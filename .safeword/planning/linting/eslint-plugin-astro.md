# eslint-plugin-astro

- **Version**: Latest 1.5.0 (dynamically imported when Astro detected)
- **Preset**: `flat/recommended` rules
- **Gotcha**: None - preset catches deprecated APIs and Astro-specific issues
- **LLM-critical rules**: `no-conflict-set-directives`, deprecated API rules
- **Overrides**: None needed

## Why This Plugin Matters for LLMs

LLMs trained on older Astro versions use deprecated patterns:

| LLM Behavior                      | Rule That Catches It                  |
| --------------------------------- | ------------------------------------- |
| Uses `Astro.canonicalURL`         | `no-deprecated-astro-canonicalurl`    |
| Uses `Astro.fetchContent()`       | `no-deprecated-astro-fetchcontent`    |
| Uses `Astro.resolve()`            | `no-deprecated-astro-resolve`         |
| Uses `getEntryBySlug()`           | `no-deprecated-getentrybyslug`        |
| Missing `client:only="framework"` | `missing-client-only-directive-value` |
| Conflicting directives on element | `no-conflict-set-directives`          |
| Unused `define:vars` in style     | `no-unused-define-vars-in-style`      |
| Generates invalid Astro templates | `valid-compile`                       |

## Rule Severity Breakdown

The recommended preset includes ~9 rules focused on Astro correctness:

| Category             | Rules                               |
| -------------------- | ----------------------------------- |
| Deprecated APIs      | 4 rules catching old Astro patterns |
| Directive validation | 2 rules for client/set directives   |
| Style validation     | 1 rule for define:vars usage        |
| Compilation          | 1 rule for valid Astro compilation  |

## Security Rules (Not in Recommended)

Notable security rules you may want to enable:

| Rule                       | Purpose                      | Severity |
| -------------------------- | ---------------------------- | -------- |
| `no-set-html-directive`    | Prevents XSS via set:html    | off      |
| `no-unsafe-inline-scripts` | Encourages CSP-safe patterns | off      |

These are disabled by default because `set:html` is sometimes needed for trusted content.

## Configuration

```javascript
// Astro support
if (deps.astro) {
  const astro = await import('eslint-plugin-astro');
  configs.push(...astro.default.configs.recommended);
}
```

Key features:

- **Conditional loading** - Only when `astro` is in project dependencies
- **Spread preset** - Uses full recommended config array
- **Includes parser** - astro-eslint-parser is configured automatically

## LLM-Specific Concerns

### Deprecated API Migration

LLMs trained on pre-Astro 2.0 docs suggest deprecated patterns:

```astro
---
// LLM mistake: deprecated API
const url = Astro.canonicalURL; // Error!
const content = Astro.fetchContent('./posts/*.md'); // Error!
---
```

Modern Astro uses:

```astro
---
// Correct: modern API
const url = Astro.url;
const content = await getCollection('posts');
---
```

### Client Directives

LLMs often forget framework value for `client:only`:

```astro
<!-- LLM mistake: missing framework -->
<ReactComponent client:only />

<!-- Correct: specify framework -->
<ReactComponent client:only="react" />
```

`missing-client-only-directive-value` catches this.

### Conflicting Directives

LLMs may add conflicting set directives:

```astro
<!-- LLM mistake: conflicting directives -->
<div set:html={html} set:text={text} />
```

`no-conflict-set-directives` prevents this.

## Accessibility Extension

For accessibility in Astro components, consider:

```javascript
...astro.default.configs["flat/jsx-a11y-recommended"]
```

This extends `eslint-plugin-jsx-a11y` rules to work with Astro components.

**Current decision:** Use recommended only (matches minimal config approach)

## Research

Sources:

- [eslint-plugin-astro User Guide](https://ota-meshi.github.io/eslint-plugin-astro/user-guide/)
- [GitHub - eslint-plugin-astro](https://github.com/ota-meshi/eslint-plugin-astro)
- [Available Rules](https://ota-meshi.github.io/eslint-plugin-astro/rules/)

**Key findings**:

- v1.5.0 flat/recommended includes ~9 rules at error
- Focus on deprecated APIs (common LLM mistake source)
- Includes Astro parser configuration automatically
- Dynamically loaded when Astro detected
- No configuration changes needed
