/**
 * Tests for no-incomplete-error-handling ESLint rule
 *
 * This rule detects catch blocks that log errors but don't terminate
 * execution (throw, return, or process.exit). This is a common LLM pattern
 * that silently swallows errors.
 */

import { RuleTester } from 'eslint';

import rule from '../no-incomplete-error-handling.js';

const ruleTester = new RuleTester();

/**
 * Helper to wrap code in a function for valid return statements
 */
const fn = (code: string) => `function test() { ${code} }`;

// RuleTester.run creates its own describe/it blocks internally
// so we call it at the top level, not inside an it() block
ruleTester.run('no-incomplete-error-handling', rule, {
  valid: [
    // Empty catch - not flagged (no logging)
    'try { foo(); } catch (e) {}',

    // Rethrow after log
    'try { foo(); } catch (e) { console.error(e); throw e; }',

    // Return after log (inside function)
    fn('try { foo(); } catch (e) { console.error(e); return null; }'),

    // Return before log (terminates early)
    fn('try { foo(); } catch (e) { return console.error(e); }'),

    // Wrap and rethrow
    'try { foo(); } catch (e) { console.error(e); throw new Error("wrapped", { cause: e }); }',

    // Log with conditional rethrow (both branches terminate)
    fn(`try { foo(); } catch (e) {
          console.error(e);
          if (e instanceof TypeError) {
            throw e;
          } else {
            return null;
          }
        }`),

    // No logging - any handling is fine
    'try { foo(); } catch (e) { handleError(e); }',

    // Logger object variants
    'try { foo(); } catch (e) { logger.error(e); throw e; }',
    fn('try { foo(); } catch (e) { log.warn(e); return false; }'),

    // Logging different methods
    'try { foo(); } catch (e) { console.warn(e); throw e; }',
    'try { foo(); } catch (e) { console.log(e); throw e; }',
    'try { foo(); } catch (e) { console.debug(e); throw e; }',
    fn('try { foo(); } catch (e) { console.info(e); return; }'),
    fn('try { foo(); } catch (e) { console.trace(e); return; }'),
  ],

  invalid: [
    // Classic LLM mistake: log and continue
    {
      code: 'try { foo(); } catch (e) { console.error(e); }',
      errors: [{ messageId: 'incompleteErrorHandling' }],
    },

    // Log with other statements but no termination
    {
      code: 'try { foo(); } catch (e) { console.error(e); doSomething(); }',
      errors: [{ messageId: 'incompleteErrorHandling' }],
    },

    // Logger object
    {
      code: 'try { foo(); } catch (e) { logger.error(e); }',
      errors: [{ messageId: 'incompleteErrorHandling' }],
    },

    // Console.log (not just error)
    {
      code: 'try { foo(); } catch (e) { console.log(e); }',
      errors: [{ messageId: 'incompleteErrorHandling' }],
    },

    // Conditional that doesn't terminate in both branches
    {
      code: fn(`try { foo(); } catch (e) {
            console.error(e);
            if (e instanceof TypeError) {
              throw e;
            }
          }`),
      errors: [{ messageId: 'incompleteErrorHandling' }],
    },

    // Nested logging in if block (no termination)
    {
      code: `try { foo(); } catch (e) {
            if (debug) {
              console.error(e);
            }
          }`,
      errors: [{ messageId: 'incompleteErrorHandling' }],
    },

    // Braceless if with logging
    {
      code: 'try { foo(); } catch (e) { if (debug) console.error(e); }',
      errors: [{ messageId: 'incompleteErrorHandling' }],
    },
  ],
});
