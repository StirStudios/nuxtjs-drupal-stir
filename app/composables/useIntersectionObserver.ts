import { useIntersectionObserver as useVueUseIntersectionObserver } from '@vueuse/core'

export function useIntersectionObserver() {
  let stopObservers: Array<() => void> = []

  const observeVideos = (threshold: number = 0.1) => {
    if (!import.meta.client) return
    disconnectObserver()

    const videoElements = document.querySelectorAll(
      'video',
    ) as NodeListOf<HTMLVideoElement>

    if (videoElements.length === 0) return

    videoElements.forEach((videoElement) => {
      const { stop } = useVueUseIntersectionObserver(
        videoElement,
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              videoElement.play().catch(() => {})
            } else {
              videoElement.pause()
            }
          })
        },
        { threshold },
      )

      stopObservers.push(stop)
    })
  }

  const disconnectObserver = () => {
    if (stopObservers.length === 0) return
    stopObservers.forEach((stop) => {
      stop()
    })
    stopObservers = []
  }

  onBeforeUnmount(() => {
    disconnectObserver()
  })

  return { observeVideos, disconnectObserver }
}
