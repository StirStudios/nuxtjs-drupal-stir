import { describe, expect, it } from 'vitest'
import {
  drupalPublicFileLocation,
  drupalPublicFileStatus,
  drupalPublicFileUrl,
} from '../../layers/theme/server/utils/drupalPublicFiles'

const drupal = 'https://cms.example.com'

describe('drupalPublicFileUrl', () => {
  it('maps a public file path onto the Drupal host, keeping the query', () => {
    expect(drupalPublicFileUrl(drupal, '/sites/default/files/2026-08/hero.jpg', '?v=12'))
      .toBe('https://cms.example.com/sites/default/files/2026-08/hero.jpg?v=12')
    expect(drupalPublicFileUrl(drupal, '/sites/default/files/images/My%20Photo.jpg'))
      .toBe('https://cms.example.com/sites/default/files/images/My%20Photo.jpg')
  })

  it('refuses paths that could leave the public files directory', () => {
    expect(drupalPublicFileUrl(drupal, '/sites/default/files/../settings.php')).toBeNull()
    expect(drupalPublicFileUrl(drupal, '/sites/default/files/%2e%2e/settings.php')).toBeNull()
    expect(drupalPublicFileUrl(drupal, '/sites/default/files/a%2fb.jpg')).toBeNull()
    expect(drupalPublicFileUrl(drupal, '/sites/default/private/a.jpg')).toBeNull()
    expect(drupalPublicFileUrl(drupal, '/user/login')).toBeNull()
  })
})

describe('drupalPublicFileStatus', () => {
  it('passes files, ranges, revalidations, redirects and missing files through', () => {
    for (const status of [200, 206, 301, 302, 304, 307, 308, 404, 410]) {
      expect(drupalPublicFileStatus(status)).toBe(status)
    }
  })

  it('turns Drupal errors into a bad gateway, so none is cached as a file', () => {
    expect(drupalPublicFileStatus(403)).toBe(502)
    expect(drupalPublicFileStatus(500)).toBe(502)
    expect(drupalPublicFileStatus(503)).toBe(502)
  })
})

describe('drupalPublicFileLocation', () => {
  it('points a redirect into Drupal back at the public host as a path', () => {
    expect(drupalPublicFileLocation('https://cms.example.com/sites/default/files/classes/a.jpg', drupal))
      .toBe('/sites/default/files/classes/a.jpg')
    expect(drupalPublicFileLocation('/sites/default/files/classes/a.jpg?x=1', drupal))
      .toBe('/sites/default/files/classes/a.jpg?x=1')
  })

  it('leaves a redirect to another host alone', () => {
    expect(drupalPublicFileLocation('https://other.example.com/a.jpg', drupal))
      .toBe('https://other.example.com/a.jpg')
  })
})
