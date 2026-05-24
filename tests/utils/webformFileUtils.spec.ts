import { describe, expect, it } from 'vitest'
import {
  buildWebformFormData,
  getFileAccept,
  getFileMaxSize,
  hasFileValue,
} from '../../layers/theme/app/utils/webformFileUtils'
import type { WebformFieldProps } from '../../types'

describe('webformFileUtils', () => {
  it('derives accept attributes from webform file extensions', () => {
    const field = {
      '#type': 'managed_file',
      '#title': 'Attachment',
      '#name': 'attachment',
      '#file_extensions': 'pdf doc docx',
    } as WebformFieldProps

    expect(getFileAccept(field)).toBe('.pdf,.doc,.docx')
  })

  it('parses human-readable max file sizes', () => {
    const field = {
      '#type': 'managed_file',
      '#title': 'Attachment',
      '#name': 'attachment',
      '#max_filesize': '2 MB',
    } as WebformFieldProps

    expect(getFileMaxSize(field)).toBe(2 * 1024 * 1024)
  })

  it('detects and appends single and multiple files to FormData', () => {
    const headshot = new File(['image'], 'headshot.jpg', {
      type: 'image/jpeg',
    })
    const resume = new File(['resume'], 'resume.pdf', {
      type: 'application/pdf',
    })

    expect(hasFileValue({ resume })).toBe(true)

    const formData = buildWebformFormData({
      webform_id: 'submit_audition_job',
      name: 'Jane Dancer',
      resume,
      photos: [headshot],
    })

    expect(formData.get('webform_id')).toBe('submit_audition_job')
    expect(formData.get('name')).toBe('Jane Dancer')
    expect((formData.get('resume') as File).name).toBe('resume.pdf')
    expect((formData.get('resume') as File).type).toBe('application/pdf')
    expect((formData.getAll('photos[]')[0] as File).name).toBe('headshot.jpg')
  })
})
