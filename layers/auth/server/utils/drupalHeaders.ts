import {
  buildStirDrupalHeaders,
  type StirDrupalHeaderOptions,
} from '../../../core/server/utils/stirDrupalApi'

export function layerAuthBuildDrupalHeaders(
  options: StirDrupalHeaderOptions = {},
): Record<string, string> {
  return buildStirDrupalHeaders(options)
}
