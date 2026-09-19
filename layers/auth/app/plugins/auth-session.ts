import { useAuthSession } from '../composables/useAuthSession'

// Registers the Drupal session for layers that must not depend on auth
// (see useOptionalAuthSession in the foundation layer).
export default defineNuxtPlugin(() => ({
  provide: {
    stirAuthSession: useAuthSession(),
  },
}))
