# Wine Tasting Game - Version History

## Version 1.4.0 (January 2025)

### Latest Release

**New Features:**
- Wine Tasting History: Players and directors can now view their past tasting sessions
  - Multilingual support for tasting history
  - Detailed game statistics and performance tracking
  - Accessible from director dashboard and player accounts
- Enhanced user navigation with home page links on director pages
- Improved authentication flow with redirect preservation across all pages

**Improvements:**
- Better user experience with consistent navigation patterns
- Enhanced Google OAuth integration on registration page
- Streamlined authentication redirect handling

**Technical Updates:**
- Updated version display system
- Improved TypeScript type safety across components

---

## Version 1.3.0 (January 2025)

### Wine Tasting History Feature

**Features:**
- Added comprehensive wine tasting history tracking
- Multilingual support for viewing past tastings
- Integration with user dashboard for easy access

---

## Version 1.2.1 (November 2024)

### Patch Release

**Bug Fixes:**
- Minor improvements to versioning system
- Documentation updates

---

## Version 1.2.0 (November 2024)

### Versioning System

**Features:**
- Comprehensive automated versioning system
- Automated changelog generation from conventional commits
- GitHub Actions integration for releases
- Docker image versioning and tagging
- Runtime version access via API and UI

**Technical:**
- Semantic versioning (SemVer) implementation
- Conventional commits enforcement
- Automated release workflow

---

## Version 1.1.0 (November 2024)

### Mobile Improvements & Versioning

**Features:**
- Wake Lock API integration to prevent screen timeout on mobile devices during games
- Eruda mobile console for on-device debugging
- Enhanced mobile reconnection handling
- Version tracking system with modal display

**Bug Fixes:**
- Fixed mobile screen timeout issues for directors
- Improved mobile device experience during long tasting sessions

---

## Version 1.0.1 (November 2024)

### First Patch Release

**Improvements:**
- GitHub Actions workflow fixes
- Docker tag format corrections
- CI/CD pipeline improvements

---

## Version 1.0.0 (October 26, 2025)

### Initial Release

**Features:**
- Complete multiplayer wine tasting game implementation
- Director-Player model with role-based functionality
- Three difficulty levels: Novice (3), Intermediate (5), and Sommelier (10) characteristics
- Real-time multiplayer synchronization using Socket.io
- AI-powered wine characteristic generation via OpenAI API
- Mobile-first responsive design with PWA support
- Multi-language support (English, Spanish, French, and German)
- Three tasting phases: Visual, Smell, and Taste characteristics
- Live scoring and results tracking
- Player session persistence and reconnection support
- Interactive hints system for players
- Comprehensive game results with detailed analytics

**Technical Stack:**
- Next.js 14 with TypeScript
- PostgreSQL database with Prisma ORM
- Redis for caching and session management
- Socket.io for WebSocket communication
- Tailwind CSS for styling
- OpenAI API integration

**Authentication:**
- JWT-based authentication for directors
- Google OAuth integration
- Session-based authentication for players

**Deployment:**
- Docker deployment support with Docker Compose
- VPS deployment compatibility
- Custom Node.js server for Socket.io support

---

**Current Version:** 1.4.0
**Release Date:** January 2025
**Status:** Stable

### What's New
See [CHANGELOG.md](CHANGELOG.md) for detailed changes.

### Technical Stack
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Prisma with PostgreSQL
- Socket.io for real-time communication
- OpenAI API for wine characteristics
- Redis for caching

### Features
- 🍷 Multiplayer wine tasting game
- 👥 Director-Player model
- 🎯 Three difficulty levels: Novice, Intermediate, Sommelier
- 🔄 Real-time multiplayer with Socket.io
- 🤖 AI-powered wine characteristics
- 📱 Progressive Web App (PWA) support
- 🌍 Multi-language support (English, Spanish, French, German)

### Deployment
- Docker support with multi-platform builds (amd64, arm64)
- Custom server.js for Socket.io integration
- Environment-based configuration
