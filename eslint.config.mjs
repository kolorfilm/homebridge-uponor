import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import vitestPlugin from '@vitest/eslint-plugin';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{ts}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2020,
        ...vitestPlugin.environments.env.globals,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
      '@vitest': vitestPlugin,
    },
    rules: {
      curly: 'error',
      'object-curly-spacing': ['error', 'always'],
      'object-shorthand': ['warn', 'properties'],
      'max-len': ['warn', 140],
      'no-console': ['warn'], // use the provided Homebridge log method instead
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
      'import/namespace': 'warn',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', ['sibling', 'parent'], 'index'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    ignores: ['dist/**'],
  }
);
