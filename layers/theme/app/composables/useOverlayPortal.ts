type OverlayPortal = boolean | string | HTMLElement

export function useOverlayPortal() {
  const appConfig = useAppConfig()
  const portalRootIsShadow = ref(false)
  const instance = getCurrentInstance()

  onMounted(() => {
    const element = instance?.proxy?.$el ?? instance?.vnode.el

    if (!(element instanceof Node)) return

    portalRootIsShadow.value = element.getRootNode() instanceof ShadowRoot
  })

  return computed<OverlayPortal>(() => {
    const configured = appConfig?.stirTheme?.overlay?.portal as
      | OverlayPortal
      | undefined

    if (configured !== undefined && configured !== null) {
      return configured
    }

    return portalRootIsShadow.value ? false : true
  })
}
