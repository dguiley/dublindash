---
type: architecture
id: dublindash-architecture
title: DublinDash Architecture Design
created_by: architect
created_date: 2025-01-06
validates_with: [architect-checklist]
phase: design
---

# Architecture Design: DublinDash (Indie Edition)

## Architecture Overview
DublinDash uses a **simple, hackable architecture** perfect for indie development and educational fun. The system emphasizes code readability, easy tweaking, and rapid experimentation over enterprise complexity. Built for 1-2 players + bots initially, with potential to scale later when needed.

## Architecture Pattern Selection

**Selected Pattern**: Simple Single-Server with Optional P2P

**Indie Philosophy**: Start simple, scale when needed!
- Single Node.js server handles everything (WebSockets, bots, state)
- Static assets served from simple CDN (Vercel/Netlify)
- P2P option for 2-player mode (no server needed)
- Everything in one codebase for easy hacking
- Can add more servers later when you have 100+ players

## System Components

### Component Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Game Client                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Vanilla JS   │  │  WebGL Canvas │  │  Avatar Camera     │   │
│  │ (No React)   │  │  (Three.js)   │  │  (Built-in API)    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │ WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Single Game Server                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Express.js   │  │  WebSocket    │  │   Bot Players      │   │
│  │ (Static)     │  │  (ws lib)     │  │   (Simple AI)      │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Level Gen    │  │  GenAI API    │  │   In-Memory DB     │   │
│  │ (Procedural) │  │  (OpenAI)     │  │   (Just JSON)      │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Inventory

#### Game Client (Vanilla JS + Three.js)
- **Purpose**: The entire game runs in the browser!
- **Boundaries**: Rendering, input, physics, avatar creation
- **Dependencies**: Just Three.js + face-api.js (no React/frameworks)
- **Interface**: WebSocket to single server, Camera API
- **Deployment**: Static files from any CDN
- **Data Ownership**: Local game state only
- **Hackability**: ⭐⭐⭐⭐⭐ Easy to tweak and experiment!

#### Single Game Server (Express + WebSockets)
- **Purpose**: Handle 2-10 players + bots, super simple
- **Boundaries**: Game logic, bot AI, level generation
- **Dependencies**: Express, ws, openai (for level gen)
- **Interface**: WebSocket for real-time, REST for level requests
- **Deployment**: Single Node.js process, any cloud service
- **Data Ownership**: Current game state in memory (no DB!)
- **Hackability**: ⭐⭐⭐⭐⭐ One file to rule them all!

#### Avatar System (Client-Side)
- **Purpose**: Turn selfies into blocky 3D characters
- **Boundaries**: Face detection + basic mesh generation
- **Dependencies**: face-api.js (lightweight)
- **Interface**: Camera → colors → simple geometry
- **Deployment**: Runs entirely in browser
- **Data Ownership**: Nothing stored, instant processing
- **Hackability**: ⭐⭐⭐⭐ Perfect for experimenting with styles!

#### Bot Players (Simple AI)
- **Purpose**: Fill the world so 1-2 players have company
- **Boundaries**: Basic pathfinding, random behavior
- **Dependencies**: None (just math!)
- **Interface**: Server creates/controls them
- **Deployment**: Part of game server
- **Data Ownership**: Bot state in server memory
- **Hackability**: ⭐⭐⭐⭐⭐ Super fun to create different bot personalities!

#### GenAI Level Generator
- **Purpose**: Create beautiful level art → geometry conversion
- **Boundaries**: Prompt engineering + image processing
- **Dependencies**: OpenAI API (or similar)
- **Interface**: Level params → AI image → procedural geometry
- **Deployment**: Server-side API calls
- **Data Ownership**: Generated images cached temporarily
- **Hackability**: ⭐⭐⭐ Fun to experiment with different art styles!

## Data Architecture

**Selected Pattern**: Keep It Simple, Stupid (KISS)

**No Databases!** Everything fits in memory and browser storage:
- **Game State**: JavaScript objects in server memory
- **Player Progress**: Browser localStorage (client-side only)
- **Level Cache**: Server memory + file system
- **Avatars**: Never stored, generated on-demand

### Storage Technologies
| Data Type | Technology | Rationale |
|-----------|------------|-----------|
| Live Game State | JavaScript Map | Instant access, no setup |
| Player Avatars | Browser only | Privacy + zero storage cost |
| Level Cache | JSON files | Easy to edit and debug |
| Bot Behavior | Code constants | Easy to tweak and experiment |
| Settings | localStorage | Persists between sessions |

### Data Flow (Super Simple!)
1. **Player Join**: Browser → WebSocket → Server memory
2. **Game State**: Server memory → WebSocket → All clients (20Hz)
3. **Level Request**: Server → OpenAI API → Generated image → Geometry
4. **No Persistence**: Game ends, state disappears (like the good old days!)

## API & Integration Architecture

### Internal Communication
- **Synchronous**: 
  - REST for lobby/menu operations
  - gRPC between microservices (low latency)
- **Asynchronous**: 
  - Redis Pub/Sub for world events
  - Message queue for analytics
- **Service Discovery**: 
  - Kubernetes DNS for container services
  - Redis for dynamic game server registry

### External APIs
- **Game API**: WebSocket with MessagePack serialization
- **Lobby API**: REST with JSON, 1s cache headers
- **Versioning**: URL-based (/v1/, /v2/)
- **Rate Limiting**: 100 req/min for REST, no limit for WebSocket
- **Authentication**: Session cookies + CSRF tokens

### Integration Patterns
- **WebRTC**: For future voice chat (data channel only)
- **Analytics**: Batched events every 30s
- **CDN**: Push-based deployment on release

## Security Architecture

### Security Layers
1. **Network**: 
   - CloudFlare DDoS protection
   - WebSocket rate limiting at edge
   - Private network for backend services
2. **Application**: 
   - Input validation for all player actions
   - Server-authoritative physics (no client trust)
   - CSRF protection for web endpoints
3. **Data**: 
   - TLS 1.3 for all connections
   - Ephemeral game data (no persistence)
   - Avatar data never leaves client
4. **Operational**: 
   - Structured logging (no PII)
   - Anomaly detection for cheating
   - Automated security scanning

### Authentication & Authorization
- **User Authentication**: Anonymous sessions (no accounts in MVP)
- **Service Authentication**: mTLS between internal services
- **Authorization Model**: Simple level-based access

### Compliance & Privacy
- **Requirements**: COPPA compliant, no data collection from minors
- **Data Residency**: User choice of region (US, EU, Asia)
- **Audit Trail**: Game results only, no personal data

## Infrastructure & Deployment

**Selected Pattern**: Edge-First Container Platform with Kubernetes

Hybrid approach optimizing for global latency:
- **Edge**: Cloudflare Pages for static assets and initial load
- **Compute**: Kubernetes clusters in 3 regions for game servers
- **Serverless**: Cloudflare Workers for lightweight APIs

### Infrastructure Strategy
- **Primary Platform**: Cloudflare (edge) + Cloud provider (compute)
- **Multi-Region**: US-East, EU-West, Asia-Pacific
- **Environment Strategy**: 
  - Dev: Single region, reduced resources
  - Staging: Multi-region, full stack
  - Production: Full multi-region with auto-scaling

### Deployment Details
```yaml
# Kubernetes Deployment Example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: game-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: game-server
  template:
    spec:
      containers:
      - name: colyseus
        image: dublindash/game-server:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
```

### Scalability Design
- **Scaling Triggers**: 
  - CPU > 70% → Add game server
  - Queue depth > 20 → Add matchmaking instance
  - World full → Spawn new world
- **Scaling Limits**: 
  - Max 100 game servers per region
  - Max 50 players per world
  - Budget cap at $500/month
- **Bottleneck Mitigation**: 
  - CDN for all static assets
  - Redis clustering for state
  - Read replicas for player data

## Operational Architecture

### Observability
- **Metrics**: 
  - Game: FPS, latency, player count
  - System: CPU, memory, network
  - Business: DAU, session length, retention
- **Logging**: 
  - Structured JSON logs
  - 7-day retention for debug
  - 30-day for errors
- **Tracing**: 
  - OpenTelemetry for request flow
  - Sampling at 1% for performance
- **Alerting**: 
  - PagerDuty for critical (> 10% errors)
  - Slack for warnings

### Reliability
- **SLA Target**: 99.9% uptime
- **Failure Modes**: 
  - Game server crash → Players reconnect to new server
  - Region failure → Route to next closest
  - Database failure → Read-only mode
- **Recovery Strategy**: 
  - RTO: 5 minutes
  - RPO: 0 (ephemeral game state)
  - Daily backups for player progression

### Performance
- **Response Time**: 
  - API: < 100ms p95
  - Game state: < 50ms p95
  - Initial load: < 3s
- **Throughput**: 
  - 10,000 concurrent players
  - 200 API requests/second
- **Resource Budget**: 
  - 2 vCPU per game server
  - 1GB RAM per instance
  - 10TB bandwidth/month

## Development & Testing Architecture

### Development Workflow
- **Local Development**: 
  ```bash
  # Docker Compose for full stack
  docker-compose up
  # Hot reload for frontend
  npm run dev
  ```
- **Feature Flags**: Environment variables for gradual rollout
- **Database Migrations**: Flyway for version control

### Testing Strategy
- **Unit Tests**: 80% coverage for game logic
- **Integration Tests**: API endpoints, WebSocket flows
- **E2E Tests**: Critical paths (join game, complete race)
- **Performance Tests**: 50-player stress test per build

### Code Organization
```
dublindash/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   └── game/          # Game client code
│   └── server/            # Game server
│       ├── rooms/         # Colyseus rooms
│       ├── physics/       # Physics simulation
│       └── schemas/       # Network schemas
├── packages/
│   ├── game-core/         # Shared game logic
│   ├── ui/               # UI component library
│   ├── types/            # TypeScript types
│   └── protocols/        # Network protocols
└── infrastructure/       # IaC and configs
```

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 20 LTS, TypeScript 5.3
- **Frontend**: Next.js 14, React 18, Three.js
- **Game Engine**: Colyseus 0.15, Rapier physics
- **Databases**: Redis 7, PostgreSQL 15
- **Message Queue**: Redis Streams

### Supporting Services
- **CDN**: Cloudflare Pages
- **Monitoring**: Grafana Cloud
- **Error Tracking**: Sentry
- **Analytics**: Plausible (privacy-first)

## Architecture Decision Records

### ADR-001: WebSocket over WebRTC for Multiplayer
- **Status**: Accepted
- **Context**: Need real-time multiplayer communication
- **Decision**: Use WebSocket with Colyseus instead of WebRTC
- **Alternatives**: Raw WebRTC, gRPC streaming
- **Consequences**: 
  - ✅ Simpler implementation
  - ✅ Better firewall traversal
  - ❌ Slightly higher latency than WebRTC
  - ❌ No P2P optimization

### ADR-002: Client-Side Avatar Generation
- **Status**: Accepted
- **Context**: Privacy concerns with photo uploads
- **Decision**: Process avatars entirely client-side
- **Alternatives**: Server processing, third-party service
- **Consequences**: 
  - ✅ Complete privacy
  - ✅ No storage costs
  - ❌ Larger client bundle
  - ❌ Device-dependent performance

### ADR-003: Authoritative Server Architecture
- **Status**: Accepted
- **Context**: Prevent cheating in competitive game
- **Decision**: Server validates all physics and game rules
- **Alternatives**: Client authoritative, hybrid trust
- **Consequences**: 
  - ✅ Cheat prevention
  - ✅ Consistent game state
  - ❌ Higher server costs
  - ❌ Requires client prediction

## Migration & Evolution

### Future Evolution
1. **Phase 1** (MVP): Core game with 3 biomes
2. **Phase 2** (Month 2): 
   - Add remaining 5 biomes
   - Voice chat via WebRTC
   - Friend system
3. **Phase 3** (Month 3+): 
   - Custom world editor
   - Tournaments
   - Mobile app

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| DDoS attacks | High | Medium | Cloudflare protection, rate limiting |
| Scaling costs | Medium | Medium | Aggressive autoscaling limits |
| WebGL compatibility | Medium | Low | Fallback to simpler graphics |
| Network latency | High | Medium | Regional servers, client prediction |
| Avatar abuse | Low | Low | Client-side only, no sharing |

---
*This architecture document should evolve with the system. Update it as decisions change or new patterns emerge.*