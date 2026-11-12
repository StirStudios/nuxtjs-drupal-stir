// Styles for `stirTheme.pageTransition.type: 'crossfade'`. The theme layer
// turns on Nuxt's view transitions at build time for that type.
export default defineNuxtPlugin(() => {
  const transition = useAppConfig().stirTheme.pageTransition

  if (transition?.type !== 'crossfade') return

  useHead({
    style: [{
      key: 'stir-page-crossfade',
      innerHTML: pageCrossfadeCss(transition.durationMs ?? 250),
    }],
  })
})
