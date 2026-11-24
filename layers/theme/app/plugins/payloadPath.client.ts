import { displayedPayloadPath } from '../utils/payloadPath'

// Keeps the displayed path so hydration matches the route (see the util).
export default defineNuxtPlugin({
  name: 'stir:payload-path',
  order: -25,
  setup(nuxtApp) {
    const renderedPath = nuxtApp.payload.path

    if (!renderedPath) return

    const path = displayedPayloadPath(renderedPath, window.location, useRuntimeConfig().app.baseURL)

    if (path) nuxtApp.payload.path = path
  },
})
