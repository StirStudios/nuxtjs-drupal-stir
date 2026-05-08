export const getFetchErrorMessage = (
  error: unknown,
  fallback = 'Request failed.',
): string => {
  const statusMessage =
    typeof error === 'object' &&
    error !== null &&
    'statusMessage' in error &&
    typeof (error as { statusMessage?: unknown }).statusMessage === 'string'
      ? (error as { statusMessage: string }).statusMessage
      : ''

  const dataError =
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof (error as { data?: { error?: unknown } }).data?.error === 'string'
      ? (error as { data: { error: string } }).data.error
      : ''

  return dataError || statusMessage || fallback
}
