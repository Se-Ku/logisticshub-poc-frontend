// A flexible middleware that handles both authentication checks and role-based access control (RBAC):
export default defineNuxtRouteMiddleware((to) => {
    const { isAuthenticated, hasRole } = useAuth()

    // Redirect unauthenticated users to login
    if (!isAuthenticated.value) {
        return navigateTo(`/login?redirectTo=${encodeURIComponent(to.fullPath)}`)
    }

    // Check custom route meta for role requirements (e.g., meta: { requiredRole: 'ROLE_ADMIN' })
    const requiredRole = to.meta.requiredRole as string | undefined
    if (requiredRole && !hasRole(requiredRole)) {
        return navigateTo('/unauthorized')
    }
})