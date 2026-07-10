import { watchOnce } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'

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
  on: (event: string, callback: (payload?: unknown) => void) => void
  off: (event: string, callback?: (payload?: unknown) => void) => void
}

type PlayerConstructor = new (iframe: HTMLIFrameElement) => VideoPlayer
type PlayerJsGlobal = {
  Player?: PlayerConstructor
}
type PlayerEventOptions = {
  enabled?: MaybeRefOrGetter<boolean>
  event: string
  handler: (payload?: unknown, player?: VideoPlayer) => void
  pollIntervalMs?: number
  playerKey: MaybeRefOrGetter<number | string | null | undefined>
}

declare global {
  interface Window {
    playerjs?: PlayerJsGlobal
  }
}

const videoPlayers = ref<Map<string, VideoPlayer>>(new Map())
const isScriptLoaded = ref(false)
let scriptInjected = false
const DEFAULT_EVENT_POLL_INTERVAL_MS = 1000
const MIN_EVENT_POLL_INTERVAL_MS = 250
const PLAYER_ORIGINS = new Set([
  'https://player.mediadelivery.net',
  'https://iframe.mediadelivery.net',
])
const pendingIframes = new Map<string, HTMLIFrameElement>()
const initializingIframes = new Map<string, HTMLIFrameElement>()
const endedBoundPlayers = new Set<string>()
const loadedIframes = new WeakSet<HTMLIFrameElement>()
const playerIframes = new WeakMap<VideoPlayer, HTMLIFrameElement>()

function normalizePlayerKey(playerKey: number | string | null | undefined): string {
  return typeof playerKey === 'number' || typeof playerKey === 'string' ? String(playerKey) : ''
}

function videoPlayerDebug(): boolean {
  if (!import.meta.dev || !import.meta.client) return false

  const searchParams = new URLSearchParams(window.location.search)

  try {
    return searchParams.get('debugPlayers') === '1' ||
      searchParams.get('debugProgress') === '1' ||
      window.localStorage.getItem('danceplug:video-player-debug') === '1'
  }
  catch {
    return searchParams.get('debugPlayers') === '1' ||
      searchParams.get('debugProgress') === '1'
  }
}

function debugVideoPlayer(message: string, context: Record<string, unknown> = {}): void {
  if (!videoPlayerDebug()) return

  console.info(`[video-player] ${message}`, context)
}

export function useVideoPlayers() {
  if (import.meta.client && !scriptInjected) {
    scriptInjected = true

    useHead({
      script: [
        {
          src: 'https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js',
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

      if (!iframeKey) return

      if (!isBunnyIframe(iframe)) {
        debugVideoPlayer('skipping non-bunny iframe', {
          iframeKey,
          src: iframe.src,
        })
        return
      }

      const existingPlayer = videoPlayers.value.get(iframeKey)

      if (existingPlayer) {
        if (isLivePlayer(iframeKey, existingPlayer)) {
          debugVideoPlayer('using existing player', { iframeKey })
          return
        }

        debugVideoPlayer('forgetting stale player', { iframeKey })
        forgetPlayer(iframeKey)
      }

      const pendingIframe = pendingIframes.get(iframeKey)

      if (pendingIframe === iframe) {
        debugVideoPlayer('iframe already pending', { iframeKey })
        return
      }

      if (pendingIframe) {
        debugVideoPlayer('replacing pending iframe', { iframeKey })
        pendingIframes.delete(iframeKey)
      }

      const initializingIframe = initializingIframes.get(iframeKey)

      if (initializingIframe === iframe) {
        debugVideoPlayer('player initialization already active', { iframeKey })
        return
      }

      if (initializingIframe) {
        debugVideoPlayer('replacing initializing iframe', { iframeKey })
        initializingIframes.delete(iframeKey)
      }

      queuePlayerInitialization(iframeKey, iframe, Player)
    })
  }

  function isBunnyIframe(iframe: HTMLIFrameElement): boolean {
    try {
      return PLAYER_ORIGINS.has(new URL(iframe.src).origin)
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
    const playerIframe = iframeForPlayer(player)

    return Boolean(playerIframe && isCurrentIframe(iframeKey, playerIframe))
  }

  function iframeForPlayer(player: VideoPlayer): HTMLIFrameElement | undefined {
    return player.elem ?? playerIframes.get(player)
  }

  function isCurrentIframe(iframeKey: string, iframe: HTMLIFrameElement): boolean {
    return currentIframe(iframeKey) === iframe && Boolean(iframe.contentWindow)
  }

  function forgetPlayer(playerKey: number | string | null | undefined): void {
    const iframeKey = normalizePlayerKey(playerKey)

    if (!iframeKey) return

    videoPlayers.value.delete(iframeKey)
    pendingIframes.delete(iframeKey)
    initializingIframes.delete(iframeKey)
    endedBoundPlayers.delete(iframeKey)
  }

  function queuePlayerInitialization(
    iframeKey: string,
    iframe: HTMLIFrameElement,
    Player: PlayerConstructor,
  ): void {
    if (loadedIframes.has(iframe)) {
      debugVideoPlayer('initializing already loaded iframe', { iframeKey })
      initializeIframePlayer(iframeKey, iframe, Player)
      return
    }

    pendingIframes.set(iframeKey, iframe)
    let initialized = false

    const initialize = () => {
      if (initialized) return
      if (pendingIframes.get(iframeKey) !== iframe) return

      initialized = true
      loadedIframes.add(iframe)
      pendingIframes.delete(iframeKey)
      debugVideoPlayer('initializing iframe player', {
        iframeKey,
        src: iframe.src,
      })
      initializeIframePlayer(iframeKey, iframe, Player)
    }

    iframe.addEventListener('load', initialize, { once: true })

    window.setTimeout(() => {
      if (pendingIframes.get(iframeKey) !== iframe) return

      initialize()
    }, 500)
  }

  function initializeIframePlayer(
    iframeKey: string,
    iframe: HTMLIFrameElement,
    Player: PlayerConstructor,
  ): void {
    const existingPlayer = videoPlayers.value.get(iframeKey)

    if (existingPlayer) {
      if (isLivePlayer(iframeKey, existingPlayer)) return

      forgetPlayer(iframeKey)
    }

    if (!isCurrentIframe(iframeKey, iframe)) {
      debugVideoPlayer('skipping stale iframe initialization', { iframeKey })
      return
    }

    initializingIframes.set(iframeKey, iframe)

    try {
      const player = new Player(iframe)

      playerIframes.set(player, iframe)
      debugVideoPlayer('created player', { iframeKey })

      playersReady(iframeKey, player)
    } catch (err) {
      initializingIframes.delete(iframeKey)
      console.error(`PlayerJS init failed for ${iframeKey}:`, err)
    }
  }

  function playersReady(iframeKey: string, player: VideoPlayer): void {
    if (videoPlayers.value.has(iframeKey)) return

    let registered = false
    const registerPlayer = (source: 'ready' | 'fallback') => {
      if (registered) return

      const existingPlayer = videoPlayers.value.get(iframeKey)

      if (existingPlayer) {
        if (isLivePlayer(iframeKey, existingPlayer)) return

        forgetPlayer(iframeKey)
      }

      if (!isLivePlayer(iframeKey, player)) {
        const playerIframe = iframeForPlayer(player)

        if (playerIframe && initializingIframes.get(iframeKey) === playerIframe) {
          initializingIframes.delete(iframeKey)
        }

        debugVideoPlayer('not registering stale player', {
          iframeKey,
          source,
        })
        return
      }

      registered = true
      debugVideoPlayer('registered player', {
        iframeKey,
        source,
      })
      initializingIframes.delete(iframeKey)
      videoPlayers.value.set(iframeKey, player)
      resetOnEnd(iframeKey, player)
    }

    player.on('ready', () => {
      registerPlayer('ready')
    })

    window.setTimeout(() => registerPlayer('fallback'), 1000)
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

  function onPlayerEvent({
    enabled = true,
    event,
    handler,
    pollIntervalMs = 1000,
    playerKey,
  }: PlayerEventOptions): void {
    let activePlayer: VideoPlayer | null = null
    let activePlayerKey = ''
    let activeCallback: ((payload?: unknown) => void) | null = null
    let poll: ReturnType<typeof setInterval> | null = null
    const safePollIntervalMs = Math.max(
      MIN_EVENT_POLL_INTERVAL_MS,
      Number.isFinite(pollIntervalMs) ? pollIntervalMs : DEFAULT_EVENT_POLL_INTERVAL_MS,
    )

    const normalizedPlayerKey = computed(() => {
      return normalizePlayerKey(toValue(playerKey))
    })
    const isEnabled = computed(() => Boolean(toValue(enabled)))

    function unbind(): void {
      if (activePlayer && activeCallback) {
        activePlayer.off(event, activeCallback)
        debugVideoPlayer('unbound player event', {
          event,
          iframeKey: activePlayerKey,
        })
      }

      activePlayer = null
      activePlayerKey = ''
      activeCallback = null
    }

    function bind(): void {
      if (!isEnabled.value || !normalizedPlayerKey.value) {
        unbind()
        return
      }

      const player = videoPlayers.value.get(normalizedPlayerKey.value)

      if (!player) {
        initializePlayers()
        return
      }

      if (!isLivePlayer(normalizedPlayerKey.value, player)) {
        forgetPlayer(normalizedPlayerKey.value)
        initializePlayers()
        return
      }

      if (activePlayer === player) return

      unbind()
      activePlayer = player
      activePlayerKey = normalizedPlayerKey.value
      activeCallback = (payload?: unknown) => handler(payload, player)
      activePlayer.on(event, activeCallback)
      debugVideoPlayer('bound player event', {
        event,
        iframeKey: activePlayerKey,
      })
    }

    function startPolling(): void {
      if (poll || !isEnabled.value) return

      poll = setInterval(bind, safePollIntervalMs)
      bind()
    }

    function stopPolling(): void {
      if (!poll) return

      clearInterval(poll)
      poll = null
    }

    onMounted(startPolling)

    watch([isEnabled, normalizedPlayerKey], () => {
      if (isEnabled.value) {
        startPolling()
        bind()
        return
      }

      stopPolling()
      unbind()
    })

    onBeforeUnmount(() => {
      stopPolling()
      unbind()
    })
  }

  return {
    initializePlayers,
    playersReady,
    forgetPlayer,
    onPlayerEvent,
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
