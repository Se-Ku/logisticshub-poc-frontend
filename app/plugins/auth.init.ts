// Ensure user state is pre-populated on initial page load (both server-side and client hydration):
export default defineNuxtPlugin(async () => {
    const { fetchUser, user } = useAuth()

    // Hydrated state check to avoid redundant fetches on client navigation
    if (!user.value) {
        await fetchUser()
    }
})