# eslint-plugin-react-hooks

- **Version**: Latest 7.0.1 (dynamically imported when React detected)
- **Preset**: `recommended` rules
- **Gotcha**: None - preset uses appropriate severities
- **LLM-critical rules**: `rules-of-hooks` at error (critical for correctness)
- **Overrides**: None needed

## Why This Plugin Matters for LLMs

LLMs frequently violate React's Rules of Hooks:

| LLM Behavior                      | Rule That Catches It |
| --------------------------------- | -------------------- |
| Calls hooks inside conditions     | `rules-of-hooks`     |
| Calls hooks inside loops          | `rules-of-hooks`     |
| Calls hooks in regular functions  | `rules-of-hooks`     |
| Missing dependencies in useEffect | `exhaustive-deps`    |
| Stale closures in callbacks       | `exhaustive-deps`    |

## Rule Severity Breakdown

| Rule              | Severity | Rationale                               |
| ----------------- | -------- | --------------------------------------- |
| `rules-of-hooks`  | error    | Violating causes runtime crashes        |
| `exhaustive-deps` | warn     | Intentional omissions exist (debatable) |

### Why `exhaustive-deps` is warn (not error)

The React team intentionally set this to warn because:

1. Some advanced patterns intentionally omit dependencies
2. False positives with stable refs
3. React Compiler will eventually handle this automatically

However, for LLM-generated code, consider escalating to error - LLMs rarely have valid reasons to omit dependencies.

## LLM-Specific Concerns

### Common LLM Mistakes with Hooks

```javascript
// LLM mistake: hook in condition
function Component({ show }) {
  if (show) {
    const [state, setState] = useState(0); // Error!
  }
}

// LLM mistake: hook in loop
function Component({ items }) {
  items.forEach((item) => {
    const [state, setState] = useState(0); // Error!
  });
}

// LLM mistake: missing dependency
function Component({ userId }) {
  useEffect(() => {
    fetchUser(userId); // userId missing from deps
  }, []); // Warn: missing userId
}
```

### Why rules-of-hooks at Error is Critical

From the [React docs](https://react.dev/reference/eslint-plugin-react-hooks):

> "Hooks rely on a stable call order. If you call Hooks inside conditions or loops, React can't guarantee they'll be called in the same order."

LLMs don't understand React's internal hook ordering mechanism. This rule is essential.

## React Compiler (2025)

React Compiler is in beta and may eventually replace `exhaustive-deps`:

- Compiler auto-memoizes and tracks dependencies
- `rules-of-hooks` still needed (compiler catches too, but belt+suspenders)

For now, keep both rules enabled.

## Current Configuration

```javascript
// React/Next.js support (conditional)
if (deps.react || deps.next) {
  const reactHooks = await import("eslint-plugin-react-hooks");
  configs.push({
    name: "react-hooks",
    plugins: { "react-hooks": reactHooks.default },
    rules: reactHooks.default.configs.recommended.rules,
  });
}
```

## Potential Enhancement

Consider escalating `exhaustive-deps` to error for LLM development:

```javascript
{
  rules: {
    "react-hooks/exhaustive-deps": "error",
  }
}
```

**Pros:** LLMs rarely have valid reasons to omit dependencies
**Cons:** May require manual `// eslint-disable` for advanced patterns

**Current decision:** Keep as warn (matches React team's recommendation)

## Research

Sources:

- [eslint-plugin-react-hooks - npm](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [React: Rules of Hooks](https://react.dev/reference/eslint-plugin-react-hooks)
- [exhaustive-deps rule](https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps)
- [React Compiler discussion](https://github.com/reactwg/react-compiler/discussions/18)

**Key findings**:

- Recommended preset uses rules-of-hooks:error, exhaustive-deps:warn
- Config correctly uses recommended preset with no overrides
- rules-of-hooks is critical for LLM-generated React code
- No configuration changes needed (consider exhaustive-deps:error in future)
