<script
  setup
  lang="ts"
  generic="T extends Record<string, unknown> = Record<string, unknown>"
>
import {
  useAuthRegister,
  type StirAuthRegisterOptions,
} from '../../composables/useAuthRegister'
import { useAuthConfig } from '../../composables/useAuthConfig'

const props = defineProps<{
  /**
   * Extra signup fields. Read once during setup.
   */
  options?: StirAuthRegisterOptions<T>
}>()

defineSlots<{
  /**
   * Project inputs rendered after the password, inside the form. Bind them to
   * `state` and wrap each in a `UFormField` whose `name` matches its errors.
   */
  fields?: (props: { state: T }) => unknown
  footer?: () => unknown
}>()

const {
  fields,
  state,
  turnstileToken,
  validate,
  onSubmit,
  isLoading,
  registrationComplete,
  registrationMessage,
  requiresApproval,
  requiresVerification,
} = useAuthRegister(props.options)
const { auth } = useAuthConfig()

const title = computed(() => auth.value.register?.title || 'Create account')
const description = computed(
  () => auth.value.register?.description || 'Create your account to continue.',
)
const submitLabel = computed(
  () => auth.value.register?.submitLabel || 'Create account',
)
const verificationTitle = computed(
  () => auth.value.register?.complete?.verificationTitle || 'Verify your email',
)
const createdTitle = computed(
  () => auth.value.register?.complete?.createdTitle || 'Account created',
)
const statusTitle = computed(() => {
  if (requiresApproval.value) return 'Account awaiting approval'
  if (requiresVerification.value) return verificationTitle.value

  return createdTitle.value
})
const statusIcon = computed(() => {
  if (requiresApproval.value) return 'i-lucide-user-round-check'
  if (requiresVerification.value) return 'i-lucide-mail-check'

  return 'i-lucide-circle-check'
})
const statusTone = computed<'warning' | 'success'>(() =>
  requiresApproval.value || requiresVerification.value ? 'warning' : 'success',
)

useSeoMeta({
  title: () => title.value,
  robots: 'noindex, nofollow',
})
</script>

<template>
  <AuthPage>
    <template v-if="registrationComplete" #secondary-action>
      <AuthSecondaryAction />
    </template>
    <AuthPageCard
      v-if="registrationComplete"
    >
      <AuthStatusPanel
        :description="registrationMessage"
        :icon="statusIcon"
        :title="statusTitle"
        :tone="statusTone"
      />
    </AuthPageCard>
    <AuthCard
      v-else
      :description="description"
      :fields="fields"
      icon="i-lucide-user-plus"
      :loading="isLoading"
      :submit="{ label: submitLabel }"
      :title="title"
      :validate="validate"
      @submit="onSubmit"
    >
      <template #password-field="{ state: formState, field }">
        <AuthPasswordField
          v-model="formState.password"
          :field="field"
          :password-policy="auth.passwordPolicy"
        />
      </template>
      <template #validation>
        <slot name="fields" :state="state as T" />
        <FieldTurnstile v-model="turnstileToken" />
      </template>
      <template #footer>
        <slot name="footer">
          Already have an account?
          <ULink class="text-primary" to="/auth/login">Sign in</ULink>
        </slot>
      </template>
    </AuthCard>
  </AuthPage>
</template>
