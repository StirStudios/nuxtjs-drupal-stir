import { watchOnce } from '@vueuse/core'

export interface VideoPlayer {
  isReady: boolean
  supports: (method: string, value: string) => boolean
  pause: () => void
  play: () => void
  mute: () => void
  unmute: () => void
  setVolume: (value: number) => void
  getVolume: (callback: (value: number) => void) => void
  getCurrentTime: (callback: (value: number) => void) => void
  setCurrentTime: (value: number) => void
  on: (event: string, callback: () => void) => void
  off: (event: string, callback?: () => void) => void
}

const videoPlayers = ref<Map<string, VideoPlayer>>(new Map())
const isScriptLoaded = ref(false)
let scriptInjected = false
const pendingIframes = new Set<string>()
const endedBoundPlayers = new Set<string>()

export function useVideoPlayers() {
  if (import.meta.client && !scriptInjected) {
    scriptInjected = true

    useHead({
      script: [
        {
          src: '//assets.mediadelivery.net/playerjs/player-0.1.0.min.js',
          defer: true,
          onload: () => {
            isScriptLoaded.value = true
          },
        },
      ],
    })

    watchOnce(isScriptLoaded, (loaded) => {
      if (loaded) {
        initializePlayers()
      }
    })
  }

  async function initializePlayers(): Promise<void> {
    if (!import.meta.client) return
    await nextTick()

    const iframes = document.querySelectorAll<HTMLIFrameElement>(
      'iframe[data-mid]',
    )

    iframes.forEach((iframe) => {
      const iframeKey = iframe.getAttribute('data-mid')

      if (!iframeKey || videoPlayers.value.has(iframeKey)) return
      if (pendingIframes.has(iframeKey)) return

      pendingIframes.add(iframeKey)

      const attachPlayer = () => {
        try {
          if (typeof window.playerjs?.Player === 'function') {
            const player = new window.playerjs.Player(iframe)

            playersReady(iframeKey, player)
            return
          }
        } catch (err) {
          console.error(`PlayerJS init failed for ${iframeKey}:`, err)
        } finally {
          pendingIframes.delete(iframeKey)
        }
      }

      const iframeReady =
        iframe.contentDocument?.readyState === 'complete' &&
        typeof window.playerjs?.Player === 'function'

      if (iframeReady) {
        attachPlayer()
      } else {
        iframe.addEventListener('load', attachPlayer, { once: true })
      }
    })
  }

  function playersReady(iframeKey: string, player: VideoPlayer): void {
    if (videoPlayers.value.has(iframeKey)) return
    player.on('ready', () => {
      videoPlayers.value.set(iframeKey, player)
      resetOnEnd(iframeKey, player)
    })
  }

  function resetOnEnd(iframeKey: string, player: VideoPlayer): void {
    if (endedBoundPlayers.has(iframeKey)) return
    endedBoundPlayers.add(iframeKey)

    const onEnded = () => {
      player.setCurrentTime(0)
      player.pause()

      if (document.fullscreenElement && 'exitFullscreen' in document) {
        document
          .exitFullscreen()
          .catch((err) => console.error('Error exiting fullscreen:', err))
      }
    }

    player.on('ended', onEnded)
  }

  function addEventToAllPlayers(event: string, callback: () => void): void {
    videoPlayers.value.forEach((player) => {
      if (player.isReady && player.supports('event', event)) {
        player.on(event, callback)
      }
    })
  }

  function playAllPlayers(): void {
    videoPlayers.value.forEach((player) => {
      if (player.isReady && player.supports('method', 'play')) {
        player.play()
      }
    })
  }

  function pauseAllPlayers(): void {
    videoPlayers.value.forEach((player) => {
      if (player.isReady && player.supports('method', 'pause')) {
        player.pause()
      }
    })
  }

  function addFullscreenExitOnEnd(): void {
    addEventToAllPlayers('ended', () => {
      if (document.fullscreenElement && 'exitFullscreen' in document) {
        document
          .exitFullscreen()
          .catch((err) => console.error('Error exiting fullscreen:', err))
      }
    })
  }

  function muteAllPlayers(): void {
    videoPlayers.value.forEach((player) => {
      if (player.isReady && player.supports('method', 'mute')) {
        player.mute()
      }
    })
  }

  function unmuteAllPlayers(): void {
    videoPlayers.value.forEach((player) => {
      if (player.isReady && player.supports('method', 'unmute')) {
        player.unmute()
      }
    })
  }

  function setVolumeForAll(value: number): void {
    videoPlayers.value.forEach((player) => {
      if (player.isReady && player.supports('method', 'setVolume')) {
        player.setVolume(value)
      }
    })
  }

  function seekAllPlayers(timeInSeconds: number): void {
    videoPlayers.value.forEach((player) => {
      if (player.isReady && player.supports('method', 'setCurrentTime')) {
        player.setCurrentTime(timeInSeconds)
      }
    })
  }

  return {
    initializePlayers,
    playersReady,
    addEventToAllPlayers,
    playAllPlayers,
    pauseAllPlayers,
    addFullscreenExitOnEnd,
    muteAllPlayers,
    unmuteAllPlayers,
    setVolumeForAll,
    seekAllPlayers,
    videoPlayers,
  }
}
