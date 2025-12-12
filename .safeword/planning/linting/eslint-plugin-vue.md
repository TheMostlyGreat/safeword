# eslint-plugin-vue

- **Version**: Latest 10.6.2 (dynamically imported when Vue/Nuxt detected)
- **Preset**: `flat/recommended` rules
- **Gotcha**: None - preset includes essential + strongly-recommended + recommended
- **LLM-critical rules**: `no-mutating-props`, `require-v-for-key`, `valid-*` directives
- **Overrides**: None needed

## Why This Plugin Matters for LLMs

LLMs make common Vue.js mistakes:

| LLM Behavior                     | Rule That Catches It         |
| -------------------------------- | ---------------------------- |
| Mutates props directly           | `no-mutating-props`          |
| Forgets :key in v-for            | `require-v-for-key`          |
| Uses single-word component names | `multi-word-component-names` |
| Unused component registrations   | `no-unused-components`       |
| Unused template variables        | `no-unused-vars`             |
| Invalid directive syntax         | `valid-v-bind`, `valid-v-on` |
| Template parsing errors          | `no-parsing-error`           |
| Vue 2 patterns in Vue 3 projects | `no-deprecated-*` rules      |
| Missing render return            | `require-render-return`      |
| v-if with v-for on same element  | `no-use-v-if-with-v-for`     |

## Preset Hierarchy

Vue plugin uses priority-based presets:

| Preset                      | Includes                                   | Severity   |
| --------------------------- | ------------------------------------------ | ---------- |
| `flat/base`                 | Parser config only                         | -          |
| `flat/essential`            | Base + Priority A rules (error prevention) | error      |
| `flat/strongly-recommended` | Essential + Priority B (readability)       | error/warn |
| `flat/recommended`          | Above + Priority C (community defaults)    | error/warn |

**Note:** Essential rules report errors. Strongly-recommended and recommended rules report warnings because they don't cover bugs.

## Rule Categories

| Category               | Count | Purpose                        |
| ---------------------- | ----- | ------------------------------ |
| Base                   | 2     | Parser configuration           |
| Essential (Vue 3)      | 50+   | Error prevention               |
| Essential (Deprecated) | 30+   | Catches Vue 2→3 migration      |
| Strongly Recommended   | 23    | Readability improvements       |
| Recommended            | 8     | Potentially dangerous patterns |
| Extension Rules        | 45+   | ESLint rules for templates     |

## Configuration

```javascript
// Vue support
if (deps.vue || deps.nuxt) {
  const vue = await import('eslint-plugin-vue');
  configs.push(...vue.default.configs['flat/recommended']);
}
```

Key features:

- **Conditional loading** - Only when `vue` or `nuxt` is in dependencies
- **Spread preset** - Uses full recommended config array (includes parser)
- **Vue 3 default** - flat/recommended targets Vue 3.x

## LLM-Specific Concerns

### Prop Mutation

LLMs often mutate props directly:

```vue
<script setup>
const props = defineProps(['items']);

// LLM mistake: mutating props
props.items.push(newItem); // Error!
</script>
```

`no-mutating-props` catches this pattern.

### Missing v-for Key

LLMs forget the required :key binding:

```vue
<!-- LLM mistake: missing key -->
<li v-for="item in items">{{ item }}</li>

<!-- Correct -->
<li v-for="item in items" :key="item.id">{{ item }}</li>
```

`require-v-for-key` enforces this.

### Vue 2 Patterns in Vue 3

LLMs trained on Vue 2 may use deprecated patterns:

```vue
<script>
// LLM mistake: Vue 2 options API patterns that are deprecated
export default {
  filters: {
    /* deprecated in Vue 3 */
  },
  beforeDestroy() {
    /* renamed to beforeUnmount */
  },
};
</script>
```

Multiple `no-deprecated-*` rules catch these.

### v-if with v-for

LLMs combine v-if and v-for on the same element:

```vue
<!-- LLM mistake: v-if with v-for -->
<li v-for="item in items" v-if="item.visible">

<!-- Correct: computed property or template wrapper -->
<template v-for="item in items" :key="item.id">
  <li v-if="item.visible">
</template>
```

`no-use-v-if-with-v-for` catches this anti-pattern.

## TypeScript Integration

For Vue + TypeScript, consider `@vue/eslint-config-typescript` which:

- Configures vue-eslint-parser with TypeScript parser
- Enables type-aware linting in `.vue` files

**Current decision:** Use flat/recommended only (TypeScript handled by typescript-eslint)

## Research

Sources:

- [eslint-plugin-vue User Guide](https://eslint.vuejs.org/user-guide/)
- [Available Rules](https://eslint.vuejs.org/rules/)
- [Vue ESLint Config TypeScript](https://github.com/vuejs/eslint-config-typescript)

**Key findings**:

- v10.6.2 flat/recommended includes 80+ rules
- Essential rules at error, others at warn
- Includes vue-eslint-parser configuration
- Dynamically loaded when Vue or Nuxt detected
- No configuration changes needed
