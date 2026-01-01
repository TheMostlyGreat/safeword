import { RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';

import rule from '../no-re-export-all.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
});

describe('no-re-export-all', () => {
  it('should pass RuleTester tests', () => {
    expect(() => {
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
    }).not.toThrow();
  });
});
