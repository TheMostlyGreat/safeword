# AI SDK v5 Breaking Changes

**Principle:** AI SDK v5 removed `input` and `setInput` from `useChat` hook. You must manage text input state locally.

## The Gotcha

What breaks when upgrading from AI SDK v4 to v5:

❌ **Bad (AI SDK v4 pattern):**

```typescript
import { useChat } from '@ai-sdk/react'

export function Chat() {
  const { input, setInput, messages, sendMessage } = useChat({
    api: '/api/chat'
  })

  // input = undefined, setInput = undefined in v5!
  return <input value={input} onChange={(e) => setInput(e.target.value)} />
}
```

✅ **Good (AI SDK v5 pattern):**

```typescript
import { useChat } from '@ai-sdk/react'
import { useState } from 'react'

export function Chat() {
  // Manage input state locally
  const [input, setInput] = useState('')

  const { messages, sendMessage } = useChat({
    api: '/api/chat'
  })

  return <input value={input} onChange={(e) => setInput(e.target.value)} />
}
```

**Why it matters:**

- `!undefined` = `true` → buttons stay disabled when checking `!input`
- `setInput(value)` throws "setInput is not a function"
- Tests may pass (if using controlled component wrappers) while browser fails

## Breaking Changes in AI SDK v5

### Removed from useChat return value:

- ❌ `input` (string)
- ❌ `setInput` (function)
- ❌ `handleSubmit` (function)
- ❌ `handleInputChange` (function)

### Still available:

- ✅ `messages`
- ✅ `setMessages`
- ✅ `sendMessage`
- ✅ `status`
- ✅ `stop`
- ✅ `reload`
- ✅ `data` (for data stream)

### New architecture:

AI SDK v5 uses **transport-based design**. Input management is now the developer's responsibility.

## Migration Pattern

**Before (v4):**

```typescript
const { input, setInput, handleSubmit } = useChat()

<form onSubmit={handleSubmit}>
  <input value={input} onChange={handleInputChange} />
</form>
```

**After (v5):**

```typescript
const [input, setInput] = useState('')
const { sendMessage } = useChat()

const handleSubmit = (e: FormEvent) => {
  e.preventDefault()
  if (input.trim()) {
    sendMessage({ text: input })
    setInput('')
  }
}

<form onSubmit={handleSubmit}>
  <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
  />
</form>
```

## Testing Trap

Integration tests using `useState` in a TestWrapper will pass even if production code is broken:

```typescript
// Test (passes even with broken useChat usage)
function TestWrapper() {
  const [input, setInput] = useState('')  // Local state works
  return <MultimodalInput input={input} setInput={setInput} />
}

// Production (broken - input/setInput are undefined)
function Chat() {
  const { input, setInput } = useChat()  // undefined in v5!
  return <MultimodalInput input={input} setInput={setInput} />
}
```

**Solution:** Tests should verify the actual integration pattern, not just component behavior. Or add E2E tests that exercise the full Chat → useChat → MultimodalInput chain.

## Symptoms

If you see these symptoms, check if you're destructuring removed properties:

1. **Button stays disabled when typing** - `!undefined` = `true`
2. **Console error: "X is not a function"** - `setInput` doesn't exist
3. **Input state is undefined** - Check console: `input: undefined`
4. **Tests pass but browser fails** - TestWrapper uses local state, production uses broken useChat

## Debug Strategy

1. Add logging to see what useChat returns:

```typescript
const chatHelpers = useChat({ ... })
console.log('useChat returned:', Object.keys(chatHelpers))
```

2. Check if input/setInput exist:

```typescript
console.log('input:', input, 'setInput:', typeof setInput);
// v5: input: undefined setInput: undefined
```

3. Verify AI SDK version:

```bash
grep '"ai":' package.json
# "ai": "5.0.87" = v5 (breaking changes)
```

## References

- AI SDK v5 docs: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
- Migration guide: https://ai-sdk.dev/docs/ai-sdk-ui/migration-guide
- Breaking change announcement: "The useChat API has been significantly updated in AI SDK 5.0"

## Real-World Example

**Project:** Chat application with send button
**Bug:** Button stayed disabled when typing
**Root cause:** Destructuring `input` and `setInput` from useChat (both undefined in v5)
**Fix:** Add `const [input, setInput] = useState('')` in Chat component
**Commit:** See project history for detailed investigation

## Prevention

**When upgrading to AI SDK v5:**

1. Search codebase for `useChat` usage: `grep -r "useChat" --include="*.tsx"`
2. Check each usage for destructuring `input`, `setInput`, `handleSubmit`, `handleInputChange`
3. Replace with local state management
4. Test in actual browser (integration tests may give false confidence)
