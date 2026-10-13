import type { FieldHook, TextField } from 'payload'
import { describe, expect, it } from 'vitest'

import { validateHref } from './link'
import { orderUrlField } from './orderUrl'
import { slugField } from './slug'

type Validate = (value: string | null | undefined) => true | string

const validateOf = (field: TextField) => field.validate as unknown as Validate

function runSlugHook(value: unknown, data: Record<string, unknown>) {
  const hook = slugField('name').hooks!.beforeValidate![0] as FieldHook
  return hook({ value, data } as Parameters<FieldHook>[0])
}

describe('slugField', () => {
  it('generates the slug from the name when blank', () => {
    expect(runSlugHook('', { name: 'Kafta Sandwich' })).toBe('kafta-sandwich')
    expect(runSlugHook(undefined, { name: 'Kafta Sandwich' })).toBe('kafta-sandwich')
  })

  it('keeps an edited slug but normalizes it', () => {
    expect(runSlugHook('My Custom Slug', { name: 'Kafta Sandwich' })).toBe('my-custom-slug')
  })

  it('is unique and indexed', () => {
    const field = slugField()
    expect(field.unique).toBe(true)
    expect(field.index).toBe(true)
  })
})

describe('orderUrlField', () => {
  const validate = validateOf(
    orderUrlField({
      name: 'doordashUrl',
      label: 'DoorDash',
      platform: 'doordash',
      description: '',
    }),
  )

  it('allows an empty value', () => {
    expect(validate('')).toBe(true)
    expect(validate(undefined)).toBe(true)
  })

  it('accepts a link on the platform', () => {
    expect(validate('https://www.doordash.com/store/x')).toBe(true)
  })

  it('rejects a link on another host with a helpful message', () => {
    expect(validate('https://www.ubereats.com/store/x')).toMatch(/DoorDash/)
  })
})

describe('validateHref', () => {
  it('accepts site paths and https links', () => {
    expect(validateHref('/menu')).toBe(true)
    expect(validateHref('https://instagram.com/albeik')).toBe(true)
    expect(validateHref('')).toBe(true)
  })

  it('rejects protocol-relative, http and javascript links', () => {
    expect(validateHref('//evil.example')).toEqual(expect.any(String))
    expect(validateHref('http://example.com')).toEqual(expect.any(String))
    expect(validateHref('javascript:alert(1)')).toEqual(expect.any(String))
  })
})
