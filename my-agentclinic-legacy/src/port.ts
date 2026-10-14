export const DEFAULT_PORT = 3000

/**
 * Parses the PORT environment variable. Unset or blank means the default port;
 * 0 asks the OS for a free port. Anything else that isn't a valid port throws.
 */
export function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return DEFAULT_PORT

  const port = Number(value)
  if (!/^\d+$/.test(value.trim()) || port > 65535) {
    throw new Error(`Invalid PORT "${value}": expected an integer from 0 to 65535.`)
  }
  return port
}
