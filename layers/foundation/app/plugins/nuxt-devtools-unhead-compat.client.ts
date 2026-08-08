import { installNuxtDevtoolsUnheadCompat } from '../utils/nuxtDevtoolsUnheadCompat'

export default defineNuxtPlugin({
  name: 'nuxt-devtools-unhead-compat',
  enforce: 'pre',
  setup() {
    if (!import.meta.dev) return

    installNuxtDevtoolsUnheadCompat(injectHead())
  },
})
