import type { LevelData, BiomeType } from '@shared/types.js'

export interface LevelGenerationConfig {
  biome: BiomeType
  seed: number
  size: { width: number; height: number }
  difficulty: number // 1-10 scale
  theme?: string
  mood?: string
  racingFriendly: boolean
  // Future level editor parameters
  terrainRoughness?: number
  obstacleCount?: number
  weatherEffects?: boolean
}

export class LevelManager {
  private levels: Map<string, LevelData> = new Map()
  private currentLevelId: string | null = null

  /**
   * Generate a new level with specified parameters
   */
  generateLevel(config: LevelGenerationConfig): LevelData {
    console.log(`🌍 Generating level with config:`, config)
    
    // Generate terrain that matches client mesh expectations
    const resolution = 2 // Match TerrainGenerator resolution
    const mapWidth = Math.floor(config.size.width / resolution) + 1
    const mapHeight = Math.floor(config.size.height / resolution) + 1
    const heightMap: number[][] = []
    
    // Use seed for deterministic generation
    const seedRandom = this.createSeededRandom(config.seed)
    
    // Generate terrain compatible with client mesh generation
    for (let z = 0; z < mapHeight; z++) {
      const row: number[] = []
      for (let x = 0; x < mapWidth; x++) {
        // Convert to world coordinates
        const worldX = (x - mapWidth / 2) * resolution
        const worldZ = (z - mapHeight / 2) * resolution
        
        // Create procedural terrain based on config
        const height = this.generateHeightAt(
          worldX, 
          worldZ, 
          config.size.width, 
          config, 
          seedRandom
        )
        row.push(height)
      }
      heightMap.push(row)
    }
    
    const levelId = `level_${config.seed}_${config.biome}`
    
    const level: LevelData = {
      id: levelId,
      biome: config.biome,
      geometry: {
        terrain: {
          width: config.size.width,
          height: config.size.height,
          heightMap
        },
        obstacles: this.generateObstacles(config, seedRandom),
        portals: {
          start: { x: 0, y: 2, z: -config.size.height * 0.4 },
          end: { x: 0, y: 2, z: config.size.height * 0.4 }
        }
      },
      metadata: {
        difficulty: config.difficulty,
        theme: config.theme || 'procedural',
        mood: config.mood || 'neutral',
        seed: config.seed,
        generatedAt: Date.now(),
        parameters: config
      }
    }
    
    // Store the level
    this.levels.set(levelId, level)
    this.currentLevelId = levelId
    
    console.log(`🌍 Generated level ${levelId} with ${mapWidth}x${mapHeight} heightmap`)
    
    return level
  }

  /**
   * Get the current active level
   */
  getCurrentLevel(): LevelData | null {
    if (!this.currentLevelId) return null
    return this.levels.get(this.currentLevelId) || null
  }

  /**
   * Get a specific level by ID
   */
  getLevel(levelId: string): LevelData | null {
    return this.levels.get(levelId) || null
  }

  /**
   * Set the current active level
   */
  setCurrentLevel(levelId: string): boolean {
    if (!this.levels.has(levelId)) return false
    this.currentLevelId = levelId
    return true
  }

  /**
   * List all available levels
   */
  listLevels(): Array<{ id: string; biome: BiomeType; difficulty: number; seed: number }> {
    return Array.from(this.levels.values()).map(level => ({
      id: level.id,
      biome: level.biome,
      difficulty: level.metadata.difficulty,
      seed: level.metadata.seed
    }))
  }

  /**
   * Generate height at specific world coordinates
   */
  private generateHeightAt(
    worldX: number, 
    worldZ: number, 
    terrainSize: number, 
    config: LevelGenerationConfig,
    random: () => number
  ): number {
    const nx = worldX / terrainSize
    const nz = worldZ / terrainSize
    
    // Base terrain using multiple octaves of noise
    let height = 0
    const roughness = config.terrainRoughness || 1.0
    
    // Large scale features
    height += Math.sin(nx * Math.PI * 4) * 3 * roughness
    height += Math.sin(nz * Math.PI * 3) * 2 * roughness
    height += Math.sin((nx + nz) * Math.PI * 2) * 1.5 * roughness
    
    // Medium scale features
    height += Math.sin(nx * Math.PI * 8) * 0.5 * roughness
    height += Math.sin(nz * Math.PI * 6) * 0.3 * roughness
    
    // Fine detail (using seeded random for deterministic results)
    height += (random() - 0.5) * 0.2 * roughness
    
    // Apply difficulty scaling (higher difficulty = more extreme terrain)
    const difficultyScale = 1 + (config.difficulty - 1) * 0.1
    height *= difficultyScale
    
    // Keep racing-friendly if requested
    if (config.racingFriendly) {
      height = Math.max(-2, Math.min(5, height)) // Clamp extreme heights
    }
    
    return height
  }

  /**
   * Generate obstacles based on configuration
   */
  private generateObstacles(config: LevelGenerationConfig, random: () => number): any[] {
    const obstacles = []
    const obstacleCount = config.obstacleCount || Math.floor(config.difficulty * 2)
    
    for (let i = 0; i < obstacleCount; i++) {
      const x = (random() - 0.5) * config.size.width * 0.8
      const z = (random() - 0.5) * config.size.height * 0.8
      
      const types = ['tree', 'rock', 'building']
      const type = types[Math.floor(random() * types.length)]
      
      obstacles.push({
        id: `${type}_${i}`,
        type,
        position: { x, y: 0, z },
        rotation: random() * Math.PI * 2,
        scale: { 
          x: 0.5 + random() * 1.5, 
          y: 1 + random() * 2, 
          z: 0.5 + random() * 1.5 
        }
      })
    }
    
    return obstacles
  }

  /**
   * Create a seeded random number generator
   */
  private createSeededRandom(seed: number): () => number {
    let currentSeed = seed
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280
      return currentSeed / 233280
    }
  }
}