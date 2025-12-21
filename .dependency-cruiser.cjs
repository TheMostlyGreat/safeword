/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // Package boundary rules
    {
      name: 'no-cli-to-website',
      comment: 'CLI should not import from website package',
      severity: 'error',
      from: { path: '^packages/cli' },
      to: { path: '^packages/website' },
    },
    {
      name: 'no-plugin-to-cli',
      comment: 'ESLint plugin should not import from CLI (plugin is a leaf)',
      severity: 'error',
      from: { path: '^packages/eslint-plugin' },
      to: { path: '^packages/cli' },
    },
    {
      name: 'no-plugin-to-website',
      comment: 'ESLint plugin should not import from website',
      severity: 'error',
      from: { path: '^packages/eslint-plugin' },
      to: { path: '^packages/website' },
    },
    {
      name: 'no-website-to-cli',
      comment: 'Website should not import from CLI (isolated package)',
      severity: 'error',
      from: { path: '^packages/website' },
      to: { path: '^packages/cli' },
    },
    {
      name: 'no-website-to-plugin',
      comment: 'Website should not import from ESLint plugin',
      severity: 'error',
      from: { path: '^packages/website' },
      to: { path: '^packages/eslint-plugin' },
    },

    // =========================================================================
    // CLI Internal Architecture Rules (Layered Architecture)
    // =========================================================================
    // Layer 1: utils/ (leaf - no upward imports)
    // Layer 2: templates/ (depends on utils only)
    // Layer 3: schema.ts, reconcile.ts (core - depends on utils, templates)
    // Layer 4: commands/ (depends on core, utils, templates)
    // Layer 5: cli.ts (entry - lazy loads commands only)
    // =========================================================================

    {
      name: 'cli-utils-no-upward-imports',
      comment: 'utils/ is a leaf layer - cannot import from commands, templates, or core (types OK)',
      severity: 'error',
      from: { path: '^packages/cli/src/utils/' },
      to: {
        dependencyTypesNot: ['type-only'], // Allow type-only imports
        path: [
          '^packages/cli/src/commands/',
          '^packages/cli/src/templates/',
          String.raw`^packages/cli/src/schema\.ts$`,
          String.raw`^packages/cli/src/reconcile\.ts$`,
          String.raw`^packages/cli/src/cli\.ts$`,
        ],
      },
    },
    {
      name: 'cli-templates-no-upward-imports',
      comment: 'templates/ cannot import from commands or core engine (types OK)',
      severity: 'error',
      from: { path: '^packages/cli/src/templates/' },
      to: {
        dependencyTypesNot: ['type-only'], // Allow type-only imports
        path: [
          '^packages/cli/src/commands/',
          String.raw`^packages/cli/src/reconcile\.ts$`,
          String.raw`^packages/cli/src/cli\.ts$`,
        ],
      },
    },
    {
      name: 'cli-commands-no-entry-import',
      comment: 'commands/ cannot import from cli.ts (entry point)',
      severity: 'error',
      from: { path: '^packages/cli/src/commands/' },
      to: { path: String.raw`^packages/cli/src/cli\.ts$` },
    },
    {
      name: 'cli-core-no-command-import',
      comment: 'Core modules (schema, reconcile) cannot import from commands',
      severity: 'error',
      from: {
        path: [String.raw`^packages/cli/src/schema\.ts$`, String.raw`^packages/cli/src/reconcile\.ts$`],
      },
      to: { path: '^packages/cli/src/commands/' },
    },

    // =========================================================================
    // ESLint Plugin Internal Architecture Rules
    // =========================================================================
    // Layer 1: rules/ (leaf - custom ESLint rules)
    // Layer 2: detect.ts (detection utilities)
    // Layer 3: configs/ (compose rules + detect)
    // Layer 4: index.ts (entry - exports everything)
    // =========================================================================

    {
      name: 'plugin-rules-no-config-import',
      comment: 'rules/ cannot import from configs/ (rules are low-level primitives)',
      severity: 'error',
      from: { path: '^packages/eslint-plugin/src/rules/' },
      to: { path: '^packages/eslint-plugin/src/configs/' },
    },
    {
      name: 'plugin-detect-no-config-import',
      comment: 'detect.ts cannot import from configs/',
      severity: 'error',
      from: { path: String.raw`^packages/eslint-plugin/src/detect\.ts$` },
      to: { path: '^packages/eslint-plugin/src/configs/' },
    },

    // =========================================================================
    // Public API Enforcement
    // =========================================================================
    // External consumers should only import from package entry points (index.ts)
    // This prevents accidental coupling to internal modules
    // =========================================================================

    {
      name: 'cli-public-api-only',
      comment: 'External imports to CLI should go through index.ts, not internal modules',
      severity: 'error',
      from: { pathNot: '^packages/cli/' },
      to: {
        path: '^packages/cli/src/',
        pathNot: String.raw`^packages/cli/src/index\.ts$`,
      },
    },
    {
      name: 'plugin-public-api-only',
      comment: 'External imports to plugin should go through index.ts, not internal modules',
      severity: 'error',
      from: { pathNot: '^packages/eslint-plugin/' },
      to: {
        path: '^packages/eslint-plugin/src/',
        pathNot: String.raw`^packages/eslint-plugin/src/index\.ts$`,
      },
    },

    // =========================================================================
    // Deprecated Dependencies Detection
    // =========================================================================

    {
      name: 'no-deprecated-deps',
      comment: 'Error when importing deprecated npm packages - fix immediately',
      severity: 'error',
      from: {},
      to: { dependencyTypes: ['deprecated'] },
    },

    // Circular dependency detection
    {
      name: 'no-circular',
      comment: 'No circular dependencies allowed',
      severity: 'error',
      from: {},
      to: { circular: true },
    },

    // No orphan modules (files not imported by anything)
    {
      name: 'no-orphans',
      comment: 'Warn on orphan modules - allows WIP files during development',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          // Entry points are expected orphans
          String.raw`(^|/)index\.[tj]sx?$`,
          String.raw`(^|/)cli\.[tj]s$`,
          String.raw`\.config\.[tj]s$`,
          String.raw`\.config\.mjs$`,
          // Test files
          String.raw`\.test\.[tj]sx?$`,
          String.raw`\.spec\.[tj]sx?$`,
          '/tests/',
          // Astro pages/content
          '/src/content/',
          '/src/pages/',
        ],
      },
      to: {},
    },

    // No dev dependencies in production code
    {
      name: 'no-dev-deps-in-src',
      comment: 'Production code should not import devDependencies',
      severity: 'error',
      from: {
        path: '^packages/[^/]+/src',
        pathNot: String.raw`\.test\.[tj]sx?$`,
      },
      to: { dependencyTypes: ['npm-dev'] },
    },
  ],

  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: [
        'node_modules',
        'dist',
        'build',
        'coverage',
        String.raw`\.d\.ts$`,
      ],
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: './tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(@[^/]+/[^/]+|[^/]+)',
        theme: {
          graph: { rankdir: 'LR' },
          modules: [
            { criteria: { source: '^packages/cli' }, attributes: { fillcolor: '#ffcccc' } },
            { criteria: { source: '^packages/eslint-plugin' }, attributes: { fillcolor: '#ccffcc' } },
            { criteria: { source: '^packages/website' }, attributes: { fillcolor: '#ccccff' } },
          ],
        },
      },
    },
  },
};
