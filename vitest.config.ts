import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'

const src = (p = '') => fileURLToPath(new URL(`./src/${p}`, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@payload-config': src('payload.config.ts'),
      '@': src(),
    },
  },
  test: {
    environment: 'node',
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.int.test.ts'],
        },
      },
      {
        // Integration tests run Payload against a throwaway database
        // (created by docker/initdb). Requires `pnpm db:up`.
        extends: true,
        test: {
          name: 'int',
          include: ['src/**/*.int.test.ts'],
          env: {
            DATABASE_URL:
              process.env.TEST_DATABASE_URL ??
              'postgres://albeik:albeik@localhost:5433/albeik_test',
            PAYLOAD_SECRET: 'integration-test-secret',
          },
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
})
