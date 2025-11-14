# Claude Development Notes

This file contains information for Claude to understand the project structure and development workflow.

## Project Overview
Wine Tasting Game - A multiplayer web application for conducting wine tasting sessions.

## Tech Stack
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Prisma with PostgreSQL
- Socket.io for real-time communication
- LLM Integration for wine characteristics (supports OpenAI, Gemini, Anthropic)
- Redis for caching

## Development Commands

### Setup
```bash
npm install
npx prisma generate
npx prisma db push
```

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

### Database
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

### Versioning
```bash
npm run version:patch     # Bump patch version (1.0.0 -> 1.0.1)
npm run version:minor     # Bump minor version (1.0.0 -> 1.1.0)
npm run version:major     # Bump major version (1.0.0 -> 2.0.0)
npm run version:current   # Show current version
npm run changelog         # Generate changelog for new version
npm run changelog:all     # Regenerate entire changelog
```

## Commit Message Convention

**IMPORTANT:** This project uses [Conventional Commits](https://www.conventionalcommits.org/) specification. All commit messages MUST follow this format:

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types (REQUIRED)
- **feat**: A new feature (triggers MINOR version bump)
- **fix**: A bug fix (triggers PATCH version bump)
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, white-space, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **build**: Changes to build system or dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scope (Optional)
The scope specifies the part of the codebase affected:
- `auth`: Authentication related
- `game`: Game logic
- `ui`: User interface
- `api`: API endpoints
- `db`: Database related
- `socket`: Socket.io related
- `i18n`: Internationalization
- etc.

### Subject (REQUIRED)
- Use imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize first letter
- No period (.) at the end
- Max 100 characters

### Breaking Changes
For breaking changes that trigger MAJOR version bump:
```
feat!: remove support for Node 16

BREAKING CHANGE: Node 18 is now the minimum required version
```

### Examples

✅ **GOOD:**
```
feat(game): add sommelier difficulty level
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
refactor(socket): simplify event handler logic
perf(api): optimize database queries for games list
test(game): add unit tests for wine generation
ci(actions): add automated release workflow
```

❌ **BAD:**
```
Added new feature                    # Missing type and unclear
Fixed bug                            # Too vague
Update code                          # No type, unclear what changed
feat: Added new feature.             # Should be imperative mood, no period
FIX: bug fix                         # Type should be lowercase
```

### Why This Matters
1. **Automated Changelog**: Changelog is auto-generated from commit messages
2. **Version Bumping**: Commit types determine version increments
3. **Release Notes**: GitHub releases use commit messages
4. **Code History**: Clear, searchable commit history
5. **CI/CD**: Workflows trigger based on commit types

### Enforcement
- Git hooks validate commit messages before commit
- CI pipeline checks commit format on pull requests
- Invalid commits will be rejected

### Version Release Process
1. Make changes with conventional commits
2. When ready to release: `npm run version:patch` (or minor/major)
3. This will:
   - Update version in package.json
   - Create a git commit
   - Create a git tag (e.g., v1.0.1)
   - Push to GitHub
4. GitHub Actions automatically:
   - Generates changelog
   - Creates GitHub Release
   - Builds and publishes Docker images
   - Updates documentation

### Quick Reference
```bash
# Examples for Claude Code
git commit -m "feat(game): add wine pairing suggestions"
git commit -m "fix(socket): resolve connection timeout on mobile"
git commit -m "docs(api): add JSDoc comments to game endpoints"
git commit -m "refactor(ui): extract WineCard component"
git commit -m "perf(db): add index on game code column"
```

## Architecture Notes

### Authentication
- JWT tokens for directors
- Session-based for players (no registration required)
- Google OAuth integration placeholder

### Real-time Communication
- Socket.io for game state synchronization
- Events: join-game, start-game, change-phase, next-wine, submit-answer

### Game Flow
1. Director creates game → generates 5-char code
2. Players join with code + nickname
3. Real-time game progression through phases
4. Results and scoring at the end

### Database Design
- Users (directors only)
- Games (with status: CREATED, IN_PROGRESS, FINISHED)
- Wines (with AI-generated characteristics)
- Players (game-specific, no global accounts)
- Answers (player responses with correctness)

## Important Files

### Configuration
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS setup
- `prisma/schema.prisma` - Database schema
- `package.json` - Dependencies and scripts

### Core Logic
- `src/lib/socket.ts` - Socket.io server logic
- `src/lib/llm/` - LLM provider abstraction layer (OpenAI, Gemini, Anthropic)
- `src/lib/openai.ts` - Legacy LLM integration (now delegates to providers)
- `src/lib/auth.ts` - Authentication utilities
- `src/hooks/useSocket.ts` - Socket client hook

### API Routes
- `src/app/api/auth/*` - Authentication endpoints
- `src/app/api/games/*` - Game management endpoints

### UI Components
- `src/components/ui/*` - Reusable UI components
- `src/app/page.tsx` - Landing page
- `src/app/director/*` - Director dashboard
- `src/app/game/[code]/*` - Player interface

## Environment Variables Required

### Core Requirements
- DATABASE_URL (PostgreSQL)
- REDIS_URL (Redis server)
- JWT_SECRET (JWT signing)
- NEXTAUTH_SECRET (NextAuth)

### LLM Provider Configuration
The application supports multiple LLM providers for wine characteristic generation:

#### Provider Selection
- **LLM_PROVIDER** - Choose provider: "openai" (default), "gemini", or "anthropic"

#### OpenAI (default)
- **OPENAI_API_KEY** - API key from https://platform.openai.com/api-keys
- **OPENAI_MODEL** - Model to use (default: "gpt-4")
  - Options: gpt-4, gpt-4-turbo-preview, gpt-3.5-turbo

#### Google Gemini
- **GEMINI_API_KEY** - API key from https://makersuite.google.com/app/apikey
- **GEMINI_MODEL** - Model to use (default: "gemini-1.5-pro")
  - Options: gemini-1.5-pro, gemini-1.5-flash, gemini-pro

#### Anthropic Claude
- **ANTHROPIC_API_KEY** - API key from https://console.anthropic.com/settings/keys
- **ANTHROPIC_MODEL** - Model to use (default: "claude-3-5-sonnet-20241022")
  - Options: claude-3-5-sonnet-20241022, claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307

### Optional
- GOOGLE_CLIENT_ID/SECRET (Google OAuth - optional)

## Deployment Notes
- Requires custom server.js for Socket.io integration (not compatible with serverless platforms)
- PWA manifest and service worker included
- Multi-language support (en, es, fr, de)

## Common Tasks
- **Switching LLM providers**: Set `LLM_PROVIDER` environment variable to "openai", "gemini", or "anthropic"
- **Adding new LLM providers**: Create a new provider class in `src/lib/llm/providers/` implementing the `LLMProvider` interface
- **Adding new wine characteristics**: Update wine-options.ts and LLM provider prompts in `src/lib/llm/providers/`
- **Adding new languages**: Update `src/lib/i18n.ts`
- **Modifying game rules**: Update Socket.io events in `src/lib/socket.ts`
- **Styling changes**: Use Tailwind classes, custom CSS in `src/app/globals.css`

## Known Limitations
- Google OAuth integration is placeholder (needs proper setup)
- PWA icons need to be generated

## LLM Provider Architecture

### Overview
The application uses an abstraction layer to support multiple LLM providers (OpenAI, Gemini, Anthropic). This allows easy switching between providers without changing application code.

### Structure
```
src/lib/llm/
├── index.ts              # Factory function to get configured provider
├── types.ts              # LLMProvider interface and types
└── providers/
    ├── openai.ts         # OpenAI implementation
    ├── gemini.ts         # Google Gemini implementation
    └── anthropic.ts      # Anthropic Claude implementation
```

### Usage
The LLM provider is automatically selected based on the `LLM_PROVIDER` environment variable. All wine characteristic generation, explanations, and hints are handled through this abstraction layer.

### Adding a New Provider
1. Create a new file in `src/lib/llm/providers/`
2. Implement the `LLMProvider` interface from `types.ts`
3. Add the provider to the factory function in `index.ts`
4. Update environment variables documentation