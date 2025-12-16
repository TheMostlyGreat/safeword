# @tanstack/eslint-plugin-query

**Status**: Planned (not yet implemented)
**Priority**: High - widely used, catches real bugs

- **Version**: ^5.x required (v4 flat config broken - [#8679](https://github.com/TanStack/query/issues/8679))
- **Weekly downloads**: 1.8M+
- **Bundled in**: `eslint-plugin-safeword` (not separate install)

## Rule Configuration

All 7 rules set to **error** - LLMs have no valid reason to violate these.

| Rule                            | What It Catches                                  |
| ------------------------------- | ------------------------------------------------ |
| `exhaustive-deps`               | Missing query key deps → stale cached data       |
| `stable-query-client`           | Client in component → infinite re-render loop    |
| `no-void-query-fn`              | No return → `undefined` cached                   |
| `no-rest-destructuring`         | `...rest` loses reactivity, stale UI state       |
| `no-unstable-deps`              | New function each render → unnecessary refetches |
| `infinite-query-property-order` | Wrong order → TypeScript can't infer types       |
| `mutation-property-order`       | Wrong order → TypeScript can't infer types       |

## Code Examples

```javascript
// exhaustive-deps: Missing userId in query key → stale cache
useQuery({
  queryKey: ['posts'],           // Error! Should be ['posts', userId]
  queryFn: () => fetchPosts(userId),
});

// stable-query-client: Creating inside component → infinite re-renders
function App() {
  const queryClient = new QueryClient(); // Error! Move outside component
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>;
}

// no-void-query-fn: Forgetting return → undefined cached
useQuery({
  queryKey: ['todos'],
  queryFn: async () => { await api.todos.fetch(); }, // Error! Missing return
});

// mutation-property-order: Wrong order → TypeScript can't infer types
useMutation({
  onSuccess: data => console.log(data), // Error! 'data' type unknown
  mutationFn: async (id: string) => api.delete(id), // Must come first
});
```

## Implementation Plan

### Detection

Add to project detection in `utils/project-detector.ts`:

```typescript
tanstackQuery: Boolean(
  deps['@tanstack/react-query'] ||
  deps['@tanstack/vue-query'] ||
  deps['@tanstack/solid-query'] ||
  deps['@tanstack/svelte-query'] ||
  deps['@tanstack/angular-query-experimental']
),
tanstackRouter: Boolean(deps['@tanstack/react-router']),
```

### ESLint Config (in eslint-plugin-safeword)

```javascript
// TanStack Query support (conditional) - bundled in eslint-plugin-safeword
if (deps.tanstackQuery) {
  const pluginQuery = await import('@tanstack/eslint-plugin-query');
  configs.push({
    name: 'safeword/tanstack-query',
    plugins: { '@tanstack/query': pluginQuery.default },
    rules: {
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/stable-query-client': 'error',
      '@tanstack/query/no-void-query-fn': 'error',
      '@tanstack/query/no-rest-destructuring': 'error',
      '@tanstack/query/no-unstable-deps': 'error',
      '@tanstack/query/infinite-query-property-order': 'error',
      '@tanstack/query/mutation-property-order': 'error',
    },
  });
}
```

### Package Changes

**eslint-plugin-safeword/package.json** - add to dependencies:

```json
"@tanstack/eslint-plugin-query": "^5.0.0"
```

No changes to `schema.ts` - plugin is bundled, not user-installed.

## TanStack Router (Secondary)

Also consider `@tanstack/eslint-plugin-router` for projects using TanStack Router:

- Rules: `create-route-property-order`
- Lower priority than Query plugin (Router less widely adopted)

## Research

Sources:

- [ESLint Plugin Docs](https://tanstack.com/query/latest/docs/eslint/eslint-plugin-query)
- [npm package](https://www.npmjs.com/package/@tanstack/eslint-plugin-query)

**Key findings**:

- 1.8M weekly downloads, mature plugin
- 7 rules catching common data-fetching mistakes
- Requires plugin v5+ for flat config support
- TanStack Form/Table/Virtual have no ESLint plugins
