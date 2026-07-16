import {
  buildStirDrupalHeaders,
  type StirDrupalHeaderOptions,
} from '../../../foundation/server/utils/stirDrupalApi'

export function buildDrupalHeaders(
  options: StirDrupalHeaderOptions = {},
): Record<string, string> {
  return buildStirDrupalHeaders(options)
}
