import { useMounted } from '@vueuse/core'
import useDarkMode from '#stir/composables/useDarkMode'

type LogoSurface = 'auto' | 'light' | 'dark'

export function useAppLogo(props: {
  addClasses?: string
  surface?: LogoSurface
}) {
  const { isDark } = useDarkMode()
  const { getPage } = useStirDrupalCe()
  const page = getPage()
  const mounted = useMounted()

  const fillClass = computed(() => {
    if (props.surface === 'dark') return 'fill-white'
    if (props.surface === 'light') return 'fill-black'
    return mounted.value ? (isDark.value ? 'fill-white' : 'fill-black') : ''
  })

  const svgClasses = computed(() =>
    [props.addClasses, fillClass.value].filter(Boolean).join(' '),
  )

  const logoTitle = computed(() => page.value?.site_info?.name ?? '')

  return {
    svgClasses,
    logoTitle,
    slotProps: computed(() => ({
      classes: svgClasses.value,
      title: logoTitle.value,
    })),
  }
}
