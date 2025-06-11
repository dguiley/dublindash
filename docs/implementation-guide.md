# DublinDash Implementation Guide

## 1-Shot Development Checklist

This guide provides everything needed to implement DublinDash in a single development session using Claude Code or Lovable.

## Project Setup

### 1. Monorepo Structure
```bash
npx create-turbo@latest dublindash
cd dublindash

# Remove default apps
rm -rf apps/web apps/docs

# Create our structure
mkdir -p apps/web apps/server
mkdir -p packages/game-core packages/ui packages/types
mkdir -p packages/protocols
```

### 2. Package Configuration

#### Root package.json
```json
{
  "name": "dublindash",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "@turbo/gen": "^1.10.7",
    "turbo": "^1.10.7",
    "prettier": "^3.0.0",
    "typescript": "^5.3.0"
  }
}
```

#### Turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {}
  }
}
```

## Frontend Implementation (apps/web)

### 3. Next.js Setup
```bash
cd apps/web
npm init -y
npm install next@14 react react-dom typescript @types/node @types/react
npm install @react-three/fiber @react-three/drei @react-three/rapier
npm install three @types/three colyseus.js face-api.js
npm install tailwindcss autoprefixer postcss @tailwindcss/forms
npm install socket.io-client @react-three/postprocessing
npm install zustand simplex-noise seedrandom stats.js
npm install leva @react-three/cannon
```

### 4. Key Files Structure
```
apps/web/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx           # Landing/lobby
│   ├── game/
│   │   └── page.tsx       # Game page
│   └── api/
│       └── avatar/
│           └── route.ts   # Avatar processing endpoint
├── components/
│   ├── ui/                # Base UI components
│   ├── game/
│   │   ├── GameCanvas.tsx
│   │   ├── PlayerController.tsx
│   │   ├── WorldRenderer.tsx
│   │   ├── AvatarSystem.tsx
│   │   └── HUD.tsx
│   ├── lobby/
│   │   ├── WorldSelector.tsx
│   │   ├── AvatarCreator.tsx
│   │   └── LobbyLayout.tsx
│   └── providers/
│       ├── GameProvider.tsx
│       └── ThreeProvider.tsx
├── lib/
│   ├── game/
│   │   ├── physics.ts
│   │   ├── networking.ts
│   │   ├── avatar-generator.ts
│   │   └── world-generator.ts
│   ├── utils.ts
│   └── constants.ts
└── public/
    ├── models/           # 3D assets
    ├── textures/         # Texture files
    └── sounds/           # Audio files
```

## Backend Implementation (apps/server)

### 5. Colyseus Game Server
```bash
cd apps/server
npm init -y
npm install colyseus express cors helmet morgan
npm install @types/node @types/express typescript ts-node nodemon
npm install redis ioredis @types/redis
npm install rapier3d-compat three simplex-noise
```

### 6. Server Structure
```
apps/server/
├── src/
│   ├── index.ts           # Express + Colyseus setup
│   ├── rooms/
│   │   ├── GameRoom.ts    # Main game room
│   │   └── schemas/
│   │       ├── PlayerSchema.ts
│   │       ├── WorldSchema.ts
│   │       └── GameState.ts
│   ├── systems/
│   │   ├── PhysicsSystem.ts
│   │   ├── MovementSystem.ts
│   │   ├── CollisionSystem.ts
│   │   └── WorldGenerator.ts
│   ├── utils/
│   │   ├── math.ts
│   │   ├── constants.ts
│   │   └── validation.ts
│   └── middlewares/
│       ├── rate-limit.ts
│       └── cors.ts
├── Dockerfile
└── docker-compose.yml
```

## Critical Implementation Details

### 7. Avatar Generation System
```typescript
// lib/avatar-generator.ts
import * as faceapi from 'face-api.js';

export class AvatarGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  async generateAvatar(imageData: ImageData): Promise<AvatarData> {
    // 1. Load face-api models
    await this.loadModels();
    
    // 2. Detect face features
    const detection = await faceapi.detectSingleFace(imageData)
      .withFaceLandmarks()
      .withFaceDescriptor();
      
    if (!detection) throw new Error('No face detected');
    
    // 3. Extract color palette
    const colors = this.extractColors(imageData, detection);
    
    // 4. Generate mesh data
    const meshData = this.generateMesh(detection.landmarks, colors);
    
    return {
      vertices: meshData.vertices,
      colors: meshData.colors,
      metadata: {
        hairColor: colors.hair,
        skinTone: colors.skin,
        eyeColor: colors.eyes
      }
    };
  }
  
  private extractColors(imageData: ImageData, detection: any) {
    // Sample key regions for color extraction
    const landmarks = detection.landmarks;
    
    return {
      hair: this.sampleRegion(imageData, landmarks.getHairline()),
      skin: this.sampleRegion(imageData, landmarks.getCheek()),
      eyes: this.sampleRegion(imageData, landmarks.getEyes()),
      clothing: this.sampleRegion(imageData, /* bottom region */)
    };
  }
}
```

### 8. Game Room Implementation
```typescript
// apps/server/src/rooms/GameRoom.ts
import { Room, Client } from "colyseus";
import { GameState, Player } from "./schemas/GameState";

export class GameRoom extends Room<GameState> {
  maxClients = 50;
  
  onCreate(options: any) {
    this.setState(new GameState());
    
    // Set up physics world
    this.setupPhysics();
    
    // Generate world
    this.generateWorld(options.biome || 'forest');
    
    // Start game loop
    this.setSimulationInterval((deltaTime) => {
      this.updatePhysics(deltaTime);
      this.updatePlayers(deltaTime);
    }, 1000 / 20); // 20 FPS server tick
  }
  
  onJoin(client: Client, options: any) {
    const player = new Player();
    player.id = client.sessionId;
    player.position.set(/* spawn position */);
    player.avatarData = options.avatar;
    
    this.state.players.set(client.sessionId, player);
  }
  
  onMessage(client: Client, message: any) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    
    switch (message.type) {
      case 'move':
        this.handleMovement(player, message.data);
        break;
      case 'jump':
        this.handleJump(player);
        break;
    }
  }
}
```

### 9. World Generation Algorithm
```typescript
// lib/world-generator.ts
import { SimplexNoise } from 'simplex-noise';

export class WorldGenerator {
  generateWorld(biome: BiomeType, seed: number): WorldData {
    const noise = new SimplexNoise(seed);
    
    // 1. Generate heightmap
    const heightmap = this.generateTerrain(noise, biome);
    
    // 2. Find spawn points
    const startPortal = this.findLowestPoint(heightmap);
    const endPortal = this.findHighestPoint(heightmap);
    
    // 3. Generate obstacles
    const obstacles = this.placeObstacles(heightmap, biome);
    
    // 4. Create mesh data
    return {
      terrain: this.createTerrainMesh(heightmap),
      obstacles: obstacles,
      portals: { start: startPortal, end: endPortal },
      lighting: biome.lightingPreset,
      metadata: {
        biome: biome.name,
        seed: seed,
        difficulty: this.calculateDifficulty(heightmap, obstacles)
      }
    };
  }
}
```

### 10. Frontend Game Canvas
```typescript
// components/game/GameCanvas.tsx
'use client';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { PlayerController } from './PlayerController';
import { WorldRenderer } from './WorldRenderer';
import { HUD } from './HUD';

export function GameCanvas() {
  return (
    <div className="h-screen w-screen relative">
      <Canvas
        camera={{ position: [0, 20, 20], fov: 60 }}
        shadows
        className="bg-gradient-to-b from-sky-300 to-sky-500"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[50, 50, 25]} castShadow />
        
        <Physics gravity={[0, -20, 0]}>
          <PlayerController />
          <WorldRenderer />
        </Physics>
      </Canvas>
      
      <HUD />
    </div>
  );
}
```

## Deployment Configuration

### 11. Docker Setup
```dockerfile
# apps/server/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 2567
CMD ["node", "dist/index.js"]
```

### 12. Docker Compose (Development)
```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
  game-server:
    build: ./apps/server
    ports:
      - "2567:2567"
    environment:
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=development
    depends_on:
      - redis
      
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_GAME_SERVER_URL=ws://localhost:2567
```

## Implementation Phase Approach

### Phase 1: Core Foundation (Week 1)
1. **Setup monorepo and basic Next.js app**
2. **Implement avatar generation (client-side only)**
3. **Create basic 3D scene with Three.js**
4. **Setup Colyseus game server**
5. **Implement basic player movement**

### Phase 2: Multiplayer & World Gen (Week 1-2)
1. **Connect client to game server**
2. **Implement world generation for 3 biomes**
3. **Add collision detection and physics**
4. **Implement portal system**
5. **Add multiplayer state synchronization**

### Phase 3: Game Mechanics (Week 2)
1. **Implement terrain modifiers (hills, obstacles)**
2. **Add progression system**
3. **Create lobby and world selection**
4. **Polish visuals and effects**
5. **Performance optimization**

## Essential Environment Variables

```bash
# apps/web/.env.local
NEXT_PUBLIC_GAME_SERVER_URL=ws://localhost:2567
NEXT_PUBLIC_CDN_URL=https://cdn.dublindash.com

# apps/server/.env
REDIS_URL=redis://localhost:6379
PORT=2567
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## Testing Strategy

### Unit Tests
- Avatar generation functions
- World generation algorithms  
- Physics calculations
- Network message handling

### Integration Tests
- Client-server connection flow
- Room joining/leaving
- Player state synchronization
- Performance under load (50 players)

## Performance Optimization Checklist

- [ ] Three.js object pooling for obstacles
- [ ] LOD system for distant objects
- [ ] Frustum culling for off-screen objects
- [ ] Delta compression for network updates
- [ ] Texture atlasing for materials
- [ ] WASM for physics calculations
- [ ] Redis clustering for scaling
- [ ] CDN for static assets

## MVP Feature Checklist

- [ ] Camera-based avatar creation
- [ ] 3 biome types (forest, desert, tundra)
- [ ] Player movement with physics
- [ ] Multiplayer rooms (up to 50 players)
- [ ] Portal-to-portal racing
- [ ] Basic progression system
- [ ] World selection lobby
- [ ] Performance: 60fps on mid-range devices

This implementation guide provides all the technical details needed to build DublinDash in a single focused development session. The modular architecture ensures each component can be built and tested independently while maintaining clear integration points.