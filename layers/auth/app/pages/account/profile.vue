<script setup lang="ts">
import { useAccountProfile } from '../../composables/account/useAccountProfile'
import { useAuthSession } from '../../composables/auth/useAuthSession'

const toast = useToast()
const session = useAuthSession()
const { fields, values, editableFields, profileMedia, hasChanges, loading, saving, load, save } =
  useAccountProfile()

const isReady = ref(false)
const uploadingSlot = ref<'avatar' | 'cover' | 'gallery' | null>(null)
const deletingMediaKey = ref<string | null>(null)
const uploadFiles = reactive<Record<'avatar' | 'cover' | 'gallery', File[]>>({
  avatar: [],
  cover: [],
  gallery: [],
})
const uploadTimers: Partial<Record<'avatar' | 'cover' | 'gallery', ReturnType<typeof setTimeout>>> = {}
const localGalleryItems = ref<ProfileMediaItem[]>([])
const dragGalleryMid = ref<number | null>(null)

type ProfileMediaItem = {
  mid: number
  title?: string
  src?: string
  alt?: string
}

const hiddenProfileFieldNames = new Set([
  'field_profile_avatar',
  'field_profile_cover',
  'field_profile_gallery',
  'field_media_profile_avatar',
  'field_media_profile_cover',
  'field_media_profile_gallery',
])

const displayFields = computed(() =>
  fields.value.filter(field => !hiddenProfileFieldNames.has(field.name)),
)

const displayEditableFieldsCount = computed(() =>
  editableFields.value.filter(field => !hiddenProfileFieldNames.has(field.name)).length,
)

const mediaSections = computed(() => {
  const avatar = profileMedia.value.avatar
    ? [profileMedia.value.avatar as ProfileMediaItem]
    : []
  const cover = profileMedia.value.cover
    ? [profileMedia.value.cover as ProfileMediaItem]
    : []
  const gallery = localGalleryItems.value

  return [
    { key: 'avatar' as const, label: 'Profile avatar', items: avatar, multiple: false },
    { key: 'cover' as const, label: 'Profile cover', items: cover, multiple: false },
    { key: 'gallery' as const, label: 'Profile gallery', items: gallery, multiple: true },
  ]
})

watch(
  () => profileMedia.value.gallery,
  (gallery) => {
    localGalleryItems.value = Array.isArray(gallery)
      ? [...(gallery as ProfileMediaItem[])]
      : []
  },
  { immediate: true },
)

const canShowUploader = (section: { key: 'avatar' | 'cover' | 'gallery'; items: ProfileMediaItem[] }): boolean => {
  if (section.key === 'gallery') {
    return true
  }

  return section.items.length === 0
}

onMounted(async () => {
  await session.fetchSession()

  if (!session.loggedIn.value) {
    await navigateTo('/auth/login')
    return
  }

  await load()
  isReady.value = true
})

const onSubmit = async () => {
  try {
    const response = await save()

    if (response?.no_changes) {
      toast.add({ title: 'No changes', description: 'There is nothing new to save.', color: 'neutral' })
      return
    }

    if (response?.updated) {
      toast.add({ title: 'Profile updated', description: 'Your changes were saved.', color: 'success' })
    }
  } catch (error: unknown) {
    const message =
      error && typeof error === 'object' && 'statusMessage' in error
        ? String((error as { statusMessage?: unknown }).statusMessage)
        : 'Unable to save profile changes.'

    toast.add({ title: 'Update failed', description: message, color: 'error' })
  }
}

const onUploadPhotos = async (slot: 'avatar' | 'cover' | 'gallery') => {
  if (uploadFiles[slot].length === 0) {
    toast.add({ title: 'No files selected', description: 'Choose one or more photos first.', color: 'neutral' })
    return
  }

  uploadingSlot.value = slot
  try {
    const formData = new FormData()

    formData.append('slot', slot)
    for (const file of uploadFiles[slot]) {
      formData.append('files[]', file)
    }

    const response = await $fetch<{
      uploaded?: boolean
      error?: string
      items?: Array<{ mid: number; name: string; url: string }>
      errors?: Array<{ file: string; error: string }>
    }>(
      '/api/account/profile/media/upload',
      {
        method: 'POST',
        body: formData,
      },
    )

    if (Array.isArray(response.items) && response.items.length > 0) {
      toast.add({ title: 'Photos uploaded', description: `${response.items.length} photo(s) uploaded.`, color: 'success' })
      await load({ silent: true })
    }

    if (Array.isArray(response.errors) && response.errors.length > 0) {
      toast.add({
        title: 'Some uploads failed',
        description: response.errors[0]?.error || 'One or more files could not be uploaded.',
        color: 'warning',
      })
    }

    if (!response.uploaded && (!Array.isArray(response.items) || response.items.length === 0)) {
      toast.add({
        title: 'Upload failed',
        description: response.error || 'No files were uploaded. Check profile media field setup in Drupal.',
        color: 'error',
      })
    }

    uploadFiles[slot] = []
  } catch (error: unknown) {
    const message =
      error && typeof error === 'object' && 'statusMessage' in error
        ? String((error as { statusMessage?: unknown }).statusMessage)
        : 'Unable to upload photos.'

    toast.add({ title: 'Upload failed', description: message, color: 'error' })
  } finally {
    uploadingSlot.value = null
  }
}

const onFilesSelected = async (
  slot: 'avatar' | 'cover' | 'gallery',
  value: File | File[] | FileList | null | undefined,
) => {
  const files = value instanceof FileList
    ? Array.from(value)
    : Array.isArray(value)
    ? value
    : value instanceof File
      ? [value]
      : []

  if (slot === 'gallery') {
    const existing = uploadFiles.gallery
    const merged = [...existing, ...files]
    const deduped = merged.filter((file, index, all) =>
      all.findIndex(candidate =>
        candidate.name === file.name
        && candidate.size === file.size
        && candidate.lastModified === file.lastModified,
      ) === index,
    )

    uploadFiles.gallery = deduped

    if (uploadTimers.gallery) {
      clearTimeout(uploadTimers.gallery)
    }
    uploadTimers.gallery = setTimeout(async () => {
      if (uploadingSlot.value === null && uploadFiles.gallery.length > 0) {
        await onUploadPhotos('gallery')
      }
    }, 250)
    return
  }

  uploadFiles[slot] = files.slice(0, 1)
  await onUploadPhotos(slot)
}

const onRemoveProfileMediaItem = async (
  slot: 'avatar' | 'cover' | 'gallery',
  item: { mid: number; title?: string },
) => {
  const key = `${slot}-${item.mid}`

  deletingMediaKey.value = key

  try {
    const response = await $fetch<{ removed?: boolean; error?: string }>('/api/account/profile/media/delete', {
      method: 'POST',
      body: {
        slot,
        mid: item.mid,
      },
    })

    if (response.removed) {
      toast.add({
        title: 'Media removed',
        description: `${item.title || `Media #${item.mid}`} was removed.`,
        color: 'success',
      })
      await load({ silent: true })
      return
    }

    toast.add({
      title: 'Remove failed',
      description: response.error || 'Unable to remove this media item.',
      color: 'error',
    })
  } catch (error: unknown) {
    const message =
      error && typeof error === 'object' && 'statusMessage' in error
        ? String((error as { statusMessage?: unknown }).statusMessage)
        : 'Unable to remove this media item.'

    toast.add({ title: 'Remove failed', description: message, color: 'error' })
  } finally {
    deletingMediaKey.value = null
  }
}

const onGalleryDragStart = (mid: number) => {
  dragGalleryMid.value = mid
}

const onGalleryDrop = async (targetMid: number) => {
  const sourceMid = dragGalleryMid.value

  dragGalleryMid.value = null
  if (!sourceMid || sourceMid === targetMid) {
    return
  }

  const current = [...localGalleryItems.value]
  const fromIndex = current.findIndex(item => item.mid === sourceMid)
  const toIndex = current.findIndex(item => item.mid === targetMid)

  if (fromIndex < 0 || toIndex < 0) {
    return
  }

  const next = [...current]
  const [moved] = next.splice(fromIndex, 1)

  if (!moved) {
    return
  }
  next.splice(toIndex, 0, moved)
  localGalleryItems.value = next

  try {
    await $fetch('/api/account/profile/media/reorder', {
      method: 'POST',
      body: {
        slot: 'gallery',
        ordered_mids: next.map(item => item.mid),
      },
    })
    toast.add({ title: 'Order updated', description: 'Gallery order saved.', color: 'success' })
    await load({ silent: true })
  } catch (error: unknown) {
    localGalleryItems.value = current
    const message =
      error && typeof error === 'object' && 'statusMessage' in error
        ? String((error as { statusMessage?: unknown }).statusMessage)
        : 'Unable to save gallery order.'

    toast.add({ title: 'Reorder failed', description: message, color: 'error' })
  }
}
</script>

<template>
  <div class="w-full px-4 py-8">
    <div class="mx-auto w-full max-w-lg space-y-6">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-highlighted mb-0 text-xl font-semibold">Profile</h1>
        <UButton icon="i-lucide-arrow-left" size="sm" to="/" variant="ghost">Back to site</UButton>
      </div>

      <div class="flex items-center gap-2">
        <UButton color="neutral" to="/account/settings" variant="ghost">Settings</UButton>
        <UButton color="neutral" to="/account/profile" variant="soft">Profile</UButton>
      </div>

      <div class="border-accented bg-default rounded-xl border p-4 md:p-6">
        <div v-if="loading || !isReady" class="space-y-4">
          <USkeleton class="h-5 w-28" />
          <USkeleton class="h-10 w-full" />
          <USkeleton class="h-10 w-full" />
          <USkeleton class="h-10 w-1/2" />
        </div>

        <template v-else>
          <AccountProfileForm
            v-if="displayFields.length > 0"
            :editable-fields-count="displayEditableFieldsCount"
            :fields="displayFields"
            :has-profile-save="hasChanges"
            heading="Profile"
            :saving="saving"
            subheading="Update your Drupal profile fields."
            :values="values"
            @submit="onSubmit"
          />

          <div class="space-y-3">
            <h2 class="text-highlighted text-base font-semibold">Profile Photos</h2>
            <p class="text-muted text-sm">Select images below to upload instantly.</p>

            <div class="space-y-4">
              <div v-for="section in mediaSections" :key="section.key" class="space-y-2">
                <h3 class="text-sm font-medium">{{ section.label }}</h3>
                <div
                  v-if="uploadingSlot === section.key"
                  class="text-muted text-sm"
                >
                  Uploading...
                </div>
                <div
                  class="grid grid-cols-2 gap-3 md:grid-cols-3"
                >
                  <div
                    v-for="item in section.items"
                    :key="item.mid"
                    class="bg-elevated group relative rounded-md p-2"
                    :class="section.key === 'gallery' ? 'cursor-grab active:cursor-grabbing' : ''"
                    :draggable="section.key === 'gallery'"
                    @dragover.prevent="section.key === 'gallery'"
                    @dragstart="section.key === 'gallery' && onGalleryDragStart(item.mid)"
                    @drop.prevent="section.key === 'gallery' && onGalleryDrop(item.mid)"
                  >
                    <UButton
                      class="absolute right-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                      color="neutral"
                      icon="i-lucide-x"
                      :loading="deletingMediaKey === `${section.key}-${item.mid}`"
                      size="xs"
                      variant="soft"
                      @click="onRemoveProfileMediaItem(section.key as 'avatar' | 'cover' | 'gallery', item)"
                    />
                    <div class="aspect-square w-full overflow-hidden rounded-md">
                      <MediaImage
                        :alt="String(item.alt || item.title || 'Profile media')"
                        :draggable="false"
                        :image-class="section.key === 'gallery' ? 'pointer-events-none select-none h-full w-full !object-cover' : 'h-full w-full !object-cover'"
                        no-wrapper
                        :src="String(item.src || '')"
                      />
                    </div>
                    <p class="text-muted mt-2 truncate text-xs">{{ item.title || `Media #${item.mid}` }}</p>
                  </div>
                  <UFileUpload
                    v-if="canShowUploader(section)"
                    v-model="uploadFiles[section.key]"
                    accept="image/*"
                    :class="section.multiple ? 'h-full min-h-0' : 'col-span-full'"
                    description="PNG, JPG, WebP or GIF"
                    icon="i-lucide-image-plus"
                    :label="section.multiple ? 'Add photos' : 'Add photo'"
                    :multiple="section.multiple"
                    :ui="{ root: section.multiple ? 'h-full' : 'w-full', base: section.multiple ? 'h-full min-h-36' : 'w-full min-h-36' }"
                    @update:model-value="onFilesSelected(section.key, $event)"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
