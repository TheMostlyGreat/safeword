/**
 * Go Language Pack - Schema Definitions
 *
 * Go-specific file definitions.
 * Imported by schema.ts and spread into SAFEWORD_SCHEMA.
 */

import type { ManagedFileDefinition } from '../../schema.js';
import { generateGolangciConfig } from './setup.js';

// ============================================================================
// Managed Files (create if missing, update if matches template)
// ============================================================================

export const golangManagedFiles: Record<string, ManagedFileDefinition> = {
  // Project-level Go linter config (created only if no existing golangci config)
  '.golangci.yml': {
    generator: ctx => {
      // Skip if project already has golangci config (safeword will use .safeword/.golangci.yml)
      if (ctx.projectType.existingGolangciConfig) return null;
      if (!ctx.languages?.golang) return null;
      return generateGolangciConfig();
    },
  },
};
