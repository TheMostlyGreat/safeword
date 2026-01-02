/**
 * Architecture boundaries detection and config generation
 *
 * Auto-detects common architecture directories and generates
 * eslint-plugin-boundaries config with sensible hierarchy rules.
 *
 * Supports:
 * - Standard projects (src/utils, utils/)
 * - Monorepos (packages/*, apps/*)
 * - Various naming conventions (helpers, shared, core, etc.)
 */

import { readdirSync } from 'node:fs';
import nodePath from 'node:path';

import { exists } from './fs.js';

/**
 * Architecture layer definitions with alternative names.
 * Each layer maps to equivalent directory names.
 * Order defines hierarchy: earlier = lower layer.
 */
const ARCHITECTURE_LAYERS = [
  // Layer 0: Pure types (no imports)
  { layer: 'types', dirs: ['types', 'interfaces', 'schemas'] },
  // Layer 1: Utilities (only types)
  { layer: 'utils', dirs: ['utils', 'helpers', 'shared', 'common', 'core'] },
  // Layer 2: Libraries (types, utils)
  { layer: 'lib', dirs: ['lib', 'libraries'] },
  // Layer 3: State & logic (types, utils, lib)
  { layer: 'hooks', dirs: ['hooks', 'composables'] },
  { layer: 'services', dirs: ['services', 'api', 'stores', 'state'] },
  // Layer 4: UI components (all above)
  { layer: 'components', dirs: ['components', 'ui'] },
  // Layer 5: Features (all above)
  { layer: 'features', dirs: ['features', 'modules', 'domains'] },
  // Layer 6: Entry points (can import everything)
  { layer: 'app', dirs: ['app', 'pages', 'views', 'routes', 'commands'] },
] as const;

type Layer = (typeof ARCHITECTURE_LAYERS)[number]['layer'];

/**
 * Hierarchy rules: what each layer can import
 * Lower layers have fewer import permissions
 */
const HIERARCHY: Record<Layer, Layer[]> = {
  types: [],
  utils: ['types'],
  lib: ['utils', 'types'],
  hooks: ['lib', 'utils', 'types'],
  services: ['lib', 'utils', 'types'],
  components: ['hooks', 'services', 'lib', 'utils', 'types'],
  features: ['components', 'hooks', 'services', 'lib', 'utils', 'types'],
  app: ['features', 'components', 'hooks', 'services', 'lib', 'utils', 'types'],
};

interface DetectedElement {
  layer: Layer;
  pattern: string; // glob pattern for boundaries config
  location: string; // human-readable location
}

export interface DetectedArchitecture {
  elements: DetectedElement[];
  isMonorepo: boolean;
}

/**
 * Find monorepo package directories
 * @param projectDirectory
 */
function findMonorepoPackages(projectDirectory: string): string[] {
  const packages: string[] = [];

  // Check common monorepo patterns
  const monorepoRoots = ['packages', 'apps', 'libs', 'modules'];

  for (const root of monorepoRoots) {
    const rootPath = nodePath.join(projectDirectory, root);
    if (!exists(rootPath)) continue;

    try {
      const entries = readdirSync(rootPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          packages.push(nodePath.join(root, entry.name));
        }
      }
    } catch {
      // Directory not readable, skip
    }
  }

  return packages;
}

/**
 * Check if a layer already exists for this path prefix
 * @param elements
 * @param layer
 * @param pathPrefix
 */
function hasLayerForPrefix(elements: DetectedElement[], layer: Layer, pathPrefix: string): boolean {
  return elements.some(
    element => element.layer === layer && element.pattern.startsWith(pathPrefix),
  );
}

/**
 * Scan a single search path for architecture layers
 * @param projectDirectory
 * @param searchPath
 * @param pathPrefix
 * @param elements
 */
function scanSearchPath(
  projectDirectory: string,
  searchPath: string,
  pathPrefix: string,
  elements: DetectedElement[],
): void {
  for (const layerDefinition of ARCHITECTURE_LAYERS) {
    for (const dirName of layerDefinition.dirs) {
      const fullPath = nodePath.join(projectDirectory, searchPath, dirName);
      if (exists(fullPath) && !hasLayerForPrefix(elements, layerDefinition.layer, pathPrefix)) {
        elements.push({
          layer: layerDefinition.layer,
          pattern: `${pathPrefix}${dirName}/**`,
          location: `${pathPrefix}${dirName}`,
        });
      }
    }
  }
}

/**
 * Scan a directory for architecture layers
 * @param projectDirectory
 * @param basePath
 */
function scanForLayers(projectDirectory: string, basePath: string): DetectedElement[] {
  const elements: DetectedElement[] = [];
  const prefix = basePath ? `${basePath}/` : '';

  // Check src/ and root level
  scanSearchPath(projectDirectory, nodePath.join(basePath, 'src'), `${prefix}src/`, elements);
  scanSearchPath(projectDirectory, basePath, prefix, elements);

  return elements;
}

/**
 * Detects architecture directories in the project
 * Handles both standard projects and monorepos
 * @param projectDirectory
 */
export function detectArchitecture(projectDirectory: string): DetectedArchitecture {
  const elements: DetectedElement[] = [];

  // First, check for monorepo packages
  const packages = findMonorepoPackages(projectDirectory);
  const isMonorepo = packages.length > 0;

  if (isMonorepo) {
    // Scan each package
    for (const pkg of packages) {
      elements.push(...scanForLayers(projectDirectory, pkg));
    }
  }

  // Also scan root level (works for both monorepo root and standard projects)
  elements.push(...scanForLayers(projectDirectory, ''));

  // Deduplicate by pattern
  const seen = new Set<string>();
  const uniqueElements = elements.filter(element => {
    if (seen.has(element.pattern)) return false;
    seen.add(element.pattern);
    return true;
  });

  return { elements: uniqueElements, isMonorepo };
}

/**
 * Format a single element for the config
 * @param el
 */
function formatElement(element: DetectedElement): string {
  return `      { type: '${element.layer}', pattern: '${element.pattern}', mode: 'full' }`;
}

/**
 * Format allowed imports for a rule
 * @param allowed
 */
function formatAllowedImports(allowed: Layer[]): string {
  return allowed.map(d => `'${d}'`).join(', ');
}

/**
 * Generate a single rule for what a layer can import
 * @param layer
 * @param detectedLayers
 */
function generateRule(layer: Layer, detectedLayers: Set<Layer>): string | undefined {
  const allowedLayers = HIERARCHY[layer];
  if (allowedLayers.length === 0) return undefined;

  const allowed = allowedLayers.filter(dep => detectedLayers.has(dep));
  if (allowed.length === 0) return undefined;

  return `        { from: ['${layer}'], allow: [${formatAllowedImports(allowed)}] }`;
}

/**
 * Build description of what was detected
 * @param arch
 */
function buildDetectedInfo(arch: DetectedArchitecture): string {
  if (arch.elements.length === 0) {
    return 'No architecture directories detected yet - add types/, utils/, components/, etc.';
  }
  const locations = arch.elements.map(element => element.location).join(', ');
  const monorepoNote = arch.isMonorepo ? ' (monorepo)' : '';
  return `Detected: ${locations}${monorepoNote}`;
}

/**
 *
 * @param arch
 */
export function generateBoundariesConfig(arch: DetectedArchitecture): string {
  const hasElements = arch.elements.length > 0;

  // Generate element definitions
  const elementsContent = arch.elements.map(element => formatElement(element)).join(',\n');

  // Generate rules (what each layer can import)
  const detectedLayers = new Set(arch.elements.map(element => element.layer));
  const rules = [...detectedLayers]
    .map(layer => generateRule(layer, detectedLayers))
    .filter((rule): rule is string => rule !== undefined);
  const rulesContent = rules.join(',\n');

  const detectedInfo = buildDetectedInfo(arch);

  return `/**
 * Architecture Boundaries Configuration (AUTO-GENERATED)
 *
 * ${detectedInfo}
 *
 * This enforces import boundaries between architectural layers:
 * - Lower layers (types, utils) cannot import from higher layers (components, features)
 * - Uses 'error' severity - LLMs ignore warnings, errors force compliance
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
  rules: {${
    hasElements
      ? `
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
${rulesContent}
      ],
    }],`
      : ''
  }
    'boundaries/no-unknown': 'off', // Allow files outside defined elements
    'boundaries/no-unknown-files': 'off', // Allow non-matching files
  },
};
`;
}
