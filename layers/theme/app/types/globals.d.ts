declare global {
  interface Window {
    initVenueCalculatorWidget?: () => void
    playerjs?: {
      Player?: new (iframe: HTMLIFrameElement) => import('#stir/composables/useVideoPlayers').VideoPlayer
    }
  }
}

export {}
