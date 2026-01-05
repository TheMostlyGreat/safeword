/**
 * Rule: no-re-export-all
 *
 * Disallows `export * from` statements which re-export all exports from
 * another module. This pattern hurts tree-shaking and makes dependencies
 * unclear. LLMs often use this for convenience without understanding
 * the bundle size implications.
 *
 * Bad:
 *   export * from './utils';
 *   export * from '@/components';
 *
 * Good:
 *   export { foo, bar } from './utils';
 *   export { Button, Modal } from '@/components';
 *
 * Note: `export * as namespace from` is allowed as it creates a named export.
 */

import type { Rule } from "eslint";
import type { ExportAllDeclaration } from "estree";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow wildcard re-exports (export * from)",
      recommended: true,
    },
    messages: {
      noReExportAll:
        "Avoid `export * from`. Use named exports for better tree-shaking and clearer dependencies.",
    },
    schema: [],
  },

  create(context) {
    return {
      ExportAllDeclaration(node: ExportAllDeclaration) {
        // Allow `export * as namespace from` - this creates a named export
        if (node.exported) {
          return;
        }

        context.report({
          node,
          messageId: "noReExportAll",
        });
      },
    };
  },
};

export default rule;
