import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { missingReviewMarkers, REVIEW_SECTIONS } from '../../scripts/compliance/review.mjs'

const template = readFileSync(new URL('../../scripts/compliance/templates/REVIEW.md', import.meta.url), 'utf8')
const init = fileURLToPath(new URL('../../scripts/compliance/init.mjs', import.meta.url))

describe('compliance review checklists', () => {
  it('ships a REVIEW.md template that contains every required section', () => {
    expect(missingReviewMarkers(template)).toEqual([])

    for (const section of REVIEW_SECTIONS) {
      expect(template).toContain(section.heading)
    }
  })

  it('reports the markers an outdated REVIEW.md is missing, in checklist order', () => {
    const outdated = template
      .replace('<!-- stir-compliance-seo:v1 -->', '')
      .replace('<!-- stir-compliance-discovery:v1 -->', '')

    expect(missingReviewMarkers(outdated)).toEqual([
      '<!-- stir-compliance-discovery:v1 -->',
      '<!-- stir-compliance-seo:v1 -->',
    ])
  })

  it('adds a missing owner questionnaire before the human confirmations without touching project notes', () => {
    const project = mkdtempSync(join(tmpdir(), 'stir-compliance-'))
    const ownerStart = template.indexOf('## Owner questionnaire')
    const outdated = `${template.slice(0, ownerStart)}## Human confirmations\n\n- Project note kept.\n`

    try {
      mkdirSync(join(project, 'compliance'))
      writeFileSync(join(project, 'compliance/site.json'), '{}')
      writeFileSync(join(project, 'compliance/REVIEW.md'), outdated)

      expect(() => execFileSync('node', [init, '--check'], { cwd: project, stdio: 'pipe' })).toThrow()
      execFileSync('node', [init], { cwd: project, stdio: 'pipe' })

      const review = readFileSync(join(project, 'compliance/REVIEW.md'), 'utf8')

      expect(missingReviewMarkers(review)).toEqual([])
      expect(review.indexOf('## Owner questionnaire')).toBeLessThan(review.indexOf('## Human confirmations'))
      expect(review).toContain('- Project note kept.')
      expect(() => execFileSync('node', [init, '--check'], { cwd: project, stdio: 'pipe' })).not.toThrow()
    }
    finally {
      rmSync(project, { recursive: true, force: true })
    }
  })

  it('adds a missing marker to an existing owner questionnaire without discarding recorded answers', () => {
    const project = mkdtempSync(join(tmpdir(), 'stir-compliance-'))
    const existing = '## Owner questionnaire\n\n- Who is the site owner? Jane Doe.\n\n## Human confirmations\n\n- Confirmed.\n'

    try {
      mkdirSync(join(project, 'compliance'))
      writeFileSync(join(project, 'compliance/site.json'), '{}')
      writeFileSync(join(project, 'compliance/REVIEW.md'), existing)

      execFileSync('node', [init], { cwd: project, stdio: 'pipe' })

      const review = readFileSync(join(project, 'compliance/REVIEW.md'), 'utf8')

      expect(review).toContain('<!-- stir-compliance-owner:v1 -->')
      expect(review).toContain('- Who is the site owner? Jane Doe.')
      expect(review.indexOf('## Owner questionnaire')).toBeLessThan(review.indexOf('- Who is the site owner? Jane Doe.'))
      expect(() => execFileSync('node', [init, '--check'], { cwd: project, stdio: 'pipe' })).not.toThrow()
    }
    finally {
      rmSync(project, { recursive: true, force: true })
    }
  })
})
