import {
  buildStirDrupalHeaders,
  type StirDrupalHeaderOptions,
} from '../../../../server/utils/stirDrupalApi'

export function buildDrupalHeaders(
  options: StirDrupalHeaderOptions = {},
): Record<string, string> {
  return buildStirDrupalHeaders(options)
}
