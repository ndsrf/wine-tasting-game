# Claude Development Notes

This file contains information for Claude to understand the project structure and development workflow.

## Project Overview
Wine Tasting Game - A multiplayer web application for conducting wine tasting sessions.

## Tech Stack
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Prisma with PostgreSQL
- Socket.io for real-time communication
- OpenAI API for wine characteristics
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
- `src/lib/openai.ts` - OpenAI integration
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
- DATABASE_URL (PostgreSQL)
- REDIS_URL (Redis server)
- OPENAI_API_KEY (OpenAI API)
- JWT_SECRET (JWT signing)
- NEXTAUTH_SECRET (NextAuth)
- GOOGLE_CLIENT_ID/SECRET (Google OAuth - optional)

## Deployment Notes
- Designed for Vercel deployment
- Custom server.js for Socket.io integration
- PWA manifest and service worker included
- Multi-language support (en, es, fr, de)

## Common Tasks
- Adding new wine characteristics: Update `src/lib/openai.ts`
- Adding new languages: Update `src/lib/i18n.ts`
- Modifying game rules: Update Socket.io events in `src/lib/socket.ts`
- Styling changes: Use Tailwind classes, custom CSS in `src/app/globals.css`

## Known Limitations
- Google OAuth integration is placeholder (needs proper setup)
- PWA icons need to be generated
- Some game interface elements are placeholder pending full OpenAI integration