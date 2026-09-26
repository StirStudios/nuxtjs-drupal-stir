// Image sources this browser has loaded. A re-rendered image of one of them,
// such as a nav photo on every page, starts visible instead of fading in
// again. Client only, so server requests never share state.
const loadedImageSources = new Set<string>()

export function markImageSourceLoaded(source: string | undefined): void {
  if (import.meta.client && source) loadedImageSources.add(source)
}

export function isImageSourceLoaded(source: string | undefined): boolean {
  return import.meta.client && Boolean(source) && loadedImageSources.has(source!)
}
