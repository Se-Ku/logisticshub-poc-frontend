<script setup lang="ts">
import { z } from 'zod'
import { orderOrderReadSchema } from '~/schemas/zod/orderOrder/readSchema'

// Infer TypeScript interface directly from the Kubb-generated Read Schema
type Order = z.output<typeof orderOrderReadSchema>

interface HydraOrderResponse {
  member?: Order[]
  'hydra:member'?: Order[]
  totalItems?: number
  'hydra:totalItems'?: number
}

const props = withDefaults(
    defineProps<{
      pollInterval?: number
    }>(),
    {
      pollInterval: 5000
    }
)

const toast = useToast()
const page = ref(1)
const isAutoRefreshActive = ref(true)
const dispatchingId = ref<number | null>(null)
let pollTimer: NodeJS.Timeout | null = null

// Forward SSR Cookies
const headers = useRequestHeaders(['cookie']) as Record<string, string>

// Fetch orders with API Platform pagination
const { data, pending, refresh } = await useFetch<HydraOrderResponse>('/api/v1/orders', {
  key: 'orders-list-table',
  headers,
  query: computed(() => ({
    page: page.value
  })),
  watch: [page],
  credentials: 'include'
})

const orders = computed(() => data.value?.member || data.value?.['hydra:member'] || [])
const totalOrders = computed(() => data.value?.totalItems || data.value?.['hydra:totalItems'] || 0)

// Refined inline Dispatch Action
async function handleDispatch(id?: number) {
  if (!id) return
  dispatchingId.value = id

  try {
    await $fetch(`/api/v1/orders/${id}/dispatch`, {
      method: 'POST',
      headers, // SSR cookie forwarding
      credentials: 'include',
      responseType: 'text' // Safely handles empty response bodies (200/204 No Content)
    })

    toast.add({
      title: 'Order Dispatched',
      description: `Order #${id} was sent for processing.`,
      color: 'success'
    })

    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Dispatch Failed',
      description: err.data?.detail || err.data?.['hydra:description'] || err.message || 'Unable to dispatch order.',
      color: 'error'
    })
  } finally {
    dispatchingId.value = null
  }
}

// Polling lifecycle management
onMounted(() => {
  pollTimer = setInterval(() => {
    if (isAutoRefreshActive.value) {
      refresh()
    }
  }, props.pollInterval)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

// UI Formatting Helpers
function getStatusColor(status?: string) {
  switch (status?.toLowerCase()) {
    case 'shipped':
      return 'success'
    case 'processing':
      return 'info'
    case 'pending':
    case 'draft':
      return 'warning'
    case 'failed':
      return 'error'
    default:
      return 'neutral'
  }
}

// EUR Currency Formatting with Polish Locale
function formatCurrency(amount?: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'EUR' }).format(amount ?? 0)
}

// Polish Date & Time Variant
function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('pl-PL', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

// Format JSON address object, array, or string fields
function formatAddress(address?: Record<string, any> | string[] | string | null) {
  if (!address) return '-'

  // Parse JSON string if needed
  if (typeof address === 'string') {
    try {
      const parsed = JSON.parse(address)
      return formatAddress(parsed)
    } catch {
      return address
    }
  }

  // Handle string array fallback
  if (Array.isArray(address)) {
    return address.filter(Boolean).join(', ')
  }

  // Format object entries as key: value pairs
  if (typeof address === 'object') {
    const fields = Object.entries(address)
        .filter(([_, val]) => val !== null && val !== undefined && val !== '')
        .map(([key, val]) => `${key}: ${String(val).trim()}`)

    return fields.length > 0 ? fields.join(', ') : '-'
  }

  return '-'
}

const columns = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'createdAt', header: 'Date' },
  { accessorKey: 'shippingAddress', header: 'Shipping Address' },
  { accessorKey: 'totalAmount', header: 'Total Amount' },
  { accessorKey: 'status', header: 'Status' }
]
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <!-- Header Controls -->
    <template #header>
      <div class="flex items-center justify-between px-4 py-2">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-arrow-path" :class="['w-4 h-4', pending ? 'animate-spin text-primary' : 'text-gray-400']" />
          <span class="text-xs text-gray-500">Auto-refresh (5s)</span>
          <USwitch v-model="isAutoRefreshActive" size="xs" />
        </div>

        <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-arrow-path"
            size="xs"
            :loading="pending"
            label="Refresh Now"
            @click="() => refresh()"
        />
      </div>
    </template>

    <!-- Orders Table -->
    <UTable
        :data="orders"
        :columns="columns"
        :loading="pending"
    >
      <!-- Date Column (Polish Locale) -->
      <template #createdAt-cell="{ row }">
        <span class="text-xs font-mono text-gray-600 dark:text-gray-400">
          {{ formatDate(row.original.createdAt) }}
        </span>
      </template>

      <!-- Address Array Handling -->
      <template #shippingAddress-cell="{ row }">
        <span class="text-sm">
          {{ formatAddress(row.original.shippingAddress) }}
        </span>
      </template>

      <!-- EUR Currency Column -->
      <template #totalAmount-cell="{ row }">
        <span class="font-semibold text-sm">
          {{ formatCurrency(row.original.totalAmount) }}
        </span>
      </template>

      <!-- Status Badges -->
      <template #status-cell="{ row }">
        <div class="flex items-center gap-2">
          <UBadge
              :color="getStatusColor(row.original.status)"
              variant="subtle"
              size="xs"
              class="capitalize"
          >
            <template #leading>
              <span
                  v-if="row.original.status === 'processing'"
                  class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1"
              ></span>
            </template>
            {{ row.original.status || 'draft' }}
          </UBadge>

          <UButton
              v-if="row.original.status === 'draft' && row.original.id"
              color="primary"
              variant="soft"
              size="xs"
              icon="i-heroicons-paper-airplane"
              :loading="dispatchingId === row.original.id"
              label="Dispatch"
              @click="handleDispatch(row.original.id)"
          />
        </div>
      </template>
    </UTable>

    <!-- Pagination Footer -->
    <template #footer>
      <div class="flex items-center justify-between px-4 py-2">
        <span class="text-xs text-gray-500">Total orders: {{ totalOrders }}</span>
        <UPagination
            v-model:page="page"
            :total="totalOrders"
            :items-per-page="10"
        />
      </div>
    </template>
  </UCard>
</template>