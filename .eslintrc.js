module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module',
  },
  extends: ['prettier', 'plugin:jest/recommended'],
  plugins: ['markdown', 'json', 'prettier', 'jest'],
  env: {
    es6: true,
    node: true,
    browser: false,
  },
  rules: {
    'sort-imports': ['error', { memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple'], ignoreCase: true }],
    quotes: 'off',

    'prettier/prettier': ['error', { singleQuote: true, printWidth: 120 }],

    'jest/consistent-test-it': ['error', { fn: 'test' }],
    'jest/no-test-prefixes': 'error',
    'jest/valid-describe': 'error',
    'jest/valid-expect-in-promise': 'error',
  },
};
