/**
 * Application version information
 * These values are injected at build time from package.json and environment variables
 */

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0'
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown'
export const GIT_COMMIT = process.env.NEXT_PUBLIC_GIT_COMMIT || 'unknown'

/**
 * Get version information as an object
 */
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    buildTime: BUILD_TIME,
    gitCommit: GIT_COMMIT,
    shortCommit: GIT_COMMIT.substring(0, 7),
  }
}

/**
 * Get a formatted version string
 * @param includeCommit - Whether to include the git commit hash
 * @returns Formatted version string (e.g., "v1.0.0" or "v1.0.0 (abc1234)")
 */
export function getVersionString(includeCommit = false): string {
  if (includeCommit && GIT_COMMIT !== 'dev' && GIT_COMMIT !== 'unknown') {
    return `v${APP_VERSION} (${GIT_COMMIT.substring(0, 7)})`
  }
  return `v${APP_VERSION}`
}
