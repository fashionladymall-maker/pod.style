const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  {
    ignores: [
      '.next/**',
      'dist/**',
      'out/**',
      'build/**',
      'coverage/**',
      'augment/specs/**',
      'simpleshop/**',
      'src/components/omg/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['tailwind.config.ts', '**/*.config.ts', '**/*.config.mts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  ...compat.config({
    overrides: [
      {
        files: ['src/dataconnect-generated/**/*.js'],
        rules: {
          '@typescript-eslint/no-require-imports': 'off',
        },
      },
    ],
  }),
];
