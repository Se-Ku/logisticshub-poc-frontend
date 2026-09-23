<script setup lang="ts">
const { user, isAuthenticated, logout, hasRole } = useAuth()

const userMenuItems = computed(() => [
  [
    {
      label: user.value?.email || '',
      slot: 'account',
      disabled: true
    }
  ],
  [
    {
      label: 'Sign Out',
      icon: 'i-heroicons-arrow-right-on-rectangle',
      onSelect: () => logout()
    }
  ]
])
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
    <!-- Main Top Navigation Header -->
    <header class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        <!-- Brand & Main Links -->
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg text-primary-600 dark:text-primary-400">
            <UIcon name="i-heroicons-truck" class="w-6 h-6" />
            <span>LogisticsHub</span>
          </NuxtLink>

          <nav v-if="isAuthenticated" class="hidden md:flex items-center gap-6 text-sm font-medium">
            <NuxtLink
                to="/orders"
                class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition"
                active-class="text-primary-600 dark:text-primary-400 font-semibold"
            >
              Shipments
            </NuxtLink>
            <NuxtLink
                to="/orders/new"
                class="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition"
                active-class="text-primary-600 dark:text-primary-400 font-semibold"
            >
              Create Order
            </NuxtLink>
            <NuxtLink
                v-if="hasRole('ROLE_ADMIN')"
                to="/admin/users"
                class="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition"
                active-class="font-semibold"
            >
              Admin Panel
            </NuxtLink>
          </nav>
        </div>

        <!-- User Controls -->
        <div class="flex items-center gap-4">
          <template v-if="isAuthenticated">
            <UDropdownMenu :items="userMenuItems">
              <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-user-circle"
                  :label="user?.email"
              />
            </UDropdownMenu>
          </template>
          <template v-else>
            <UButton to="/login" color="primary" variant="solid">
              Sign In
            </UButton>
          </template>
        </div>
      </div>
    </header>

    <!-- Main Content Canvas -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Simple Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-4 text-center text-xs text-gray-500">
      <p>Logistics Ecosystem PoC &copy; 2026</p>
    </footer>
  </div>
</template>