type UseModalMediaPlaybackOptions = {
  getCurrentMid: () => string
  getActiveMid: (index: number) => string
  onSelect: (index: number) => void
}

export function useModalMediaPlayback({
  getCurrentMid,
  getActiveMid,
  onSelect,
}: UseModalMediaPlaybackOptions) {
  const resolveModalIframes = () => {
    const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role=\'dialog\']'))
    const openDialogs = dialogs.filter((dialog) => dialog.getAttribute('data-state') !== 'closed')
    const scope = openDialogs.length > 0 ? openDialogs[openDialogs.length - 1] : dialogs[dialogs.length - 1]

    if (scope) {
      const modalIframes = Array.from(scope.querySelectorAll<HTMLIFrameElement>('iframe[data-mid]'))

      if (modalIframes.length > 0) {
        return modalIframes
      }

      return Array.from(scope.querySelectorAll<HTMLIFrameElement>('iframe'))
    }

    return Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe[data-mid]'))
  }

  function stopIframePlayback(iframe: HTMLIFrameElement) {
    iframe.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
      '*',
    )
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: 'pause' }),
      '*',
    )

    const src = iframe.getAttribute('src')

    if (src) {
      iframe.setAttribute('src', src)
    }
  }

  function stopNonActiveModalVideos(nextIndex: number) {
    if (!import.meta.client) return
    const nextMid = getActiveMid(nextIndex)
    const currentMid = getCurrentMid()
    const iframes = resolveModalIframes()

    if (iframes.length === 0) return

    if (currentMid !== '' && currentMid !== nextMid) {
      const currentIframe = iframes.find((iframe) => (iframe.dataset.mid ?? '') === currentMid)

      if (currentIframe) {
        stopIframePlayback(currentIframe)
        return
      }
    }

    iframes.forEach((iframe) => {
      const iframeMid = iframe.dataset.mid ?? ''

      if (nextMid !== '' && iframeMid === nextMid) return
      stopIframePlayback(iframe)
    })
  }

  function handleCarouselSelect(index: number) {
    stopNonActiveModalVideos(index)
    onSelect(index)
  }

  return {
    handleCarouselSelect,
  }
}
