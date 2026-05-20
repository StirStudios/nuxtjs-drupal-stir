import { watchOnce } from '@vueuse/core'

export interface VideoPlayer {
  elem?: HTMLIFrameElement
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

type PlayerConstructor = new (iframe: HTMLIFrameElement) => VideoPlayer

const videoPlayers = ref<Map<string, VideoPlayer>>(new Map())
const isScriptLoaded = ref(false)
let scriptInjected = false
const PLAYER_ORIGIN = 'https://player.mediadelivery.net'
const pendingIframes = new Set<string>()
const endedBoundPlayers = new Set<string>()
const loadedIframes = new WeakSet<HTMLIFrameElement>()
const playerIframes = new WeakMap<VideoPlayer, HTMLIFrameElement>()

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

    watchOnce(isScriptLoaded, (loaded) => {
      if (loaded) {
        initializePlayers()
      }
    })
  }

  async function initializePlayers(): Promise<void> {
    if (!import.meta.client) return
    await nextTick()

    const Player = window.playerjs?.Player

    if (typeof Player !== 'function') {
      return
    }

    const iframes = document.querySelectorAll<HTMLIFrameElement>(
      'iframe[data-mid]',
    )

    iframes.forEach((iframe) => {
      const iframeKey = iframe.getAttribute('data-mid')

      if (!iframeKey || !isBunnyIframe(iframe)) return

      const existingPlayer = videoPlayers.value.get(iframeKey)

      if (existingPlayer) {
        if (isLivePlayer(iframeKey, existingPlayer)) return

        forgetPlayer(iframeKey)
      }

      if (pendingIframes.has(iframeKey)) return

      queuePlayerInitialization(iframeKey, iframe, Player)
    })
  }

  function isBunnyIframe(iframe: HTMLIFrameElement): boolean {
    try {
      return new URL(iframe.src).origin === PLAYER_ORIGIN
    }
    catch {
      return false
    }
  }

  function currentIframe(iframeKey: string): HTMLIFrameElement | null {
    return document.querySelector<HTMLIFrameElement>(
      `iframe[data-mid="${CSS.escape(iframeKey)}"]`,
    )
  }

  function isLivePlayer(iframeKey: string, player: VideoPlayer): boolean {
    const iframe = currentIframe(iframeKey)
    const playerIframe = player.elem ?? playerIframes.get(player)

    return Boolean(iframe && iframe.contentWindow && playerIframe === iframe)
  }

  function forgetPlayer(iframeKey: string): void {
    videoPlayers.value.delete(iframeKey)
    endedBoundPlayers.delete(iframeKey)
  }

  function queuePlayerInitialization(
    iframeKey: string,
    iframe: HTMLIFrameElement,
    Player: PlayerConstructor,
  ): void {
    if (loadedIframes.has(iframe)) {
      initializeIframePlayer(iframeKey, iframe, Player)
      return
    }

    pendingIframes.add(iframeKey)
    let initialized = false

    const initialize = () => {
      if (initialized) return
      initialized = true
      loadedIframes.add(iframe)
      pendingIframes.delete(iframeKey)
      initializeIframePlayer(iframeKey, iframe, Player)
    }

    iframe.addEventListener('load', initialize, { once: true })

    window.setTimeout(() => {
      if (!pendingIframes.has(iframeKey)) return

      initialize()
    }, 500)
  }

  function initializeIframePlayer(
    iframeKey: string,
    iframe: HTMLIFrameElement,
    Player: PlayerConstructor,
  ): void {
    if (videoPlayers.value.has(iframeKey)) return

    try {
      const player = new Player(iframe)

      playerIframes.set(player, iframe)

      playersReady(iframeKey, player)
    } catch (err) {
      console.error(`PlayerJS init failed for ${iframeKey}:`, err)
    }
  }

  function playersReady(iframeKey: string, player: VideoPlayer): void {
    if (videoPlayers.value.has(iframeKey)) return

    player.on('ready', () => {
      if (!isLivePlayer(iframeKey, player)) return

      videoPlayers.value.set(iframeKey, player)
      resetOnEnd(iframeKey, player)
    })
  }

  function resetOnEnd(iframeKey: string, player: VideoPlayer): void {
    if (endedBoundPlayers.has(iframeKey)) return
    endedBoundPlayers.add(iframeKey)

    const onEnded = () => {
      if (!isLivePlayer(iframeKey, player)) return

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

  function forEachLivePlayer(callback: (player: VideoPlayer) => void): void {
    videoPlayers.value.forEach((player, iframeKey) => {
      if (!isLivePlayer(iframeKey, player)) {
        forgetPlayer(iframeKey)
        return
      }

      callback(player)
    })
  }

  function addEventToAllPlayers(event: string, callback: () => void): void {
    forEachLivePlayer((player) => {
      if (player.isReady && player.supports('event', event)) {
        player.on(event, callback)
      }
    })
  }

  function playAllPlayers(): void {
    forEachLivePlayer((player) => {
      if (player.isReady && player.supports('method', 'play')) {
        player.play()
      }
    })
  }

  function pauseAllPlayers(): void {
    forEachLivePlayer((player) => {
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
    forEachLivePlayer((player) => {
      if (player.isReady && player.supports('method', 'mute')) {
        player.mute()
      }
    })
  }

  function unmuteAllPlayers(): void {
    forEachLivePlayer((player) => {
      if (player.isReady && player.supports('method', 'unmute')) {
        player.unmute()
      }
    })
  }

  function setVolumeForAll(value: number): void {
    forEachLivePlayer((player) => {
      if (player.isReady && player.supports('method', 'setVolume')) {
        player.setVolume(value)
      }
    })
  }

  function seekAllPlayers(timeInSeconds: number): void {
    forEachLivePlayer((player) => {
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
