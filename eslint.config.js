const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const security = require('eslint-plugin-security');
const importPlugin = require('eslint-plugin-import');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      'node_modules',
      'dist',
      'build',
      'coverage',
      '.nyc_output',
      'uploads',
      'prisma/migrations',
      '*.log',
      'eslint.config.js',
      'prettier.config.js',
      'scripts/**/*',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      security,
      import: importPlugin,
    },
    rules: {
      // Security & Type Safety (ERRORS - MUST FIX)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-throw-literal': 'error',
      'no-promise-executor-return': 'error',

      // TypeScript Strict Mode
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Imports Organization
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
      'import/no-cycle': 'error',
      'no-duplicate-imports': 'error',

      // Security Plugins
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
  prettier,
];
