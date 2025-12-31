# Publishing

## NPM Package Publishing

Use `bun publish` instead of `npm publish` for this project:

```bash
cd packages/cli && bun publish
```

Note: `--access public` is only needed for first publish of scoped packages.

This runs the prepublishOnly script which:

1. Runs `check-bun-publish.js` to ensure bun is used
2. Builds the package (`bun run build`)
3. Runs tests (`bun run test`)
4. Publishes to npm
