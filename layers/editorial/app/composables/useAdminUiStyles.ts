let stylesheetPromise: Promise<unknown> | undefined

export function useAdminUiStyles(): void {
  onBeforeMount(() => {
    stylesheetPromise ||= import('../assets/css/admin-ui.css')
  })
}
