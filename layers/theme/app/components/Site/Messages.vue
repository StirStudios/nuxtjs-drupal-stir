<script setup lang="ts">
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'

type DrupalMessage = { message: string; type: string }

const { getMessages } = useStirDrupalCe()
const toast = useToast()
// drupal-ce queues Drupal status messages from every page response. The
// layout stays mounted across navigations, so drain the queue whenever it
// grows instead of reading it once.
const queue = getMessages() as Ref<DrupalMessage[]>

onMounted(() => {
  watch(() => queue.value.length, () => {
    for (const message of queue.value.splice(0)) {
      toast.add({
        title: message.type === 'success' ? 'Success!' : 'Error!',
        description: h('div', {
          innerHTML: trustedDrupalHtml(message.message),
        }),
        icon: getAlertIcon(message.type),
        color: message.type === 'success' ? 'success' : 'error',
      })
    }
  }, { immediate: true })
})

function getAlertIcon(type: string): string {
  switch (type) {
    case 'success':
      return 'i-lucide-check-circle'
    case 'error':
    case 'danger':
      return 'i-lucide-x-circle'
    default:
      return 'i-lucide-info'
  }
}
</script>

<template>
  <ClientOnly />
</template>
