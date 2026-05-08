export const mediaPreviewClasses = {
  overlayBase:
    'after:pointer-events-none after:col-start-1 after:row-start-1 after:block after:h-full after:w-full after:content-[\'\'] after:z-10',
  overlayTint40: 'after:bg-black/40',
  overlayTint30: 'after:bg-black/30',
  overlayInteractiveTint:
    'after:transition-colors group-hover:after:bg-black/10 group-focus-within:after:bg-black/10',
  zoomLayer:
    'col-start-1 row-start-1 z-0 h-full w-full will-change-transform transition-transform',
  iconLayer: 'pointer-events-none col-start-1 row-start-1 z-20',
} as const
