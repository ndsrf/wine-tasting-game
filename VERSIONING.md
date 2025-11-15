# Versioning Guide

This document describes the comprehensive versioning system implemented in the Wine Tasting Game application.

> **TL;DR**: Use `npm run version:patch` in feature branches (doesn't push tag), then push the tag after PR is merged. Use `npm run version:patch:push` on main branch for immediate releases.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
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
✅ **PR-Friendly**: Version bumps can be included in pull requests
✅ **Flexible Workflows**: Supports both feature branch and direct release workflows

### Key Features

- **Feature Branch Support**: Bump versions in feature branches without triggering releases
- **Controlled Tag Pushing**: Tags created locally, pushed when ready
- **No Auto-Push**: Uses `.npmrc` to prevent automatic tag pushing
- **Dual Workflow**: Choose between PR-based or direct release workflows

## Quick Start

### For Pull Requests (Recommended)

When working on a feature branch and want to include version bump in your PR:

```bash
# 1. Create your feature branch
git checkout -b feature/my-awesome-feature

# 2. Make changes with conventional commits
git commit -m "feat(game): add new scoring algorithm"
git commit -m "fix(ui): resolve button alignment issue"

# 3. Bump version (creates tag locally, doesn't push it)
npm run version:minor  # or patch/major
# This creates a single clean commit with just the version bump

# 4. Push your branch (tag stays local)
git push origin feature/my-awesome-feature

# 5. Create PR and get it merged

# 6. After PR is merged, push the tag to trigger release
git checkout main
git pull
git push origin v1.5.0  # Use the version number from step 3
# GitHub Actions will automatically generate CHANGELOG.md and create the release
```

### For Direct Releases (From Main Branch)

When you want to release immediately without a PR:

```bash
# 1. Ensure you're on main and up to date
git checkout main
git pull

# 2. Make your changes with conventional commits
git commit -m "feat(api): add new endpoint"

# 3. Bump version and release immediately
npm run version:minor:push  # or patch:push/major:push

# GitHub Actions will automatically:
# - Create a GitHub Release
# - Build Docker images
# - Update CHANGELOG.md
```

### Which Workflow Should I Use?

| Situation | Use |
|-----------|-----|
| Working in a team with PRs | **Feature Branch Workflow** |
| Small hotfix that needs immediate release | **Direct Release Workflow** |
| New feature that needs review | **Feature Branch Workflow** |
| Documentation updates | **Feature Branch Workflow** |
| Emergency security fix | **Direct Release Workflow** |

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

### Two Workflows: Feature Branch vs Main Branch

This project supports two different versioning workflows:

#### 1. Feature Branch Workflow (for Pull Requests)

**Use when**: Working on a feature branch and want to include version bump in your PR.

```bash
# Bump version (creates tag but doesn't push)
npm run version:patch  # or minor/major

# The CHANGELOG.md will be updated automatically
# Commit the changes to your branch
git add CHANGELOG.md
git commit --amend --no-edit

# Push your branch (but not the tag yet)
git push origin your-branch-name
```

**What happens**:
1. Version in `package.json` is bumped
2. Git commit is created with message: `chore: bump version to vX.X.X`
3. Git tag is created locally (e.g., `v1.0.1`)
4. **Tag is NOT pushed** (stays local until you push it)
5. **CHANGELOG.md is NOT updated locally** (generated by GitHub Actions when tag is pushed)

**When to push the tag**:
- Push the tag **only after your PR is merged to main**:
  ```bash
  # After PR is merged, fetch and checkout main
  git checkout main
  git pull
  
  # Push the tag to trigger release
  git push origin v1.0.1  # or use: git push --tags
  ```

#### 2. Main Branch Workflow (Direct Release)

**Use when**: Working directly on main branch and ready to release immediately.

```bash
# Bump version AND push tag in one command
npm run version:patch:push  # or minor:push/major:push
```

**What happens**:
1. Version in `package.json` is bumped
2. Git commit is created with message: `chore: bump version to vX.X.X`
3. Git tag is created
4. **Tag is automatically pushed** to GitHub
5. **Release workflow is triggered** immediately
6. **GitHub Actions generates CHANGELOG.md** and creates the release

### Manual Version Bump Commands

```bash
# For feature branches (doesn't push):
npm run version:patch   # 1.0.0 → 1.0.1 (Bug fixes)
npm run version:minor   # 1.0.0 → 1.1.0 (New features)
npm run version:major   # 1.0.0 → 2.0.0 (Breaking changes)

# For main branch (pushes tag automatically):
npm run version:patch:push
npm run version:minor:push
npm run version:major:push

# Show current version:
npm run version:current
```

### What Happens During Version Bump

1. **Ensures dependencies are installed** (automatically via `preversion` hook)
2. **Updates `package.json`** with new version
3. **Creates git commit** with message: `chore: bump version to vX.X.X`
4. **Creates git tag** (e.g., `v1.0.1`)
5. **Optionally pushes tag** (only if using `:push` variant)

When tag is pushed to GitHub:
- GitHub Actions release workflow is triggered
- **CHANGELOG.md is generated/updated** automatically from conventional commits
- GitHub Release is created with release notes
- Docker images are built and published
- Documentation is updated and committed back to main

### NPM Configuration (.npmrc)

The project uses `.npmrc` to control versioning behavior:

- **git-tag-version=true**: Creates git tags when bumping version
- **No auto-push**: Tags are created locally but not pushed automatically (unless using `:push` variant)
- **tag-version-prefix=v**: Tags are prefixed with 'v' (e.g., v1.0.1)

This configuration allows version bumps in feature branches without triggering releases prematurely.

### Automatic Dependency Installation

The `preversion` npm lifecycle hook automatically runs `npm install --ignore-scripts` before any version bump. This ensures:

- ✅ All dev dependencies are installed before version bump
- ✅ Version bump process works reliably across all environments
- ✅ No manual intervention needed to install dependencies
- ✅ The `--ignore-scripts` flag prevents running postinstall scripts during the version bump process

**Note**: This automatic installation step adds a few seconds to the version bump process, but ensures consistency across all environments.

### Changelog Generation

The CHANGELOG.md is **automatically generated by GitHub Actions** when you push a version tag. You don't need to update it locally:

- ✅ Changelog is generated from conventional commits on the server
- ✅ Automatically committed back to main branch
- ✅ Prevents merge conflicts and local git issues
- ✅ Single source of truth maintained by CI/CD

This means your local version bump is just a single clean commit with the version change in `package.json`.

### Automatic Version Detection

The version bump scripts use conventional commits to suggest the appropriate version:

- Any `feat` commits since last release → MINOR bump
- Any `fix` commits since last release → PATCH bump
- Any `feat!` or `BREAKING CHANGE` → MAJOR bump

## Release Process

### Option A: Release from Feature Branch (Recommended for PRs)

1. **Create feature branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** with conventional commits:
   ```bash
   git commit -m "feat(game): add new feature"
   git commit -m "fix(ui): resolve styling issue"
   ```

3. **Bump version before merging**:
   ```bash
   npm run version:patch  # or minor/major
   # This creates a clean commit with just the version bump
   ```

4. **Push branch** (tag stays local):
   ```bash
   git push origin feature/my-feature
   # Note: The tag is created locally but NOT pushed yet
   ```

5. **Create and merge PR**

6. **After merge, push tag** to trigger release:
   ```bash
   git checkout main
   git pull
   git push origin v1.x.x  # Replace with your version
   # This triggers GitHub Actions to generate changelog and create release
   ```

### Option B: Direct Release from Main Branch

1. **Ensure you're on main**:
   ```bash
   git checkout main
   git pull
   ```

2. **Make changes** with conventional commits:
   ```bash
   git commit -m "feat(game): add new feature"
   git commit -m "fix(ui): resolve styling issue"
   ```

3. **Bump version and release**:
   ```bash
   npm run version:patch:push  # or minor:push/major:push
   ```

4. **Automation takes over**:
   - Tag pushed to GitHub
   - GitHub Actions triggered
   - **CHANGELOG.md generated** from conventional commits
   - GitHub Release created with release notes
   - Docker images built and published
   - Updated documentation committed back to main

### What Gets Released

Each release includes:

- **GitHub Release** with auto-generated notes
- **CHANGELOG.md** with detailed changes
- **Docker Images** tagged with version
- **Git Tag** for version reference

## Automated Systems

### GitHub Actions Workflows

#### 1. Release Workflow (`.github/workflows/release.yml`)

**Trigger**: Git tags matching `v*` (e.g., `v1.0.1`)

**Actions**:
- Generates/updates CHANGELOG.md
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
- **Version Modal**: Shows full changelog from CHANGELOG.md (fetched from GitHub or local fallback)

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

### Version Bump in Feature Branch Issues

**Issue**: "I bumped version in my feature branch and it triggered a release prematurely"

**Solution**: When working in feature branches, use the regular version commands (without `:push`):
```bash
# In feature branch - creates tag locally but doesn't push
npm run version:patch

# Push your branch (not the tag)
git push origin your-branch-name

# After PR is merged, push the tag from main
git checkout main
git pull
git push origin v1.x.x
```

**Prevention**: Use `.npmrc` configuration (already set up) which prevents auto-push.

### Tag Already Exists

**Issue**: `tag 'v1.x.x' already exists`

**Solution**: If you need to change the version:
```bash
# Delete local tag
git tag -d v1.x.x

# Delete remote tag (if already pushed)
git push --delete origin v1.x.x

# Bump to correct version
npm run version:patch
```

### Version Bump Failed

**Error**: `Failed to push tags to remote`

**Solution**: This error no longer occurs with the updated configuration. Tags are not automatically pushed unless you use the `:push` variant:
```bash
# This creates tag but doesn't push (safe for feature branches)
npm run version:patch

# This pushes tag immediately (use on main branch only)
npm run version:patch:push
```

### Merge Conflicts in CHANGELOG.md

**Issue**: CHANGELOG.md has merge conflicts when merging feature branch

**Solution**: This should no longer happen since CHANGELOG.md is generated by GitHub Actions after the tag is pushed. If you still encounter this:
```bash
# The CHANGELOG.md in your branch can be safely ignored or removed
# GitHub Actions will regenerate it from scratch when the tag is pushed

# If needed, regenerate locally to resolve conflict:
npm run changelog:all

# Review and commit
git add CHANGELOG.md
git commit -m "chore: resolve changelog merge conflicts"
```

**Prevention**: With the current setup, CHANGELOG.md is only updated by GitHub Actions, so local conflicts should be rare.

### Release Not Triggered After Pushing Tag

**Issue**: Pushed tag but GitHub Actions didn't create release

**Solution**: 
1. Check that tag follows the pattern `v*` (e.g., `v1.0.1`, not `1.0.1`)
2. Verify GitHub Actions has necessary permissions
3. Check Actions tab on GitHub for any errors
4. Manually trigger release if needed:
   ```bash
   # Delete and recreate tag
   git tag -d v1.x.x
   git push --delete origin v1.x.x
   npm run version:patch:push
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

### CHANGELOG Missing Recent Versions

**Issue**: CHANGELOG.md doesn't include recent version releases

**Solution**: The changelog is generated from conventional commits. Regenerate it:
```bash
# Regenerate entire changelog from all tags
npm run changelog:all

# Or regenerate just the latest changes
npm run changelog
```

**Note**: Make sure you have fetched all tags:
```bash
git fetch --all --tags
npm run changelog:all
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
11. **Use feature branch workflow for PRs** - bump version in branch, push tag after merge
12. **Never use `:push` variants in feature branches** - only use on main branch for immediate releases

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
