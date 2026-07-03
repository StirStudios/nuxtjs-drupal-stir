<script setup lang="ts">
import { useTeaserPost } from '~/composables/useTeaserPost'
import { resolveDrupalTeaserLink } from '~/composables/useDrupalTeaserLink'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  title?: string
  id?: string | number
  nid?: string | number
  url?: string
  editLink?: string
  created?: string
  orientation?: 'horizontal' | 'vertical'
  teaser: unknown
  titleOverlay?: boolean
  showDate?: boolean
  showDescription?: boolean
  path?: {
    alias?: string
  }
}>()

const href = computed(() =>
  resolveDrupalTeaserLink(props),
)

const { post, orientation } = useTeaserPost(props.teaser, {
  title: props.title,
  url: href.value,
  created: props.created,
  orientation: props.orientation,
  editLink: props.editLink,
})

const showDate = computed(() => props.showDate ?? true)
const showDescription = computed(() => props.showDescription ?? true)
const titleOverlay = computed(() => props.titleOverlay ?? false)
const teaserImage = computed(() => {
  const image = post.value.image

  if (!image) return null
  if (typeof image === 'string') {
    return {
      src: image,
      alt: post.value.title || props.title || '',
    }
  }

  const media = image as Record<string, unknown>
  const mediaAlt = typeof media.alt === 'string' ? media.alt : ''

  return {
    ...media,
    alt:
      (mediaAlt.length > 0
        ? mediaAlt
        : post.value.title || props.title || ''),
  }
})
const teaserImageProps = computed<Record<string, unknown>>(() => {
  const image = teaserImage.value

  return image && typeof image === 'object' ? image : {}
})

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
    body: 'pointer-events-none absolute inset-0 flex items-center justify-center text-center bg-black/50',
  }
})

</script>

<template>
  <EditLink :link="post.editLink">
    <UBlogPost
      :date="showDate ? post.date : undefined"
      :description="showDescription ? post.description : undefined"
      :orientation="orientation"
      :title="post.title"
      :to="post.to"
      :ui="postUi"
    >
      <template #header>
        <MediaImage
          v-if="teaserImage"
          v-bind="teaserImageProps"
          :wrapper-class="[
            'h-full w-full transform transition-transform duration-300 group-hover:scale-105 group-hover/blog-post:scale-105',
          ]"
        />
      </template>

      <template v-if="showDescription" #description>
        <div v-html="post.description" />
      </template>
    </UBlogPost>
  </EditLink>
</template>
