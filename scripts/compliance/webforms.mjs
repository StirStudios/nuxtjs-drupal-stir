// Checks exported Drupal Webforms against the compliance inventory.
//
// Mirrors how Webform resolves settings at runtime: a form's own falsy value
// falls back to the site-wide `default_*` setting (Webform::getSetting()), so a
// form exported with `form_disable_remote_addr: false` still stores no IP when
// the site-wide default disables it.

const enabled = (source, key) => new RegExp(`^\\s*${key}:\\s*true\\s*$`, 'm').test(source)
const scalar = (source, key) => source.match(new RegExp(`^\\s*${key}:\\s*['"]?([^'"\\s#]+)['"]?\\s*$`, 'm'))?.[1]

// Purge modes that delete completed submissions; `draft` only removes drafts.
const PURGES_COMPLETED = new Set(['completed', 'all'])

/**
 * @param {object} input
 * @param {string | null} input.settingsSource webform.settings.yml, or null when unreadable.
 * @param {Array<{ source: string }>} input.forms Exported webform.webform.*.yml sources.
 * @param {{ storeSubmitterIpWithSubmission?: boolean, drupalSubmissionRetention?: number | string }} [input.dataHandling]
 * @param {string[]} [input.formIds] Webform IDs declared in the inventory.
 * @returns {string[]} Blocking findings.
 */
export function webformFindings({ settingsSource, forms, dataHandling = {}, formIds = [] }) {
  const errors = []
  const inventoryDisablesIp = dataHandling.storeSubmitterIpWithSubmission === false
  const disablesIpByDefault = settingsSource !== null && enabled(settingsSource, 'default_form_disable_remote_addr')
  if (settingsSource !== null && disablesIpByDefault !== inventoryDisablesIp) {
    errors.push('Drupal Webform IP default conflicts with dataHandling.storeSubmitterIpWithSubmission.')
  }

  const retention = dataHandling.drupalSubmissionRetention
  const expectedIds = new Set(formIds)
  const exportedIds = new Set()
  for (const { source } of forms) {
    // Top-level only: handlers and elements also carry indented `id:` keys.
    const id = source.match(/^id:\s*['"]?([^'"\s]+)['"]?\s*$/m)?.[1]
    if (!id) continue
    exportedIds.add(id)

    const storesIp = !enabled(source, 'form_confidential')
      && !enabled(source, 'form_disable_remote_addr')
      && !disablesIpByDefault
    if (inventoryDisablesIp && storesIp) {
      errors.push(`Drupal Webform ${id} stores the submitter IP contrary to the inventory.`)
    }

    const purge = scalar(source, 'purge') ?? 'none'
    if (retention === 'indefinite' && purge !== 'none') {
      errors.push(`Drupal Webform ${id} has automatic purge enabled contrary to indefinite retention.`)
    }
    if (Number.isInteger(retention) && retention > 0) {
      const days = Number(scalar(source, 'purge_days'))
      if (!PURGES_COMPLETED.has(purge)) {
        errors.push(`Drupal Webform ${id} never purges completed submissions contrary to drupalSubmissionRetention (${retention} days).`)
      } else if (!(days > 0) || days > retention) {
        errors.push(`Drupal Webform ${id} keeps completed submissions for ${days > 0 ? days : 'an unset number of'} days, longer than drupalSubmissionRetention (${retention} days).`)
      }
    }
  }

  for (const id of expectedIds) {
    if (!exportedIds.has(id)) errors.push(`Declared Drupal Webform ${id} is missing from the config export.`)
  }
  for (const id of exportedIds) {
    if (!expectedIds.has(id)) errors.push(`Drupal Webform ${id} is not declared in technology.formIds.`)
  }

  return errors
}
