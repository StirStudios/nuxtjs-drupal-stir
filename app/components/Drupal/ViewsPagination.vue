<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    current?: number
    totalPages?: number
    siblingCount?: number
  }>(),
  {
    current: 0,
    totalPages: 0,
    siblingCount: 1,
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
    class="views-pager"
    :items-per-page="1"
    show-edges
    :sibling-count="siblingCount"
    :total="totalPages"
  />
</template>
