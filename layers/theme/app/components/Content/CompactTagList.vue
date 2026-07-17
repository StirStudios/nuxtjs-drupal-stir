<script setup lang="ts">
type TagColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export type CompactTag = {
  id?: number | string
  label: string
  url?: string | null
  color?: TagColor
}

const props = withDefaults(defineProps<{
  ariaLabelPrefix?: string
  defaultColor?: TagColor
  items?: CompactTag[]
  maxVisible?: number
  useItemColors?: boolean
  wrap?: boolean
}>(), {
  ariaLabelPrefix: 'View',
  defaultColor: 'neutral',
  items: () => [],
  maxVisible: 0,
  useItemColors: false,
  wrap: true,
})

const normalizedItems = computed(() =>
  props.items.filter(item => item.label.trim() !== ''),
)
const hasLimit = computed(() => props.maxVisible > 0)
const visibleItems = computed(() => hasLimit.value
  ? normalizedItems.value.slice(0, props.maxVisible)
  : normalizedItems.value,
)
const hiddenItems = computed(() => hasLimit.value
  ? normalizedItems.value.slice(props.maxVisible)
  : [],
)
const hiddenLabel = computed(() => hiddenItems.value.map(item => item.label).join(', '))
const hiddenAriaLabel = computed(() =>
  `${hiddenItems.value.length} more: ${hiddenLabel.value}`,
)
const ULinkComponent = resolveComponent('ULink')

function itemKey(item: CompactTag, prefix: string): string {
  return `${prefix}-${item.id || item.label}`
}

function itemComponent(item: CompactTag) {
  return item.url ? ULinkComponent : 'span'
}

function itemColor(item: CompactTag): TagColor {
  return props.useItemColors && item.color ? item.color : props.defaultColor
}

function linkAttrs(item: CompactTag) {
  return item.url
    ? {
        'aria-label': `${props.ariaLabelPrefix} ${item.label}`,
        to: item.url,
      }
    : {}
}
</script>

<template>
  <div
    v-if="normalizedItems.length"
    class="flex min-w-0 items-center gap-1.5"
    :class="wrap ? 'flex-wrap' : 'overflow-hidden'"
  >
    <component
      :is="itemComponent(item)"
      v-for="item in visibleItems"
      :key="itemKey(item, 'tag')"
      class="relative z-20 min-w-0 shrink"
      v-bind="linkAttrs(item)"
    >
      <UBadge
        class="max-w-28 truncate px-1.5 py-0.5 text-[11px] leading-4 sm:max-w-32"
        :color="itemColor(item)"
        variant="subtle"
      >
        {{ item.label }}
      </UBadge>
    </component>

    <UTooltip
      v-if="hiddenItems.length"
      :text="hiddenLabel"
    >
      <UBadge
        :aria-label="hiddenAriaLabel"
        class="shrink-0 px-1.5 py-0.5 text-[11px] leading-4"
        color="neutral"
        variant="soft"
      >
        +{{ hiddenItems.length }}
      </UBadge>
    </UTooltip>
  </div>
</template>
