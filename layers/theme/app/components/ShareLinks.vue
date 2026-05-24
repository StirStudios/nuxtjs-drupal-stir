<script setup lang="ts">
import type { ShareNetwork } from '~/composables/useShareLinks'

type ShareLinksVariant = 'icons' | 'buttons' | 'menu'

const props = withDefaults(defineProps<{
  url?: string
  title?: string
  description?: string
  networks?: ShareNetwork[]
  label?: string
  compact?: boolean
  variant?: ShareLinksVariant
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  compact: false,
  description: '',
  label: 'Share',
  networks: () => ['native', 'x', 'facebook', 'linkedin', 'email', 'copy'],
  size: 'sm',
  title: '',
  url: '',
  variant: 'icons',
})

const {
  copied,
  isNativeShareSupported,
  items,
  share,
} = useShareLinks({
  description: computed(() => props.description),
  networks: computed(() => props.networks),
  title: computed(() => props.title),
  url: computed(() => props.url),
})

const visibleItems = computed(() => items.value.filter(item => item.network !== 'native' || isNativeShareSupported.value))
const showMenuLabel = computed(() => props.variant !== 'menu' || !props.compact)
const menuItems = computed(() => visibleItems.value.map(item => ({
  label: item.network === 'copy' && copied.value ? 'Copied' : item.label,
  icon: item.network === 'copy' && copied.value ? 'i-lucide-check' : item.icon,
  onSelect: () => share(item.network),
})))

function itemLabel(network: ShareNetwork, label: string) {
  return network === 'copy' && copied.value ? 'Copied' : label
}

function itemIcon(network: ShareNetwork, icon: string) {
  return network === 'copy' && copied.value ? 'i-lucide-check' : icon
}
</script>

<template>
  <UDropdownMenu v-if="variant === 'menu'" :items="menuItems">
    <UButton
      :aria-label="showMenuLabel ? undefined : label"
      color="neutral"
      :icon="copied ? 'i-lucide-check' : 'i-lucide-share-2'"
      :label="showMenuLabel ? label : undefined"
      :size="size"
      :square="!showMenuLabel"
      variant="outline"
    />
  </UDropdownMenu>

  <div v-else class="flex flex-wrap items-center gap-2">
    <UTooltip
      v-for="item in visibleItems"
      :key="item.network"
      :text="itemLabel(item.network, item.label)"
    >
      <UButton
        :aria-label="itemLabel(item.network, item.label)"
        color="neutral"
        :icon="itemIcon(item.network, item.icon)"
        :label="variant === 'buttons' ? itemLabel(item.network, item.label) : undefined"
        :size="size"
        :square="variant === 'icons'"
        variant="outline"
        @click="share(item.network)"
      />
    </UTooltip>
  </div>
</template>
