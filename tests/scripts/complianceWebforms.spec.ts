import { describe, expect, it } from 'vitest'
import { webformFindings } from '../../scripts/compliance/webforms.mjs'

const settings = (disableIp: boolean) => `settings:\n  default_form_disable_remote_addr: ${disableIp}\n`

function form(id: string, overrides: Record<string, string> = {}) {
  const values = {
    form_disable_remote_addr: 'false',
    form_confidential: 'false',
    purge: 'completed',
    purge_days: '730',
    ...overrides,
  }
  const lines = Object.entries(values).map(([key, value]) => `  ${key}: ${value}`)

  // Handlers carry their own indented `id:` keys, which must not be read as the form ID.
  return { source: `id: ${id}\nsettings:\n${lines.join('\n')}\nhandlers:\n  email:\n    id: email\n` }
}

const dataHandling = { storeSubmitterIpWithSubmission: false, drupalSubmissionRetention: 730 }

describe('compliance webform findings', () => {
  it('passes forms that inherit the site-wide no-IP default and purge within retention', () => {
    expect(webformFindings({
      settingsSource: settings(true),
      forms: [form('contact'), form('interest', { form_disable_remote_addr: 'true', purge_days: '365' })],
      dataHandling,
      formIds: ['contact', 'interest'],
    })).toEqual([])
  })

  it('flags a form that stores IPs when no site-wide default disables them', () => {
    expect(webformFindings({
      settingsSource: settings(false),
      forms: [form('contact'), form('confidential', { form_confidential: 'true' })],
      dataHandling: { ...dataHandling, storeSubmitterIpWithSubmission: true },
      formIds: ['contact', 'confidential'],
    })).toEqual([])

    expect(webformFindings({
      settingsSource: settings(false),
      forms: [form('contact'), form('confidential', { form_confidential: 'true' })],
      dataHandling,
      formIds: ['contact', 'confidential'],
    })).toEqual([
      'Drupal Webform IP default conflicts with dataHandling.storeSubmitterIpWithSubmission.',
      'Drupal Webform contact stores the submitter IP contrary to the inventory.',
    ])
  })

  it('flags forms that never purge or keep completed submissions too long', () => {
    expect(webformFindings({
      settingsSource: settings(true),
      forms: [
        form('never', { purge: 'none', purge_days: 'null' }),
        form('drafts', { purge: 'draft' }),
        form('long', { purge_days: '1095' }),
        form('unset', { purge: 'all', purge_days: 'null' }),
      ],
      dataHandling,
      formIds: ['never', 'drafts', 'long', 'unset'],
    })).toEqual([
      'Drupal Webform never never purges completed submissions contrary to drupalSubmissionRetention (730 days).',
      'Drupal Webform drafts never purges completed submissions contrary to drupalSubmissionRetention (730 days).',
      'Drupal Webform long keeps completed submissions for 1095 days, longer than drupalSubmissionRetention (730 days).',
      'Drupal Webform unset keeps completed submissions for an unset number of days, longer than drupalSubmissionRetention (730 days).',
    ])
  })

  it('flags automatic purge when the inventory declares indefinite retention', () => {
    expect(webformFindings({
      settingsSource: settings(true),
      forms: [form('kept', { purge: 'none' }), form('purged')],
      dataHandling: { ...dataHandling, drupalSubmissionRetention: 'indefinite' },
      formIds: ['kept', 'purged'],
    })).toEqual(['Drupal Webform purged has automatic purge enabled contrary to indefinite retention.'])
  })

  it('reports forms missing from either the inventory or the config export', () => {
    expect(webformFindings({
      settingsSource: settings(true),
      forms: [form('contact'), form('undeclared')],
      dataHandling,
      formIds: ['contact', 'deleted'],
    })).toEqual([
      'Declared Drupal Webform deleted is missing from the config export.',
      'Drupal Webform undeclared is not declared in technology.formIds.',
    ])
  })

  it('skips the site-wide check when webform.settings.yml is unreadable', () => {
    expect(webformFindings({
      settingsSource: null,
      forms: [form('contact', { form_disable_remote_addr: 'true' })],
      dataHandling,
      formIds: ['contact'],
    })).toEqual([])
  })
})
