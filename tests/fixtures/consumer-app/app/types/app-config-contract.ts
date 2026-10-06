// Typecheck fails if the theme layer's app config declarations stop reaching
// useAppConfig() in a consumer, leaving only the types Nuxt infers.
type ConsumerAppConfig = ReturnType<typeof useAppConfig>
type Expect<T extends true> = T
// Strict equality, so an `any` from an unresolved import does not pass.
type IsExactly<T, U> = (<G>() => G extends T ? 1 : 2) extends (<G>() => G extends U ? 1 : 2) ? true : false

export type AppConfigContract = [
  Expect<IsExactly<ConsumerAppConfig['stirTheme']['navigation']['mode'], 'fixed' | 'sticky' | undefined>>,
  Expect<IsExactly<
    NonNullable<ConsumerAppConfig['stirTheme']['routeHero']['routes']>[number]['variant'],
    'cover' | 'simple' | 'overlap' | undefined
  >>,
]
