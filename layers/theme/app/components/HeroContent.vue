<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    eyebrow?: string
    id?: number | string
    editLink?: string
    pageTitle?: string
    headerTag?: string
    subtitle?: string
    heroText?: string
    hideTitle?: boolean
    isFront?: boolean
  }>(),
  {
    eyebrow: '',
    id: undefined,
    editLink: undefined,
    headerTag: undefined,
    pageTitle: '',
    subtitle: '',
    heroText: '',
    hideTitle: false,
    isFront: false,
  },
)

const heading = computed(() => props.subtitle.trim() || props.pageTitle.trim())

const { isAdministrator } = usePageContext()

defineSlots<{ button?(): unknown }>()
</script>

<template>
  <div v-if="heading || eyebrow?.trim() || (isAdministrator && id)" class="hero-heading-group">
    <p v-if="eyebrow?.trim()" class="paragraph-eyebrow mt-0 mb-[var(--stir-eyebrow-gap,0.75rem)] text-sm font-semibold tracking-[0.1em] uppercase">{{ eyebrow }}</p>
    <EditableRichText
      v-if="heading || (isAdministrator && id)"
      :id="id"
      :edit-link="editLink"
      :edit-target="{ entityType: 'paragraph', entityId: id, fieldName: 'field_header', editorMode: 'heading' }"
      :text="heading"
      :text-source="headerTag ? `${headerTag}|${subtitle}` : subtitle"
    >
      <h1 v-if="heading" class="hero-heading mb-0" :class="{ 'sr-only': hideTitle }">{{ heading }}</h1>
    </EditableRichText>
  </div>

  <EditableRichText v-if="heroText?.trim() || (isAdministrator && id)" :id="id" classes="hero-copy" :edit-link="editLink" :text="heroText" />

  <slot name="button" />
</template>
