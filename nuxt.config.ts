// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      title: 'LogisticsHub', // default fallback title
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    logisticshubBackendApiBase: process.env.NUXT_LOGISTICSHUB_BACKEND_API_BASE,
  },

  // nitro: {
  //   routeRules: {
  //  Here we can only declare static routes.
  //  Runtime routes required using a middleware (ap-proxy.ts).
  //   },
  // },
})
