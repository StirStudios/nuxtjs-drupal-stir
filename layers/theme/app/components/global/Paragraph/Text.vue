<script setup lang="ts">
import { Motion } from 'motion-v'
import { useRevealMotionConfig } from '~/composables/useRevealMotionConfig'
import { trustedDrupalHtml } from '~/utils/trustedDrupalHtml'

const props = defineProps<{
  id?: number | string
  uuid?: string
  parentUuid?: string
  region?: string

  text?: string
  textSource?: string

  align?: string
  width?: string
  spacing?: string
  classes?: string
  direction?: string

  editLink?: string
}>()

const attrs = useAttrs()
const { isAdministrator } = usePageContext()

const isEditing = ref(false)
const paragraphId = computed(() => Number(props.id || 0))
const editSourceText = ref<string | null>(null)
const renderedText = ref(props.text ?? '')

const sourceText = computed(() => {
  const rawSnake = attrs.text_source ?? attrs['text-source']
  const snakeSource = typeof rawSnake === 'string' ? rawSnake : ''
  const normalizedTextSource = props.textSource?.trim()
    ? props.textSource
    : undefined

  return normalizedTextSource ?? (snakeSource.trim() ? snakeSource : undefined) ?? props.text ?? ''
})

const trustedTextHtml = computed(() => trustedDrupalHtml(renderedText.value))
const canInlineEdit = computed(() => isAdministrator.value && paragraphId.value > 0)
const richTextClass = 'prose max-w-none'
const { revealMotionKey, useRevealMotionProps } = useRevealMotionConfig()
const motionProps = useRevealMotionProps(() => props.direction)
const wrapStyles = computed(() =>
  [props.width, props.spacing].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  ),
)

async function startEditing() {
  editSourceText.value = sourceText.value

  if (canInlineEdit.value && paragraphId.value > 0) {
    try {
      const response = await $fetch<{ ok: boolean; text?: string }>(`/api/paragraph/${paragraphId.value}/text`)

      if (response?.ok === true && typeof response.text === 'string') {
        editSourceText.value = response.text
      }
    } catch {
      // Keep fallback source text if fetch fails.
    }
  }

  isEditing.value = true
}

function stopEditing() {
  isEditing.value = false
  editSourceText.value = null
}

function handleSaved(nextText: string) {
  renderedText.value = nextText
  stopEditing()
}

watch(() => props.text, (value) => {
  renderedText.value = value ?? ''
})
</script>

<template>
  <WrapDiv :align="align" :styles="wrapStyles">
    <EditLink
      v-slot="{ actions, hasActions, selectAction }"
      controls-placement="slot"
      :link="editLink"
      :parent-uuid="parentUuid"
      :show-quick-edit="canInlineEdit && isEditing === false"
      @quick-edit="startEditing"
    >
      <template v-if="isEditing && canInlineEdit">
        <LazyEditText
          :classes="classes"
          :paragraph-id="paragraphId"
          :source-text="editSourceText ?? sourceText"
          @cancel="stopEditing"
          @saved="handleSaved"
        />
      </template>

      <template v-else-if="trustedTextHtml">
        <div class="relative grid">
          <LazyEditControls
            v-if="hasActions"
            :actions="actions"
            container-class="sticky top-16 z-[500] col-start-1 row-start-1 self-start justify-self-end"
            @select="selectAction"
          />
          <Motion
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
          </Motion>
        </div>
      </template>

      <template v-else-if="hasActions">
        <LazyEditControls
          :actions="actions"
          @select="selectAction"
        />
      </template>
    </EditLink>
  </WrapDiv>
</template>
