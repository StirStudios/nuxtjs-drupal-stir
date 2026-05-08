<script setup lang="ts">
import { useAccountProfile } from '../../composables/account/useAccountProfile'
import { useAuthSession } from '../../composables/auth/useAuthSession'

const toast = useToast()
const session = useAuthSession()
const { fields, values, editableFields, hasChanges, loading, saving, load, save } =
  useAccountProfile()

const isReady = ref(false)
const uploading = ref(false)
const selectedFiles = ref<File[]>([])
const uploadSlot = ref<'avatar' | 'cover' | 'gallery'>('gallery')
const uploadedItems = ref<Array<{ mid: number; name: string; url: string }>>([])

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

const onUploadPhotos = async () => {
  if (selectedFiles.value.length === 0) {
    toast.add({ title: 'No files selected', description: 'Choose one or more photos first.', color: 'neutral' })
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('slot', uploadSlot.value)
    for (const file of selectedFiles.value) {
      formData.append('files', file)
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
      uploadedItems.value = response.items
      toast.add({ title: 'Photos uploaded', description: `${response.items.length} photo(s) uploaded.`, color: 'success' })
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

    selectedFiles.value = []
  } catch (error: unknown) {
    const message =
      error && typeof error === 'object' && 'statusMessage' in error
        ? String((error as { statusMessage?: unknown }).statusMessage)
        : 'Unable to upload photos.'

    toast.add({ title: 'Upload failed', description: message, color: 'error' })
  } finally {
    uploading.value = false
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
            :editable-fields-count="editableFields.length"
            :fields="fields"
            :has-profile-save="hasChanges"
            :saving="saving"
            :values="values"
            heading="Profile"
            subheading="Update your Drupal profile fields."
            @submit="onSubmit"
          />

          <div class="mt-8 space-y-3 border-t pt-6">
            <h2 class="text-highlighted text-base font-semibold">Profile Photos</h2>
            <p class="text-muted text-sm">Upload one or more profile photos (images only).</p>
            <UFormField label="Upload To">
              <USelect
                v-model="uploadSlot"
                :items="[
                  { label: 'Avatar', value: 'avatar' },
                  { label: 'Cover', value: 'cover' },
                  { label: 'Gallery', value: 'gallery' },
                ]"
                label-key="label"
                value-key="value"
                class="w-52"
              />
            </UFormField>
            <UFileUpload
              v-model="selectedFiles"
              accept="image/*"
              description="PNG, JPG, WebP or GIF (max. 10MB each)"
              icon="i-lucide-image"
              label="Drop your profile photos here"
              layout="list"
              multiple
              class="min-h-40"
            />
            <UButton :disabled="uploading || selectedFiles.length === 0" :loading="uploading" @click="onUploadPhotos">
              Upload Photos
            </UButton>

            <ul v-if="uploadedItems.length > 0" class="space-y-1 text-sm">
              <li v-for="item in uploadedItems" :key="item.mid">
                <a :href="item.url" class="underline" target="_blank">{{ item.name }}</a>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
