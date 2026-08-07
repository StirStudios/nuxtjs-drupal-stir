import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { writeFileIfChanged } from '../../layers/theme/build/writeFileIfChanged'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(directory =>
      rm(directory, { recursive: true, force: true }),
    ),
  )
})

describe('writeFileIfChanged', () => {
  it('writes new and changed content without rewriting identical content', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'stir-write-if-changed-'))
    const path = join(directory, 'generated.css')

    temporaryDirectories.push(directory)

    await expect(writeFileIfChanged(path, 'first')).resolves.toBe(true)
    await expect(writeFileIfChanged(path, 'first')).resolves.toBe(false)
    await expect(writeFileIfChanged(path, 'second')).resolves.toBe(true)
    await expect(readFile(path, 'utf8')).resolves.toBe('second')
  })
})
