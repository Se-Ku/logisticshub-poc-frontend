import type { User, LoginCredentials } from '~/types/auth'

export const useAuth = () => {
    const user = useState<User | null>('auth_user', () => null)
    const isLoading = useState<boolean>('auth_loading', () => false)

    const isAuthenticated = computed(() => !!user.value)

    // Fetch logged-in user profile using session cookie
    const fetchUser = async () => {
        isLoading.value = true
        try {
            // Forward client cookie header during Server-Side Rendering (SSR)
            const headers = useRequestHeaders(['cookie']) as Record<string, string>

            const data = await $fetch<User>('/api/v1/users/me', {
                headers,
                credentials: 'include'
            })
            user.value = data
        } catch {
            user.value = null
        } finally {
            isLoading.value = false
        }
    }

    // Login handler against Lexik JWT endpoint
    const login = async (credentials: LoginCredentials) => {
        await $fetch('/api/v1/login', {
            method: 'POST',
            body: {
                username: credentials.email,
                password: credentials.password,
            },
            credentials: 'include'
        })
        // Fetch profile right after HttpOnly cookie is set
        await fetchUser()
    }

    // Clear authentication cookie via backend logout
    const logout = async () => {
        try {
            // Hits backend /api/logout through proxy rules
            await $fetch('/api/v1/logout', {
                method: 'POST',
                credentials: 'include'
            })
        } finally {
            user.value = null
            await navigateTo('/login')
        }
    }

    // Symfony Role Guard helper
    const hasRole = (role: string) => {
        return user.value?.roles.includes(role) ?? false
    }

    return {
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        fetchUser,
        hasRole
    }
}