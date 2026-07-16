import { fileURLToPath } from 'node:url'
import { addComponent, defineNuxtModule } from 'nuxt/kit'

const editorialComponentOverrides = defineNuxtModule({
  meta: {
    name: 'stir-editorial-component-overrides',
  },
  setup() {
    for (const [name, path] of [
      ['DrupalTabs', './app/components/Drupal/Tabs.vue'],
      ['EditLink', './app/components/Edit/Link.vue'],
    ] as const) {
      addComponent({
        name,
        filePath: fileURLToPath(new URL(path, import.meta.url)),
        priority: 100,
      })
    }
  },
})

export default defineNuxtConfig({
  modules: [editorialComponentOverrides],
})
