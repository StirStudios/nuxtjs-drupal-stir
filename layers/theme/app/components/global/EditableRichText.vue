<script setup lang="ts">
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'
import { useOptimizedDrupalHtml } from '#stir/composables/useOptimizedDrupalHtml'
import type { EditableRichTextProps } from '#stir/types'
import {
  formattedTextApiPath,
  normalizeFormattedTextEditTarget,
} from '#stir/utils/formattedTextEditTarget'

const props = defineProps<EditableRichTextProps>()

const attrs = useAttrs()
const { isAdministrator } = usePageContext()

const isEditing = ref(false)
const isLoadingEditor = ref(false)
const paragraphId = computed(() => Number(props.id || 0))
const editTarget = computed(() => {
  const configured = normalizeFormattedTextEditTarget(props.editTarget)

  if (configured) return configured
  if (paragraphId.value <= 0) return null

  return {
    entityType: 'paragraph',
    entityId: paragraphId.value,
    fieldName: 'field_text',
  }
})
const editSourceText = ref<string | null>(null)
const renderedText = ref(props.text ?? '')

const sourceText = computed(() => {
  const rawSnake = attrs.text_source ?? attrs['text-source']
  const snakeSource = typeof rawSnake === 'string' ? rawSnake : ''
  const normalizedTextSource = props.textSource?.trim()
    ? props.textSource
    : undefined

  return (
    normalizedTextSource ??
    (snakeSource.trim() ? snakeSource : undefined) ??
    props.text ??
    ''
  )
})

const trustedTextHtml = useOptimizedDrupalHtml(renderedText)
const canInlineEdit = computed(
  () => isAdministrator.value && editTarget.value !== null,
)
const richTextClass = 'prose max-w-none'
const { revealMotionKey, useRevealMotionProps } = useRevealMotionConfig()
const motionProps = useRevealMotionProps(() => props.direction)
const hasRevealMotion = computed(() => 'whileInView' in motionProps.value)

async function startEditing() {
  if (isEditing.value || isLoadingEditor.value) return

  isLoadingEditor.value = true
  editSourceText.value = sourceText.value

  if (canInlineEdit.value && editTarget.value) {
    try {
      const response = await $fetch<{ ok: boolean; text?: string }>(
        formattedTextApiPath(editTarget.value),
      )

      if (response?.ok === true && typeof response.text === 'string') {
        editSourceText.value = response.text
      }
    } catch {
      // Keep fallback source text if fetch fails.
    }
  }

  isEditing.value = true
  isLoadingEditor.value = false
}

function stopEditing() {
  isEditing.value = false
  isLoadingEditor.value = false
  editSourceText.value = null
}

async function handleSaved() {
  isLoadingEditor.value = true

  try {
    await refreshNuxtData()
  } finally {
    stopEditing()
  }
}

watch(
  () => props.text,
  (value) => {
    renderedText.value = value ?? ''
  },
)
</script>

<template>
  <EditLink
    v-slot="{ actions, hasActions, selectAction }"
    controls-placement="slot"
    :link="editLink"
    :parent-uuid="parentUuid"
    :show-quick-edit="
      canInlineEdit && isEditing === false && isLoadingEditor === false
    "
    @quick-edit="startEditing"
  >
    <template v-if="(isEditing || isLoadingEditor) && canInlineEdit">
      <div
        v-if="isLoadingEditor"
        class="border-default bg-elevated grid min-h-32 place-items-center rounded-lg border p-6"
        role="status"
      >
        <UIcon
          aria-hidden="true"
          class="text-muted size-5 animate-spin"
          name="i-lucide-loader-circle"
        />
        <span class="sr-only">Loading editor</span>
      </div>
      <Suspense v-else>
        <LazyEditText
          :classes="classes"
          :edit-target="editTarget!"
          :source-text="editSourceText ?? sourceText"
          @cancel="stopEditing"
          @saved="handleSaved"
        />

        <template #fallback>
          <div
            class="border-default bg-elevated grid min-h-32 place-items-center rounded-lg border p-6"
            role="status"
          >
            <UIcon
              aria-hidden="true"
              class="text-muted size-5 animate-spin"
              name="i-lucide-loader-circle"
            />
            <span class="sr-only">Loading editor</span>
          </div>
        </template>
      </Suspense>
    </template>

    <template v-else-if="$slots.default || trustedTextHtml">
      <div class="relative">
        <div
          v-if="hasActions"
          class="sticky top-16 z-[500] flex h-0 justify-end overflow-visible"
        >
          <LazyEditControls
            :actions="actions"
            @select="selectAction"
          />
        </div>
        <template v-if="$slots.default">
          <slot />
        </template>
        <template v-else>
          <LazyRevealMotion
            v-if="hasRevealMotion"
            :key="`text-${paragraphId}-${revealMotionKey}`"
            as-child
            v-bind="motionProps"
          >
            <div
              :class="
                [classes, richTextClass]
                  .filter(Boolean)
                  .join(' ')
              "
              v-html="trustedTextHtml"
            />
          </LazyRevealMotion>
          <div
            v-else
            :class="
              [classes, richTextClass]
                .filter(Boolean)
                .join(' ')
            "
            v-html="trustedTextHtml"
          />
        </template>
      </div>
    </template>

    <template v-else-if="hasActions">
      <LazyEditControls :actions="actions" @select="selectAction" />
    </template>
  </EditLink>
</template>
