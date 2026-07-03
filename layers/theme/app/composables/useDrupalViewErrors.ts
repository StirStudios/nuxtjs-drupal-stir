export function isDrupalViewAbortError(error: unknown): boolean {
  const message = String(
    (error as { message?: string })?.message || error || '',
  )
  const causeMessage = String(
    (error as { cause?: { message?: string } })?.cause?.message || '',
  )
  const abortMessage = `${message} ${causeMessage}`.toLowerCase()

  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    message.includes('AbortError') ||
    abortMessage.includes('operation was aborted') ||
    abortMessage.includes('request aborted')
  )
}

export function drupalViewLoadErrorMessage(error: unknown): string {
  const message = String(
    (error as { message?: string })?.message || error || '',
  )
  const isDrupalMemoryError =
    message.includes('Allowed memory size') ||
    message.includes('ApcuBackend.php')

  return isDrupalMemoryError
    ? 'Drupal ran out of memory while processing this view. Please try again or adjust backend memory/cache settings.'
    : 'Unable to load results. Please try again.'
}

