# Wine Tasting Game

**Version:** 1.0.0

A multiplayer web application for conducting wine tasting sessions where players guess wine characteristics across visual, smell, and taste categories.

## Features

- **Director-Player Model**: Directors create and manage games, players join with simple codes
- **Multi-difficulty Levels**: Novice (3), Intermediate (5), Sommelier (10) characteristics per category
- **Real-time Multiplayer**: WebSocket-based synchronization for live gameplay
- **AI-Powered Wine Characteristics**: OpenAI integration generates realistic wine profiles
- **Mobile-First Design**: PWA with offline capabilities and mobile optimization
- **Multi-language Support**: English, Spanish, French, and German
- **SEO Optimized**: Server-side rendering with comprehensive meta tags

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management and game state
- **AI**: OpenAI API for wine characteristic generation
- **Authentication**: JWT + Google OAuth
- **Deployment**: Docker deployment or VPS with custom Node.js server

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis server
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wine-tasting-game
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Fill in your database URLs, API keys, and secrets
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wine_tasting_db"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret-here"

# Google OAuth (optional)
# To configure Google OAuth, follow these steps:
# 1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials
# 2. Create a new project or select an existing one
# 3. Go to "APIs & Services" > "Credentials"
# 4. Click "Create Credentials" > "OAuth client ID"
# 5. Select "Web application" as the application type
# 6. Under "Authorized JavaScript origins", add:
#    - http://localhost:3000 (for development)
#    - https://yourdomain.com (for production)
# 7. Under "Authorized redirect URIs" (optional for @react-oauth/google):
#    - http://localhost:3000 (for development)
#    - https://yourdomain.com (for production)
# 8. Click "Create" and copy your Client ID and Client Secret
#
# IMPORTANT: All three environment variables below are required:
# - GOOGLE_CLIENT_ID: Server-side authentication (verifies ID tokens)
# - GOOGLE_CLIENT_SECRET: Server-side authentication
# - NEXT_PUBLIC_GOOGLE_CLIENT_ID: Client-side Google Login button (must have NEXT_PUBLIC_ prefix)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"

# LLM Provider Configuration
# Choose LLM provider: "openai" (default), "gemini", or "anthropic"
LLM_PROVIDER="openai"

# OpenAI Configuration
# Get API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-your-openai-api-key-here"
# Model to use (default: gpt-4)
# Options: gpt-4, gpt-4-turbo-preview, gpt-3.5-turbo
OPENAI_MODEL="gpt-4"

# Google Gemini Configuration (only needed if LLM_PROVIDER="gemini")
# Get API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY="your-gemini-api-key-here"
# Model to use (default: gemini-1.5-pro)
# Options: gemini-1.5-pro, gemini-1.5-flash, gemini-pro
GEMINI_MODEL="gemini-1.5-pro"

# Anthropic Configuration (only needed if LLM_PROVIDER="anthropic")
# Get API key from: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key-here"
# Model to use (default: claude-3-5-sonnet-20241022)
# Options: claude-3-5-sonnet-20241022, claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

# Redis
REDIS_URL="redis://localhost:6379"

# Environment
NODE_ENV="development"
```

## Game Flow

### For Directors

1. **Register/Login**: Create an account to manage games
2. **Create Game**: Set difficulty, number of wines, and wine details
3. **Share Code**: Distribute the 5-character game code to players
4. **Manage Game**: Control game phases and progression
5. **View Results**: Access final scores and detailed answer analysis

### For Players

1. **Join Game**: Enter game code and nickname (no registration required)
2. **Wait for Start**: See other players joining in real-time
3. **Play Rounds**: Guess wine characteristics across three phases per wine:
   - Visual characteristics
   - Smell characteristics
   - Taste characteristics
4. **See Results**: View final rankings and correct answers

## API Endpoints

### Authentication
- `POST /api/auth/register` - Director registration
- `POST /api/auth/login` - Director login
- `POST /api/auth/google` - Google OAuth authentication

### Games
- `POST /api/games/create` - Create new game (directors only)
- `GET /api/games/[code]` - Get game details
- `GET /api/games/[code]/results` - Get game results (finished games only)

## WebSocket Events

### Client to Server
- `join-game` - Join a game as player or director
- `start-game` - Start the game (directors only)
- `change-phase` - Change current phase (directors only)
- `next-wine` - Move to next wine (directors only)
- `submit-answer` - Submit player answers

### Server to Client
- `game-state` - Current game state
- `player-joined` - New player joined
- `game-started` - Game has started
- `phase-changed` - Phase transition
- `wine-changed` - Wine transition
- `answer-submitted` - Answer submission confirmation
- `error` - Error messages

## Database Schema

### Core Tables
- **users**: Director accounts and authentication
- **games**: Game instances with settings and status
- **wines**: Wine details and AI-generated characteristics
- **players**: Player information and scores
- **answers**: Player responses and correctness

### Key Relationships
- Games belong to directors (users)
- Wines belong to games
- Players belong to games
- Answers link players to wines with characteristic types

## Deployment

**Note**: This application uses Socket.io for real-time functionality, which requires a persistent WebSocket connection. It is **not compatible** with serverless platforms like Vercel, AWS Lambda, or Netlify Functions. Deploy to a VPS or container platform instead.

### Docker Deployment

Public Docker images are available at `ghcr.io/ndsrf/wine-tasting-game`.

#### Option 1: Docker Compose (Recommended)

This method is recommended as it automatically sets up the application, PostgreSQL database, and Redis cache.

1.  Create a directory for your deployment, and `cd` into it.
    ```bash
    mkdir wine-tasting
    cd wine-tasting
    ```

2.  Create an `.env` file. You can use `.env.example` from the repository as a template. **Important:** For Docker Compose, ensure your `DATABASE_URL` and `REDIS_URL` point to the service names (`postgres` and `redis` respectively), as shown in the example `.env` content in `DOCKER_DEPLOYMENT.md`.

3.  Download the `docker-compose.yml` file from the repository:
    ```bash
    wget https://raw.githubusercontent.com/ndsrf/wine-tasting-game/main/docker-compose.yml
    ```

4.  Pull the latest images and start the services in detached mode:
    ```bash
    docker-compose pull
    docker-compose up -d
    ```

5.  Initialize the database by running the Prisma migration inside the running `app` container:
    ```bash
    docker-compose exec app npx prisma db push
    ```

Your application should now be running and accessible at `http://localhost:3000`.

#### Option 2: Standalone Docker Container

Use this option if you are managing your own PostgreSQL and Redis instances.

1.  Ensure you have a `.env` file ready and that the `DATABASE_URL` and `REDIS_URL` variables point to your existing database and Redis server.

2.  Pull the latest image from the GitHub Container Registry:
    ```bash
    docker pull ghcr.io/ndsrf/wine-tasting-game:latest
    ```

3.  Run the container, making sure to pass your environment file:
    ```bash
    docker run -p 3000:3000 --env-file .env --name wine-tasting-app ghcr.io/ndsrf/wine-tasting-game:latest
    ```

4.  Initialize the database. You can do this by executing a command inside the running container:
    ```bash
    docker exec wine-tasting-app npx prisma db push
    ```

### VPS Deployment (DigitalOcean, Linode, AWS EC2, etc.)

```bash
# SSH into your server
ssh user@your-server-ip

# Clone repository
git clone <repository-url>
cd wine-tasting-game

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
nano .env  # Edit with your values

# Set up database
npx prisma generate
npx prisma db push

# Build for production
npm run build

# Start production server (use PM2 for process management)
npm install -g pm2
pm2 start npm --name "wine-tasting" -- start
pm2 save
pm2 startup
```

## Development

### Scripts

#### Development
- `npm run dev` - Development server with hot reload
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - ESLint check
- `npm run typecheck` - TypeScript type checking

#### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

#### Versioning
- `npm run version:patch` - Bump patch version (1.0.0 → 1.0.1)
- `npm run version:minor` - Bump minor version (1.0.0 → 1.1.0)
- `npm run version:major` - Bump major version (1.0.0 → 2.0.0)
- `npm run changelog` - Generate changelog for new version
- `npm run changelog:all` - Regenerate entire changelog

### Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── director/       # Director dashboard and game management
│   ├── game/           # Player game interface
│   └── globals.css     # Global styles
├── components/         # Reusable React components
│   └── ui/            # Base UI components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
│   ├── auth.ts        # Authentication utilities
│   ├── openai.ts      # OpenAI integration
│   ├── prisma.ts      # Database client
│   ├── redis.ts       # Redis client
│   └── socket.ts      # Socket.io server logic
└── types/             # TypeScript type definitions
```

## Versioning

This project follows [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards-compatible)
- **PATCH**: Bug fixes (backwards-compatible)

### Version Information
- Current version displayed in UI footer (click for history)
- API endpoint: `GET /api/version`
- Docker images tagged with version numbers

### Release Process
Releases are automated via GitHub Actions:
1. Commit changes using [Conventional Commits](#commit-conventions)
2. Run `npm run version:patch|minor|major`
3. Push tags to GitHub
4. GitHub Actions automatically:
   - Generates changelog
   - Creates GitHub Release
   - Builds and publishes Docker images
   - Updates documentation

See [VERSIONING.md](VERSIONING.md) for detailed information.

## Contributing

### Commit Conventions

**This project uses [Conventional Commits](https://www.conventionalcommits.org/).** All commit messages must follow this format:

```
<type>(<scope>): <subject>
```

**Types:**
- `feat`: New feature (→ MINOR version bump)
- `fix`: Bug fix (→ PATCH version bump)
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test changes
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(game): add wine pairing suggestions
fix(auth): resolve JWT token expiration
docs(readme): update deployment instructions
refactor(socket): simplify event handlers
```

For breaking changes, add `!` after type:
```bash
feat!: remove support for Node 16

BREAKING CHANGE: Node 18 is now required
```

See [CLAUDE.md](CLAUDE.md) for detailed commit guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Commit using conventional commits: `git commit -m "feat(scope): description"`
5. Push to branch: `git push origin feature-name`
6. Submit a pull request

### Commit Message Validation
- Git hooks validate commit messages locally
- CI pipeline checks commit format on PRs
- Invalid commits will be rejected

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API endpoints and WebSocket events

## Roadmap

- [ ] Advanced analytics and game statistics
- [ ] Tournament mode with multiple rounds
- [ ] Wine recommendation system
- [ ] Social features and friend systems
- [ ] Custom wine databases
- [ ] Enhanced mobile app with native features