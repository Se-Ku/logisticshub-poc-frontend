// Workaround for dynamic proxy routes (based on env variable).
// We want to proxy every backend API call (/api/v1).
// API URL is declared at runtime.
export default defineEventHandler(async (event) => {
    // Using event.path directly
    if (event.path.startsWith('/api/v1/')) {
        const config = useRuntimeConfig(event)
        const apiBase = config.logisticshubBackendApiBase
        const targetUrl = `${apiBase}${event.path}`

        return proxyRequest(event, targetUrl)
    }
})