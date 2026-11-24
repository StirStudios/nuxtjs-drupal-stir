const decodedPath = (path: string): string => {
  const pathname = path.split(/[?#]/u, 1)[0] || '/'

  try {
    return decodeURI(pathname).replace(/\/+$/u, '') || '/'
  }
  catch {
    return pathname
  }
}

/**
 * The path the payload should hold once the page hydrates. The server renders
 * the decoded path (/café) while the browser shows it encoded (/caf%C3%A9);
 * for the same page this returns the displayed one, otherwise null.
 */
export function displayedPayloadPath(
  renderedPath: string,
  location: { pathname: string, search: string },
  baseURL: string,
): string | null {
  const base = baseURL.replace(/\/+$/u, '')
  const displayedPath = base && location.pathname.startsWith(base)
    ? location.pathname.slice(base.length) || '/'
    : location.pathname

  return decodedPath(renderedPath) === decodedPath(displayedPath)
    ? displayedPath + location.search
    : null
}
