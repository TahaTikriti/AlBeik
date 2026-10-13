import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

export function RichText({ data, className }: { data: SerializedEditorState; className?: string }) {
  return <LexicalRichText data={data} className={className} />
}
