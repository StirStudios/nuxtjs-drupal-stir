// Typecheck fails if the auth layer's app config declarations stop reaching
// useAppConfig() in a consumer, leaving only the types Nuxt infers.
type AccountNavItems = NonNullable<NonNullable<ReturnType<typeof useAppConfig>['auth']>['accountNav']>['items']
type Expect<T extends true> = T
// Strict equality, so an `any` from an unresolved import does not pass.
type IsExactly<T, U> = (<G>() => G extends T ? 1 : 2) extends (<G>() => G extends U ? 1 : 2) ? true : false

export type AppConfigContract = Expect<IsExactly<
  AccountNavItems,
  { label: string, to: string, icon?: string, visibility?: string }[] | undefined
>>
