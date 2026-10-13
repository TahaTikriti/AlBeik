import { describe, expect, it } from 'vitest'

import { isSafeRedirectPath, previewUrl } from '.'

describe('previewUrl', () => {
  it('points the admin at the draft-mode route with the path and secret', () => {
    expect(previewUrl('/menu/kafta-sandwich', 's3cret')).toBe(
      '/next/preview?path=%2Fmenu%2Fkafta-sandwich&previewSecret=s3cret',
    )
  })
})

describe('isSafeRedirectPath', () => {
  it('accepts site paths', () => {
    expect(isSafeRedirectPath('/')).toBe(true)
    expect(isSafeRedirectPath('/menu/kafta-sandwich')).toBe(true)
    expect(isSafeRedirectPath('/menu#sandwiches')).toBe(true)
  })

  it('rejects anything that could leave the site', () => {
    expect(isSafeRedirectPath('https://evil.example')).toBe(false)
    expect(isSafeRedirectPath('//evil.example')).toBe(false)
    expect(isSafeRedirectPath('/\\evil.example')).toBe(false)
    expect(isSafeRedirectPath('javascript:alert(1)')).toBe(false)
    expect(isSafeRedirectPath('')).toBe(false)
    expect(isSafeRedirectPath(null)).toBe(false)
  })
})
