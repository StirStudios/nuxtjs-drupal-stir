<script setup lang="ts">
import { useTeaserPost } from '~/composables/useTeaserPost'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  title?: string
  url?: string
  nid?: string
  created?: string
  orientation?: 'horizontal' | 'vertical'
  teaser: unknown
  titleOverlay?: boolean
  showDate?: boolean
  showDescription?: boolean
}>()

const { post, orientation } = useTeaserPost(props.teaser, {
  title: props.title,
  nid: props.nid,
  url: props.url,
  created: props.created,
  orientation: props.orientation,
})

const showDate = computed(() => props.showDate ?? true)
const showDescription = computed(() => props.showDescription ?? true)
const titleOverlay = computed(() => props.titleOverlay ?? false)

const postUi = computed(() => {
  if (!titleOverlay.value) {
    return {
      image: 'object-center',
    }
  }

  return {
    root: 'rounded-none',
    header: 'rounded-none',
    image: 'object-center duration-800',
    date: 'sr-only',
    title: 'text-white text-lg mb-0',
    body: 'absolute inset-0 flex items-center justify-center text-center bg-black/50',
  }
})
</script>

<template>
  <EditLink :link="post.editLink">
    <UBlogPost
      :date="showDate ? post.date : undefined"
      :description="showDescription ? post.description : undefined"
      :image="post.image"
      :orientation="orientation"
      :title="post.title"
      :to="post.to"
      :ui="postUi"
    >
      <template v-if="showDescription" #description>
        <div v-html="post.description" />
      </template>
    </UBlogPost>
  </EditLink>
</template>
