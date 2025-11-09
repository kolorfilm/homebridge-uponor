import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['dist/**'],
  },
  
  // Base ESLint recommended config
  eslint.configs.recommended,
  
  // TypeScript ESLint recommended configs
  ...tseslint.configs.recommended,
  
  // Custom rules
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@stylistic': stylistic,
    },
    rules: {
      'quotes': ['warn', 'single'],
      'indent': ['warn', 2, { 'SwitchCase': 1 }],
      'semi': ['off'],
      'comma-dangle': ['warn', 'always-multiline'],
      'dot-notation': 'off',
      'eqeqeq': 'warn',
      'curly': ['warn', 'all'],
      'brace-style': ['warn'],
      'prefer-arrow-callback': ['warn'],
      'max-len': ['warn', 140],
      'no-console': ['warn'], // use the provided Homebridge log method instead
      'comma-spacing': ['error'],
      'no-multi-spaces': ['warn', { 'ignoreEOLComments': true }],
      'no-trailing-spaces': ['warn'],
      'lines-between-class-members': ['warn', 'always', { 'exceptAfterSingleLine': true }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@stylistic/semi': ['warn'],
      '@stylistic/member-delimiter-style': ['warn'],
    },
  },
);

