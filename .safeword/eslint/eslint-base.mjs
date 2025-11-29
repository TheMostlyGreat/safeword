////////////////////////////////////////////////////////////////////////////////
//
//  ██████╗  ██████╗     ███╗   ██╗ ██████╗ ████████╗    ███████╗██████╗ ██╗████████╗
//  ██╔══██╗██╔═══██╗    ████╗  ██║██╔═══██╗╚══██╔══╝    ██╔════╝██╔══██╗██║╚══██╔══╝
//  ██║  ██║██║   ██║    ██╔██╗ ██║██║   ██║   ██║       █████╗  ██║  ██║██║   ██║
//  ██║  ██║██║   ██║    ██║╚██╗██║██║   ██║   ██║       ██╔══╝  ██║  ██║██║   ██║
//  ██████╔╝╚██████╔╝    ██║ ╚████║╚██████╔╝   ██║       ███████╗██████╔╝██║   ██║
//  ╚═════╝  ╚═════╝     ╚═╝  ╚═══╝ ╚═════╝    ╚═╝       ╚══════╝╚═════╝ ╚═╝   ╚═╝
//
//  AUTO-GENERATED FILE - DO NOT EDIT
//
//  This file is regenerated every time you run:
//    bash setup-linting.sh
//
//  To customize ESLint rules, edit eslint.config.mjs instead.
//  Your customizations there are preserved across regenerations.
//
////////////////////////////////////////////////////////////////////////////////

import { globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import sonarjs from 'eslint-plugin-sonarjs';
import sdl from '@microsoft/eslint-plugin-sdl';
import boundaries from 'eslint-plugin-boundaries';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  globalIgnores([
    '**/node_modules/', '**/dist/', '**/build/', '**/.next/', '**/coverage/',
    '**/*.min.js', '**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml',
  ]),

  // Base JavaScript
  {
    name: 'safeword/base-js',
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.es2025 },
    },
  },

  // Code quality (SonarJS)
  {
    name: 'safeword/sonarjs',
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { sonarjs },
    rules: sonarjs.configs.recommended.rules,
  },

  // Security (Microsoft SDL)
  {
    name: 'safeword/security',
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { '@microsoft/sdl': sdl },
    rules: {
      '@microsoft/sdl/no-insecure-url': 'error',
      '@microsoft/sdl/no-inner-html': 'error',
      '@microsoft/sdl/no-document-write': 'error',
      '@microsoft/sdl/no-html-method': 'error',
      '@microsoft/sdl/no-insecure-random': 'error',
      '@microsoft/sdl/no-postmessage-star-origin': 'error',
    },
  },

  // Architecture boundaries (default layers - customize in eslint.config.mjs)
  {
    name: 'safeword/boundaries',
    files: ['src/**/*.{js,mjs,cjs,ts,tsx,jsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**/*' },
        { type: 'domain', pattern: 'src/domain/**/*' },
        { type: 'infra', pattern: 'src/infra/**/*' },
        { type: 'shared', pattern: 'src/shared/**/*' },
      ],
    },
    rules: {
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: 'app', allow: ['domain', 'infra', 'shared'] },
          { from: 'domain', allow: ['shared'] },
          { from: 'infra', allow: ['domain', 'shared'] },
          { from: 'shared', allow: [] },
        ],
      }],
    },
  },

  // Prettier (must be last in base)
  {
    name: 'safeword/prettier',
    ...prettier,
  },
];
