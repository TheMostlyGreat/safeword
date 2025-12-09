# @next/eslint-plugin-next

- **Version**: Latest 16.0.8 (dynamically imported when Next.js detected)
- **Preset**: `recommended` rules
- **Gotcha**: None - preset enforces Next.js patterns
- **LLM-critical rules**: `no-html-link-for-pages`, `no-sync-scripts` at warn
- **Overrides**: None needed

## Why This Plugin Matters for LLMs

LLMs trained on generic React code often miss Next.js-specific patterns:

| LLM Behavior                       | Rule That Catches It     |
| ---------------------------------- | ------------------------ |
| Uses `<a href>` for internal links | `no-html-link-for-pages` |
| Uses `<img>` instead of `Image`    | `no-img-element`         |
| Uses `<head>` instead of next/head | `no-head-element`        |
| Uses `<script>` synchronously      | `no-sync-scripts`        |
| Uses `<link>` for custom fonts     | `no-page-custom-font`    |
| Puts CSS imports in \_document.js  | `no-css-imports`         |

## Presets Available

| Preset            | Description                                       |
| ----------------- | ------------------------------------------------- |
| `recommended`     | Base Next.js rules (our config uses this)         |
| `core-web-vitals` | Recommended + upgrades performance rules to error |

### Should We Use core-web-vitals?

For LLM development, consider `core-web-vitals` instead of `recommended`:

- Upgrades performance rules from warn to error
- LLMs would be forced to use `Image`, `Link`, etc.

**Current decision:** Use `recommended` (matches minimal config approach)

## Key Rules

| Rule                         | Severity | Purpose                              |
| ---------------------------- | -------- | ------------------------------------ |
| `no-html-link-for-pages`     | warn     | Use `<Link>` for client-side routing |
| `no-img-element`             | warn     | Use `<Image>` for optimization       |
| `no-head-element`            | warn     | Use `next/head` for meta tags        |
| `no-sync-scripts`            | warn     | Use `<Script>` for async loading     |
| `no-document-import-in-page` | error    | `_document` only in pages/\_document |

## Flat Config Support (March 2025)

Next.js 16+ added named exports for flat config:

```javascript
import { flatConfig } from '@next/eslint-plugin-next';

export default {
  ...flatConfig.recommended,
  // or ...flatConfig.coreWebVitals for stricter rules
};
```

Our config uses the legacy approach (dynamically loading and spreading rules), which still works.

## Current Configuration

```javascript
// Next.js plugin (conditional)
if (deps.next) {
  const nextPlugin = await import('@next/eslint-plugin-next');
  configs.push({
    name: 'nextjs',
    plugins: { '@next/next': nextPlugin.default },
    rules: nextPlugin.default.configs.recommended.rules,
  });
}
```

## Potential Enhancement

Consider using `core-web-vitals` for better LLM enforcement:

```javascript
rules: {
  ...nextPlugin.default.configs.recommended.rules,
  // Upgrade performance rules to error
  "@next/next/no-img-element": "error",
  "@next/next/no-html-link-for-pages": "error",
}
```

**Pros:** Forces LLMs to use Next.js patterns
**Cons:** May be too strict for prototyping

**Current decision:** Keep `recommended` (matches Next.js team's default)

## Research

Sources:

- [Next.js ESLint Configuration](https://nextjs.org/docs/app/api-reference/config/eslint)
- [@next/eslint-plugin-next - npm](https://www.npmjs.com/package/@next/eslint-plugin-next)
- [Flat Config Discussion](https://github.com/vercel/next.js/discussions/49337)

**Key findings**:

- v16.0.8 recommended preset enforces Next.js patterns
- All rules at warn (recommended) or error (core-web-vitals)
- Config correctly uses recommended rules with no overrides
- Dynamically loaded when Next.js detected
- No configuration changes needed (consider core-web-vitals in future)
