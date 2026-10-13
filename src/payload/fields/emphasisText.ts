import type { TextField } from 'payload'

/** Display text where *asterisks* mark the highlighted words. */
export function emphasisTextField(args: {
  name: string
  label?: string
  required?: boolean
}): TextField {
  return {
    name: args.name,
    label: args.label,
    type: 'text',
    required: args.required,
    admin: {
      description: 'Wrap words in *asterisks* to highlight them, e.g. The recipe is *Lebanese*.',
    },
  }
}
