module.exports = {
  forbidden: [
    // =========================================================================
    // ERROR RULES (block on violations)
    // =========================================================================
    {
      name: 'no-circular',
      comment: 'Circular dependencies cause runtime issues and make code hard to reason about',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-deprecated-deps',
      comment:
        'Deprecated npm packages should be replaced - they may have security issues or be unmaintained',
      severity: 'error',
      from: {},
      to: { dependencyTypes: ['deprecated'] },
    },

    // =========================================================================
    // WARNING RULES (flag issues but don't block)
    // =========================================================================
    {
      name: 'no-dev-deps-in-src',
      comment: 'Production code should not import devDependencies - may cause runtime failures',
      severity: 'warn',
      from: {
        path: '^(packages/[^/]+/)?src',
        pathNot: '\\.test\\.[tj]sx?$',
      },
      to: { dependencyTypes: ['npm-dev'] },
    },
    {
      name: 'no-orphans',
      comment: 'Orphan modules are not imported anywhere - may be dead code',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          // Entry points
          '(^|/)index\\.[tj]sx?$',
          '(^|/)main\\.[tj]sx?$',
          '(^|/)cli\\.[tj]s$',
          '\\.config\\.[tj]s$',
          '\\.config\\.mjs$',
          // Test files
          '\\.test\\.[tj]sx?$',
          '\\.spec\\.[tj]sx?$',
          '/tests/',
          '/__tests__/',
          // Astro/Next.js pages and content
          '/src/content/',
          '/src/pages/',
          '/app/',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: ['node_modules', '.safeword'] },
    exclude: {
      path: ['node_modules', 'dist', 'build', 'coverage', '\\.d\\.ts$'],
    },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
