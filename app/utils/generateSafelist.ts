import fs from 'fs'
import path from 'path'

// Run with: node ./app/utils/generateSafelist.ts
const breakpoints = ['', 'sm:', 'md:', 'lg:', 'xl:']
const columns = Array.from({ length: 6 }, (_, i) => `grid-cols-${i + 1}`)
const spans = Array.from({ length: 3 }, (_, i) => `col-span-${i + 1}`)
const gaps = [...Array.from({ length: 10 }, (_, i) => `gap-${i + 1}`), 'gap-20']
const spaceY = [
  ...Array.from({ length: 10 }, (_, i) => `space-y-${i + 1}`),
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
const columnsDynamic = Array.from({ length: 5 }, (_, i) => `columns-${i + 1}`)
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
const safelist = new Set<string>()

breakpoints.forEach((bp) => {
  columns.forEach((col) => safelist.add(`${bp}${col}`))
  columnsDynamic.forEach((col) => safelist.add(`${bp}${col}`))
  spans.forEach((span) => safelist.add(`${bp}${span}`))
  gaps.forEach((gap) => safelist.add(`${bp}${gap}`))
  spaceY.forEach((space) => safelist.add(`${bp}${space}`))
  basisValues.forEach((basis) => safelist.add(`${bp}${basis}`))
  spacingClasses.forEach((cls) => safelist.add(`${bp}${cls}`))

  safelist.add(`${bp}hidden`)
  safelist.add(`${bp}block`)
})

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
  'lg:grid-cols-[8fr_4fr]',
  'lg:grid-cols-[4fr_8fr]',
  'text-muted',
  'list-none',
  'aspect-video',
  'aspect-square',
]

additionalClasses.forEach((cls) => safelist.add(cls))

function generateInlineSources(classes: Set<string>): string {
  const lines: string[] = []
  const sorted = Array.from(classes).sort()

  const chunkSize = 20

  for (let i = 0; i < sorted.length; i += chunkSize) {
    const chunk = sorted.slice(i, i + chunkSize).join(' ')

    lines.push(`@source inline("${chunk}");`)
  }

  return lines.join('\n')
}

const safelistPath = path.resolve('app/assets/css/safelist.inline.css')
const inlineCSS = generateInlineSources(safelist)

fs.writeFileSync(safelistPath, inlineCSS)

console.log(
  `Tailwind v4 inline safelist generated: ${safelist.size} classes saved to ${safelistPath}`,
)
