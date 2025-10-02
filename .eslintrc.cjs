module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier', 'simple-import-sort'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // This must be last
  ],
  env: { node: true, es2021: true, browser: true },
  ignorePatterns: ['dist', 'node_modules', 'packages/**/dist'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-shadow': ['error'],
    curly: 'error',
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'max-statements-per-line': ['error', { max: 1 }],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: true,
        trailingComma: 'all',
        printWidth: 120,
      },
    ],
  },
};
