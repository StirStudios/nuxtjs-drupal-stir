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
  url: props.url,
  created: props.created,
  orientation: props.orientation,
})

const theme = useAppConfig().stirTheme
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

  return {
    ...image,
    alt:
      (typeof image.alt === 'string' && image.alt.length > 0
        ? image.alt
        : post.value.title || props.title || ''),
  }
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
    body: 'absolute inset-0 flex items-center justify-center text-center bg-black/50',
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
        <div
          :class="[
            theme.media.base,
            'transform transition-transform',
            theme.media.transitions.fast,
            theme.media.effects.scale,
          ]"
        >
          <MediaImage
            v-if="teaserImage"
            v-bind="teaserImage"
          />
        </div>
      </template>

      <template v-if="showDescription" #description>
        <div v-html="post.description" />
      </template>
    </UBlogPost>
  </EditLink>
</template>
