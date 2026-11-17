<script lang="ts">
import theme from '#build/ui/blog-post'
</script>

<script setup lang="ts">
import { useLocale } from '@nuxt/ui/composables/useLocale'
import { tv } from '@nuxt/ui/utils/tv'
import { useTeaserPost } from '#stir/composables/useTeaserPost'
import { resolveDrupalTeaserLink } from '#stir/composables/useDrupalTeaserLink'

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
const appConfig = useAppConfig()
const stirTheme = appConfig.stirTheme
const { locale } = useLocale()
const trustedDescription = computed(() =>
  trustedDrupalHtml(post.value.description),
)
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
const teaserImageRoundedClass = computed(() =>
  `${stirTheme.media.rounded} rounded-b-none`,
)

const postUi = computed<Partial<Record<'root' | 'header' | 'date' | 'title' | 'body', string>>>(() => {
  if (!titleOverlay.value) return {}

  return {
    root: 'rounded-none',
    header: 'rounded-none',
    date: 'sr-only',
    title: 'text-white text-lg mb-0',
    body: 'pointer-events-none absolute inset-0 flex items-center justify-center text-center bg-black/50',
  }
})

// UBlogPost's markup and theme without its reka-ui date formatter, which pulls
// every @internationalized/date calendar into pages that show teasers.
// A site's app.config type for ui.blogPost would widen the theme's slots and
// variants; read it as the theme's own shape, as UBlogPost does at runtime.
const blogPostOverride = appConfig.ui?.blogPost as Partial<typeof theme> | undefined
const ui = computed(() => tv({ extend: theme, ...blogPostOverride })({
  orientation: orientation.value,
  image: Boolean(teaserImage.value),
  to: Boolean(post.value.to),
}))
const date = computed(() => {
  const value = showDate.value ? post.value.date : ''
  const parsed = value ? new Date(value) : null

  if (!parsed || Number.isNaN(parsed.getTime())) return null

  return {
    iso: parsed.toISOString(),
    label: new Intl.DateTimeFormat(locale.value.code, { dateStyle: 'medium', timeZone: 'UTC' }).format(parsed),
  }
})
</script>

<template>
  <EditLink :link="post.editLink">
    <article
      :class="ui.root({ class: postUi.root })"
      :data-orientation="orientation"
      data-slot="root"
    >
      <ULink
        v-if="post.to"
        :aria-label="post.title || 'Post link'"
        class="absolute inset-0 focus:outline-none"
        raw
        :to="post.to"
      />

      <div v-if="teaserImage" :class="ui.header({ class: postUi.header })" data-slot="header">
        <MediaImage
          v-bind="teaserImageProps"
          :rounded-class="teaserImageRoundedClass"
          :wrapper-class="[
            'h-full w-full transform transition-transform duration-300 group-hover:scale-105 group-hover/blog-post:scale-105',
          ]"
        />
      </div>

      <div :class="ui.body({ class: postUi.body })" data-slot="body">
        <div v-if="date" :class="ui.meta()" data-slot="meta">
          <time :class="ui.date({ class: postUi.date })" data-slot="date" :datetime="date.iso">
            {{ date.label }}
          </time>
        </div>

        <h2 v-if="post.title" :class="ui.title({ class: postUi.title })" data-slot="title">
          {{ post.title }}
        </h2>

        <div
          v-if="showDescription && trustedDescription"
          :class="ui.description()"
          data-slot="description"
          v-html="trustedDescription"
        />
      </div>
    </article>
  </EditLink>
</template>
