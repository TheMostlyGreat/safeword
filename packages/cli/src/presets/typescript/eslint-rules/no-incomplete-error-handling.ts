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

import type { Rule } from "eslint";
import type { CallExpression, CatchClause, Statement } from "estree";

const LOG_METHODS = new Set(["log", "error", "warn", "info", "debug", "trace"]);

const LOG_OBJECTS = new Set(["console", "logger", "log"]);

/**
 * Checks if a call expression is a logging call (console.log, logger.error, etc.)
 * @param node
 */
function isLoggingCall(node: CallExpression): boolean {
  const { callee } = node;

  // console.error(...), logger.error(...), etc.
  if (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    callee.property.type === "Identifier"
  ) {
    const object = callee.object.name.toLowerCase();
    const method = callee.property.name.toLowerCase();
    return LOG_OBJECTS.has(object) && LOG_METHODS.has(method);
  }

  return false;
}

/**
 * Check if a single statement terminates control flow.
 */
function isTerminatingBranch(stmt: Statement): boolean {
  if (stmt.type === "ThrowStatement" || stmt.type === "ReturnStatement") {
    return true;
  }
  if (stmt.type === "BlockStatement") {
    return hasTerminatingStatement(stmt.body);
  }
  return false;
}

/**
 * Check if an if statement terminates (both branches must terminate).
 */
function ifStatementTerminates(
  stmt: Statement & { type: "IfStatement" },
): boolean {
  const consequentTerminates = isTerminatingBranch(stmt.consequent);
  const alternateTerminates = stmt.alternate
    ? isTerminatingBranch(stmt.alternate)
    : false;
  return consequentTerminates && alternateTerminates;
}

/**
 * Checks if statements include a throw or return (error is properly handled)
 * @param statements
 */
function hasTerminatingStatement(statements: Statement[]): boolean {
  for (const stmt of statements) {
    if (stmt.type === "ThrowStatement" || stmt.type === "ReturnStatement") {
      return true;
    }
    if (stmt.type === "IfStatement" && ifStatementTerminates(stmt)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a single statement is a logging call.
 */
function isLoggingStatement(stmt: Statement): boolean {
  return (
    stmt.type === "ExpressionStatement" &&
    stmt.expression.type === "CallExpression" &&
    isLoggingCall(stmt.expression)
  );
}

/**
 * Get nested statements from a statement (for recursive search).
 */
function getNestedStatements(stmt: Statement): Statement[] {
  if (stmt.type === "BlockStatement") {
    return stmt.body;
  }
  if (stmt.type === "IfStatement") {
    const nested = [stmt.consequent];
    if (stmt.alternate) nested.push(stmt.alternate);
    return nested;
  }
  return [];
}

/**
 * Recursively checks if statements include a logging call (searches nested blocks)
 * @param statements
 */
function containsLoggingCall(statements: Statement[]): boolean {
  for (const stmt of statements) {
    if (isLoggingStatement(stmt)) return true;

    const nested = getNestedStatements(stmt);
    if (nested.length > 0 && containsLoggingCall(nested)) return true;
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow catch blocks that log but do not rethrow or return",
      recommended: true,
    },
    messages: {
      incompleteErrorHandling:
        "Catch block logs error but does not rethrow or return. This swallows the error silently.",
    },
    schema: [],
  },

  create(context) {
    return {
      CatchClause(node: CatchClause) {
        const { body } = node;
        if (body.type !== "BlockStatement") return;

        const statements = body.body;

        // Only flag if there's a logging call but no terminating statement
        if (
          containsLoggingCall(statements) &&
          !hasTerminatingStatement(statements)
        ) {
          context.report({
            node,
            messageId: "incompleteErrorHandling",
          });
        }
      },
    };
  },
};

export default rule;
