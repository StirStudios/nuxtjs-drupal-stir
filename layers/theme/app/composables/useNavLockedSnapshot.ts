import type { Ref, ShallowRef } from 'vue'

export function useNavLockedSnapshot<T>(source: Ref<T>) {
  const { locked } = useNavLock()
  const holding = ref(locked.value)
  const snapshot = shallowRef(source.value) as ShallowRef<T>

  let frameId = 0

  function cancelFrame() {
    if (import.meta.client && frameId) {
      cancelAnimationFrame(frameId)
    }

    frameId = 0
  }

  function commitSnapshot() {
    snapshot.value = source.value
    holding.value = false
    frameId = 0
  }

  function scheduleCommit() {
    cancelFrame()

    if (!import.meta.client) {
      commitSnapshot()
      return
    }

    nextTick(() => {
      frameId = requestAnimationFrame(commitSnapshot)
    })
  }

  watch(
    locked,
    (isLocked) => {
      if (isLocked) {
        cancelFrame()
        holding.value = true
        return
      }

      scheduleCommit()
    },
    { flush: 'sync' },
  )

  watch(
    source,
    () => {
      if (!locked.value && !holding.value) {
        snapshot.value = source.value
      }
    },
    { flush: 'sync' },
  )

  onScopeDispose(cancelFrame)

  return computed(() => (locked.value || holding.value ? snapshot.value : source.value))
}
