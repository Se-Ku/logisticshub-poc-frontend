<script setup lang="ts">
const { user } = useAuth()
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>

    <UCard v-if="user">
      <template #header>
        <h3 class="text-lg font-medium">Welcome, {{ user.email }}!</h3>
      </template>

      <div class="space-y-2">
        <p><strong>ID:</strong> {{ user.id }}</p>
        <p><strong>Roles:</strong>
          <UBadge v-for="role in user.roles" :key="role" color="primary" variant="subtle" class="mr-1">
            {{ role }}
          </UBadge>
        </p>
      </div>
    </UCard>

    <UAlert
        v-else
        title="Not Authenticated"
        description="You are currently browsing as a guest. Please log in to access the logistics platform."
        color="warning"
        variant="subtle"
    />
  </div>
</template>