export default function useDarkMode() {
  const colorMode = useColorMode()
  const isDark = computed({
    get() {
      return colorMode.value === 'dark'
    },
    set(_isDark: boolean) {
      colorMode.preference = _isDark ? 'dark' : 'light'
    },
  })

  return { isDark, colorMode }
}
