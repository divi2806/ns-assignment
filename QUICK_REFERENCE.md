# LinkChain - Quick Reference Guide

## 🚀 Quick Start

```bash
# Setup
pnpm install
cp .env.example .env.local  # Add POSTGRES_URL and ALCHEMY_KEY
pnpm drizzle-kit push

# Development
pnpm dev                    # Start dev server
open http://localhost:3000

# Production
pnpm build
pnpm start
```

## 📁 Project Structure

```
linkchain/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   │   ├── avatar/        # ENS avatar fetching
│   │   │   ├── edges/         # Network connections CRUD
│   │   │   ├── activity/      # Activity analytics
│   │   │   └── ens-search/    # ENS name search
│   │   ├── profile/[name]/    # Profile pages
│   │   ├── graph/             # Network visualization
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── ens-profile.tsx    # Profile display
│   │   ├── graph-view.tsx     # Graph visualization
│   │   └── activity-graph.tsx # Activity heatmap
│   ├── lib/                   # Utilities
│   │   ├── ens.ts            # ENS functions
│   │   ├── db.ts             # Database client
│   │   └── config.ts         # Configuration
│   └── db/
│       └── schema.ts          # Database schema
├── public/                    # Static assets
├── .env.local                 # Environment variables
└── package.json
```

## 🗄️ Database Schema

```sql
-- Network connections
edges (
  id SERIAL PRIMARY KEY,
  source VARCHAR(255),
  target VARCHAR(255),
  created_at TIMESTAMP
)

-- Activity cache
activity_cache (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) UNIQUE,
  activities_json TEXT,
  max_count INTEGER,
  updated_at TIMESTAMP
)
```

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/avatar?name=vitalik.eth` | GET | Get ENS avatar |
| `/api/edges` | GET | List all connections |
| `/api/edges` | POST | Add connection |
| `/api/edges` | DELETE | Remove connection |
| `/api/activity?address=0x...` | GET | Get activity data |
| `/api/ens-search?q=vita` | GET | Search ENS names |

## 🎨 Key Components

### ENS Profile
```typescript
<ENSProfile profile={profileData} />
```

### Network Graph
```typescript
<GraphView 
  initialEdges={edges}
  onAddEdge={handleAdd}
  onDeleteEdge={handleDelete}
/>
```

### Activity Graph
```typescript
<ActivityGraph address="0x..." />
```

## 🔧 Common Commands

```bash
# Database
pnpm drizzle-kit push          # Run migrations
pnpm drizzle-kit studio        # Open database GUI

# Development
pnpm dev                       # Start dev server
pnpm build                     # Build for production
pnpm start                     # Start production server
pnpm lint                      # Run linter

# Testing
pnpm test                      # Run tests
pnpm test:watch                # Watch mode
```

## 🌐 Environment Variables

```bash
# Required
POSTGRES_URL="postgresql://..."

# Optional (recommended)
NEXT_PUBLIC_ALCHEMY_KEY="..."

# Production
NODE_ENV="production"
```

## 📊 Performance Tips

1. **Cache Hit Rate**: Aim for 80%+
2. **Database Indexes**: Already optimized
3. **RPC Provider**: Use Alchemy for speed
4. **Serverless**: Max 1 DB connection
5. **Canvas Rendering**: 60 FPS guaranteed

## 🐛 Debugging

```bash
# Check database connection
node -e "const pg = require('postgres'); const sql = pg(process.env.POSTGRES_URL); sql\`SELECT 1\`.then(console.log)"

# Test ENS resolution
curl "http://localhost:3000/api/avatar?name=vitalik.eth"

# View logs
tail -f .next/logs/*
```

## 📈 Monitoring

```typescript
// Add to API routes for monitoring
console.log({
  endpoint: '/api/edges',
  method: 'POST',
  duration: Date.now() - start,
  success: true
});
```


## 📚 Key Technologies

- **Next.js 16**: React framework
- **Drizzle ORM**: Type-safe database
- **viem**: Ethereum library
- **PostgreSQL**: Database
- **Tailwind CSS**: Styling
- **react-force-graph-2d**: Visualization

## 🎯 Feature Flags

```typescript
// src/lib/config.ts
export const FEATURES = {
  CACHE_ENABLED: hasDatabaseConfig(),
  GRAPH_ANIMATION: true,
  ACTIVITY_GRAPH: true,
};
```

## 🔄 Data Flow

```
User Action → Next.js Route → API Handler → Database/Blockchain → Response → UI Update
```

