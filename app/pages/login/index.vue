<script setup lang="ts">
const { heading, state, validate, onSubmit, onError, isLoading, showLogin } =
  usePasswordLogin()
</script>

<template>
  <div
    class="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-4 text-center"
    role="presentation"
  >
    <h1>{{ heading }}</h1>

    <UButton
      v-if="!showLogin"
      label="Enter Password"
      size="xl"
      variant="solid"
      @click="showLogin = true"
    />

    <main
      v-if="showLogin"
      aria-labelledby="login-heading"
      class="bg-default/90 w-full max-w-md space-y-4 rounded-lg p-8 shadow-lg"
      role="main"
    >
      <UForm
        :state="state"
        :validate="validate"
        @error="onError"
        @submit="onSubmit"
      >
        <FieldRenderer
          :field="{
            '#type': 'textfield',
            '#title': 'Password',
            '#attributes': {
              type: 'password',
              id: 'password',
              'aria-label': 'password',
            },
          }"
          field-name="password"
          :state="state"
        />

        <UButton
          class="mt-10 w-full justify-center"
          label="Submit"
          :loading="isLoading"
          type="submit"
        />
      </UForm>
    </main>
  </div>
</template>
