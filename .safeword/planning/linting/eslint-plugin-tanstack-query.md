# @tanstack/eslint-plugin-query

**Status**: Planned (not yet implemented)
**Priority**: High - widely used, catches real bugs

- **Version**: ^5.91.2 (conditional - when @tanstack/react-query detected)
- **Preset**: `flat/recommended` rules
- **Weekly downloads**: 1.8M+
- **Gotcha**: Flat config syntax changed in recent versions

## Why This Plugin Matters for LLMs

TanStack Query (React Query) is one of the most popular data fetching libraries. LLMs frequently make mistakes that this plugin catches:

| LLM Behavior                                     | Rule That Catches It            |
| ------------------------------------------------ | ------------------------------- |
| Missing query key dependencies                   | `exhaustive-deps`               |
| Destructuring `data` rest properties incorrectly | `no-rest-destructuring`         |
| Creating queryClient inside component            | `stable-query-client`           |
| Unstable function references in options          | `no-unstable-deps`              |
| Wrong property order in infinite queries         | `infinite-query-property-order` |

## Rule Severity Breakdown

| Rule                            | Severity | Rationale                                                    |
| ------------------------------- | -------- | ------------------------------------------------------------ |
| `exhaustive-deps`               | error    | Query keys must include all dependencies for correct caching |
| `no-rest-destructuring`         | warn     | Rest destructuring loses reactivity                          |
| `stable-query-client`           | error    | Creating client in component causes infinite re-renders      |
| `no-unstable-deps`              | warn     | Unstable refs cause unnecessary refetches                    |
| `infinite-query-property-order` | warn     | Enforces consistent property ordering                        |

## LLM-Specific Concerns

### Common LLM Mistakes with React Query

```javascript
// LLM mistake: missing dependency in query key
function useUserPosts(userId) {
  return useQuery({
    queryKey: ['posts'], // Error! Missing userId
    queryFn: () => fetchPosts(userId),
  });
}

// LLM mistake: creating client inside component
function App() {
  const queryClient = new QueryClient(); // Error! Recreated every render
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>;
}

// LLM mistake: rest destructuring
const { data, ...rest } = useQuery({ queryKey: ['user'], queryFn: fetchUser });
// 'rest' won't update when query state changes

// LLM mistake: inline function in options
useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  select: data => data.name, // Warn: new function every render
});
```

## Implementation Plan

### Detection

Add to project detection in `utils/project-detector.ts`:

```typescript
tanstackQuery: Boolean(deps['@tanstack/react-query'] || deps['@tanstack/vue-query']),
tanstackRouter: Boolean(deps['@tanstack/react-router']),
```

### ESLint Config

```javascript
// TanStack Query support (conditional)
if (deps.tanstackQuery) {
  const pluginQuery = await import('@tanstack/eslint-plugin-query');
  configs.push(...pluginQuery.default.configs['flat/recommended']);
}
```

### Package Installation

Add to `schema.ts` conditional packages:

```typescript
conditional: {
  // ... existing
  tanstackQuery: ['@tanstack/eslint-plugin-query'],
  tanstackRouter: ['@tanstack/eslint-plugin-router'],
}
```

## TanStack Router (Secondary)

Also consider `@tanstack/eslint-plugin-router` for projects using TanStack Router:

- Rules: `create-route-property-order`
- Lower priority than Query plugin (Router less widely adopted)

## Research

Sources:

- [TanStack Query ESLint Plugin Docs](https://tanstack.com/query/v4/docs/eslint/eslint-plugin-query)
- [@tanstack/eslint-plugin-query on npm](https://www.npmjs.com/package/@tanstack/eslint-plugin-query)
- [Flat Config Discussion](https://github.com/TanStack/query/discussions/6669)

**Key findings**:

- Plugin is mature with 1.8M weekly downloads
- Flat config support available via `flat/recommended`
- Rules catch common LLM mistakes with data fetching
- Should be conditional based on @tanstack/react-query in dependencies
