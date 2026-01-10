/**
 * Safeword custom ESLint rules
 */

import noAccumulatingSpread from './no-accumulating-spread.js';
import noIncompleteErrorHandling from './no-incomplete-error-handling.js';
import noReExportAll from './no-re-export-all.js';

export const rules = {
  'no-accumulating-spread': noAccumulatingSpread,
  'no-incomplete-error-handling': noIncompleteErrorHandling,
  'no-re-export-all': noReExportAll,
};
