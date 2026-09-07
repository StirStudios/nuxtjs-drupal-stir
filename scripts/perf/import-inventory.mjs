import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'vue/compiler-sfc'
import ts from 'typescript'

const args = process.argv.slice(2)
const option = name => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
const root = resolve(option('cwd') || fileURLToPath(new URL('../../', import.meta.url)))
const output = resolve(option('output') || resolve(root, '.audit/source-imports.json'))
const excluded = new Set(['node_modules', '.git', '.nuxt', '.output', '.audit'])

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const groups = await Promise.all(entries.filter(entry => !excluded.has(entry.name)).map((entry) => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : [path]
  }))
  return groups.flat().filter(path => /\.(vue|[cm]?[jt]s)$/.test(path))
}

function scriptImports(source, filename, lineOffset = 0) {
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true)
  const imports = []
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push({
          source: node.moduleSpecifier.text,
          kind: 'static',
          typeOnly: Boolean(node.importClause?.isTypeOnly || node.isTypeOnly
            || (!node.importClause?.name && node.importClause?.namedBindings
              && ts.isNamedImports(node.importClause.namedBindings)
              && node.importClause.namedBindings.elements.length > 0
              && node.importClause.namedBindings.elements.every(element => element.isTypeOnly))),
          line: lineOffset + ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
        })
      }
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      imports.push({
        source: node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])
          ? node.arguments[0].text
          : node.arguments[0]?.getText(ast),
        kind: 'dynamic',
        line: lineOffset + ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return imports
}

const records = []
for (const filename of await sourceFiles(resolve(root, 'layers'))) {
  const source = await readFile(filename, 'utf8')
  const record = { file: relative(root, filename), imports: [], components: [] }
  if (filename.endsWith('.vue')) {
    const { descriptor, errors } = parse(source, { filename })
    if (errors.length) throw new Error(`Cannot parse ${filename}: ${errors.join('; ')}`)
    for (const script of [descriptor.script, descriptor.scriptSetup].filter(Boolean)) {
      record.imports.push(...scriptImports(script.content, filename, script.loc.start.line - 1))
    }
    function walk(node, conditions = []) {
      if (node.type === 1) {
        conditions = [...conditions, ...node.props
          .filter(prop => prop.type === 7 && ['if', 'else-if', 'else', 'for'].includes(prop.name))
          .map(prop => `${prop.name}: ${prop.exp?.content || ''}`)]
        if (node.tagType === 1 && !['component', 'slot', 'template'].includes(node.tag)) {
          record.components.push({
            tag: node.tag,
            lazy: node.tag.startsWith('Lazy'),
            conditions,
            line: node.loc.start.line,
          })
        }
      }
      for (const child of node.children || []) walk(child, conditions)
    }
    if (descriptor.template?.ast) walk(descriptor.template.ast)
  } else {
    record.imports = scriptImports(source, filename)
  }
  records.push(record)
}
records.sort((a, b) => a.file.localeCompare(b.file))
const report = {
  schemaVersion: 1,
  scope: 'layers source imports and Vue component references',
  limitations: [
    'Source candidates are not defects or measured production costs.',
    'Generated auto-imports, downstream overrides and dynamic render functions require build/runtime tracing.',
    'Type-only imports are recorded separately; production tree shaking and shared dependencies must be checked.',
  ],
  filesScanned: records.length,
  records,
}
await mkdir(dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(`Recorded ${records.length} source files in ${output}`)
