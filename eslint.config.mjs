import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'

const boundaryMessage =
  'Presentation code (components, views, theme) receives view models as props. ' +
  'Load data in src/lib/data from a page.tsx instead. See README "Presentation boundary".'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // The presentation boundary: POC branches rewrite these folders freely,
    // so they must not reach into the CMS or the data loaders.
    files: ['src/components/**', 'src/views/**', 'src/theme/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'payload', message: boundaryMessage },
            { name: '@payload-config', message: boundaryMessage },
            { name: '@/payload-types', message: boundaryMessage },
          ],
          patterns: [
            { group: ['payload/*', '@/payload/*'], message: boundaryMessage },
            {
              group: ['@/lib/data', '@/lib/data/*'],
              message: boundaryMessage,
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'src/payload-types.ts',
    'src/migrations/**',
    'src/app/(payload)/**',
  ]),
])
