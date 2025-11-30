/**
 * Architecture boundaries detection and config generation
 *
 * Auto-detects common architecture directories and generates
 * eslint-plugin-boundaries config with sensible hierarchy rules.
 */

import { join } from 'node:path';
import { exists } from './fs.js';

/**
 * Architecture directories to detect, ordered from bottom to top of hierarchy.
 * Lower items can be imported by higher items, not vice versa.
 */
const ARCHITECTURE_DIRS = [
  'types', // Bottom: can be imported by everything
  'utils',
  'lib',
  'hooks',
  'services',
  'components',
  'features',
  'modules',
  'app', // Top: can import everything
] as const;

type ArchDir = (typeof ARCHITECTURE_DIRS)[number];

/**
 * Hierarchy rules: what each layer can import
 * Lower layers have fewer import permissions
 */
const HIERARCHY: Record<ArchDir, ArchDir[]> = {
  types: [], // types can't import anything (pure type definitions)
  utils: ['types'],
  lib: ['utils', 'types'],
  hooks: ['lib', 'utils', 'types'],
  services: ['lib', 'utils', 'types'],
  components: ['hooks', 'services', 'lib', 'utils', 'types'],
  features: ['components', 'hooks', 'services', 'lib', 'utils', 'types'],
  modules: ['components', 'hooks', 'services', 'lib', 'utils', 'types'],
  app: ['features', 'modules', 'components', 'hooks', 'services', 'lib', 'utils', 'types'],
};

export interface DetectedArchitecture {
  directories: ArchDir[];
  inSrc: boolean; // true if dirs are in src/, false if at root
}

/**
 * Detects architecture directories in the project
 * Always returns a result (even with 0 directories) - boundaries is always configured
 */
export function detectArchitecture(projectDir: string): DetectedArchitecture {
  const foundInSrc: ArchDir[] = [];
  const foundAtRoot: ArchDir[] = [];

  for (const dir of ARCHITECTURE_DIRS) {
    if (exists(join(projectDir, 'src', dir))) {
      foundInSrc.push(dir);
    }
    if (exists(join(projectDir, dir))) {
      foundAtRoot.push(dir);
    }
  }

  // Prefer src/ location if more dirs found there
  const inSrc = foundInSrc.length >= foundAtRoot.length;
  const found = inSrc ? foundInSrc : foundAtRoot;

  return { directories: found, inSrc };
}

/**
 * Generates the boundaries config file content
 */
export function generateBoundariesConfig(arch: DetectedArchitecture): string {
  const prefix = arch.inSrc ? 'src/' : '';
  const hasDirectories = arch.directories.length > 0;

  // Generate element definitions with mode: 'full' to match from project root only
  const elements = arch.directories
    .map(dir => `      { type: '${dir}', pattern: '${prefix}${dir}/**', mode: 'full' }`)
    .join(',\n');

  // Generate rules (what each layer can import)
  const rules = arch.directories
    .filter(dir => HIERARCHY[dir].length > 0)
    .map(dir => {
      const allowed = HIERARCHY[dir].filter(dep => arch.directories.includes(dep));
      if (allowed.length === 0) return null;
      return `        { from: ['${dir}'], allow: [${allowed.map(d => `'${d}'`).join(', ')}] }`;
    })
    .filter(Boolean)
    .join(',\n');

  const detectedInfo = hasDirectories
    ? `Detected directories: ${arch.directories.join(', ')} (${arch.inSrc ? 'in src/' : 'at root'})`
    : 'No architecture directories detected yet - add types/, utils/, components/, etc.';

  // Build elements array content (empty array if no directories)
  const elementsContent = elements || '';
  const rulesContent = rules || '';

  return `/**
 * Architecture Boundaries Configuration (AUTO-GENERATED)
 *
 * ${detectedInfo}
 *
 * This enforces import boundaries between architectural layers:
 * - Lower layers (types, utils) cannot import from higher layers (components, features)
 * - Uses 'warn' severity - informative, not blocking
 *
 * Recognized directories (in hierarchy order):
 *   types → utils → lib → hooks/services → components → features/modules → app
 *
 * To customize, override in your eslint.config.mjs:
 *   rules: { 'boundaries/element-types': ['error', { ... }] }
 */

import boundaries from 'eslint-plugin-boundaries';

export default {
  plugins: { boundaries },
  settings: {
    'boundaries/elements': [
${elementsContent}
    ],
  },
  rules: {
    'boundaries/element-types': ['warn', {
      default: 'disallow',
      rules: [
${rulesContent}
      ],
    }],
    'boundaries/no-unknown': 'off', // Allow files outside defined elements
    'boundaries/no-unknown-files': 'off', // Allow non-matching files
  },
};
`;
}
