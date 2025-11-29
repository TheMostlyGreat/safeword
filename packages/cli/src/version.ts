import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Read version from package.json at runtime to avoid sync issues
function getVersion(): string {
  try {
    // Use createRequire for JSON import in ESM
    const require = createRequire(import.meta.url);
    const pkg = require('../package.json') as { version: string };
    return pkg.version;
  } catch {
    // Fallback for when running from dist (package.json is one level up)
    try {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const require = createRequire(join(__dirname, 'index.js'));
      const pkg = require('../package.json') as { version: string };
      return pkg.version;
    } catch {
      return '0.0.0';
    }
  }
}

export const VERSION = getVersion();
