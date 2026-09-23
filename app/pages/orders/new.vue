<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { userUserReadSchema } from '~/schemas/zod/userUser/readSchema'
import { carrierCarrierReadSchema } from '~/schemas/zod/carrierCarrier/readSchema'
import { shippingRateShippingRateOutputSchema } from '~/schemas/zod/shippingRate/shippingRateOutputSchema.ts'

definePageMeta({
  layout: 'default',
  middleware: ['auth']
})

const toast = useToast()
const isSubmitting = ref(false)
const isCalculatingRate = ref(false)

// Rate state tracking
const calculatedRate = ref<number | null>(null)
const calculationId = ref<string | null>(null)
const isRateValid = ref(false)

type UserRead = z.output<typeof userUserReadSchema> & { '@id'?: string }
type CarrierRead = z.output<typeof carrierCarrierReadSchema> & { '@id'?: string }

interface HydraCollection<T> {
  member?: T[]
  'hydra:member'?: T[]
}

// Fetch Users (Clients) & Carriers
const headers = useRequestHeaders(['cookie']) as Record<string, string>

const { data: usersData } = await useFetch<HydraCollection<UserRead>>('/api/v1/users', {
  headers,
  credentials: 'include'
})

const { data: carriersData } = await useFetch<HydraCollection<CarrierRead>>('/api/v1/carriers', {
  headers,
  credentials: 'include'
})

// Transform Options for USelect using Hydra IRIs
const clientOptions = computed(() => {
  const members = usersData.value?.member || usersData.value?.['hydra:member'] || []
  return members.map(u => ({
    label: u.email || `Client #${u.id}`,
    value: u['@id'] || `/api/v1/users/${u.id}`
  }))
})

const carrierOptions = computed(() => {
  const members = carriersData.value?.member || carriersData.value?.['hydra:member'] || []
  return members
      .filter(c => c.isActive !== false)
      .map(c => ({
        label: c.code ? `${c.name} (${c.code})` : (c.name || `Carrier #${c.id}`),
        value: c['@id'] || `/api/v1/carriers/${c.id}`
      }))
})

// Form Schemas & Reactive State
const itemSchema = z.object({
  name: z.string().min(1, { error: 'Item name is required' }),
  quantity: z.number({ error: 'Quantity must be a number' }).min(1, { error: 'Minimum 1 item' }),
  unitPrice: z.number({ error: 'Price must be a number' }).min(0, { error: 'Price cannot be negative' })
})

const addressSchema = z.object({
  street: z.string().min(1, { error: 'Street is required' }),
  city: z.string().min(1, { error: 'City is required' }),
  postalCode: z.string().min(1, { error: 'Postal code is required' }),
  country: z.string().min(1, { error: 'Country is required' })
})

const dimensionsSchema = z.object({
  lengthCm: z.number({ error: 'Enter length' }).min(1, { error: 'Dimension must be > 0' }),
  widthCm: z.number({ error: 'Enter width' }).min(1, { error: 'Dimension must be > 0' }),
  heightCm: z.number({ error: 'Enter height' }).min(1, { error: 'Dimension must be > 0' }),
  weightKg: z.number({ error: 'Enter weight' }).min(0.1, { error: 'Weight must be > 0' })
})

const createOrderSchema = z.object({
  client: z.string().min(1, { error: 'Select a client' }),
  carrier: z.string().min(1, { error: 'Select a carrier' }),
  shippingAddress: addressSchema,
  packageDimensions: dimensionsSchema,
  items: z.array(itemSchema).min(1, { error: 'Add at least one item to the order' })
})

type FormState = z.output<typeof createOrderSchema>

const state = reactive<FormState>({
  client: '',
  carrier: '',
  shippingAddress: {
    street: '',
    city: '',
    postalCode: '',
    country: 'Poland'
  },
  packageDimensions: {
    lengthCm: 20,
    widthCm: 15,
    heightCm: 10,
    weightKg: 1.5
  },
  items: [
    { name: 'USB-C Cable 2m', quantity: 2, unitPrice: 12.50 }
  ]
})

// Invalidate rate whenever dimensions or destination country change
watch(
    [
      () => state.packageDimensions.lengthCm,
      () => state.packageDimensions.widthCm,
      () => state.packageDimensions.heightCm,
      () => state.packageDimensions.weightKg,
      () => state.shippingAddress.country
    ],
    () => {
      isRateValid.value = false
      calculatedRate.value = null
      calculationId.value = null
    }
)

const itemsTotal = computed(() => {
  return state.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice || 0), 0)
})

const grandTotal = computed(() => {
  return itemsTotal.value + (calculatedRate.value ?? 0)
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'EUR' }).format(amount)
}

function addItem() {
  state.items.push({ name: '', quantity: 1, unitPrice: 0 })
}

function removeItem(index: number) {
  if (state.items.length > 1) {
    state.items.splice(index, 1)
  }
}

// Calculate rate action using backend API call
async function calculateRate() {
  if (
      !state.packageDimensions.lengthCm ||
      !state.packageDimensions.widthCm ||
      !state.packageDimensions.heightCm ||
      !state.packageDimensions.weightKg ||
      !state.shippingAddress.country
  ) {
    toast.add({
      title: 'Fill in dimensions',
      description: 'All package dimensions and destination country are required for calculation.',
      color: 'warning'
    })
    return
  }

  isCalculatingRate.value = true

  const payload = {
    dimensions: {
      length: state.packageDimensions.lengthCm,
      width: state.packageDimensions.widthCm,
      height: state.packageDimensions.heightCm
    },
    weight: state.packageDimensions.weightKg,
    destinationCountry: state.shippingAddress.country
  }

  try {
    const response = await $fetch('/api/v1/shipping/calculate-rates', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    })

    const parsed = shippingRateShippingRateOutputSchema.parse(response)
    calculatedRate.value = parsed.rate ?? 0
    calculationId.value = parsed['calculation-id'] ?? null
    isRateValid.value = true

    toast.add({ title: 'Shipping cost calculated', color: 'success' })
  } catch (err: any) {
    isRateValid.value = false
    toast.add({
      title: 'Rate calculation error',
      description: err.data?.detail || err.data?.message || 'Failed to calculate shipping cost.',
      color: 'error'
    })
  } finally {
    isCalculatingRate.value = false
  }
}

async function handleSubmit(event: FormSubmitEvent<FormState>) {
  if (!isRateValid.value) {
    toast.add({
      title: 'Calculated shipping cost required',
      description: 'Calculate shipping cost before placing the order.',
      color: 'warning'
    })
    return
  }

  isSubmitting.value = true

  const payload = {
    client: event.data.client,
    carrier: event.data.carrier,
    shippingAddress: event.data.shippingAddress,
    packageDimensions: event.data.packageDimensions,
    items: event.data.items,
    shippingRate: calculatedRate.value,
    shippingCalculationId: calculationId.value,
    totalAmount: grandTotal.value,
    status: 'pending'
  }

  try {
    await $fetch('/api/v1/orders', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    })

    toast.add({
      title: 'Order created',
      description: 'Order submitted for processing.',
      color: 'success'
    })

    await navigateTo('/orders')
  } catch (err: any) {
    toast.add({
      title: 'Order creation error',
      description: err.data?.detail || err.data?.message || 'Failed to save order.',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">New Order</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Fill in shipping details and order items.
        </p>
      </div>

      <UButton
          to="/orders"
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-left"
          label="Back to list"
      />
    </div>

    <UForm
        :schema="createOrderSchema"
        :state="state"
        class="space-y-6"
        @submit="handleSubmit"
    >
      <!-- Section 1: Client & Carrier Selection -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2 font-semibold text-base">
            <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-primary" />
            <span>Client and Carrier</span>
          </div>
        </template>

        <div class="flex flex-row gap-4">
          <UFormField label="Client" name="client" class="flex-1">
            <USelect
                v-model="state.client"
                :items="clientOptions"
                placeholder="Select client..."
                class="w-full"
            />
          </UFormField>

          <UFormField label="Carrier" name="carrier" class="flex-1">
            <USelect
                v-model="state.carrier"
                :items="carrierOptions"
                placeholder="Select carrier..."
                class="w-full"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- Section 2: Address -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2 font-semibold text-base">
            <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-primary" />
            <span>Shipping Address</span>
          </div>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Street and number" name="shippingAddress.street" class="sm:col-span-2">
            <UInput v-model="state.shippingAddress.street" placeholder="e.g. 12 Main St" class="w-full" />
          </UFormField>

          <UFormField label="Postal code" name="shippingAddress.postalCode">
            <UInput v-model="state.shippingAddress.postalCode" placeholder="e.g. 00-001" class="w-full" />
          </UFormField>

          <UFormField label="City" name="shippingAddress.city">
            <UInput v-model="state.shippingAddress.city" placeholder="e.g. Warsaw" class="w-full" />
          </UFormField>

          <UFormField label="Country" name="shippingAddress.country" class="sm:col-span-2">
            <UInput v-model="state.shippingAddress.country" placeholder="Poland" class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <!-- Section 3: Package Dimensions & Rate Action -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2 font-semibold text-base">
            <UIcon name="i-heroicons-cube" class="w-5 h-5 text-primary" />
            <span>Package Dimensions</span>
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex flex-row gap-4">
            <UFormField label="Length (cm)" name="packageDimensions.lengthCm" class="flex-1">
              <UInput v-model.number="state.packageDimensions.lengthCm" type="number" step="0.1" class="w-full" />
            </UFormField>

            <UFormField label="Width (cm)" name="packageDimensions.widthCm" class="flex-1">
              <UInput v-model.number="state.packageDimensions.widthCm" type="number" step="0.1" class="w-full" />
            </UFormField>

            <UFormField label="Height (cm)" name="packageDimensions.heightCm" class="flex-1">
              <UInput v-model.number="state.packageDimensions.heightCm" type="number" step="0.1" class="w-full" />
            </UFormField>
          </div>

          <div class="flex flex-row gap-4">
            <UFormField label="Weight (kg)" name="packageDimensions.weightKg" class="flex-1">
              <UInput v-model.number="state.packageDimensions.weightKg" type="number" step="0.1" class="w-full" />
            </UFormField>
            <div class="flex-1"></div>
            <div class="flex-1"></div>
          </div>

          <!-- Action Button Below Dimensions -->
          <div class="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
            <div class="flex items-center gap-2">
              <UBadge
                  :color="isRateValid ? 'success' : 'warning'"
                  variant="subtle"
                  size="xs"
              >
                {{ isRateValid ? 'Rate up to date' : 'Recalculation required' }}
              </UBadge>
            </div>

            <UButton
                color="neutral"
                variant="solid"
                icon="i-heroicons-calculator"
                :loading="isCalculatingRate"
                label="Calculate shipping cost"
                @click="calculateRate"
            />
          </div>
        </div>
      </UCard>

      <!-- Section 4: Items -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 font-semibold text-base">
              <UIcon name="i-heroicons-shopping-bag" class="w-5 h-5 text-primary" />
              <span>Order Items</span>
            </div>
            <UButton
                color="neutral"
                variant="subtle"
                icon="i-heroicons-plus"
                size="xs"
                label="Add item"
                @click="addItem"
            />
          </div>
        </template>

        <div class="space-y-4">
          <div
              v-for="(item, index) in state.items"
              :key="index"
              class="flex flex-row items-end gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50"
          >
            <UFormField label="Item name" :name="`items.${index}.name`" class="flex-[3]">
              <UInput v-model="item.name" placeholder="Item name" class="w-full" />
            </UFormField>

            <UFormField label="Quantity" :name="`items.${index}.quantity`" class="w-24 shrink-0">
              <UInput v-model.number="item.quantity" type="number" min="1" class="w-full" />
            </UFormField>

            <UFormField label="Unit price (EUR)" :name="`items.${index}.unitPrice`" class="w-36 shrink-0">
              <UInput v-model.number="item.unitPrice" type="number" step="0.01" min="0" class="w-full" />
            </UFormField>

            <div class="shrink-0 pb-0.5">
              <UButton
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="md"
                  :disabled="state.items.length === 1"
                  @click="removeItem(index)"
              />
            </div>
          </div>
        </div>

        <!-- Dynamic Order Totals Breakdown -->
        <template #footer>
          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between text-gray-600 dark:text-gray-400">
              <span>Items total:</span>
              <span class="font-medium">{{ formatCurrency(itemsTotal) }}</span>
            </div>

            <div class="flex items-center justify-between text-gray-600 dark:text-gray-400">
              <span>Shipping cost:</span>
              <span v-if="isRateValid" class="font-medium text-emerald-600 dark:text-emerald-400">
                {{ formatCurrency(calculatedRate ?? 0) }}
              </span>
              <span v-else class="text-xs italic text-amber-600 dark:text-amber-400">
                Recalculation required
              </span>
            </div>

            <div class="flex items-center justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-800">
              <span>Total amount with shipping:</span>
              <span class="text-primary">{{ isRateValid ? formatCurrency(grandTotal) : '-' }}</span>
            </div>
          </div>
        </template>
      </UCard>

      <div class="flex justify-end gap-3 pt-4">
        <UButton
            to="/orders"
            color="neutral"
            variant="outline"
            label="Cancel"
        />
        <UButton
            type="submit"
            color="primary"
            size="lg"
            icon="i-heroicons-paper-airplane"
            :loading="isSubmitting"
            :disabled="!isRateValid"
            label="Place and send order"
        />
      </div>
    </UForm>
  </div>
</template>