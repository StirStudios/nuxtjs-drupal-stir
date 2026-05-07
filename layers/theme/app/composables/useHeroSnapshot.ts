export function useHeroSnapshot(input: {
  locked: Ref<boolean>
  isFront: Ref<boolean>
  title: Ref<string>
  hide: Ref<boolean>
}) {
  const snapIsFront = useState<boolean>('hero-snap-is-front', () => input.isFront.value)
  const snapTitle = useState<string>('hero-snap-title', () => input.title.value)
  const snapHide = useState<boolean>('hero-snap-hide', () => input.hide.value)

  watch(input.locked, (locked) => {
    if (!locked) {
      snapIsFront.value = input.isFront.value
      snapTitle.value = input.title.value
      snapHide.value = input.hide.value
    }
  })

  watch([input.isFront, input.title, input.hide], ([nextIsFront, nextTitle, nextHide]) => {
    if (input.locked.value) return

    snapIsFront.value = nextIsFront
    snapTitle.value = nextTitle
    snapHide.value = nextHide
  })

  return {
    isFrontEffective: computed(() => (input.locked.value ? snapIsFront.value : input.isFront.value)),
    titleEffective: computed(() => (input.locked.value ? snapTitle.value : input.title.value)),
    hideEffective: computed(() => (input.locked.value ? snapHide.value : input.hide.value)),
  }
}
