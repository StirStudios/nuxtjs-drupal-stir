import { defineEventHandler, setResponseHeader } from 'h3'
import type { StirPresentationCatalogue } from '../../../app/utils/presentationClasses'
import { buildPresentationCatalogue } from '../../utils/presentationCatalogue'

// Drupal stores the last copy it fetched, so its forms never wait on this route.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'public, max-age=60')

  return await buildPresentationCatalogue(
    useAppConfig().stirTheme?.presentation as StirPresentationCatalogue | undefined,
  )
})
