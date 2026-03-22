<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'
import { useParagraphTextEditor } from '~/composables/useParagraphTextEditor'

const props = defineProps<{
  paragraphId: number
  sourceText: string
  classes?: string
}>()

const emit = defineEmits<{
  (e: 'cancel' | 'saved'): void
}>()

const isEditing = ref(true)
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const editPanelRef = ref<HTMLElement | null>(null)
const { y } = useWindowScroll()

const sourceTextRef = computed(() => props.sourceText)
const toolbarClass = 'sticky top-0 z-10 mb-2 border-b border-default bg-default px-2 py-2'
const shouldShowBubbleToolbar = (payload: { view: { hasFocus: () => boolean }; state: { selection: { empty: boolean } } }) => {
  return payload.view.hasFocus() && payload.state.selection.empty === false
}
const {
  bubbleToolbarItems,
  customHandlers,
  editorUi,
  editorValue,
  extensions,
  fixedToolbarItems,
  suggestionItems,
  syncEditorBuffers,
} = useParagraphTextEditor(sourceTextRef)

function resetEditMessages(): void {
  saveError.value = ''
  saveSuccess.value = ''
}

function closeEditor(event: 'cancel' | 'saved'): void {
  isEditing.value = false
  emit(event)
}

function cancelEditing() {
  syncEditorBuffers(sourceTextRef.value)
  resetEditMessages()
  closeEditor('cancel')
}

function stripTrailingEmptyParagraphs(value: string): string {
  return value
    .replace(/(?:\s*<p>(?:\s|&nbsp;|<br\s*\/?>|\u00a0)*<\/p>\s*)+$/gi, '')
    .trim()
}

async function saveInline() {
  if (props.paragraphId === 0) return

  const valueToSave = stripTrailingEmptyParagraphs(editorValue.value)

  if (valueToSave === '') {
    saveError.value = 'Text is required.'

    return
  }

  isSaving.value = true
  resetEditMessages()

  try {
    const response = await $fetch<{ ok: boolean; message?: string }>(
      `/api/paragraph/${props.paragraphId}/text`,
      {
        method: 'POST',
        body: {
          text: valueToSave,
        },
      },
    )

    if (response?.ok !== true) {
      throw new Error(response?.message || 'Save failed.')
    }

    saveSuccess.value = 'Saved.'
    await refreshNuxtData()
    closeEditor('saved')
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Failed to save paragraph text.'
  } finally {
    isSaving.value = false
  }
}

function scrollEditorIntoViewIfNeeded(): void {
  if (import.meta.client === false || editPanelRef.value === null) return

  const headerHeightRaw = window.getComputedStyle(document.documentElement)
    .getPropertyValue('--ui-header-height')
    .trim()
  const headerHeight = Number.parseFloat(headerHeightRaw) || 0
  const rootFontSizeRaw = window.getComputedStyle(document.documentElement).fontSize
  const rootFontSize = Number.parseFloat(rootFontSizeRaw) || 16
  const extraTopOffset = 10 * rootFontSize
  const topSafeArea = headerHeight + extraTopOffset
  const panelRect = editPanelRef.value.getBoundingClientRect()
  const isOutsideViewport = panelRect.top < topSafeArea || panelRect.bottom > window.innerHeight - 12

  if (isOutsideViewport === false) return

  const panelTop = window.scrollY + editPanelRef.value.getBoundingClientRect().top
  const targetTop = Math.max(0, panelTop - topSafeArea)

  if (Math.abs(window.scrollY - targetTop) > 8) {
    y.value = targetTop
  }
}

onMounted(async () => {
  syncEditorBuffers(sourceTextRef.value)
  await nextTick()
  scrollEditorIntoViewIfNeeded()
})
</script>

<template>
  <div
    ref="editPanelRef"
    :class="['rounded-md border border-default bg-default p-4', classes]"
  >
    <UEditor
      v-slot="{ editor }"
      v-model="editorValue"
      class="w-full min-h-32 max-h-[60vh] overflow-y-auto"
      content-type="html"
      :extensions="extensions"
      :handlers="customHandlers"
      :inject-css="false"
      placeholder="Type / for commands..."
      :starter-kit="{
        trailingNode: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }"
      :ui="editorUi"
    >
      <div :class="toolbarClass">
        <UEditorToolbar
          class="border-0 bg-transparent p-0"
          :editor="editor"
          :items="fixedToolbarItems"
        />
      </div>

      <UEditorToolbar
        :editor="editor"
        :items="bubbleToolbarItems"
        layout="bubble"
        :should-show="shouldShowBubbleToolbar"
      />

      <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />
    </UEditor>

    <div class="mt-3 flex items-center gap-2">
      <UButton
        :disabled="isSaving"
        icon="i-lucide-save"
        :loading="isSaving"
        size="sm"
        @click="saveInline"
      >
        Save
      </UButton>
      <UButton
        color="neutral"
        :disabled="isSaving"
        icon="i-lucide-x"
        size="sm"
        variant="outline"
        @click="cancelEditing"
      >
        Cancel
      </UButton>

      <span v-if="saveError" class="text-sm text-error">{{ saveError }}</span>
      <span v-else-if="saveSuccess" class="text-sm text-success">{{ saveSuccess }}</span>
    </div>
  </div>
</template>
