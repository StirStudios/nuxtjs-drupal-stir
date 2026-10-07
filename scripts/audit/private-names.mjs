// This repository is public, so it must not name client projects. Fails when a
// tracked file, or a commit message in a range, contains one. Names are kept
// as SHA-256 hashes so this check does not publish them, and findings name a
// file and line or a commit, never the word. Add a name with:
//   node scripts/audit/private-names.mjs --hash "<name>"
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const NAME_HASHES = new Set([
  '2b946c7baa7d3e4333ac90554243bd61917238a49b5febfa2128d9811fcef3ab',
  '5840e50f94435030b3790c46cd644ec660a509504cc71e649ab7baed6a8acc73',
  '898b88c8276331f118d71d84d299bc450f2da788811d5122f62967695ce4a3e1',
  'b8dde45084eca2f60dfff1647f525b1a9e91a20b2dc15bd9ab002f2d78247a69',
  'd93bfd7d0b879db9afb004bb8d09fd40ea6f48c3c93df96d7b2f87bccec95ff3',
  'bfe7e64c304377af1877cec389116fede404a48fe3d7a2c7f120cb71a16c7ce2',
  'b52ebd41916c79a5bbdfc379f9bb80a07ee8cd212aebca51374d0011c7e4b09a',
  '01b2d2fb022a64d36ef93e5371fe37b4b8e6909617455a95f1684ef4cdbf6ca3',
  '9d25712ec836734942c5bd60e158827b62b6b1b6cbff76dcd8e2a217876ad2c3',
  'f1fd7e2faad545c3188d808f27113b96980376dca906e3580b4abd2f06a8ed6c',
  '9b85668b292dbe03e5e591052e2c510b847c359e08179fb9ba0a81596fe082c3',
  'a8822b92c5210b44a7f75d0747f40b43553f8ab57d83656fc6dc63d6ff970904',
  'fa5a0489611ad5cf21087ec8dbb3cf8e3ace218aaad002db89c301d76f11a72a',
  '79a0638cbd1d3c379fe68429929fdfa20ba96ee5b5fbe29907a6b53e78b94660',
  '3e51789da25704e68fd73ef57d52640cd859d6cf43006bf1bb641d61aa4bafa8',
])

const hash = value => createHash('sha256').update(value).digest('hex')

// Words and runs of up to three words joined without separators, so the
// spaced, hyphenated, domain and joined spellings of a name all match.
export function containsPrivateName(text) {
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

  for (let index = 0; index < words.length; index += 1) {
    let joined = ''

    for (let length = 0; length < 3 && index + length < words.length; length += 1) {
      joined += words[index + length]
      if (NAME_HASHES.has(hash(joined))) return true
    }
  }

  return false
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
}

function fileFindings() {
  const findings = []

  for (const file of git('ls-files', '-z').split('\0').filter(Boolean)) {
    let content

    try {
      content = readFileSync(file)
    }
    catch {
      continue
    }
    if (content.includes(0)) continue

    content.toString('utf8').split('\n').forEach((line, index) => {
      if (containsPrivateName(line)) findings.push(`${file}:${index + 1}`)
    })
  }

  return findings
}

function commitFindings(range) {
  return git('log', '--format=%H%x00%B%x01', range)
    .split('\x01')
    .map(entry => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const [sha = '', message = ''] = entry.split('\0')

      return containsPrivateName(message) ? [`commit ${sha.slice(0, 12)}`] : []
    })
}

function main() {
  const hashIndex = process.argv.indexOf('--hash')

  if (hashIndex !== -1) {
    console.log(hash(String(process.argv[hashIndex + 1] ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')))
    return
  }

  const commitsIndex = process.argv.indexOf('--commits')
  const findings = commitsIndex === -1
    ? fileFindings()
    : commitFindings(String(process.argv[commitsIndex + 1] ?? 'HEAD'))

  if (findings.length) {
    console.error('This repository is public and must not name client projects. Rename them (for example "a client site", example.com):')
    for (const finding of findings) console.error(`  ${finding}`)
    process.exit(1)
  }

  console.log(commitsIndex === -1 ? 'No client project names in tracked files.' : 'No client project names in these commit messages.')
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
