<script setup lang="ts">
import { useAuthConfig } from '../../composables/auth/useAuthConfig'
import type { AuthPasswordRequirement } from '../../types/auth'

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
const { auth } = useAuthConfig()

function checkStrength(str: string) {
  return passwordRequirements.value.map((req) => ({
    key: req.key,
    met: req.regex.test(str),
    text: req.text,
  }))
}

const passwordRequirements = computed(() => {
  const configured = auth.value.passwordPolicy?.requirements || []
  const requirements = configured.length > 0 ? configured : defaultPasswordRequirements()
  const normalized = requirements
    .map((req: AuthPasswordRequirement) => normalizePasswordRequirement(req))
    .filter((req): req is NonNullable<typeof req> => Boolean(req))

  if (normalized.length > 0) {
    return normalized
  }

  return defaultPasswordRequirements()
    .map((req: AuthPasswordRequirement) => normalizePasswordRequirement(req))
    .filter((req): req is NonNullable<typeof req> => Boolean(req))
})

const strength = computed(() => checkStrength(model.value || ''))
const score = computed(() => strength.value.filter(req => req.met).length)
const requirementCount = computed(() => Math.max(passwordRequirements.value.length, 1))
const isComplete = computed(() => (
  passwordRequirements.value.length > 0 &&
  score.value === passwordRequirements.value.length
))
const scoreRatio = computed(() => score.value / requirementCount.value)

const color = computed(() => {
  if (score.value === 0) {
    return 'neutral'
  }

  if (isComplete.value) {
    return 'success'
  }

  if (scoreRatio.value <= 0.34) {
    return 'error'
  }

  return 'warning'
})

const text = computed(() => {
  const labels = auth.value.passwordPolicy?.strengthLabels

  if (score.value === 0) {
    return labels?.empty || 'Enter a password'
  }

  if (isComplete.value) {
    return labels?.strong || 'Strong password'
  }

  if (scoreRatio.value >= 0.67) {
    return labels?.medium || 'Medium password'
  }

  if (score.value > 0) {
    return labels?.weak || 'Weak password'
  }

  return labels?.empty || 'Enter a password'
})

const describedBy = computed(() => props.showRequirements === false ? undefined : 'password-strength')
const invalid = computed(() => props.showRequirements !== false && !isComplete.value)

function normalizePasswordRequirement(requirement: AuthPasswordRequirement) {
  if (!requirement.pattern) {
    return null
  }

  try {
    return {
      key: requirement.key || requirement.label || requirement.pattern,
      regex: new RegExp(requirement.pattern),
      text: requirement.label || '',
    }
  } catch {
    return null
  }
}

function defaultPasswordRequirements(): AuthPasswordRequirement[] {
  return [
    { key: 'minLength', pattern: '.{8,}', label: 'At least 8 characters' },
    { key: 'number', pattern: '\\d', label: 'At least 1 number' },
    { key: 'lowercase', pattern: '[a-z]', label: 'At least 1 lowercase letter' },
    { key: 'uppercase', pattern: '[A-Z]', label: 'At least 1 uppercase letter' },
  ]
}
</script>

<template>
  <div class="space-y-2">
    <UInput
      v-model="model"
      :aria-describedby="describedBy"
      :aria-invalid="invalid"
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
        :max="requirementCount"
        :model-value="score"
        size="sm"
      />

      <p id="password-strength" class="text-sm font-medium">
        {{ text }}. {{ auth.passwordPolicy?.strengthLabels?.mustContain || 'Must contain:' }}
      </p>

      <ul aria-label="Password requirements" class="space-y-1">
        <li
          v-for="req in strength"
          :key="req.key"
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
