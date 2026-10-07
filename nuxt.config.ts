// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',
    '@nuxtjs/tailwindcss'
  ],
  typescript: {
    strict: true,
    typeCheck: true
  },
  i18n: {
    locales: [
      { code: 'vi', file: 'vi.json', name: 'Tiếng Việt' },
      { code: 'en', file: 'en.json', name: 'English' }
    ],
    defaultLocale: 'vi',
    strategy: 'no_prefix'
  },
  css: ['~/assets/css/tailwind.css']
})
