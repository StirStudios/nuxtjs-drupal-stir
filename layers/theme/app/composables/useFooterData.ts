import type {
  AppContextFooterMenuItem,
  AppContextSiteInfo,
} from '#stir/composables/useAppContext'

/**
 * Footer menu and site info from the current Drupal page, falling back to the
 * app footer context when the page does not carry them. The context loads
 * during SSR and whenever a client-side page is missing that data.
 */
export function useFooterData() {
  const page = useStirDrupalCe().getPage()
  const {
    data: appContext,
    status: appContextStatus,
    execute: loadAppFooterContext,
  } = useAppFooterContext({ immediate: false })

  const pageFooterMenu = computed<AppContextFooterMenuItem[] | undefined>(() =>
    Array.isArray(page.value?.footer_menu) ? page.value?.footer_menu as AppContextFooterMenuItem[] : undefined,
  )
  const hasPageFooterMenu = computed(() => (pageFooterMenu.value?.length ?? 0) > 0)
  const pageSiteInfo = computed<AppContextSiteInfo | undefined>(() =>
    page.value?.site_info && typeof page.value.site_info === 'object'
      ? page.value.site_info as AppContextSiteInfo
      : undefined,
  )
  const needsAppContext = computed(() => !hasPageFooterMenu.value || !pageSiteInfo.value)

  function loadMissingFooter() {
    if (needsAppContext.value && appContextStatus.value !== 'success') {
      return loadAppFooterContext()
    }
  }

  onServerPrefetch(loadMissingFooter)
  if (import.meta.client) {
    watch(needsAppContext, () => { void loadMissingFooter() }, { immediate: true })
  }

  const footerMenu = computed<AppContextFooterMenuItem[]>(() => {
    if (hasPageFooterMenu.value && pageFooterMenu.value) {
      return pageFooterMenu.value
    }

    return Array.isArray(appContext.value?.footer_menu) ? appContext.value.footer_menu : []
  })
  const siteInfo = computed<AppContextSiteInfo | undefined>(() =>
    pageSiteInfo.value ?? appContext.value?.site_info,
  )
  const footerMenuItems = computed(() =>
    footerMenu.value.map((item) => ({ label: item.title || '', to: item.url || '' })),
  )

  return {
    footerMenu,
    footerMenuItems,
    siteInfo,
  }
}
