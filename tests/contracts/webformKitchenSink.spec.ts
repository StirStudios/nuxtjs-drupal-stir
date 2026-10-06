import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { safeParse } from 'valibot'
import { describe, expect, it } from 'vitest'
import type { WebformFieldProps, WebformState } from '../../layers/theme/app/types'
import { getHiddenDefaults } from '../../layers/theme/app/utils/getHiddenDefaults'
import { buildValidationSchema } from '../../layers/webform/app/utils/buildValidationSchema'
import { flattenWebformFields } from '../../layers/webform/app/utils/flattenWebformFields'
import { serializeWebformSubmission } from '../../layers/webform/app/utils/transformUtils'
import { resolveWebformFieldStates } from '../../layers/webform/app/utils/webformConditions'
import { isWebformDisplayElement } from '../../layers/webform/app/utils/webformDisplayUtils'
import { normalizeWebformDefinition } from '../../layers/webform/app/utils/webformFieldUtils'
import {
  isSupportedWebformField,
  isWebformContainer,
} from '../../layers/webform/app/utils/webformFieldTypes'
import {
  getFileAccept,
  getFileMaxSize,
  isWebformFileField,
} from '../../layers/webform/app/utils/webformFileUtils'
import { createWebformState } from '../../layers/webform/app/utils/webformState'

/**
 * Replays the Stir Tools kitchen-sink webform.
 *
 * The payload fixture is a real Webform built by Drupal and passed through
 * Custom Elements' key conversion. The submission fixture is a sample that
 * Webform accepted and stored unchanged. Whatever element family Drupal adds
 * to that webform, the layer must render it, accept the sample, and submit
 * exactly the sample back.
 */
const fixtures = resolve(__dirname, '../../contracts/stir-tools/v1/fixtures')
const payload: unknown = JSON.parse(readFileSync(resolve(fixtures, 'webform-kitchen-sink.json'), 'utf8'))
const submission = JSON.parse(
  readFileSync(resolve(fixtures, 'webform-kitchen-sink-submission.json'), 'utf8'),
) as { webformId: string, data: Record<string, unknown> }

function loadFields(source: unknown = payload): Record<string, WebformFieldProps> {
  return flattenWebformFields(normalizeWebformDefinition(source).fields)
}

/** The sample as the form's controls hold it: booleans, File objects. */
function sampleState(fields: Record<string, WebformFieldProps>): WebformState {
  const state = structuredClone(submission.data) as WebformState

  for (const [name, field] of Object.entries(fields)) {
    if (field['#type'] === 'checkbox') state[name] = state[name] === '1'
    if (isWebformFileField(field)) state[name] = new File(['png'], 'poster.png', { type: 'image/png' })
  }

  return state
}

function withoutConditions(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutConditions)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== '#conditions')
      .map(([key, item]) => [key, withoutConditions(item)]),
  )
}

describe('Stir Tools kitchen-sink webform', () => {
  const fields = loadFields()

  it('renders every element Drupal sends', () => {
    const unsupported = Object.values(fields)
      .filter(field => !isWebformDisplayElement(field) && !isWebformContainer(field) && !isSupportedWebformField(field))
      .map(field => `${field['#name']} (${field['#type']})`)

    expect(unsupported).toEqual([])
  })

  it('holds a value under every key, and composite part, Drupal stores', () => {
    const state = {
      ...createWebformState(fields),
      ...getHiddenDefaults(fields),
    }

    expect(Object.keys(state).sort()).toEqual(Object.keys(submission.data).sort())

    for (const [name, stored] of Object.entries(submission.data)) {
      const row = Array.isArray(stored) ? stored[0] : stored
      const held = state[name]
      const heldRow = Array.isArray(held) ? held[0] : held

      if (fields[name]?.['#type'] === 'webform_likert') {
        expect(Object.keys(fields[name]!['#questions'] ?? {}).sort(), name).toEqual(Object.keys(stored as object).sort())
      }
      if (fields[name]?.['#composite']) {
        expect(Object.keys(heldRow as object).sort(), name).toEqual(Object.keys(row as object).sort())
        expect(Array.isArray(held), `${name} is a list`).toBe(Array.isArray(stored))
      }
    }
  })

  it('applies the upload limits Drupal enforces', () => {
    const poster = fields.poster_image!

    expect(getFileAccept(poster)).toBe('.png')
    expect(getFileMaxSize(poster)).toBe(2 * 1024 * 1024)
  })

  it('accepts the submission Drupal accepted', () => {
    const state = sampleState(fields)
    const result = safeParse(buildValidationSchema(fields, state), state)

    expect(result.issues?.map(issue => `${issue.path?.map(item => item.key).join('.')}: ${issue.message}`) ?? []).toEqual([])
  })

  it('submits exactly the submission Drupal stored', () => {
    const state = sampleState(fields)
    const { poster_image: file, ...sent } = serializeWebformSubmission(state)
    const { poster_image: _fileId, ...stored } = submission.data

    expect(file).toBeInstanceOf(File)
    expect(sent).toEqual(stored)
    // Every choice is an option the field offers, under Drupal's key.
    // (Interests also takes free text, as an "other" element does.)
    for (const name of ['event_type', 'needs_access', 'extras', 'satisfaction']) {
      const field = fields[name]!
      const offered = Object.keys(field['#options'] ?? field['#answers'] ?? {})
      const chosen = stored[name]
      const values = Array.isArray(chosen)
        ? chosen
        : chosen && typeof chosen === 'object' ? Object.values(chosen) : [chosen]

      expect(values.filter(value => !offered.includes(String(value))), name).toEqual([])
    }
  })

  it('applies conditions by Drupal names', () => {
    const ticketFee = fields.ticket_fee!
    const extrasNote = fields.extras_note!
    const paid = sampleState(fields)

    expect(resolveWebformFieldStates(ticketFee, paid)).toMatchObject({ visible: true, required: true })
    expect(resolveWebformFieldStates(extrasNote, paid).visible).toBe(true)

    const free = { ...paid, event_type: 'free_event', extras: ['late-entry'] }

    expect(resolveWebformFieldStates(ticketFee, free)).toMatchObject({ visible: false, required: false })
    expect(resolveWebformFieldStates(extrasNote, free).visible).toBe(false)
  })

  it('reads the same conditions from #states sent by older producers', () => {
    const legacy = loadFields(withoutConditions(payload))
    const states = [
      sampleState(fields),
      { ...sampleState(fields), event_type: 'free_event', extras: [] },
    ]

    for (const state of states) {
      for (const [name, field] of Object.entries(fields)) {
        expect(resolveWebformFieldStates(legacy[name]!, state), name).toEqual(resolveWebformFieldStates(field, state))
      }
    }
  })
})
