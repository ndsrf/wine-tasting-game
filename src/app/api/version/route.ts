import { NextResponse } from 'next/server'
import { getVersionInfo } from '@/lib/version'

/**
 * GET /api/version
 * Returns version information about the application
 *
 * @returns JSON object with version, build time, and git commit
 */
export async function GET() {
  const versionInfo = getVersionInfo()

  return NextResponse.json({
    version: versionInfo.version,
    buildTime: versionInfo.buildTime,
    gitCommit: versionInfo.gitCommit,
    shortCommit: versionInfo.shortCommit,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}
