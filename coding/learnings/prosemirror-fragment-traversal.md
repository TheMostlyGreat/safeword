# ProseMirror Fragment Traversal

**Principle:** `Fragment.forEach()` only iterates direct children, not descendants. Use recursive traversal to process nested text nodes.

## The Gotcha

When applying marks to typed text in ProseMirror, `Fragment.forEach()` doesn't reach text nodes nested inside block nodes (paragraphs, headings, etc.).

❌ **Bad:** Iterating fragments without recursion
```typescript
// This ONLY sees paragraph nodes, not text inside them
const markedNodes: Node[] = [];
fragment.forEach((node: Node) => {
  if (node.isText) {
    markedNodes.push(node.mark([...node.marks, insertionMark]));
  }
  // Paragraph node with text children → mark NOT applied
});
```

✅ **Good:** Recursive traversal
```typescript
function markFragmentRecursive(fragment: Fragment, mark: Mark): Fragment {
  const markedNodes: Node[] = [];

  fragment.forEach((node: Node) => {
    if (node.isText) {
      // Text node - add mark
      markedNodes.push(node.mark([...node.marks, mark]));
    } else if (node.content.size > 0) {
      // Block node with children - recursively mark children
      const markedContent = markFragmentRecursive(node.content, mark);
      markedNodes.push(node.copy(markedContent));
    } else {
      // Leaf node without content - keep as-is
      markedNodes.push(node);
    }
  });

  return Fragment.from(markedNodes);
}
```

**Why it matters:** User types "hello" → ProseMirror wraps it in paragraph → `Fragment → Paragraph → Text("hello")`. Without recursion, `forEach()` only sees the paragraph node, and marks are applied to the wrong level.

## Document Structure

ProseMirror documents are tree structures:

```
Fragment (from ReplaceStep.slice.content)
├─ Paragraph node
│  └─ Text("hello")  ← forEach() DOESN'T reach this
└─ Heading node
   └─ Text("world")  ← forEach() DOESN'T reach this
```

## Testing Trap

Tests might pass if you manually create flat fragments in test fixtures:

```typescript
// ✅ Test passes (flat structure)
const testFragment = Fragment.from(schema.text('hello'));
// Fragment → Text("hello")  ← forEach() DOES reach this

// ❌ Real app breaks (nested structure)
// User types "hello" → editor wraps in paragraph
// Fragment → Paragraph → Text("hello")  ← forEach() DOESN'T reach this
```

**Solution:** Test with realistic document structures (paragraphs, headings) that match actual user input, not artificially flat fragments.

## When to Use Recursive Traversal

Use recursive traversal when:
- Processing text content across entire document (search, replace, mark application)
- Transforming node structure at any depth (format conversion, sanitization)
- Analyzing document content (word count, spell check)

Use simple `forEach()` when:
- Only processing top-level nodes (block-level operations)
- Explicitly working with known flat structures

## Reference Pattern

```typescript
// Recursive helper for deep traversal
function processFragmentRecursive(fragment: Fragment, operation: (node: Node) => Node): Fragment {
  const processedNodes: Node[] = [];

  fragment.forEach((node: Node) => {
    if (node.isText) {
      processedNodes.push(operation(node));
    } else if (node.content.size > 0) {
      const processedContent = processFragmentRecursive(node.content, operation);
      processedNodes.push(node.copy(processedContent));
    } else {
      processedNodes.push(node);
    }
  });

  return Fragment.from(processedNodes);
}
```

## Additional Resources

- [ProseMirror Node docs](https://prosemirror.net/docs/ref/#model.Node) - `node.copy()` for immutable updates
- [Fragment API](https://prosemirror.net/docs/ref/#model.Fragment) - `forEach()` behavior
- Track Changes implementation example: `packages/web/src/plugins/trackChangesPlugin.ts:17-45`

## Summary

**Fragment.forEach() is shallow.** Always use recursive traversal when processing text content, as ProseMirror wraps text in block nodes (paragraphs, headings). Test with realistic nested structures, not flat fragments.
