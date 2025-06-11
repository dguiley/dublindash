# DublinDash Game Design Document

## Core Gameplay Loop

### Movement Mechanics
```typescript
interface PlayerMovement {
  baseSpeed: 5.0;          // units per second
  acceleration: 12.0;      // units per second²
  deceleration: 8.0;       // units per second²
  maxSpeed: 8.0;           // normal max speed
  turnSpeed: 3.0;          // radians per second
  jumpPower: 8.0;          // initial jump velocity
  gravity: -20.0;          // downward acceleration
  groundDrag: 0.9;         // friction when grounded
  airDrag: 0.95;           // less control in air
}
```

### Speed Modifiers
- **Uphill**: speed * 0.7 (30% slower)
- **Downhill**: speed * 1.4 (40% faster)
- **Climbing**: speed * 0.5 (50% slower)
- **Water/Mud**: speed * 0.6 (40% slower)
- **Ice**: acceleration * 0.3 (slippery)

### Collision & Physics
- **Player Radius**: 0.5 units
- **Bounce Factor**: 0.8 (elastic collisions)
- **Push Force**: Proportional to relative velocity
- **Climbing**: Auto-climb obstacles < 0.5 units high
- **Falling**: No damage, but 0.5s recovery animation

## Level Generation System

### Biome Configuration
```typescript
interface BiomeConfig {
  name: string;
  baseColor: Color;
  accentColor: Color;
  lightingPreset: LightingType;
  terrainNoise: NoiseParams;
  obstacleSet: ObstacleType[];
  obstacleDensity: number; // 0-1
  elevationRange: number;  // max height variation
  specialFeatures: Feature[];
}
```

### Biome Types

#### 1. Forest Biome
- **Colors**: Deep greens, browns
- **Obstacles**: Trees, logs, rocks
- **Density**: High (0.7)
- **Elevation**: Medium (10 units)
- **Special**: Clearings, streams

#### 2. Desert Biome  
- **Colors**: Yellows, oranges, reds
- **Obstacles**: Cacti, rocks, dunes
- **Density**: Low (0.3)
- **Elevation**: Low (5 units)
- **Special**: Oasis spots, sandstorms

#### 3. Tundra Biome
- **Colors**: Whites, light blues
- **Obstacles**: Ice blocks, snow drifts
- **Density**: Medium (0.5)
- **Elevation**: High (15 units)
- **Special**: Ice patches (slippery)

#### 4. Volcanic Biome
- **Colors**: Reds, blacks, oranges
- **Obstacles**: Lava rocks, geysers
- **Density**: Medium (0.5)
- **Elevation**: Extreme (20 units)
- **Special**: Lava flows (avoid)

#### 5. Crystal Cave Biome
- **Colors**: Purples, teals, pinks
- **Obstacles**: Crystal formations
- **Density**: High (0.8)
- **Elevation**: Medium (10 units)
- **Special**: Glowing crystals (lighting)

#### 6. Floating Islands Biome
- **Colors**: Sky blues, whites
- **Obstacles**: Floating platforms
- **Density**: Low (0.2)
- **Elevation**: Extreme (25 units)
- **Special**: Gaps between islands

#### 7. Jungle Biome
- **Colors**: Vibrant greens, browns
- **Obstacles**: Vines, temples, water
- **Density**: Very High (0.9)
- **Elevation**: Medium (12 units)
- **Special**: Temple ruins, rivers

#### 8. Cyber City Biome
- **Colors**: Neons, dark grays
- **Obstacles**: Buildings, barriers
- **Density**: High (0.7)
- **Elevation**: High (18 units)
- **Special**: Moving platforms

### Level Generation Algorithm

```typescript
interface LevelGenerationParams {
  seed: number;
  biome: BiomeConfig;
  difficulty: 1-10;
  size: { width: 100, length: 200 };
  playerCount: 30-50;
}

// Generation Steps:
1. Generate base terrain heightmap using simplex noise
2. Place start portal at lowest 10% elevation
3. Place end portal at highest 10% elevation  
4. Generate primary path using A* pathfinding
5. Add obstacle clusters along and near path
6. Create alternate routes (2-3 options)
7. Add decorative elements
8. Optimize for performance (LOD, instancing)
```

### Dynamic Difficulty
```typescript
const difficultyModifiers = {
  1: { obstacleMultiplier: 0.5, elevationScale: 0.5 },
  5: { obstacleMultiplier: 1.0, elevationScale: 1.0 },
  10: { obstacleMultiplier: 2.0, elevationScale: 1.5 }
};
```

## Avatar Generation System

### Face Processing Pipeline
1. **Capture**: MediaDevices API at 640x480
2. **Detection**: face-api.js finds facial landmarks
3. **Analysis**: Extract key features
   - Hair color (top region sampling)
   - Skin tone (cheek region average)
   - Clothing color (bottom region)
   - Face shape (landmark distances)
4. **Generation**: Create low-poly mesh
   - 200 vertices max
   - Simple color regions
   - Stylized proportions

### Privacy Features
- All processing client-side
- No image data sent to server
- Canvas cleared after processing
- No persistence of photo data

## Multiplayer Architecture

### Network Updates
```typescript
interface PlayerState {
  id: string;
  position: Vector3;
  rotation: number;
  velocity: Vector3;
  animation: AnimationType;
  level: number;
  avatarData: CompressedAvatar; // 256 bytes max
}

// Update frequency
const TICK_RATE = 20; // 20 updates per second
const INTERPOLATION_BUFFER = 100; // 100ms buffer
```

### Room Management
- **Max Players**: 50 per world instance
- **Instance Creation**: When 40 players reached
- **Instance Merging**: When < 10 players
- **Regional Servers**: US-East, US-West, EU, Asia

### State Synchronization
1. **Authoritative Server**: Server validates all positions
2. **Client Prediction**: Immediate local movement
3. **Reconciliation**: Correct discrepancies smoothly
4. **Interpolation**: Smooth other player movements
5. **Compression**: Delta compression for bandwidth

## Progression System

### Level Calculation
```typescript
function calculateNewLevel(currentLevel: number, racePosition: number, totalPlayers: number): number {
  const percentile = (totalPlayers - racePosition) / totalPlayers;
  
  if (percentile >= 0.7) return Math.min(currentLevel + 1, 10);
  if (percentile <= 0.3) return Math.max(currentLevel - 1, 1);
  return currentLevel;
}
```

### Unlocks by Level
- **Level 1-2**: Forest, Desert, Tundra
- **Level 3-4**: + Volcanic, Crystal Cave
- **Level 5-6**: + Floating Islands
- **Level 7-8**: + Jungle
- **Level 9-10**: + Cyber City, Mixed biomes

## UI/UX Flow

### Screen Flow
1. **Landing Page** → Camera Permission → Avatar Creation
2. **Lobby** → World Selection Grid → Loading
3. **Game** → Racing → Results
4. **Results** → Level Change → Back to Lobby

### HUD Elements
- **Timer**: Top center, large font
- **Player Count**: Top right corner
- **Level Indicator**: Top left corner
- **Mini-map**: Bottom right (optional)
- **Speed Indicator**: Visual effects

### Visual Style
- **Low-poly aesthetic**: Max 500 triangles per object
- **Saturated colors**: High contrast, vibrant
- **Smooth shading**: Flat shading with AO
- **Particle effects**: Minimal, for portals and collisions
- **Post-processing**: Bloom, slight vignette

## Performance Optimization

### LOD System
- **Near**: Full detail (< 20 units)
- **Medium**: 50% vertices (20-50 units)  
- **Far**: 25% vertices (50-100 units)
- **Culled**: Not rendered (> 100 units)

### Instancing
- Trees, rocks, obstacles use GPU instancing
- Maximum 1000 instances per type
- Batched rendering for terrain

### Network Optimization
- Position updates use 16-bit integers
- Rotation uses 8-bit (256 directions)
- Avatar data compressed to 256 bytes
- Delta compression for changes only

## Sound Design (Future)
- **Ambient**: Biome-specific atmosphere
- **Movement**: Footsteps vary by surface
- **Actions**: Jump, land, collision sounds
- **UI**: Button clicks, level up fanfare
- **Music**: Upbeat, changes by biome

## Monetization Strategy (Future)
- **No Pay-to-Win**: Cosmetic only
- **Avatar Accessories**: Hats, trails, effects
- **Premium Biomes**: Visual variants only
- **Server Priority**: Faster matchmaking
- **No Ads**: Clean experience

This design document provides the complete blueprint for implementing DublinDash with all systems clearly defined and ready for development.