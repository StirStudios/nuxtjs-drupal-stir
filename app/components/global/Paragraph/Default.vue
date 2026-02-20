<script setup lang="ts">
import { usePageContext } from '~/composables/usePageContext'

const isDev = import.meta.dev

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string
  element?: string

  editLink?: string
}>()

type CustomElementNode = {
  element?: string
  props?: Record<string, unknown>
  slots?: Record<string, unknown>
}

const { page } = usePageContext()

const toPascalCase = (value: string) =>
  value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

const findMatchingElement = (
  value: unknown,
  target: {
    uuid?: string
    id?: number | string
    parentUuid?: string
    region?: string
  },
): string | null => {
  if (!value) return null

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findMatchingElement(item, target)

      if (found) return found
    }
    return null
  }

  if (typeof value !== 'object') return null

  const node = value as CustomElementNode
  const nodeProps = (node.props ?? {}) as Record<string, unknown>
  const nodeUuid = typeof nodeProps.uuid === 'string' ? nodeProps.uuid : undefined
  const nodeId = nodeProps.id
  const nodeParentUuid =
    typeof nodeProps.parentUuid === 'string' ? nodeProps.parentUuid : undefined
  const nodeRegion =
    typeof nodeProps.region === 'string' ? nodeProps.region : undefined

  const uuidMatch = !!target.uuid && nodeUuid === target.uuid
  const idParentRegionMatch =
    target.id !== undefined &&
    nodeId === target.id &&
    !!target.parentUuid &&
    nodeParentUuid === target.parentUuid &&
    !!target.region &&
    nodeRegion === target.region

  if ((uuidMatch || idParentRegionMatch) && typeof node.element === 'string') {
    return node.element
  }

  for (const child of Object.values(node)) {
    const found = findMatchingElement(child, target)

    if (found) return found
  }

  return null
}

const resolvedElement = computed(() => {
  if (!isDev) return ''

  if (typeof props.element === 'string' && props.element.length > 0) {
    return props.element
  }

  return (
    findMatchingElement(page.value?.content, {
      uuid: props.uuid,
      id: props.id,
      parentUuid: props.parentUuid,
      region: props.region,
    }) ?? ''
  )
})

const suggestedComponentPath = computed(() => {
  const element = resolvedElement.value

  if (!element) return ''

  if (element.startsWith('paragraph-')) {
    const paragraphName = toPascalCase(element.replace(/^paragraph-/, ''))

    return `app/components/global/Paragraph/${paragraphName}.vue`
  }

  return `app/components/global/${element}.vue`
})
</script>

<template>
  <UAlert
    v-if="isDev"
    class="m-auto mb-20 max-w-lg space-y-2"
    color="error"
    title="Missing Paragraph Component"
    variant="subtle"
  >
    <template #description>
      <p v-if="resolvedElement" class="mb-2">
        Missing element:
        <code>{{ resolvedElement }}</code>
      </p>
      <p v-if="suggestedComponentPath" class="mb-5">
        Suggested file:
        <code>{{ suggestedComponentPath }}</code>
      </p>
      <p v-if="props.editLink" class="mb-4">
        Drupal edit link:
        <ULink class="underline" rel="noopener noreferrer" target="_blank" :to="props.editLink">
          Open paragraph edit form
        </ULink>
      </p>
      <details class="rounded border border-default p-3">
        <summary class="cursor-pointer text-sm font-medium">Debug props</summary>
        <pre class="mt-3 overflow-auto text-xs">{{ props }}</pre>
      </details>
    </template>
  </UAlert>
</template>
