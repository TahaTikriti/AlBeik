import { draftMode } from 'next/headers'

import type { LoadOptions } from '.'

/** Load options for the current request: drafts only while draft mode is on. */
export async function loadOptions(): Promise<LoadOptions> {
  return { draft: (await draftMode()).isEnabled }
}
