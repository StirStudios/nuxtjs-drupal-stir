<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    current?: number
    totalPages?: number
    maxLinks?: number
  }>(),
  {
    current: 0,
    totalPages: 0,
    maxLinks: 8,
  },
)

const route = useRoute()
const current = computed(() => Math.max(0, props.current))
const totalPages = computed(() => Math.max(0, props.totalPages))
const maxLinks = computed(() => Math.max(1, props.maxLinks))

const pageWindow = computed(() => {
  const half = Math.floor(maxLinks.value / 2)
  const start = Math.max(0, current.value - half)
  const end = Math.min(totalPages.value - 1, current.value + half)
  const pages: number[] = []

  for (let page = start; page <= end; page++) {
    pages.push(page)
  }

  return pages
})

const previousPage = computed(() =>
  current.value > 0 ? current.value - 1 : null,
)
const nextPage = computed(() =>
  current.value + 1 < totalPages.value ? current.value + 1 : null,
)
const hellipLeft = computed(
  () => (pageWindow.value.at(0) ?? 0) > 0,
)
const hellipRight = computed(
  () => (pageWindow.value.at(-1) ?? -1) < totalPages.value - 1,
)

function pageToLink(page: number) {
  return {
    path: route.path,
    query: {
      ...route.query,
      page: String(page),
    },
  }
}
</script>

<template>
  <div class="views-pager">
    <nav aria-label="Pagination" class="isolate inline-flex gap-1 -space-x-px">
      <NuxtLink
        v-if="previousPage !== null"
        class="relative inline-flex min-w-10 items-center px-2 py-2 text-sm"
        :to="pageToLink(previousPage)"
      >
        <span class="sr-only">Previous</span>
        &lt;&lt;
      </NuxtLink>
      <span
        v-if="hellipLeft"
        class="relative inline-flex min-w-10 items-center px-4 py-2"
        >&hellip;</span
      >
      <template v-for="page in pageWindow" :key="page">
        <component
          :is="page === current ? 'span' : 'NuxtLink'"
          :aria-current="page === current ? 'page' : undefined"
          :class="{
            'relative z-10 inline-flex min-w-10 items-center px-4 py-2':
              page === current,
            'relative inline-flex min-w-10 items-center px-4 py-2':
              page !== current,
          }"
          :to="page !== current ? pageToLink(page) : undefined"
        >
          {{ page + 1 }}
        </component>
      </template>
      <span
        v-if="hellipRight"
        class="relative inline-flex min-w-10 items-center"
        >&hellip;</span
      >
      <NuxtLink
        v-if="nextPage !== null"
        class="relative inline-flex min-w-10 items-center px-2 py-2"
        :to="pageToLink(nextPage)"
      >
        <span class="sr-only">Next</span>
        &gt;&gt;
      </NuxtLink>
    </nav>
  </div>
</template>
