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
      comment: 'Warn about orphan modules (may be entry points - review manually)',
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
