/**
 * Tests for no-re-export-all ESLint rule
 *
 * This rule disallows `export * from 'module'` patterns because they
 * hurt tree-shaking and make it unclear what's being exported.
 * Use `export { specific, names }` or `export * as namespace` instead.
 */

import { RuleTester } from 'eslint';

import rule from '../no-re-export-all.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

// RuleTester.run creates its own describe/it blocks internally
// so we call it at the top level, not inside an it() block
ruleTester.run('no-re-export-all', rule, {
  valid: [
    // Named exports (preferred pattern)
    "export { foo, bar } from './utils'",
    "export { default as Utils } from './utils'",
    "export { Button, Modal, Input } from '@/components'",

    // Namespace re-export (creates named export, OK)
    "export * as utils from './utils'",
    "export * as components from '@/components'",

    // Regular exports
    'export const foo = 1',
    'export function bar() {}',
    'export default class Foo {}',
  ],

  invalid: [
    // Wildcard re-export
    {
      code: "export * from './utils'",
      errors: [{ messageId: 'noReExportAll' }],
    },

    // From package
    {
      code: "export * from '@/components'",
      errors: [{ messageId: 'noReExportAll' }],
    },

    // From node_modules
    {
      code: "export * from 'lodash'",
      errors: [{ messageId: 'noReExportAll' }],
    },

    // Multiple wildcards
    {
      code: "export * from './a'; export * from './b'",
      errors: [{ messageId: 'noReExportAll' }, { messageId: 'noReExportAll' }],
    },
  ],
});
