# Versioning Guide

This document describes the comprehensive versioning system implemented in the Wine Tasting Game application.

## Table of Contents

- [Overview](#overview)
- [Semantic Versioning](#semantic-versioning)
- [Conventional Commits](#conventional-commits)
- [Version Bumping](#version-bumping)
- [Release Process](#release-process)
- [Automated Systems](#automated-systems)
- [Version Access](#version-access)
- [Docker Image Versioning](#docker-image-versioning)
- [Troubleshooting](#troubleshooting)

## Overview

The Wine Tasting Game uses a comprehensive, automated versioning system that:

✅ **Single Source of Truth**: Version defined in `package.json` only
✅ **Semantic Versioning**: Follows [SemVer](https://semver.org/) (MAJOR.MINOR.PATCH)
✅ **Conventional Commits**: Standardized commit message format
✅ **Automated Changelog**: Generated from commit history
✅ **GitHub Releases**: Automatically created with release notes
✅ **Docker Images**: Tagged with version numbers
✅ **Runtime Access**: Version available via environment variables and API

## Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR** (1.x.x): Breaking changes that require user action
- **MINOR** (x.1.x): New features that are backwards-compatible
- **PATCH** (x.x.1): Bug fixes that are backwards-compatible

### Examples

| Version Change | Type | Example |
|---------------|------|---------|
| 1.0.0 → 2.0.0 | MAJOR | Removed Node 16 support, now requires Node 18+ |
| 1.0.0 → 1.1.0 | MINOR | Added wine pairing suggestion feature |
| 1.0.0 → 1.0.1 | PATCH | Fixed socket connection timeout issue |

## Conventional Commits

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Commit Types

| Type | Description | Version Impact | Example |
|------|-------------|----------------|---------|
| `feat` | New feature | MINOR | `feat(game): add sommelier mode` |
| `fix` | Bug fix | PATCH | `fix(auth): resolve token expiration` |
| `docs` | Documentation | None | `docs(readme): update installation` |
| `style` | Code style/formatting | None | `style(ui): fix button alignment` |
| `refactor` | Code refactoring | None | `refactor(api): simplify error handling` |
| `perf` | Performance improvement | PATCH | `perf(db): optimize game queries` |
| `test` | Test changes | None | `test(game): add wine generation tests` |
| `build` | Build system changes | None | `build(deps): update next to 14.2.6` |
| `ci` | CI/CD changes | None | `ci(actions): add release workflow` |
| `chore` | Maintenance tasks | None | `chore(deps): update dependencies` |
| `revert` | Revert previous commit | Depends | `revert: revert "feat: add feature"` |

### Breaking Changes

For breaking changes (MAJOR version bump), add `!` after type:

```bash
feat!: remove Node 16 support

BREAKING CHANGE: Node 18 is now the minimum required version.
Update your environment before upgrading.
```

### Commit Scope

Recommended scopes for this project:

- `game`: Game logic and mechanics
- `auth`: Authentication and authorization
- `ui`: User interface components
- `api`: API endpoints
- `socket`: Socket.io real-time functionality
- `db`: Database and Prisma
- `i18n`: Internationalization
- `docker`: Docker and deployment
- `ci`: CI/CD workflows

### Good Commit Examples

✅ **GOOD:**
```bash
feat(game): add wine pairing suggestions to results
fix(socket): resolve connection timeout on mobile devices
docs(api): add JSDoc comments to game endpoints
refactor(ui): extract WineCard component for reusability
perf(db): add index on game code column for faster lookups
test(auth): add unit tests for JWT token validation
ci(actions): add automated release workflow
build(deps): update next from 14.2.5 to 14.2.6
```

❌ **BAD:**
```bash
Added new feature                    # Missing type, unclear
Fixed bug                            # Too vague
Update                               # No context
feat: Added new feature.             # Should be imperative, no period
FIX: bug fix                         # Type should be lowercase
feature: new game mode               # Type should be 'feat' not 'feature'
```

### Commit Message Validation

Commit messages are validated by:
1. **Husky Git Hook**: Validates locally before commit
2. **commitlint**: Enforces conventional commit format
3. **CI Pipeline**: Checks all commits in PRs

Invalid commits will be rejected with an error message.

## Version Bumping

### Manual Version Bump

Use npm scripts to bump versions:

```bash
# Patch version (1.0.0 → 1.0.1) - Bug fixes
npm run version:patch

# Minor version (1.0.0 → 1.1.0) - New features
npm run version:minor

# Major version (1.0.0 → 2.0.0) - Breaking changes
npm run version:major

# Show current version
npm run version:current
```

### What Happens When You Bump Version

1. **Updates `package.json`** with new version
2. **Creates git commit** with message: `chore: bump version to vX.X.X`
3. **Creates git tag** (e.g., `v1.0.1`)
4. **Pushes commit and tag** to GitHub
5. **Triggers GitHub Actions** for automated release

### Automatic Version Detection

The version bump scripts use conventional commits to suggest the appropriate version:

- Any `feat` commits since last release → MINOR bump
- Any `fix` commits since last release → PATCH bump
- Any `feat!` or `BREAKING CHANGE` → MAJOR bump

## Release Process

### Step-by-Step Release

1. **Make changes** with conventional commits:
   ```bash
   git commit -m "feat(game): add new feature"
   git commit -m "fix(ui): resolve styling issue"
   ```

2. **Check what will be released**:
   ```bash
   git log $(git describe --tags --abbrev=0)..HEAD --oneline
   ```

3. **Bump version** (choose appropriate level):
   ```bash
   npm run version:patch  # or minor/major
   ```

4. **Automation takes over**:
   - Tag pushed to GitHub
   - GitHub Actions triggered
   - Changelog generated
   - GitHub Release created
   - Docker images built and published
   - Documentation updated

### What Gets Released

Each release includes:

- **GitHub Release** with auto-generated notes
- **CHANGELOG.md** with detailed changes
- **Docker Images** tagged with version
- **Updated VERSION.md** files
- **Git Tag** for version reference

## Automated Systems

### GitHub Actions Workflows

#### 1. Release Workflow (`.github/workflows/release.yml`)

**Trigger**: Git tags matching `v*` (e.g., `v1.0.1`)

**Actions**:
- Generates/updates CHANGELOG.md
- Updates VERSION.md files
- Creates GitHub Release with notes
- Links to Docker images
- Commits updated docs

#### 2. Docker Build Workflow (`.github/workflows/docker-build.yml`)

**Trigger**: Git tags matching `v*`, pushes to main/develop

**Actions**:
- Builds Docker images (multi-platform)
- Tags with semantic versions
- Pushes to GitHub Container Registry
- Links to release

### Automatic Changelog Generation

Changelogs are generated from conventional commits:

```bash
# Generate changelog for upcoming release
npm run changelog

# Regenerate entire changelog
npm run changelog:all
```

The changelog groups commits by type:
- **Features** (`feat`)
- **Bug Fixes** (`fix`)
- **Performance Improvements** (`perf`)
- **Breaking Changes** (`BREAKING CHANGE`)

## Version Access

### In Application Code

```typescript
import { APP_VERSION, getVersionInfo, getVersionString } from '@/lib/version'

// Simple version string
console.log(APP_VERSION)  // "1.0.0"

// Formatted version string
console.log(getVersionString())  // "v1.0.0"
console.log(getVersionString(true))  // "v1.0.0 (abc1234)"

// Full version info
const info = getVersionInfo()
// {
//   version: "1.0.0",
//   buildTime: "2025-10-26T12:00:00.000Z",
//   gitCommit: "abc1234567890",
//   shortCommit: "abc1234"
// }
```

### Via API Endpoint

```bash
# Get version information
curl https://yourdomain.com/api/version

# Response:
{
  "version": "1.0.0",
  "buildTime": "2025-10-26T12:00:00.000Z",
  "gitCommit": "abc1234567890",
  "shortCommit": "abc1234"
}
```

### In UI

- **Footer**: Click version number (e.g., `v1.0.0`) in footer
- **Version Modal**: Shows full version history from VERSION.md

### Environment Variables

Available at build time:
- `NEXT_PUBLIC_APP_VERSION`: Version from package.json
- `NEXT_PUBLIC_BUILD_TIME`: ISO timestamp of build
- `NEXT_PUBLIC_GIT_COMMIT`: Git commit SHA

## Docker Image Versioning

Docker images are automatically tagged with multiple formats:

```bash
# Specific version
ghcr.io/ndsrf/wine-tasting-game:1.0.0

# Major.Minor
ghcr.io/ndsrf/wine-tasting-game:1.0

# Major only
ghcr.io/ndsrf/wine-tasting-game:1

# Latest stable
ghcr.io/ndsrf/wine-tasting-game:latest

# Branch name
ghcr.io/ndsrf/wine-tasting-game:main
ghcr.io/ndsrf/wine-tasting-game:develop

# Git SHA
ghcr.io/ndsrf/wine-tasting-game:sha-abc1234
```

### Pull Specific Version

```bash
# Pull exact version
docker pull ghcr.io/ndsrf/wine-tasting-game:1.0.0

# Pull latest 1.x.x version
docker pull ghcr.io/ndsrf/wine-tasting-game:1

# Pull latest stable
docker pull ghcr.io/ndsrf/wine-tasting-game:latest
```

## Troubleshooting

### Commit Message Rejected

**Error**: `commit message doesn't follow conventional commits format`

**Solution**: Fix commit message format:
```bash
# Bad
git commit -m "Added feature"

# Good
git commit -m "feat(game): add wine pairing suggestions"
```

### Version Bump Failed

**Error**: `Failed to push tags to remote`

**Solution**: Ensure you have push permissions and are on the correct branch:
```bash
git fetch origin
git pull origin main
npm run version:patch
```

### Docker Image Not Found

**Error**: `unable to find image 'ghcr.io/ndsrf/wine-tasting-game:1.0.1'`

**Solution**: Wait for GitHub Actions to complete building the image (usually 5-10 minutes after pushing tag). Check Actions tab on GitHub.

### Version Mismatch

**Issue**: UI shows different version than package.json

**Solution**: Rebuild the application to inject new version:
```bash
npm run build
```

### Changelog Not Updating

**Issue**: Changelog.md not showing new commits

**Solution**: Ensure commits follow conventional format:
```bash
# Check recent commits
git log --oneline -10

# Regenerate changelog
npm run changelog:all
```

### Husky Hooks Not Working

**Issue**: Commits not being validated

**Solution**: Reinstall husky hooks:
```bash
npm run prepare
chmod +x .husky/commit-msg
```

## Best Practices

1. **Write descriptive commit messages** that explain the "why" not just the "what"
2. **Use appropriate commit types** based on the change impact
3. **Add breaking change footer** for any incompatible changes
4. **Keep commits atomic** - one logical change per commit
5. **Test before releasing** - ensure all tests pass
6. **Review changelog** before creating release
7. **Document breaking changes** in commit message and release notes
8. **Use scopes consistently** for better changelog organization
9. **Follow semantic versioning strictly** for predictable releases
10. **Communicate breaking changes** to users in advance

## Additional Resources

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [commitlint](https://commitlint.js.org/)
- [Husky](https://typicode.github.io/husky/)

## Support

For questions about versioning:
- Check this document first
- Review [CLAUDE.md](CLAUDE.md) for commit examples
- See [CHANGELOG.md](CHANGELOG.md) for version history
- Create an issue on GitHub for support
