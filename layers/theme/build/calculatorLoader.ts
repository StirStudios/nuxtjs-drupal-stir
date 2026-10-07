/**
 * The calculator widget loads from the address a site commits in its own
 * config (runtimeConfig.public.calculator.loaderUrl); staging and local
 * environments point it elsewhere with NUXT_PUBLIC_CALCULATOR_LOADER_URL.
 *
 * Production never overrides it: an override there is a copied staging or
 * local value, so the build fails before the release goes live.
 */
export function refuseProductionCalculatorOverride(
  env: Record<string, string | undefined> = process.env,
): void {
  if (env.NUXT_ENV === 'production' && env.NUXT_PUBLIC_CALCULATOR_LOADER_URL) {
    throw new Error(
      'NUXT_PUBLIC_CALCULATOR_LOADER_URL is set in a production environment. '
      + 'Production loads the calculator from runtimeConfig.public.calculator.loaderUrl '
      + 'in the site\'s nuxt.config.ts; remove the variable from this environment.',
    )
  }
}
