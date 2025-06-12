# DublinDash Terrain Generation Architecture

## Module Structure

```
apps/client/src/terrain/
├── TerrainGenerator.ts           # Main interface - ONLY file game imports
├── core/
│   ├── NoiseGenerator.ts         # Simplex noise wrapper
│   ├── BiomeGenerator.ts         # Biome logic using noise
│   ├── HeightMapGenerator.ts     # Terrain height calculation
│   └── ChunkManager.ts           # Chunk-based loading system
├── features/
│   ├── VegetationPlacer.ts       # Trees/bushes using Poisson sampling
│   ├── RockPlacer.ts             # Scattered rocks and boulders
│   └── WaterFeatures.ts          # Rivers, lakes, streams
├── meshes/
│   ├── TerrainMeshBuilder.ts     # Three.js visual mesh creation
│   ├── CollisionMeshBuilder.ts   # Simplified physics mesh
│   └── VegetationMeshBuilder.ts  # Tree/bush instanced rendering
├── config/
│   ├── BiomeConfigs.ts           # Biome definitions and rules
│   ├── VegetationConfigs.ts      # Tree types, densities, placement rules
│   └── TerrainConfigs.ts         # Height scales, noise parameters
└── utils/
    ├── MathUtils.ts              # Terrain math helpers
    └── PerformanceUtils.ts       # Profiling and optimization
```

## Clean Interface Design

### 1. Single Entry Point
```typescript
// apps/client/src/terrain/TerrainGenerator.ts
export class TerrainGenerator {
  constructor(config: TerrainConfig) {
    // Initialize all internal systems
    this.noiseGenerator = new NoiseGenerator(config.seed)
    this.biomeGenerator = new BiomeGenerator(config.biome)
    this.vegetationPlacer = new VegetationPlacer(config.vegetation)
    // ... etc, all internal
  }

  async generate(): Promise<TerrainResult> {
    // Returns ready-to-use Three.js meshes
    // Game code never sees the complexity
  }
}
```

### 2. Configuration-Driven
```typescript
interface TerrainConfig {
  seed: number
  size: { width: number, height: number }
  biome: 'temperate_forest' | 'desert' | 'alpine' | 'wetlands'
  detail: 'low' | 'medium' | 'high'
  racingFriendly: boolean  // Ensures driveable terrain
}

interface TerrainResult {
  visualMesh: THREE.Group      // Full detail for rendering
  collisionMesh: THREE.Mesh    // Simplified for physics
  bounds: BoundingBox
  metadata: {
    biome: string
    features: string[]
    seed: number
  }
}
```

## Technology Stack

### Core Libraries
- **simplex-noise**: Fast 2D/3D noise generation (70M calls/second)
- **poisson-disk-sampling**: Natural tree placement
- **Three.js**: Mesh generation and rendering

### Key Algorithms

#### 1. Height Map Generation (Minecraft-style)
```typescript
class HeightMapGenerator {
  generateHeightMap(bounds: Bounds): Float32Array {
    // Multiple noise octaves for natural terrain
    // - Large scale: rolling hills
    // - Medium scale: ridges and valleys  
    // - Small scale: surface detail
    // - Racing mode: flatten steep areas
  }
}
```

#### 2. Biome Generation
```typescript
class BiomeGenerator {
  generateBiomeMap(bounds: Bounds): BiomeMap {
    // Temperature + moisture noise maps
    // Determines vegetation types and density
    // Smooth transitions between biomes
  }
}
```

#### 3. Vegetation Placement (Poisson Disk)
```typescript
class VegetationPlacer {
  placeTrees(heightMap: Float32Array, biomeMap: BiomeMap): VegetationData {
    // Poisson disk sampling for natural distribution
    // Slope checking (no trees on steep hills)
    // Biome-based tree types and densities
    // Clearings for racing areas
  }
}
```

## Performance Strategy

### 1. Chunk-Based Generation
- Generate terrain in 64x64 chunks
- Load/unload based on camera distance
- LOD system for distant chunks

### 2. Web Worker Integration
```typescript
// Future optimization - move heavy generation off main thread
class TerrainWorkerPool {
  generateChunkAsync(chunkCoords: ChunkCoords): Promise<ChunkData>
}
```

### 3. Memory Management
- Dispose old chunks automatically
- Instanced rendering for vegetation
- Texture atlasing for materials

## Racing Game Optimizations

### 1. Driveable Terrain
- Limit slope angles near racing areas
- Smooth transitions between height levels
- Automatic road/track clearing

### 2. Visual Interest
- Elevation changes for dynamic racing
- Forest tunnels and clearings
- Scenic vistas and landmarks

### 3. Performance Targets
- 60 FPS with full terrain detail
- <2GB memory usage
- <100ms chunk generation time

## Integration with Game Systems

### 1. Game Manager Integration
```typescript
// In GameManager.ts
class GameManager {
  async initializeLevel() {
    const terrain = await this.terrainGenerator.generate()
    this.scene.add(terrain.visualMesh)
    this.physics.addCollisionMesh(terrain.collisionMesh)
    // Terrain is now part of the game world
  }
}
```

### 2. Physics Integration
- Terrain collision mesh automatically added to physics world
- Simplified geometry for performance
- Proper surface materials (grass, dirt, rock)

### 3. Lighting Integration
- Terrain meshes work with existing lighting
- Automatic shadow receiving
- Material-based rendering

## Development Phases

### Phase 1: Basic Terrain (1-2 days)
- Simple height map generation
- Basic mesh creation
- Single biome (temperate forest)

### Phase 2: Vegetation (1-2 days)  
- Tree placement with Poisson sampling
- Multiple tree types
- Biome-based vegetation rules

### Phase 3: Optimization (2-3 days)
- Chunk-based loading
- LOD system
- Performance profiling

### Phase 4: Variety (2-3 days)
- Multiple biomes
- Water features
- Rock placement

## Benefits

### 1. **Encapsulation**
- Game code only imports TerrainGenerator
- All complexity hidden behind clean interface
- Easy to swap algorithms or add features

### 2. **Performance**
- Chunk-based loading for infinite worlds
- LOD system for consistent frame rates
- Optimized for browser constraints

### 3. **Flexibility**
- Configuration-driven generation
- Multiple biome types
- Racing-friendly terrain generation

### 4. **Maintainability**
- Clear separation of concerns
- Well-defined interfaces
- Easy to test individual components

This architecture ensures the terrain system enhances DublinDash without polluting the existing clean codebase.