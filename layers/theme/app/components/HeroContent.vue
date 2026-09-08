<script setup lang="ts">
withDefaults(
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

const { isAdministrator } = usePageContext()

defineSlots<{ button?(): unknown }>()
</script>

<template>
  <template v-if="pageTitle && isFront">
    <h1 :class="{ 'sr-only': hideTitle }">{{ pageTitle }}</h1>
    <div v-if="subtitle || eyebrow?.trim() || (isAdministrator && id)" class="hero-heading-group">
      <p v-if="eyebrow?.trim()" class="paragraph-eyebrow">{{ eyebrow }}</p>
    <EditableRichText v-if="subtitle || (isAdministrator && id)" :id="id" :edit-link="editLink" :edit-target="{ entityType: 'paragraph', entityId: id, fieldName: 'field_header', editorMode: 'heading' }" :text="subtitle" :text-source="headerTag ? `${headerTag}|${subtitle}` : subtitle">
      <h2 v-if="subtitle" class="display-h1 text-left">{{ subtitle }}</h2>
    </EditableRichText>
    </div>
  </template>

  <div v-else-if="pageTitle" class="hero-heading-group">
    <p v-if="eyebrow?.trim()" class="paragraph-eyebrow">{{ eyebrow }}</p>
  <h1
    class="mb-0"
    :class="{ 'sr-only': hideTitle }"
  >
    {{ pageTitle }}
  </h1>
  </div>

  <EditableRichText v-if="heroText?.trim() || (isAdministrator && id)" :id="id" classes="hero-copy" :edit-link="editLink" :text="heroText" />

  <slot name="button" />
</template>
