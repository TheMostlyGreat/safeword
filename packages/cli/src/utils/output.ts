/**
 * Console output utilities for consistent CLI messaging
 */

/**
 * Print info message
 * @param message
 */
export function info(message: string): void {
  console.log(message);
}

/**
 * Print success message
 * @param message
 */
export function success(message: string): void {
  console.log(`✓ ${message}`);
}

/**
 * Print warning message
 * @param message
 */
export function warn(message: string): void {
  console.warn(`⚠ ${message}`);
}

/**
 * Print error message to stderr
 * @param message
 */
export function error(message: string): void {
  console.error(`✗ ${message}`);
}

/**
 * Print a blank line
 */
export function blank(): void {
  console.log('');
}

/**
 * Print a section header
 * @param title
 */
export function header(title: string): void {
  console.log(`\n${title}`);
  console.log('─'.repeat(title.length));
}

/**
 * Print a list item
 * @param item
 * @param indent
 */
export function listItem(item: string, indent = 2): void {
  console.log(`${' '.repeat(indent)}• ${item}`);
}

/**
 * Print key-value pair
 * @param key
 * @param value
 */
export function keyValue(key: string, value: string): void {
  console.log(`  ${key}: ${value}`);
}
