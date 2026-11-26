import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'artifacts/**'] },
  js.configs.recommended,
  { files: ['tests/browser/*.mjs'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': hooks },
    rules: { ...hooks.configs.recommended.rules }
  }
);
