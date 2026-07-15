import {
  buildStirDrupalHeaders,
  type StirDrupalHeaderOptions,
} from './stirDrupalApi'

export function buildDrupalHeaders(
  options: StirDrupalHeaderOptions = {},
): Record<string, string> {
  return buildStirDrupalHeaders(options)
}
