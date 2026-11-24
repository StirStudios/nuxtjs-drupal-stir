import type { Directive } from 'vue'

// Renders trusted Drupal markup. Unlike v-html it keeps server-rendered markup
// as it is on hydration, so embeds that changed the DOM are not reset.
const vDrupalMarkup: Directive<HTMLElement, string | null | undefined> = {
  getSSRProps: binding => ({ innerHTML: binding.value ?? '' }),
  beforeMount(el, binding) {
    if (!el.firstChild) el.innerHTML = binding.value ?? ''
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) el.innerHTML = binding.value ?? ''
  },
}

export default defineNuxtPlugin({
  name: 'stir:drupal-markup',
  setup(nuxtApp) {
    nuxtApp.vueApp.directive('drupal-markup', vDrupalMarkup)
  },
})
