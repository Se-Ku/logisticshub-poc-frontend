<script setup lang="ts">
const { user, logout } = useAuth()

const navLinks = [
  { label: 'User Management', icon: 'i-heroicons-users', to: '/admin/users' },
  { label: 'Back to Portal', icon: 'i-heroicons-arrow-left-start-on-rectangle', to: '/orders' }
]
</script>

<template>
  <div class="min-h-screen flex bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
    <!-- Admin Sidebar -->
    <aside class="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col justify-between shrink-0">
      <div>
        <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 font-bold text-amber-600 dark:text-amber-400 gap-2">
          <UIcon name="i-heroicons-shield-check" class="w-6 h-6" />
          <span>Admin Console</span>
        </div>

        <nav class="p-4 space-y-1">
          <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              active-class="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold"
          >
            <UIcon :name="link.icon" class="w-5 h-5" />
            <span>{{ link.label }}</span>
          </NuxtLink>
        </nav>
      </div>

      <!-- Footer Info -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div class="truncate pr-2">
          <p class="text-xs font-semibold truncate">{{ user?.email }}</p>
          <p class="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider">Role Admin</p>
        </div>
        <UButton
            color="neutral"
            variant="ghost"
            icon="i-heroicons-arrow-right-on-rectangle"
            size="xs"
            @click="logout"
        />
      </div>
    </aside>

    <!-- Main Workspace -->
    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-8">
        <h2 class="text-xs font-bold text-gray-500 uppercase tracking-wider">
          System Administration
        </h2>
        <UBadge color="warning" variant="subtle">ROLE_ADMIN</UBadge>
      </header>

      <main class="flex-1 p-8 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>