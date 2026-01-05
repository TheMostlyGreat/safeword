// Public API exports
export type { ProjectType } from "./utils/project-detector.js";
export { VERSION } from "./version.js";

// ESLint presets (also available via safeword/eslint subpath export)
export { eslintPlugin as eslint } from "./presets/typescript/index.js";
export { detect } from "./presets/typescript/detect.js";
