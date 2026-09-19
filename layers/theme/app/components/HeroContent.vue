<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    eyebrow?: string
    id?: number | string
    editLink?: string
    pageTitle?: string
    headerTag?: string
    subtitle?: string
    siteSlogan?: string
    heroText?: string
    hideTitle?: boolean
    isFront?: boolean
    layout?: 'background' | 'inline'
  }>(),
  {
    eyebrow: '',
    id: undefined,
    editLink: undefined,
    headerTag: undefined,
    pageTitle: '',
    subtitle: '',
    siteSlogan: '',
    heroText: '',
    hideTitle: false,
    isFront: false,
    layout: 'background',
  },
)

const { canEditInline } = usePageContext()
const canEdit = computed(() => Boolean(props.id) && canEditInline(props.editLink))
const { hero: heroTheme } = useAppConfig().stirTheme

// On the front page, `hero.front.subtitle: 'below'` keeps the page title as the
// H1 and shows the authored header, or else the site slogan, beneath it.
const subtitleBelow = computed(() => props.isFront && heroTheme.front.subtitle === 'below')
const heading = computed(() =>
  subtitleBelow.value
    ? props.pageTitle.trim() || props.subtitle.trim()
    : props.subtitle.trim() || props.pageTitle.trim(),
)
const secondaryHeading = computed(() =>
  subtitleBelow.value && props.pageTitle.trim()
    ? props.subtitle.trim() || props.siteSlogan.trim()
    : '',
)
const showText = computed(() => !props.isFront || heroTheme.front.showText !== false)
const headerEditTarget = computed(() => ({
  entityType: 'paragraph',
  entityId: props.id,
  fieldName: 'field_header',
  editorMode: 'heading',
}))

defineSlots<{ button?(): unknown }>()
</script>

<template>
  <div
    v-if="heading || eyebrow?.trim() || canEdit"
    class="heading-group"
  >
    <p
      v-if="eyebrow?.trim()"
      class="eyebrow mt-0 mb-[var(--stir-eyebrow-gap,0.75rem)] text-sm font-semibold tracking-[0.1em] uppercase"
    >
      {{ eyebrow }}
    </p>

    <template v-if="subtitleBelow">
      <h1
        v-if="heading"
        class="heading"
        :class="[heroTheme.text.heading, { 'sr-only': hideTitle }]"
      >
        {{ heading }}
      </h1>

      <EditableRichText
        v-if="secondaryHeading || canEdit"
        :id="id"
        :edit-link="editLink"
        :edit-target="headerEditTarget"
        :text="subtitle"
        :text-source="headerTag ? `${headerTag}|${subtitle}` : subtitle"
      >
        <h2
          v-if="secondaryHeading"
          class="subtitle"
          :class="heroTheme.front.subtitleClass"
        >
          {{ secondaryHeading }}
        </h2>
      </EditableRichText>
    </template>

    <EditableRichText
      v-else-if="heading || canEdit"
      :id="id"
      :edit-link="editLink"
      :edit-target="headerEditTarget"
      :text="heading"
      :text-source="headerTag ? `${headerTag}|${subtitle}` : subtitle"
    >
      <h1
        v-if="heading"
        class="heading"
        :class="[heroTheme.text.heading, { 'sr-only': hideTitle }]"
      >
        {{ heading }}
      </h1>
    </EditableRichText>
  </div>

  <EditableRichText
    v-if="showText && (heroText?.trim() || canEdit)"
    :id="id"
    classes="lead"
    :edit-link="editLink"
    :text="heroText"
  />

  <slot name="button" />
</template>
