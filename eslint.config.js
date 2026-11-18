import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Layers that must not touch the browser directly (CLAUDE.md: services own the microphone,
// network and storage; docs/mimari.md: domain is pure).
// The microphone, the network and storage, and the global objects that reach them
// (`globalThis.fetch` would otherwise slip through). Only src/services may use them.
const browserApis = [
  'window',
  'self',
  'globalThis',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'caches',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'AudioContext',
  'MediaRecorder',
  'Audio',
  'Image',
  'Worker',
].map((name) => ({
  name,
  message: 'This layer does not touch browser APIs; go through an interface in src/services.',
}));

export default defineConfig([
  globalIgnores([
    'dist/',
    'dist-e2e/',
    'dist-trial/',
    'coverage/',
    'shots/',
    'test-results/',
    'playwright-report/',
    'blob-report/',
    '.superpowers/',
    'design/',
    'seed/',
  ]),

  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: {
      // Turkish casing only (CLAUDE.md): use toUpperTr / toLowerTr from src/domain/text.ts.
      'no-restricted-properties': [
        'error',
        {
          property: 'toUpperCase',
          message: 'Use toUpperTr from src/domain/text.ts (tr-TR casing).',
        },
        {
          property: 'toLowerCase',
          message: 'Use toLowerTr from src/domain/text.ts (tr-TR casing).',
        },
      ],
    },
  },

  {
    files: ['src/**/*.tsx'],
    extends: [jsxA11y.flatConfigs.recommended],
  },

  {
    // UI text lives only in src/i18n/tr.ts. The dev showcase lists code names; tests may use literals.
    files: ['src/**/*.tsx'],
    ignores: ['src/features/dev/**', 'src/**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXText[value=/\\S/]',
          message: 'UI text lives in src/i18n/tr.ts; pass it in through props.',
        },
        {
          selector:
            'JSXAttribute[name.name=/^(aria-label|alt|title|placeholder)$/] > Literal[value=/\\S/]',
          message: 'Accessible names and labels come from src/i18n/tr.ts.',
        },
      ],
    },
  },

  {
    files: ['src/domain/**/*.ts'],
    ignores: ['src/domain/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { regex: '^(?!\\./)', message: 'src/domain imports only its own modules (./...).' },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Domain functions receive today as a parameter (docs/mimari.md, "Zaman").',
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Domain functions receive today as a parameter (docs/mimari.md, "Zaman").',
        },
      ],
    },
  },

  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)(features|app|services|i18n)(/|$)',
              message: 'Components know only styles and domain types; pass text in through props.',
            },
          ],
        },
      ],
    },
  },

  {
    files: [
      'src/domain/**/*.ts',
      'src/components/**/*.{ts,tsx}',
      'src/features/**/*.{ts,tsx}',
      'src/app/**/*.{ts,tsx}',
    ],
    ignores: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    rules: {
      'no-restricted-globals': ['error', ...browserApis],
    },
  },
]);
