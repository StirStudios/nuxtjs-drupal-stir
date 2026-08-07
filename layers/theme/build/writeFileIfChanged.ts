import { readFile, writeFile } from 'node:fs/promises'

export async function writeFileIfChanged(
  path: string,
  contents: string,
): Promise<boolean> {
  try {
    if (await readFile(path, 'utf8') === contents) return false
  } catch {
    // Missing or unreadable output should be regenerated.
  }

  await writeFile(path, contents)

  return true
}
