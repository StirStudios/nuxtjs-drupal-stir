<script setup lang="ts">
import type { AuthFormField, FormError } from '@nuxt/ui'
import { authLayoutContextKey } from '../../utils/authLayout'

const props = defineProps<{
  title: string
  description: string
  icon?: string
  fields: AuthFormField[]
  submit?: Record<string, unknown>
  loading?: boolean
  validate?: (
    state: Record<string, unknown>,
  ) => FormError<string>[] | Promise<FormError<string>[]>
}>()

const appConfig = useAppConfig()
const resolveSubmitButtonConfig = (value: unknown): Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}
const submitButton = computed(() => ({
  label: 'Continue',
  ...resolveSubmitButtonConfig(appConfig.auth?.submitButton),
  ...resolveSubmitButtonConfig(props.submit),
}))
const authLayout = inject(authLayoutContextKey, undefined)
const isCardSplit = computed(() =>
  authLayout?.value.layout === 'card-split' && Boolean(authLayout.value.image),
)
const isPageSplit = computed(() =>
  authLayout?.value.layout === 'page-split' && Boolean(authLayout.value.image),
)
const isImageFirst = computed(() => authLayout?.value.imagePosition !== 'right')
const cardImageStyle = computed(() =>
  authLayout?.value.image
    ? ({ backgroundImage: `url('${authLayout.value.image}')` } as const)
    : undefined,
)
const formIcon = computed(() => {
  if (authLayout?.value.showIcon === false) {
    return undefined
  }

  return props.icon || 'i-lucide-lock'
})
const authFormPaddingClass = 'p-6'
const formPanelProps = computed(() => ({
  title: props.title,
  description: props.description,
  fields: props.fields,
  icon: formIcon.value,
  loading: props.loading,
  submit: submitButton.value,
  validate: props.validate,
}))

defineEmits<{
  submit: [event: unknown]
  error: [event: unknown]
}>()

defineSlots<{
  'password-field'?: (props: { field: AuthFormField; state: Record<string, string | undefined> }) => unknown
  'confirmPassword-field'?: (props: { field: AuthFormField; state: Record<string, string | undefined> }) => unknown
  'password-hint'?: () => unknown
  validation?: () => unknown
  footer?: () => unknown
}>()
</script>

<template>
  <div
    v-if="isCardSplit"
    class="grid w-full overflow-hidden rounded-lg bg-default text-left shadow-lg ring ring-default lg:grid-cols-2"
  >
    <div
      v-if="isImageFirst"
      aria-hidden="true"
      class="min-h-64 bg-cover bg-center bg-no-repeat lg:min-h-full"
      :style="cardImageStyle"
    />
    <AuthFormPanel
      :class="['flex h-full w-full flex-col justify-center', authFormPaddingClass]"
      v-bind="formPanelProps"
      @error="$emit('error', $event)"
      @submit="$emit('submit', $event)"
    >
      <template #password-field="{ state, field }">
        <slot :field="field" name="password-field" :state="state" />
      </template>
      <template #confirmPassword-field="{ state, field }">
        <slot :field="field" name="confirmPassword-field" :state="state" />
      </template>
      <template #password-hint>
        <slot name="password-hint" />
      </template>
      <template #validation>
        <slot name="validation" />
      </template>
      <template #footer>
        <slot name="footer" />
      </template>
    </AuthFormPanel>
    <div
      v-if="!isImageFirst"
      aria-hidden="true"
      class="min-h-64 bg-cover bg-center bg-no-repeat lg:min-h-full"
      :style="cardImageStyle"
    />
  </div>

  <AuthFormPanel
    v-else-if="isPageSplit"
    :class="[
      'w-full rounded-lg bg-default shadow-lg ring ring-default lg:bg-transparent lg:shadow-none lg:ring-0',
      authFormPaddingClass,
    ]"
    v-bind="formPanelProps"
    @error="$emit('error', $event)"
    @submit="$emit('submit', $event)"
  >
    <template #password-field="{ state, field }">
      <slot :field="field" name="password-field" :state="state" />
    </template>
    <template #confirmPassword-field="{ state, field }">
      <slot :field="field" name="confirmPassword-field" :state="state" />
    </template>
    <template #password-hint>
      <slot name="password-hint" />
    </template>
    <template #validation>
      <slot name="validation" />
    </template>
    <template #footer>
      <slot name="footer" />
    </template>
  </AuthFormPanel>

  <UPageCard
    v-else
    class="w-full shadow-lg"
    :ui="{ container: 'p-6 sm:p-6' }"
    variant="outline"
  >
    <AuthFormPanel
      v-bind="formPanelProps"
      @error="$emit('error', $event)"
      @submit="$emit('submit', $event)"
    >
      <template #password-field="{ state, field }">
        <slot :field="field" name="password-field" :state="state" />
      </template>
      <template #confirmPassword-field="{ state, field }">
        <slot :field="field" name="confirmPassword-field" :state="state" />
      </template>
      <template #password-hint>
        <slot name="password-hint" />
      </template>
      <template #validation>
        <slot name="validation" />
      </template>
      <template #footer>
        <slot name="footer" />
      </template>
    </AuthFormPanel>
  </UPageCard>
</template>
