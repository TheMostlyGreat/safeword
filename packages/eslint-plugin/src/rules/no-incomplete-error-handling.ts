/**
 * Rule: no-incomplete-error-handling
 *
 * Detects catch blocks that log an error but don't rethrow or return,
 * which swallows the error silently. This is a common LLM mistake.
 *
 * Bad:
 *   catch (error) { console.error(error); }  // swallowed!
 *
 * Good:
 *   catch (error) { console.error(error); throw error; }
 *   catch (error) { console.error(error); return null; }
 *   catch (error) { throw new AppError('context', { cause: error }); }
 */

/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional, @typescript-eslint/no-unnecessary-condition, jsdoc/require-returns, jsdoc/require-param-description */

import type { Rule } from 'eslint';
import type { CallExpression, CatchClause, Statement } from 'estree';

const LOG_METHODS = new Set(['log', 'error', 'warn', 'info', 'debug', 'trace']);

const LOG_OBJECTS = new Set(['console', 'logger', 'log']);

/**
 * Checks if a call expression is a logging call (console.log, logger.error, etc.)
 * @param node
 */
function isLoggingCall(node: CallExpression): boolean {
  const { callee } = node;

  // console.error(...), logger.error(...), etc.
  if (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.property.type === 'Identifier'
  ) {
    const obj = callee.object.name.toLowerCase();
    const method = callee.property.name.toLowerCase();
    return LOG_OBJECTS.has(obj) && LOG_METHODS.has(method);
  }

  return false;
}

/**
 * Checks if statements include a throw or return (error is properly handled)
 * @param statements
 */
function hasTerminatingStatement(statements: Statement[]): boolean {
  for (const stmt of statements) {
    switch (stmt.type) {
      case 'ThrowStatement':
      case 'ReturnStatement': {
        return true;
      }

      case 'IfStatement': {
        // Both branches must terminate
        const consequentTerminates =
          stmt.consequent.type === 'BlockStatement'
            ? hasTerminatingStatement(stmt.consequent.body)
            : stmt.consequent.type === 'ThrowStatement' ||
              stmt.consequent.type === 'ReturnStatement';

        const alternateTerminates = stmt.alternate
          ? stmt.alternate.type === 'BlockStatement'
            ? hasTerminatingStatement(stmt.alternate.body)
            : stmt.alternate.type === 'ThrowStatement' || stmt.alternate.type === 'ReturnStatement'
          : false;

        if (consequentTerminates && alternateTerminates) {
          return true;
        }
        break;
      }
    }
  }
  return false;
}

/**
 * Recursively checks if statements include a logging call (searches nested blocks)
 * @param statements
 */
function containsLoggingCall(statements: Statement[]): boolean {
  for (const stmt of statements) {
    // Direct logging call
    if (
      stmt.type === 'ExpressionStatement' &&
      stmt.expression.type === 'CallExpression' &&
      isLoggingCall(stmt.expression)
    ) {
      return true;
    }

    // Check nested blocks
    if (stmt.type === 'IfStatement') {
      if (containsLoggingCall([stmt.consequent])) {
        return true;
      }
      if (stmt.alternate && containsLoggingCall([stmt.alternate])) {
        return true;
      }
    }

    if (stmt.type === 'BlockStatement' && containsLoggingCall(stmt.body)) {
      return true;
    }
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow catch blocks that log but do not rethrow or return',
      recommended: true,
    },
    messages: {
      incompleteErrorHandling:
        'Catch block logs error but does not rethrow or return. This swallows the error silently.',
    },
    schema: [],
  },

  create(context) {
    return {
      CatchClause(node: CatchClause) {
        const { body } = node;
        if (body.type !== 'BlockStatement') return;

        const statements = body.body;

        // Only flag if there's a logging call but no terminating statement
        if (containsLoggingCall(statements) && !hasTerminatingStatement(statements)) {
          context.report({
            node,
            messageId: 'incompleteErrorHandling',
          });
        }
      },
    };
  },
};

export default rule;
