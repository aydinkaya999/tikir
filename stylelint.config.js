// Fixed values for colour, font, radius and shadow live only in the token files
// (CLAUDE.md "Stil"; docs/planlar/faz-0.md decision 3). Everything else uses var(--...).
const onlyVars = '/^var\\(--[\\w-]+\\)(\\s*,\\s*var\\(--[\\w-]+\\))*$/';
const varsOrZero = '/^(var\\(--[\\w-]+\\)|0)(\\s+(var\\(--[\\w-]+\\)|0))*$/';
const colorProperties =
  '/^(color|background-color|border-color|border-(top|right|bottom|left)-color|outline-color|text-decoration-color|caret-color|accent-color|fill|stroke)$/';

/** @type {import('stylelint').Config} */
export default {
  ignoreFiles: ['dist/**', 'dist-e2e/**', 'coverage/**', 'node_modules/**', 'design/**'],
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      'rgb',
      'rgba',
      'hsl',
      'hsla',
      'hwb',
      'lab',
      'lch',
      'oklab',
      'oklch',
      'color',
      'color-mix',
    ],
    'declaration-property-value-allowed-list': {
      [colorProperties]: [onlyVars, 'inherit', 'currentColor', 'currentcolor', 'transparent'],
      background: [onlyVars, 'none', 'transparent', 'inherit'],
      font: ['inherit'],
      'font-size': [onlyVars, 'inherit', '1em', '100%'],
      'font-family': [onlyVars, 'inherit'],
      'font-weight': [onlyVars, 'inherit'],
      'border-radius': [varsOrZero, '50%', 'inherit'],
      'box-shadow': [onlyVars, 'none'],
    },
    'declaration-property-value-disallowed-list': {
      'text-transform': ['uppercase'],
    },
  },
  overrides: [
    {
      // Token files define the values; fonts.css holds only @font-face descriptors.
      files: ['src/styles/tokens.css', 'src/styles/tokens-extra.css', 'src/styles/fonts.css'],
      rules: {
        'color-no-hex': null,
        'function-disallowed-list': null,
        'declaration-property-value-allowed-list': null,
      },
    },
  ],
};
