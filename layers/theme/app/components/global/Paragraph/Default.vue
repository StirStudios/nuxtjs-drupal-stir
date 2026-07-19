<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { CustomElementNode } from '#stir/types'
import { withEditorDestination } from '#stir/utils/layoutEditLinks'
import { createParagraphComponentStarter } from '../../../utils/componentTreeDiagnostics'

defineOptions({
  inheritAttrs: false,
})

const isDev = import.meta.dev

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string
  element?: string

  editLink?: string
}>()
const attrs = useAttrs()
const slots = useSlots()
const toast = useToast()

const { getPage } = useStirDrupalCe()
const page = getPage()
const route = useRoute()
const requestUrl = useRequestURL()
const editLink = computed(() => {
  const link = typeof props.editLink === 'string' ? props.editLink.trim() : ''
  const frontendUrl = new URL(route.fullPath, requestUrl.origin).toString()

  return link ? withEditorDestination(link, frontendUrl) : ''
})

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

    return `layers/theme/app/components/global/Paragraph/${paragraphName}.vue`
  }

  return `layers/theme/app/components/global/${element}.vue`
})

const renderableSlotNames = computed(() => Object.keys(slots))
const payloadProps = computed<Record<string, unknown>>(() => {
  const values: Record<string, unknown> = { ...attrs }

  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) values[key] = value
  }

  return Object.fromEntries(
    Object.entries(values).filter(([key]) =>
      key !== 'class'
      && key !== 'style'
      && !key.startsWith('on'),
    ),
  )
})
const debugPayload = computed(() => JSON.stringify({
  element: resolvedElement.value,
  props: payloadProps.value,
  slots: renderableSlotNames.value,
}, null, 2))

const starterSource = computed(() => createParagraphComponentStarter(
  payloadProps.value,
  renderableSlotNames.value,
))
const { copy, copied, isSupported: canCopy } = useClipboard({
  source: starterSource,
})

const copyStarter = async () => {
  await copy()
  toast.add({
    color: 'success',
    icon: 'i-lucide-check',
    title: 'Component starter copied',
  })
}
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
      <p v-if="editLink" class="mb-4">
        Drupal edit link:
        <ULink class="underline" :to="editLink">
          Open paragraph edit form
        </ULink>
      </p>
      <UCollapsible class="rounded-md border border-default bg-default">
        <UButton
          block
          color="neutral"
          icon="i-lucide-code-xml"
          label="Payload and component starter"
          trailing-icon="i-lucide-chevron-down"
          :ui="{ base: 'justify-start', trailingIcon: 'ms-auto' }"
          variant="ghost"
        />

        <template #content>
          <div class="space-y-4 border-t border-default p-3">
            <div>
              <p class="mb-2 text-sm font-medium">Normalized payload</p>
              <pre class="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs"><code>{{ debugPayload }}</code></pre>
            </div>
            <div>
              <div class="mb-2 flex items-center justify-between gap-3">
                <p class="text-sm font-medium">Component starter</p>
                <UButton
                  v-if="canCopy"
                  color="neutral"
                  :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
                  :label="copied ? 'Copied' : 'Copy component'"
                  size="xs"
                  variant="soft"
                  @click.stop="copyStarter"
                />
              </div>
              <pre class="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs"><code>{{ starterSource }}</code></pre>
            </div>
          </div>
        </template>
      </UCollapsible>
    </template>
  </UAlert>

  <template v-for="slotName in renderableSlotNames" :key="slotName">
    <slot :name="slotName" />
  </template>
</template>
