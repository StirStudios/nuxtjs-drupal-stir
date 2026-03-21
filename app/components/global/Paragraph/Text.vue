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

const sourceText = computed(() => {
  const rawSnake = attrs.text_source ?? attrs['text-source']
  const snakeSource = typeof rawSnake === 'string' ? rawSnake : ''
  const normalizedTextSource = props.textSource?.trim()
    ? props.textSource
    : undefined

  return normalizedTextSource ?? (snakeSource.trim() ? snakeSource : undefined) ?? props.text ?? ''
})

const safeTextHtml = computed(() => cleanHTML(props.text ?? ''))
const canInlineEdit = computed(() => isAdministrator.value && paragraphId.value > 0)
const hasIframeEmbed = computed(() => sourceText.value.toLowerCase().includes('<iframe'))
const richTextClass = 'prose max-w-none'

function startEditing() {
  isEditing.value = true
}

function stopEditing() {
  isEditing.value = false
}
</script>

<template>
  <WrapAnimate :effect="direction">
    <WrapAlign :align="align">
      <div :class="[width, spacing]">
        <EditLink
          :link="editLink"
          :quick-edit-disabled="hasIframeEmbed"
          :show-quick-edit="canInlineEdit && isEditing === false"
          @quick-edit="startEditing"
        >
          <EditText
            v-if="isEditing && canInlineEdit"
            :classes="classes"
            :paragraph-id="paragraphId"
            :source-text="sourceText"
            @cancel="stopEditing"
            @saved="stopEditing"
          />

          <div
            v-else-if="safeTextHtml"
            :class="[classes, richTextClass].filter(Boolean).join(' ')"
            v-html="safeTextHtml"
          />
        </EditLink>
      </div>
    </WrapAlign>
  </WrapAnimate>
</template>
