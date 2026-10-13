import type { NumberField } from 'payload'

export const sortOrderField: NumberField = {
  name: 'sortOrder',
  type: 'number',
  defaultValue: 0,
  admin: {
    position: 'sidebar',
    description: 'Lower numbers come first.',
  },
}
