<script setup lang="ts">
import { useAccountProfile } from '~/composables/account/useAccountProfile'
import { useAuthSession } from '~/composables/auth/useAuthSession'

const toast = useToast()
const session = useAuthSession()
const { values, editableFields, loading, saving, load, save } =
  useAccountProfile()

const isReady = ref(false)

const title = 'Profile'
const description = 'Update your account profile details.'

const getFieldType = (type: string): 'text' | 'textarea' | 'select' | 'checkbox' => {
  if (type === 'text_long' || type === 'string_long') {
    return 'textarea'
  }

  if (type === 'boolean') {
    return 'checkbox'
  }

  if (type === 'list_string' || type === 'list_integer') {
    return 'select'
  }

  return 'text'
}

const toSelectItems = (field: {
  options?: Record<string, string>
}): Array<{ label: string; value: string }> => {
  const options = field.options || {}

  return Object.entries(options).map(([value, label]) => ({
    label,
    value,
  }))
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

    if (response?.updated) {
      toast.add({
        title: 'Profile updated',
        description: 'Your changes were saved.',
        color: 'success',
      })
    }
  } catch (error: unknown) {
    const message =
      error && typeof error === 'object' && 'statusMessage' in error
        ? String((error as { statusMessage?: unknown }).statusMessage)
        : 'Unable to save profile changes.'

    toast.add({
      title: 'Update failed',
      description: message,
      color: 'error',
    })
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4 py-8">
    <UPageCard>
      <template #header>
        <div class="space-y-1">
          <h1 class="text-xl font-semibold text-highlighted">{{ title }}</h1>
          <p class="text-sm text-muted">{{ description }}</p>
        </div>
      </template>

      <div v-if="loading || !isReady" class="space-y-4">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-1/2" />
      </div>

      <UForm v-else class="space-y-5" :state="values" @submit="onSubmit">
        <div
          v-for="field in editableFields"
          :key="field.name"
          class="space-y-2"
        >
          <UFormField :label="field.label" :name="field.name" :required="field.required">
            <UCheckbox
              v-if="getFieldType(field.type) === 'checkbox'"
              v-model="values[field.name]"
            />

            <UTextarea
              v-else-if="getFieldType(field.type) === 'textarea'"
              v-model="values[field.name]"
              :rows="4"
            />

            <USelect
              v-else-if="getFieldType(field.type) === 'select'"
              v-model="values[field.name]"
              :items="toSelectItems(field)"
              label-key="label"
              value-key="value"
            />

            <UInput v-else v-model="values[field.name]" type="text" />
          </UFormField>
        </div>

        <div v-if="editableFields.length === 0" class="text-sm text-muted">
          No editable profile fields are currently available.
        </div>

        <UButton :disabled="saving || editableFields.length === 0" :loading="saving" type="submit">
          Save Changes
        </UButton>
      </UForm>
    </UPageCard>
  </div>
</template>
