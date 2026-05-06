import type { SocialIcon } from '../../types/Social'

export function useSocialIcons() {
  const theme = useAppConfig().stirTheme as { socials?: unknown }

  const iconsSocialConfig = computed<SocialIcon[]>(() => {
    const socials = theme.socials

    return Array.isArray(socials) ? (socials as SocialIcon[]) : []
  })

  return {
    iconsSocialConfig,
  }
}
