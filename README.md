# ENS Social Graph

An interactive social graph visualization for Ethereum Name Service (ENS) profiles.

## Features

- **ENS Profile Viewer**: View any ENS name's avatar, address, and text records
- **Interactive Graph**: Force-directed graph visualization of ENS connections
- **Click-to-Navigate**: Click on graph nodes to view profiles
- **Add/Delete Edges**: Manage connections through the UI
- **Database Persistence**: PostgreSQL with Drizzle ORM (falls back to localStorage)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Blockchain**: viem + wagmi
- **Database**: Vercel Postgres (or any PostgreSQL via Drizzle)
- **Graph**: react-force-graph-2d
- **Styling**: Tailwind CSS

## Getting Started

1. Install dependencies:
```bash
bun install
```

2. (Optional) Set up database - copy `.env.example` to `.env.local` and add your Postgres URL:
```bash
cp .env.example .env.local
# Edit .env.local with your POSTGRES_URL
```

3. (Optional) Run database migration:
```bash
bunx drizzle-kit push
```

4. Start the development server:
```bash
bun run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Pages

- `/` - Home page with navigation
- `/profile/[ensName]` - ENS profile viewer (e.g., `/profile/vitalik.eth`)
- `/graph` - Interactive social graph

## Deployment to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add a Postgres database from Vercel Storage
4. Deploy

The app will automatically use the `POSTGRES_URL` environment variable provided by Vercel Postgres.

## License

MIT
