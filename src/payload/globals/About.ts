import {
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
} from '@payloadcms/richtext-lexical'
import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateSite } from '../hooks/revalidateSite'
import { emphasisTextField } from '../fields/emphasisText'

export const aboutEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const About: GlobalConfig = {
  slug: 'about',
  label: 'About page',
  access: { read: anyone, update: authenticated },
  hooks: {
    afterChange: [revalidateSite.globalAfterChange],
  },
  fields: [
    emphasisTextField({ name: 'headline' }),
    { name: 'body', type: 'richText', editor: aboutEditor },
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          filterOptions: { mimeType: { contains: 'image' } },
        },
      ],
    },
  ],
}
