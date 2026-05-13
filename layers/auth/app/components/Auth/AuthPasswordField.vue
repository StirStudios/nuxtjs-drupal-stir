<script setup lang="ts">
const model = defineModel<string | undefined>()

const props = defineProps<{
  field?: {
    autocomplete?: string
    name?: string
    placeholder?: string
  }
  showRequirements?: boolean
}>()

const show = ref(false)

const requirements = computed(() => {
  const value = model.value || ''

  return [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /\d/, text: 'At least 1 number' },
    { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
    { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
  ].map(requirement => ({
    ...requirement,
    met: requirement.regex.test(value),
  }))
})

const score = computed(() => requirements.value.filter(requirement => requirement.met).length)

const color = computed(() => {
  if (score.value === 0) {
    return 'neutral'
  }

  if (score.value <= 1) {
    return 'error'
  }

  if (score.value <= 3) {
    return 'warning'
  }

  return 'success'
})

const label = computed(() => {
  if (score.value === 0) {
    return 'Enter a password'
  }

  if (score.value <= 1) {
    return 'Weak password'
  }

  if (score.value <= 3) {
    return 'Almost there'
  }

  return 'Strong password'
})

const describedBy = computed(() => props.showRequirements === false ? undefined : 'password-strength')
</script>

<template>
  <div class="space-y-2">
    <UInput
      v-model="model"
      :aria-describedby="describedBy"
      :aria-invalid="score < 4 && Boolean(model)"
      :autocomplete="field?.autocomplete"
      class="w-full"
      :color="color"
      :name="field?.name"
      :placeholder="field?.placeholder"
      :type="show ? 'text' : 'password'"
    >
      <template #trailing>
        <UButton
          :aria-label="show ? 'Hide password' : 'Show password'"
          :aria-pressed="show"
          color="neutral"
          :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          size="sm"
          type="button"
          variant="link"
          @click="show = !show"
        />
      </template>
    </UInput>

    <template v-if="showRequirements !== false">
      <UProgress
        :color="color"
        :indicator="label"
        :max="4"
        :model-value="score"
        size="sm"
      />

      <p id="password-strength" class="text-highlighted text-sm font-medium">
        {{ label }}. Must contain:
      </p>

      <ul aria-label="Password requirements" class="space-y-1">
        <li
          v-for="requirement in requirements"
          :key="requirement.text"
          class="flex items-center gap-1"
          :class="requirement.met ? 'text-success' : 'text-muted'"
        >
          <UIcon
            class="size-4 shrink-0"
            :name="requirement.met ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
          />
          <span class="text-xs">
            {{ requirement.text }}
            <span class="sr-only">
              {{ requirement.met ? ' - Requirement met' : ' - Requirement not met' }}
            </span>
          </span>
        </li>
      </ul>
    </template>
  </div>
</template>
