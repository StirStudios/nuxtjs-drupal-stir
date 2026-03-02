<script setup lang="ts">
const { page } = usePageContext()

type NodeLink = {
  nid: string
  title: string
  url: string
}

type Related = {
  prevNode?: NodeLink | null
  nextNode?: NodeLink | null
}

const related = computed(
  () => (page.value?.related as Related | undefined) ?? undefined,
)
const prevNode = computed(() => related.value?.prevNode ?? null)
const nextNode = computed(() => related.value?.nextNode ?? null)
</script>

<template>
  <div class="container m-auto mb-5 flex justify-between">
    <UButton
      v-if="prevNode"
      color="primary"
      icon="i-lucide-chevron-left"
      label="Previous"
      size="xl"
      square
      :to="prevNode.url"
      variant="link"
    />

    <UButton
      v-if="nextNode"
      class="ml-auto"
      color="primary"
      icon="i-lucide-chevron-right"
      label="Next"
      size="xl"
      square
      :to="nextNode.url"
      trailing
      variant="link"
    />
  </div>
</template>
