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

function checkStrength(str: string) {
  const requirements = [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /\d/, text: 'At least 1 number' },
    { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
    { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
  ]

  return requirements.map(req => ({ met: req.regex.test(str), text: req.text }))
}

const strength = computed(() => checkStrength(model.value || ''))
const score = computed(() => strength.value.filter(req => req.met).length)

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

const text = computed(() => {
  if (score.value === 0) {
    return 'Enter a password'
  }

  if (score.value <= 2) {
    return 'Weak password'
  }

  if (score.value === 3) {
    return 'Medium password'
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
      :aria-invalid="score < 4"
      :autocomplete="field?.autocomplete"
      class="w-full"
      :color="color"
      :name="field?.name"
      :placeholder="field?.placeholder || 'Password'"
      :type="show ? 'text' : 'password'"
      :ui="{ trailing: 'pe-1' }"
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
        :indicator="text"
        :max="4"
        :model-value="score"
        size="sm"
      />

      <p id="password-strength" class="text-sm font-medium">
        {{ text }}. Must contain:
      </p>

      <ul aria-label="Password requirements" class="space-y-1">
        <li
          v-for="req in strength"
          :key="req.text"
          class="flex items-center gap-0.5"
          :class="req.met ? 'text-success' : 'text-muted'"
        >
          <UIcon
            class="size-4 shrink-0"
            :name="req.met ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
          />

          <span class="text-xs font-light">
            {{ req.text }}
            <span class="sr-only">
              {{ req.met ? ' - Requirement met' : ' - Requirement not met' }}
            </span>
          </span>
        </li>
      </ul>
    </template>
  </div>
</template>
