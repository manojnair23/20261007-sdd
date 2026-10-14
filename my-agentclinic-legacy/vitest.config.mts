import { defineConfig } from 'vitest/config'

// Set the Hono JSX runtime explicitly so *.test.tsx files compile the same way
// as the app, without relying on Vitest reading JSX settings from tsconfig.
export default defineConfig({
  oxc: {
    jsx: { runtime: 'automatic', importSource: 'hono/jsx' },
  },
})
