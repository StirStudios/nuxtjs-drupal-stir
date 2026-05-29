import {
  buildStirDrupalHeaders,
  type StirDrupalHeaderOptions,
} from '../../../../server/utils/stirDrupalApi'

export function layerAuthBuildDrupalHeaders(
  options: StirDrupalHeaderOptions = {},
): Record<string, string> {
  return buildStirDrupalHeaders(options)
}
