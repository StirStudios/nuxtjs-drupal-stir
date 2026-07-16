import { fileURLToPath } from 'node:url'
import { addComponent, defineNuxtModule } from 'nuxt/kit'

const integrationMountOverride = defineNuxtModule({
  meta: {
    name: 'stir-integration-mount-override',
  },
  setup() {
    addComponent({
      name: 'AppIntegrations',
      filePath: fileURLToPath(
        new URL('./app/components/App/Integrations.vue', import.meta.url),
      ),
      priority: 100,
    })
  },
})

export default defineNuxtConfig({
  modules: [integrationMountOverride],
})
