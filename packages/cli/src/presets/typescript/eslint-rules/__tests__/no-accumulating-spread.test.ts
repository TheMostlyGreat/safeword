import { RuleTester } from "eslint";
import { describe, expect, it } from "vitest";

import rule from "../no-accumulating-spread.js";

const ruleTester = new RuleTester();

describe("no-accumulating-spread", () => {
  it("should pass RuleTester tests", () => {
    expect(() => {
      ruleTester.run("no-accumulating-spread", rule, {
        valid: [
          // Mutation instead of spread (correct pattern)
          "items.reduce((acc, item) => { acc[item.id] = item; return acc; }, {})",
          "items.reduce((acc, item) => { acc.push(item); return acc; }, [])",

          // No spread at all
          "items.reduce((acc, item) => acc + item, 0)",
          "items.reduce((acc, item) => acc.concat(item), [])",

          // Spreading something other than accumulator
          "items.reduce((acc, item) => ({ ...item, processed: true }), {})",
          "items.reduce((acc, item) => [...item.values], [])",

          // Different variable name not matching accumulator
          "items.reduce((result, item) => ({ ...acc, [item.id]: item }), {})",

          // Not a reduce call
          "items.map(item => ({ ...acc, [item.id]: item }))",
          "someReduce((acc, item) => ({ ...acc, [item.id]: item }), {})",

          // Spread in nested function (not the reduce callback)
          "items.reduce((acc, item) => { const fn = () => ({ ...acc }); return acc; }, {})",

          // export * as namespace is fine (different AST node)
          "export * as utils from './utils'",
        ],

        invalid: [
          // Classic O(n²) object spread
          {
            code: "items.reduce((acc, item) => ({ ...acc, [item.id]: item }), {})",
            errors: [{ messageId: "accumulatingSpread" }],
          },

          // Classic O(n²) array spread
          {
            code: "items.reduce((acc, item) => [...acc, item], [])",
            errors: [{ messageId: "accumulatingSpread" }],
          },

          // With explicit return
          {
            code: "items.reduce((acc, item) => { return { ...acc, [item.id]: item }; }, {})",
            errors: [{ messageId: "accumulatingSpread" }],
          },

          // Conditional with spread
          {
            code: "items.reduce((acc, item) => item.valid ? { ...acc, [item.id]: item } : acc, {})",
            errors: [{ messageId: "accumulatingSpread" }],
          },

          // Different accumulator name
          {
            code: "items.reduce((result, item) => ({ ...result, [item.id]: item }), {})",
            errors: [{ messageId: "accumulatingSpread" }],
          },

          // Function expression callback
          {
            code: "items.reduce(function(acc, item) { return { ...acc, [item.id]: item }; }, {})",
            errors: [{ messageId: "accumulatingSpread" }],
          },

          // Logical OR with spread
          {
            code: "items.reduce((acc, item) => item || { ...acc, [item.id]: item }, {})",
            errors: [{ messageId: "accumulatingSpread" }],
          },
        ],
      });
    }).not.toThrow();
  });
});
