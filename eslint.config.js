import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Esta regra é bem opinativa e gera falsos-positivos no padrão do app (ex.: inicialização de forms ao abrir modais).
      'react-hooks/set-state-in-effect': 'off',
      // Estas regras estão ligadas ao React Compiler e acabam bloqueando o lint em código existente.
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
      // Mantemos o Vite/React Refresh, mas sem bloquear o lint por exports auxiliares.
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
])
