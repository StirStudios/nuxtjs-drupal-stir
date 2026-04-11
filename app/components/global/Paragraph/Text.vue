<script setup lang="ts">
import { cleanHTML } from '~/utils/cleanHTML'
import EditText from '~/components/Edit/Text.vue'

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

const safeTextHtml = computed(() => cleanHTML(renderedText.value))
const canInlineEdit = computed(() => isAdministrator.value && paragraphId.value > 0)
const richTextClass = 'prose max-w-none'

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
  <WrapAnimate :effect="direction">
    <WrapDiv :align="align" :styles="[width, spacing]">
      <EditLink
        :link="editLink"
        :parent-uuid="parentUuid"
        :show-quick-edit="canInlineEdit && isEditing === false"
        @quick-edit="startEditing"
      >
        <EditText
          v-if="isEditing && canInlineEdit"
          :classes="classes"
          :paragraph-id="paragraphId"
          :source-text="editSourceText ?? sourceText"
          @cancel="stopEditing"
          @saved="handleSaved"
        />

        <div
          v-else-if="safeTextHtml"
          :class="[classes, richTextClass].filter(Boolean).join(' ')"
          v-html="safeTextHtml"
        />
      </EditLink>
    </WrapDiv>
  </WrapAnimate>
</template>
