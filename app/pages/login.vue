<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

definePageMeta({
  layout: 'default'
})

const { login, isAuthenticated } = useAuth()
const route = useRoute()
const toast = useToast()

if (isAuthenticated.value) {
  const redirectTo = (route.query.redirectTo as string) || '/orders'
  await navigateTo(redirectTo)
}

const loading = ref(false)

const schema = z.object({
  email: z.email({ error: 'Please enter a valid email address' }),
  password: z.string().min(1, { error: 'Password is required' })
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  email: '',
  password: ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await login(event.data)

    toast.add({
      title: 'Welcome back',
      description: 'Logged in successfully.',
      color: 'success'
    })

    const redirectTo = (route.query.redirectTo as string) || '/orders'
    await navigateTo(redirectTo)
  } catch (err: any) {
    toast.add({
      title: 'Authentication Failed',
      description: err.data?.message || err.data?.detail || 'Invalid email or password.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <UCard class="w-full max-w-md shadow-lg">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Logistics Portal Login
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sign in to manage orders and access fulfillment services
          </p>
        </div>
      </template>

      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Email address" name="email">
          <UInput
              v-model="state.email"
              type="email"
              placeholder="operator@logistics.dev"
              icon="i-heroicons-envelope"
              autocomplete="email"
              class="w-full"
          />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
              v-model="state.password"
              type="password"
              placeholder="••••••••"
              icon="i-heroicons-lock-closed"
              autocomplete="current-password"
              class="w-full"
          />
        </UFormField>

        <UButton
            type="submit"
            block
            color="primary"
            size="lg"
            :loading="loading"
            class="mt-6"
        >
          Sign In
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>