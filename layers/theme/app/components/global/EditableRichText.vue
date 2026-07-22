<script setup lang="ts">
import { useRevealMotionConfig } from '#stir/composables/useRevealMotionConfig'
import {
  optimizeDrupalRichTextImages,
  trustedDrupalHtml,
} from '#stir/utils/trustedDrupalHtml'
import type { EditableRichTextProps } from '#stir/types'

const props = defineProps<EditableRichTextProps>()

const attrs = useAttrs()
const appConfig = useAppConfig()
const $img = useImage()
const { isAdministrator } = usePageContext()

const getRichTextImageSizes = $img.getSizes as unknown as (
  source: string,
  options: {
    modifiers: Record<string, number | string | undefined>
    sizes: string | undefined
  },
) => ReturnType<typeof $img.getSizes>

const isEditing = ref(false)
const isLoadingEditor = ref(false)
const paragraphId = computed(() => Number(props.id || 0))
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

const trustedTextHtml = computed(() => {
  const html = trustedDrupalHtml(renderedText.value)

  const image = appConfig.stirTheme.media.image

  return optimizeDrupalRichTextImages(html, (source, width, height, context) =>
    getRichTextImageSizes(source, {
      sizes:
        context?.alignment === 'left' || context?.alignment === 'right'
          ? image.profiles.split
          : image.profiles.container,
      modifiers: {
        format: image.format,
        height,
        quality: image.quality,
        width,
      },
    }),
  )
})
const canInlineEdit = computed(
  () => isAdministrator.value && paragraphId.value > 0,
)
const richTextClass = 'prose max-w-none'
const { revealMotionKey, useRevealMotionProps } = useRevealMotionConfig()
const motionProps = useRevealMotionProps(() => props.direction)
const hasRevealMotion = computed(() => 'whileInView' in motionProps.value)

async function startEditing() {
  if (isEditing.value || isLoadingEditor.value) return

  isLoadingEditor.value = true
  editSourceText.value = sourceText.value

  if (canInlineEdit.value && paragraphId.value > 0) {
    try {
      const response = await $fetch<{ ok: boolean; text?: string }>(
        `/api/paragraph/${paragraphId.value}/text`,
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
          :paragraph-id="paragraphId"
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

    <template v-else-if="trustedTextHtml">
      <div class="relative grid">
        <LazyEditControls
          v-if="hasActions"
          :actions="actions"
          container-class="sticky top-16 z-[500] col-start-1 row-start-1 self-start justify-self-end"
          @select="selectAction"
        />
        <LazyRevealMotion
          v-if="hasRevealMotion"
          :key="`text-${paragraphId}-${revealMotionKey}`"
          as-child
          v-bind="motionProps"
        >
          <div
            :class="
              ['col-start-1 row-start-1', classes, richTextClass]
                .filter(Boolean)
                .join(' ')
            "
            v-html="trustedTextHtml"
          />
        </LazyRevealMotion>
        <div
          v-else
          :class="
            ['col-start-1 row-start-1', classes, richTextClass]
              .filter(Boolean)
              .join(' ')
          "
          v-html="trustedTextHtml"
        />
      </div>
    </template>

    <template v-else-if="hasActions">
      <LazyEditControls :actions="actions" @select="selectAction" />
    </template>
  </EditLink>
</template>
