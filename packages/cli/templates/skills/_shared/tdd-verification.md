## Verification Gate

**Evidence before claims.** If you haven't run the verification command in this response, you cannot claim it passes.

```text
✅ CORRECT                          ❌ WRONG
─────────────────────────────────   ─────────────────────────────────
Run: bun run test                   "Tests should pass now"
Output: ✓ 34/34 tests pass          "I'm confident this works"
Claim: "All tests pass"             "Tests pass" (no output shown)
```

| Claim            | Requires                      | Not Sufficient              |
| ---------------- | ----------------------------- | --------------------------- |
| "Tests pass"     | Fresh test output: 0 failures | "should pass", previous run |
| "Build succeeds" | Build command: exit 0         | "linter passed"             |
| "Bug fixed"      | Original symptom test passes  | "code changed"              |

## Anti-Pattern: Mock Implementations

Don't hardcode values to pass tests:

```typescript
// ❌ BAD - Hardcoded to pass test
function calculateDiscount(amount, tier) {
  return 80; // Passes test but isn't real
}

// ✅ GOOD - Actual logic
function calculateDiscount(amount, tier) {
  if (tier === 'VIP') return amount * 0.8;
  return amount;
}
```

Fix mocks immediately. The next test cycle will catch them, but they're technical debt.
