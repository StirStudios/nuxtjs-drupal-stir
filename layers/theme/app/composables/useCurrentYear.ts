/**
 * The current year for copyright lines. Cached HTML keeps the year it was
 * rendered in, so the browser corrects it after hydration.
 */
export function useCurrentYear(): Readonly<Ref<number>> {
  const year = ref(new Date().getFullYear())

  onMounted(() => {
    year.value = new Date().getFullYear()
  })

  return readonly(year)
}
