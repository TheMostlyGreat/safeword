# eslint-plugin-svelte

- **Version**: Latest 3.13.1 (dynamically imported when Svelte/SvelteKit detected)
- **Preset**: `recommended` rules
- **Gotcha**: None - preset includes base + recommended rules
- **LLM-critical rules**: `no-at-html-tags` (XSS), `no-dom-manipulating`, reactive pattern rules
- **Overrides**: None needed

## Why This Plugin Matters for LLMs

LLMs make common Svelte mistakes:

| LLM Behavior                          | Rule That Catches It               |
| ------------------------------------- | ---------------------------------- |
| Uses `{@html}` without sanitizing     | `no-at-html-tags`                  |
| Direct DOM manipulation in components | `no-dom-manipulating`              |
| Reassigns reactive variables wrong    | `no-reactive-reassign`             |
| Forgets $ prefix for store access     | `require-store-reactive-access`    |
| Hardcoded values in reactive blocks   | `no-reactive-literals`             |
| Functions in reactive statements      | `no-reactive-functions`            |
| Unnecessary reactive statements       | `no-immutable-reactive-statements` |
| Infinite reactive loops               | `infinite-reactive-loop`           |
| Unnecessary mustache expressions      | `no-useless-mustaches`             |

## Rule Categories

| Category               | Count | Purpose                         |
| ---------------------- | ----- | ------------------------------- |
| Possible Errors        | 10+   | Syntax and logic issues         |
| Security Vulnerability | 2     | XSS prevention                  |
| Best Practices         | 15+   | Improved code patterns          |
| Stylistic Issues       | 10+   | Formatting conventions          |
| Extension Rules        | 15+   | ESLint rules adapted for Svelte |
| SvelteKit              | 5+    | Framework-specific guidance     |
| Experimental           | 3+    | Emerging rules                  |

## Configuration

```javascript
// Svelte support
if (deps.svelte || deps['@sveltejs/kit']) {
  const svelte = await import('eslint-plugin-svelte');
  configs.push(...svelte.default.configs.recommended);
}
```

Key features:

- **Conditional loading** - Only when `svelte` or `@sveltejs/kit` is in dependencies
- **Spread preset** - Uses full recommended config array (includes parser)
- **v3 flat config** - Uses modern flat config format

## Available Presets

| Preset        | Description                              |
| ------------- | ---------------------------------------- |
| `base`        | Parser configuration only                |
| `recommended` | Base + rules to prevent errors           |
| `prettier`    | Disables rules conflicting with Prettier |
| `all`         | All available rules (not for production) |

## LLM-Specific Concerns

### XSS via @html

LLMs often use `{@html}` without understanding the security implications:

```svelte
<!-- LLM mistake: XSS vulnerability -->
{@html userContent}

<!-- Should sanitize or avoid -->
{@html DOMPurify.sanitize(userContent)}
```

`no-at-html-tags` warns about this pattern.

### Direct DOM Manipulation

LLMs sometimes bypass Svelte's reactivity:

```svelte
<script>
  // LLM mistake: direct DOM manipulation
  document.querySelector('.my-element').style.color = 'red';
</script>
```

`no-dom-manipulating` catches this anti-pattern.

### Reactive Statement Mistakes

LLMs misunderstand Svelte's reactivity system:

```svelte
<script>
  // LLM mistake: unnecessary reactive statement
  $: const PI = 3.14159; // Constant doesn't need reactivity

  // LLM mistake: function doesn't need reactive wrapper
  $: function formatDate(d) { return d.toISOString(); }

  // LLM mistake: reactive reassignment
  $: items = items.filter(i => i.active); // Infinite loop!
</script>
```

Multiple `no-reactive-*` rules catch these patterns.

### Store Access

LLMs forget the `$` prefix for auto-subscription:

```svelte
<script>
  import { myStore } from './stores';

  // LLM mistake: missing $ prefix
  console.log(myStore); // Gets store object, not value

  // Correct
  console.log($myStore); // Gets reactive value
</script>
```

`require-store-reactive-access` enforces this.

## TypeScript Integration

For Svelte + TypeScript:

```javascript
{
  files: ['**/*.svelte', '**/*.svelte.ts'],
  languageOptions: {
    parserOptions: {
      projectService: true,
      extraFileExtensions: ['.svelte'],
      parser: ts.parser,
    }
  }
}
```

**Current decision:** Use recommended only (TypeScript handled by typescript-eslint)

## Version 3 Changes

The plugin v3 (required for ESLint 9) includes:

- Flat config only (no .eslintrc support)
- New rules added to recommended: `infinite-reactive-loop`, `no-dom-manipulating`
- Node.js ^18.20.4, ^20.18.0, >=22.10.0 required

## Research

Sources:

- [eslint-plugin-svelte User Guide](https://sveltejs.github.io/eslint-plugin-svelte/user-guide/)
- [GitHub - eslint-plugin-svelte](https://github.com/sveltejs/eslint-plugin-svelte)
- [Available Rules](https://sveltejs.github.io/eslint-plugin-svelte/rules/)

**Key findings**:

- v3.13.1 recommended includes 40+ rules
- Security rules at error (no-at-html-tags: warn by default)
- Reactivity rules catch common LLM mistakes
- Dynamically loaded when Svelte or SvelteKit detected
- Includes svelte-eslint-parser configuration
- No configuration changes needed
