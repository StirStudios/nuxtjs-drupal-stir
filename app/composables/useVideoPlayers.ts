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

export function useVideoPlayers() {
  if (import.meta.client && !scriptInjected) {
    scriptInjected = true

    useHead({
      script: [
        {
          src: '//assets.mediadelivery.net/playerjs/playerjs-latest.min.js',
          defer: true,
          onload: () => {
            isScriptLoaded.value = true
          },
        },
      ],
    })

    // Only initialize players after script is loaded
    watchOnce(isScriptLoaded, (loaded) => {
      if (loaded) {
        initializePlayers()
      }
    })
  }

  async function initializePlayers(): Promise<void> {
    await nextTick()

    const iframes = document.querySelectorAll('iframe[data-mid]')
    iframes.forEach((iframe) => {
      const iframeKey = iframe.getAttribute('data-mid')
      if (!iframeKey || videoPlayers.value.has(iframeKey)) return

      iframe.addEventListener('load', () => {
        try {
          if (typeof window.playerjs?.Player === 'function') {
            const player = new window.playerjs.Player(
              iframe as HTMLIFrameElement,
            )
            playersReady(iframeKey, player)
          }
        } catch (err) {
          console.error(`PlayerJS init failed for ${iframeKey}:`, err)
        }
      })
    })
  }

  function playersReady(iframeKey: string, player: VideoPlayer): void {
    player.on('ready', () => {
      videoPlayers.value.set(iframeKey, player)
      addFullscreenExitOnEnd()
      resetOnEnd(iframeKey, player)
    })
  }

  function resetOnEnd(_iframeKey: string, player: VideoPlayer): void {
    player.on('ended', () => {
      player.setCurrentTime(0)
      player.pause()
    })
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
