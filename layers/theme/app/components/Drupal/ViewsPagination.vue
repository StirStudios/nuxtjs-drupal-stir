<script setup lang="ts">
interface PaginationDestination {
  path: string
  query: Record<string, string | string[]>
}

const props = withDefaults(
  defineProps<{
    current?: number
    totalPages?: number
    siblingCount?: number
    to?: (page: number) => PaginationDestination
  }>(),
  {
    current: 0,
    totalPages: 0,
    siblingCount: 1,
    to: undefined,
  },
)

const emit = defineEmits<{
  'update:current': [value: number]
}>()

const current = computed(() => Math.max(0, props.current))
const totalPages = computed(() => Math.max(0, props.totalPages))
const page = computed({
  get() {
    return current.value + 1
  },
  set(value: number) {
    emit('update:current', Math.max(0, value - 1))
  },
})
</script>

<template>
  <UPagination
    v-model:page="page"
    :items-per-page="1"
    show-edges
    :sibling-count="siblingCount"
    :to="to"
    :total="totalPages"
    :ui="{
      root: 'mt-8 flex justify-center',
    }"
  />
</template>
