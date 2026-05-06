<script setup lang="ts">
type CrumbItem = {
  label: string
  url?: string
}

const props = defineProps<{
  crumbs?: CrumbItem[]
}>()

const { getPage } = useDrupalCe()
const page = getPage()
const breadcrumbs = computed<CrumbItem[]>(() => {
  if (props.crumbs && props.crumbs.length > 0) {
    return props.crumbs
  }

  return page.value?.breadcrumbs || []
})

const breadcrumbLinks = computed(() =>
  breadcrumbs.value.map((crumb) => ({
    label: crumb.label,
    to: crumb.url || null,
  })),
)
</script>

<template>
  <UBreadcrumb v-if="breadcrumbLinks.length > 0" :items="breadcrumbLinks">
    <template #separator>
      <span class="mx-2 text-(--ui-text-muted)">/</span>
    </template>
  </UBreadcrumb>
</template>
