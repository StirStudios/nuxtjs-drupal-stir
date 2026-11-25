import { getStirDrupalApiConfig } from '../../../foundation/server/utils/stirDrupalApi'
import { resolveDrupalCeConfig } from '../../../foundation/shared/utils/drupalCeConfig'

export function resolveDrupalCeApiConfig(
  config: ReturnType<typeof useRuntimeConfig>,
) {
  const drupalApi = getStirDrupalApiConfig()

  return {
    apiKey: drupalApi.apiKey,
    ceApiEndpoint: resolveDrupalCeConfig(config.public).ceApiEndpoint,
    drupalBaseUrl: drupalApi.baseUrl,
    requestTimeoutMs: drupalApi.requestTimeoutMs,
  }
}
