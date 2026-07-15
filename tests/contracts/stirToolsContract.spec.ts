import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv from 'ajv'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../../contracts/stir-tools/v1')
const manifest = JSON.parse(
  readFileSync(resolve(root, 'manifest.json'), 'utf8'),
) as {
  schemaVersion: number
  contractVersion: string
  contracts: Record<string, { schema: string, fixtures: string[] }>
}
const snapshot = JSON.parse(
  readFileSync(resolve(root, 'snapshot.json'), 'utf8'),
) as {
  schemaVersion: number
  producer: string
  contractVersion: string
  files: Record<string, string>
}

describe('Stir Tools contract snapshot', () => {
  it('has an intact deterministic snapshot', () => {
    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      producer: 'stirstudios/stir_tools',
      contractVersion: manifest.contractVersion,
    })

    for (const [path, expected] of Object.entries(snapshot.files)) {
      const actual = createHash('sha256')
        .update(readFileSync(resolve(root, path)))
        .digest('hex')

      expect(actual, path).toBe(expected)
    }
  })

  it('validates every producer fixture against its declared schema', () => {
    const ajv = new Ajv({ allErrors: true, schemaId: 'auto' })

    for (const [id, contract] of Object.entries(manifest.contracts)) {
      const schema = JSON.parse(
        readFileSync(resolve(root, contract.schema), 'utf8'),
      )
      const validate = ajv.compile(schema)

      for (const fixture of contract.fixtures) {
        const payload = JSON.parse(readFileSync(resolve(root, fixture), 'utf8'))
        const valid = validate(payload)

        expect(
          valid,
          `${id}:${fixture} ${ajv.errorsText(validate.errors)}`,
        ).toBe(true)
      }
    }
  })
})
