declare global {
  interface Window {
    initVenueCalculatorWidget?: () => void
    playerjs?: {
      Player?: new (iframe: HTMLIFrameElement) => import('~/composables/useVideoPlayers').VideoPlayer
    }
  }
}

export {}
