<script setup lang="ts">
import { cleanHTML } from '~/utils/cleanHTML'

const { getMessages } = useDrupalCe()
const toast = useToast()

// Use an array in state to keep payload serialization simple.
const shownMessages = useState<string[]>('shownMessages', () => [])

onMounted(() => {
  const messages = getMessages().value as Array<{ message: string; type: string }>

  messages.forEach((message) => {
    // Check if the message has already been shown
    if (!shownMessages.value.includes(message.message)) {
      // Show the toast
      toast.add({
        title: message.type === 'success' ? 'Success!' : 'Error!',
        description: h('div', { innerHTML: cleanHTML(message.message || '') }),
        icon: getAlertIcon(message.type),
        color: message.type === 'success' ? 'success' : 'error',
      })

      // Track the shown message
      shownMessages.value.push(message.message)
    }
  })
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
