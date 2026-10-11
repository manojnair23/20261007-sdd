import { defineConfig } from 'vitest/config'

// tsconfig.json excludes test files from the build, so Vitest can't pick up the
// JSX settings for *.test.tsx from it. Set the Hono JSX runtime explicitly.
export default defineConfig({
  oxc: {
    jsx: { runtime: 'automatic', importSource: 'hono/jsx' },
  },
})
