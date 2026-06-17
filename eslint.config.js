const { FlatCompat } = require('@eslint/eslintrc')
const path = require('path')

const compat = new FlatCompat({
  baseDirectory: __dirname
})

module.exports = [
  ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended'),
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**', 'coverage/**']
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  }
]