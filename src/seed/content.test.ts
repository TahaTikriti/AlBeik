import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

import * as content from './content'

const imagesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'images')
const allText = JSON.stringify(content)

describe('seed content', () => {
  it('has none of the live-site typos the brief lists', () => {
    expect(allText).not.toMatch(/\bhala\b/i)
    expect(allText).not.toMatch(/commited/i)
    expect(allText).not.toMatch(/smashed smashed/i)
    expect(allText).not.toMatch(/Ribe-eye/)
    expect(allText).not.toMatch(/Kansas city/)
  })

  it('has balanced parentheses in every description (no stray ")")', () => {
    for (const item of content.menuItems) {
      const opens = item.description.split('(').length
      const closes = item.description.split(')').length
      expect(closes, item.name).toBe(opens)
    }
  })

  it('spells the brand AlBeik in item names', () => {
    expect(
      content.menuItems.filter((i) => /albeik/i.test(i.name) && !i.name.includes('AlBeik')),
    ).toEqual([])
  })

  it('has unique item names in known categories', () => {
    const names = content.menuItems.map((i) => i.name)
    expect(new Set(names).size).toBe(names.length)
    const categories = new Set(content.categories.map((c) => c.name))
    expect(content.menuItems.filter((i) => !categories.has(i.category))).toEqual([])
  })

  it('features items that exist', () => {
    const names = new Set(content.menuItems.map((i) => i.name))
    expect(content.homepage.featured.filter((n) => !names.has(n))).toEqual([])
  })

  it('ships every image it references', () => {
    const files = [
      ...content.menuItems.map((i) => i.image.file),
      ...Object.values(content.images).map((i) => i.file),
    ]
    expect(files.filter((f) => !fs.existsSync(path.join(imagesDir, f)))).toEqual([])
  })

  it('does not seed prices or invented contact details', () => {
    expect(allText).not.toMatch(/"price"/)
    expect(allText).not.toMatch(/"phone"|"streetAddress"|"doordashStoreUrl"|"uberEatsStoreUrl"/)
  })
})
