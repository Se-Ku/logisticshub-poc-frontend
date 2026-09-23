<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth']
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Fulfillment & Orders</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Monitor active dispatch status and track asynchronous label processing.
        </p>
      </div>

      <UButton
          to="/orders/new"
          color="primary"
          icon="i-heroicons-plus"
          label="Create Order"
      />
    </div>

    <!-- Active Orders Component -->
    <OrderTable :poll-interval="5000" />
  </div>
</template>