<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    countryCode?: string
    administrativeArea?: string
    locality?: string
    dependentLocality?: string
    postalCode?: string
    sortingCode?: string
    addressLine1?: string
    addressLine2?: string
    organization?: string
    givenName?: string
    familyName?: string
    lines?: string[]
    label?: string
    searchQuery?: string
  }>(),
  {
    countryCode: '',
    administrativeArea: '',
    locality: '',
    dependentLocality: '',
    postalCode: '',
    sortingCode: '',
    addressLine1: '',
    addressLine2: '',
    organization: '',
    givenName: '',
    familyName: '',
    lines: () => [],
    label: '',
    searchQuery: '',
  },
)

const fallbackLines = computed(() => {
  const name = [props.givenName, props.familyName].filter(Boolean).join(' ')
  const locality = [
    props.dependentLocality,
    props.locality,
    props.administrativeArea,
  ]
    .filter(Boolean)
    .join(', ')
  const localityWithPostalCode = [locality, props.postalCode]
    .filter(Boolean)
    .join(' ')

  return [
    name,
    props.organization,
    props.addressLine1,
    props.addressLine2,
    localityWithPostalCode,
    props.countryCode,
  ].filter(Boolean)
})
const displayLines = computed(() =>
  props.lines.length > 0 ? props.lines : fallbackLines.value,
)
</script>

<template>
  <address :aria-label="label || undefined" class="not-italic">
    <slot
      v-bind="props"
      :display-lines="displayLines"
    >
      <span
        v-for="(line, index) in displayLines"
        :key="`${index}-${line}`"
        class="block"
      >
        {{ line }}
      </span>
    </slot>
  </address>
</template>
