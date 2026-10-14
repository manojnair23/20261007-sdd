import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

// ESLint is for correctness only; eslint-config-prettier turns off every rule that Prettier owns.
export default defineConfig(
  { ignores: ['dist/', 'data/', 'node_modules/', 'src/db/__fixtures__/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  prettier,
)
