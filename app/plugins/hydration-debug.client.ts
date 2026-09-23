// Extra information about Hydration mismatches when calling useFetch.
export default defineNuxtPlugin((nuxtApp) => {

    // Exit immediately if not running in development mode
    if (!import.meta.dev) return

    nuxtApp.vueApp.config.warnHandler = (msg, instance, trace) => {
        if (msg.includes('Hydration')) {
            console.group('🔍 Hydration Mismatch Warning')
            console.warn('Message:', msg)
            console.log('Component Instance:', instance)
            console.log('Component Trace:', trace)
            console.groupEnd()
        }
    }
})