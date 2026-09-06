import { fileURLToPath } from 'node:url'
import { defineNuxtModule } from 'nuxt/kit'
import { overrideFallbackComponent } from '../../config/componentOverrides'

const editorialComponentOverrides = defineNuxtModule({
  meta: {
    name: 'stir-editorial-component-overrides',
  },
  setup() {
    for (const [name, path] of [
      ['DrupalTabs', './app/components/Drupal/Tabs.vue'],
      ['EditLink', './app/components/Edit/Link.vue'],
    ] as const) {
      overrideFallbackComponent(
        name,
        fileURLToPath(new URL(`../theme/${path}`, import.meta.url)),
        fileURLToPath(new URL(path, import.meta.url)),
      )
    }
  },
})

export default defineNuxtConfig({
  modules: [editorialComponentOverrides],
})
