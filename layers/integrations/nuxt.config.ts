import { fileURLToPath } from 'node:url'
import { defineNuxtModule } from 'nuxt/kit'
import { overrideFallbackComponent } from '../../config/componentOverrides'

const integrationMountOverride = defineNuxtModule({
  meta: {
    name: 'stir-integration-mount-override',
  },
  setup() {
    overrideFallbackComponent(
      'AppIntegrations',
      fileURLToPath(new URL('../theme/app/components/App/Integrations.vue', import.meta.url)),
      fileURLToPath(new URL('./app/components/App/Integrations.vue', import.meta.url)),
    )
  },
})

export default defineNuxtConfig({
  // The popup renders through platform utilities, and platform's foundation
  // keeps standalone integrations, analytics and scripts compositions in
  // application mode.
  extends: ['../platform'],
  modules: [integrationMountOverride],
})
