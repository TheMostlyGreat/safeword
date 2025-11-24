# Milkdown Crepe .editor Property is Official Public API

**Principle:** `crepe.editor` is the **official way** to access the underlying Milkdown Editor and register custom plugins - it's not a hack.

## The Gotcha

When extending Crepe with custom ProseMirror plugins, you might think accessing `.editor` is bypassing the public API:

❌ **Assumption:** "We're accessing an internal property"
✅ **Reality:** `.editor` is explicitly declared in TypeScript definitions as a public getter

**Why it matters:** This is a **correct, supported pattern** for extending Crepe. No need to replace Crepe with core Milkdown just to avoid this "hack."

## Evidence

From `@milkdown/crepe` TypeScript definitions (`node_modules/@milkdown/crepe/lib/types/core/builder.d.ts:18`):

```typescript
export declare class CrepeBuilder {
    #private;
    constructor({ root, defaultValue }?: CrepeBuilderConfig);
    addFeature: { /* ... */ };
    create: () => Promise<Editor>;
    destroy: () => Promise<Editor>;
    get editor(): Editor;  // ← PUBLIC API GETTER
    get readonly(): boolean;
    setReadonly: (value: boolean) => this;
    getMarkdown: () => string;
    on: (fn: (api: ListenerManager) => void) => this;
}

export declare class Crepe extends CrepeBuilder {
    // Inherits all properties from CrepeBuilder, including .editor getter
}
```

## Correct Usage Pattern

```typescript
import { Crepe } from '@milkdown/crepe';
import { trackChangesPlugin } from './plugins/trackChangesPlugin';

const crepe = new Crepe({ root, defaultValue: '', features: {} });

// ✅ CORRECT - Official public API
crepe.editor.use(trackChangesPlugin);

return crepe.editor;
```

## When to Use This Pattern

Use `crepe.editor.use()` when you need to:
- Register custom ProseMirror plugins that Crepe doesn't provide
- Access the underlying Milkdown Editor instance for direct API calls
- Configure plugins that aren't available through Crepe's feature system

## Alternative (Not Recommended)

You could replace Crepe with core Milkdown:

```typescript
// ❌ NOT RECOMMENDED - Loses Crepe's pre-built features
import { Editor } from '@milkdown/core';

return Editor.make()
  .use(commonmark)
  .use(listener)
  .use(history)
  .use(trackChangesPlugin);
```

**Why not recommended:**
- Lose Crepe's toolbar, slash commands, block editing UI
- 2-3 weeks to rebuild features
- More code to maintain
- Violates "avoid bloat" principle
- Zero user value

## Research Sources

- **GitHub Discussion:** [How to add extra plugins to the crepe editor? #1432](https://github.com/orgs/Milkdown/discussions/1432)
  - Maintainer confirmed: "Register the plugin as usual" after fixing rollup bug in v7.5.2
- **Web Search:** Multiple examples show `crepe.editor.use()` pattern in production code
- **TypeScript Definitions:** Explicit public getter declaration

## Conclusion

When you see `crepe.editor.use(plugin)` in code reviews, **don't flag it as a hack**. It's the correct, documented way to extend Crepe with custom functionality.

**Decision:** Keep the current implementation. No refactoring needed.

---

**Related Files:**
- `src/components/Editor.tsx` - Uses this pattern to register trackChangesPlugin
- `planning/design/track-changes-refactoring-plan.md` - Initially flagged as hack, now corrected
