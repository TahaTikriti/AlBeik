import type { TextField } from 'payload'

import { slugify } from '@/lib/text'

/** URL slug, generated from `source` when left blank. Unique per collection. */
export function slugField(source = 'name'): TextField {
  return {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: `Used in the page URL. Leave blank to generate it from the ${source}.`,
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          const edited = typeof value === 'string' ? slugify(value) : ''
          if (edited) return edited
          const fromSource = data?.[source]
          return typeof fromSource === 'string' ? slugify(fromSource) : value
        },
      ],
    },
  }
}
