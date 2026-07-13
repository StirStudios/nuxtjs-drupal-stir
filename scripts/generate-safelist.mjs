import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const breakpoints = ['', 'xs:', 'sm:', 'md:', 'lg:', 'xl:']
const columns = Array.from({ length: 6 }, (_, index) => `grid-cols-${index + 1}`)
const spans = Array.from({ length: 3 }, (_, index) => `col-span-${index + 1}`)
const gaps = [...Array.from({ length: 10 }, (_, index) => `gap-${index + 1}`), 'gap-20']
const spaceY = [
  ...Array.from({ length: 10 }, (_, index) => `space-y-${index + 1}`),
  'space-y-20',
]
const basisValues = [
  'basis-1/1',
  'basis-1/2',
  'basis-1/3',
  'basis-1/4',
  'basis-1/5',
  'basis-1/6',
  'basis-1/7',
]
const columnsDynamic = Array.from({ length: 5 }, (_, index) => `columns-${index + 1}`)
const spacings = [0, 1, 2, 3, 4, 5, 10, 15, 20]
const spacingClasses = spacings.flatMap((size) => [
  `p-${size}`,
  `pt-${size}`,
  `pr-${size}`,
  `pb-${size}`,
  `pl-${size}`,
  `px-${size}`,
  `py-${size}`,
  `m-${size}`,
  `mt-${size}`,
  `mr-${size}`,
  `mb-${size}`,
  `ml-${size}`,
  `mx-${size}`,
  `my-${size}`,
])
const safelist = new Set()

for (const breakpoint of breakpoints) {
  columns.forEach(column => safelist.add(`${breakpoint}${column}`))
  columnsDynamic.forEach(column => safelist.add(`${breakpoint}${column}`))
  spans.forEach(span => safelist.add(`${breakpoint}${span}`))
  gaps.forEach(gap => safelist.add(`${breakpoint}${gap}`))
  spaceY.forEach(space => safelist.add(`${breakpoint}${space}`))
  basisValues.forEach(basis => safelist.add(`${breakpoint}${basis}`))
  spacingClasses.forEach(spacing => safelist.add(`${breakpoint}${spacing}`))

  safelist.add(`${breakpoint}hidden`)
  safelist.add(`${breakpoint}block`)
}

const additionalClasses = [
  'lg:block',
  'mx-auto',
  'm-auto',
  'lg:flex',
  'sm:w-lg',
  'sm:max-w-lg',
  'lg:max-w-2xl',
  'lg:max-w-3xl',
  'lg:max-w-4xl',
  'lg:max-w-5xl',
  'lg:max-w-6xl',
  'lg:grid-cols-[8fr_4fr]',
  'lg:grid-cols-[4fr_8fr]',
  'text-muted',
  'list-none',
  'aspect-video',
  'aspect-square',
]

additionalClasses.forEach(className => safelist.add(className))

function generateInlineSources(classes) {
  const lines = []
  const sortedClasses = Array.from(classes).sort()
  const chunkSize = 20

  for (let index = 0; index < sortedClasses.length; index += chunkSize) {
    const chunk = sortedClasses.slice(index, index + chunkSize).join(' ')

    lines.push(`@source inline("${chunk}");`)
  }

  return lines.join('\n')
}

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const safelistPath = resolve(
  rootDir,
  'layers/theme/app/assets/css/safelist.inline.css',
)

writeFileSync(safelistPath, generateInlineSources(safelist))

console.log(
  `Tailwind v4 inline safelist generated: ${safelist.size} classes saved to ${safelistPath}`,
)
