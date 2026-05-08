const colorModeGlobalName = '__NUXT_COLOR_MODE__'

const colorModeHelper = {
  preference: 'light',
  value: 'light',
  getColorScheme: () => 'light',
  addColorScheme: () => {},
  removeColorScheme: () => {},
}

if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>)[colorModeGlobalName] =
    colorModeHelper

  const localStorageShim = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }

  if (typeof window.localStorage?.setItem !== 'function') {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageShim,
      configurable: true,
      writable: true,
    })
  }
}
