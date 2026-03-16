type AspectRatioConfig = {
  portrait?: string
  landscape?: string
  square?: string
  fourThree?: string
}

export const aspectRatios = (
  width: number | null,
  height: number | null,
  sizeConfig?: {
    portraitMax?: string
    landscapeMax?: string
    squareMax?: string
    fourThreeMax?: string
  },
) => {
  const appConfig = useAppConfig?.()
  const ratioConfig = (appConfig?.stirTheme?.aspectRatios || {}) as AspectRatioConfig

  const defaults = {
    portrait: 'aspect-[9/16]',
    landscape: 'aspect-[16/9]',
    square: 'aspect-square',
    fourThree: 'aspect-[4/3]',
  }

  const portraitRatio = ratioConfig.portrait || defaults.portrait
  const landscapeRatio = ratioConfig.landscape || defaults.landscape
  const squareRatio = ratioConfig.square || defaults.square
  const fourThreeRatio = ratioConfig.fourThree || defaults.fourThree

  const portraitMax = sizeConfig?.portraitMax || 'max-h-[40%]'
  const landscapeMax = sizeConfig?.landscapeMax || 'max-h-[30%]'
  const squareMax = sizeConfig?.squareMax || 'max-h-[35%]'
  const fourThreeMax = sizeConfig?.fourThreeMax || 'max-h-[30%]'

  if (width && height) {
    const ratio = width / height

    if (height === 480) {
      return `${fourThreeRatio} ${fourThreeMax}`
    }
    if (ratio > 1) {
      return `${landscapeRatio} ${landscapeMax}`
    }
    if (ratio < 1) {
      return `${portraitRatio} ${portraitMax}`
    }
    return `${squareRatio} ${squareMax}`
  }

  return ''
}
