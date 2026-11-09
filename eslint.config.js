import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import security from 'eslint-plugin-security';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    }
  },
  {
    // Security lint (RBX engineering guardrail 2). Every finding is an error:
    // fix it, or disable it at the line with the reason after `--`.
    // `svelte/no-at-html-tags` belongs to this set and comes from
    // flat/recommended.
    plugins: { security },
    rules: {
      ...Object.fromEntries(
        Object.keys(security.configs.recommended.rules).map((rule) => [rule, 'error'])
      ),
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'svelte/no-target-blank': 'error'
    }
  },
  {
    // Tests and operator tooling: they read repository files by computed path,
    // match repository data, and evaluate the repository's own transpiled
    // modules. None of it handles requests.
    files: ['scripts/**'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-unsafe-regex': 'off',
      'no-new-func': 'off'
    }
  },
  {
    ignores: ['build/', '.svelte-kit/', 'node_modules/', 'docker/']
  }
);
