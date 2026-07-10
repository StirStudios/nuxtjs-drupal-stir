export function useAuthIntegration(): boolean {
  return useAppConfig().authIntegration?.drupalAccounts === true
}
