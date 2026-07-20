<script setup lang="ts">
import { trustedDrupalHtml } from '#stir/utils/trustedDrupalHtml'
import type { WebformDefinition } from '#stir/types'

const props = defineProps<{
  id: number | string
  uuid: string
  parentUuid?: string
  region?: string

  text?: string
  alert?: string
  webform?: WebformDefinition

  direction?: string
  onClose?: () => void

  editLink?: string
}>()

const appConfig = useAppConfig()
const isSubscriptionOpen = ref(false)
const trustedTextHtml = computed(() => trustedDrupalHtml(props.text))
const popupConfig = computed(() => appConfig.popup ?? {})
const isWebformCollapsible = computed(
  () => Boolean(props.webform && popupConfig.value.webformCollapsible),
)
const webformToggleLabel = computed(
  () =>
    popupConfig.value.webformToggleLabel?.trim() || 'Subscribe for updates',
)
</script>

<template>
  <EditLink :link="editLink" :parent-uuid="parentUuid">
    <slot name="media" />
    <slot name="schedule" />

    <div
      v-if="trustedTextHtml || props.webform"
      :class="isWebformCollapsible ? 'p-5' : 'space-y-6 p-5'"
    >
      <UCollapsible
        v-if="isWebformCollapsible"
        v-model:open="isSubscriptionOpen"
        class="flex flex-col gap-5"
      >
        <UButton
          block
          color="neutral"
          :label="webformToggleLabel"
          :trailing-icon="
            isSubscriptionOpen
              ? 'i-lucide-chevron-up'
              : 'i-lucide-chevron-down'
          "
          variant="soft"
        />

        <template #content>
          <div class="space-y-6 pt-1">
            <div
              v-if="trustedTextHtml"
              class="prose max-w-none"
              v-html="trustedTextHtml"
            />
            <ParagraphWebform
              v-if="props.webform"
              :on-close="props.onClose"
              :webform="props.webform"
            />
          </div>
        </template>
      </UCollapsible>

      <template v-else>
        <div
          v-if="trustedTextHtml"
          class="prose max-w-none"
          v-html="trustedTextHtml"
        />
        <ParagraphWebform
          v-if="props.webform"
          :on-close="props.onClose"
          :webform="props.webform"
        />
      </template>
    </div>
  </EditLink>
</template>
