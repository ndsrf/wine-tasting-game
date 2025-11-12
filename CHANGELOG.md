# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-26

### Added
- 🍷 Initial release of Wine Tasting Game
- 👥 Multiplayer wine tasting functionality with Director-Player model
- 🎯 Three difficulty levels: Novice, Intermediate, Sommelier
- 🔄 Real-time multiplayer with Socket.io
- 🤖 AI-powered wine characteristics generation using OpenAI
- 🔐 JWT authentication for directors
- 🎮 Complete game flow from creation to results
- 📱 Progressive Web App (PWA) support
- 🌍 Multi-language support (English, Spanish, French, German)
- 🎨 Modern UI with Tailwind CSS
- 🗄️ PostgreSQL database with Prisma ORM
- 💾 Redis caching for performance
- 🐳 Docker support with multi-platform builds
- 📊 Real-time scoring and leaderboards
- 🔗 QR code generation for easy game joining
- 📈 Director dashboard with game management
- 🎪 Wake Lock API for mobile devices to prevent screen timeout

### Technical
- Next.js 14 with TypeScript
- Custom server.js for Socket.io integration
- Prisma database schema for Users, Games, Wines, Players, Answers
- Socket.io events: join-game, start-game, change-phase, next-wine, submit-answer
- Environment-based configuration
- GitHub Actions CI/CD pipeline
- Automated Docker image builds

### Security
- JWT token authentication
- Secure headers configuration
- Input validation with Zod
- SQL injection prevention with Prisma
- XSS protection

[1.0.0]: https://github.com/ndsrf/wine-tasting-game/releases/tag/v1.0.0
