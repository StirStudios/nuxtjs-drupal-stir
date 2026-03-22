<script setup lang="ts">
import { useEventListener, useWindowScroll } from '@vueuse/core'
import { useParagraphTextEditor } from '~/composables/useParagraphTextEditor'
import { adminUiTheme } from '~/utils/adminUiTheme'
import { normalizeEditorHtmlForSave } from '~/utils/normalizeEditorHtmlForSave'

const props = defineProps<{
  paragraphId: number
  sourceText: string
  classes?: string
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'saved', value: string): void
}>()

const isEditing = ref(true)
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const editPanelRef = ref<HTMLElement | null>(null)
const { y } = useWindowScroll()

const sourceTextRef = computed(() => props.sourceText)
const toolbarClass = 'admin-ui-toolbar sticky top-0 z-10 mb-2 px-2 py-2'
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

function closeEditor(event: 'cancel' | 'saved', value = ''): void {
  isEditing.value = false

  if (event === 'saved') {
    emit('saved', value)

    return
  }

  emit(event)
}

async function saveInline() {
  if (props.paragraphId === 0) return

  const valueToSave = normalizeEditorHtmlForSave(editorValue.value)

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
    closeEditor('saved', valueToSave)
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Failed to save paragraph text.'
  } finally {
    isSaving.value = false
  }
}

function cancelEditing(): void {
  closeEditor('cancel')
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

  if (import.meta.client) {
    useEventListener(window, 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelEditing()

        return
      }

      if (event.key === 'Enter' && event.metaKey) {
        event.preventDefault()
        void saveInline()
      }
    })
  }
})
</script>

<template>
  <UTheme :ui="adminUiTheme">
    <div
      ref="editPanelRef"
      :class="[classes, 'admin-ui admin-ui-scope admin-ui-panel rounded-lg']"
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
          taskList: false,
          taskItem: false,
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

      <div class="mt-4 p-4 flex items-center justify-between gap-3">
        <span v-if="isSaving" class="admin-ui-status-saving text-sm">Saving...</span>
        <span v-else-if="saveError" class="admin-ui-status-error text-sm">{{ saveError }}</span>
        <span v-else-if="saveSuccess" class="admin-ui-status-success text-sm">{{ saveSuccess }}</span>
        <span v-else class="text-sm text-transparent">Status</span>
        <div class="flex items-center gap-2">
          <UButton
            aria-label="Cancel"
            color="neutral"
            icon="i-lucide-x"
            size="sm"
            variant="ghost"
            @click="cancelEditing"
          >
            Cancel
          </UButton>

          <UButton
            aria-label="Save"
            color="neutral"
            icon="i-lucide-save"
            :loading="isSaving"
            size="sm"
            variant="soft"
            @click="saveInline"
          >
            Save
          </UButton>
        </div>
      </div>
    </div>
  </UTheme>
</template>
