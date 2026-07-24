# Open Plan Poker

A real-time planning poker application built with Vue 3, Node.js/Express, and PostgreSQL.

## Overview

Open Plan Poker enables distributed teams to collaboratively estimate user stories using the Fibonacci card deck. Features include:

- Real-time voting with WebSocket support
- Session-based management with unique slug URLs
- Story/Epic/Task hierarchy support
- Markdown import/export
- Chat integration
- Automatic session expiration (30 minutes inactivity)

## Stack

- **Frontend**: Vue 3 with Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.io
- **Testing**: Jest (backend), Vitest (frontend)

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/coderCadu/OpenPlanPoker.git
   cd OpenPlanPoker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL connection string
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

### Development

Start the backend server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Testing

Run all tests:
```bash
npm test
```

Run unit tests only:
```bash
npm run test:unit
```

Run integration tests only:
```bash
npm run test:integration
```

### Building

Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── backend/
│   ├── config/          # Configuration (database, environment)
│   ├── services/        # Business logic (Session, Story, Vote, Chat, etc.)
│   ├── routes/          # API endpoints
│   ├── middleware/      # Express middleware
│   ├── utils/           # Helper functions
│   ├── realtime/        # Socket.io server and handlers
│   └── server.ts        # Express app setup
└── frontend/
    ├── components/      # Vue components
    ├── stores/          # Global state management
    └── main.ts          # Vue app entry point

prisma/
├── schema.prisma        # Data model
└── migrations/          # Database migrations
```

## API Documentation

See API documentation for available endpoints and WebSocket events (to be added).

## Contributing

See CONTRIBUTING.md for guidelines.

## License

See LICENSE file for details.
