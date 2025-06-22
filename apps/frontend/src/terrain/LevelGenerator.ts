import type { LevelData, Vector3, ObstacleData } from '@shared/types'
import { TerrainGenerator } from './TerrainGenerator'
import type { TerrainConfig, BiomeType } from './config/TerrainTypes'
import type { Group, Mesh } from 'three'

/**
 * Enhanced level generator that creates procedural worlds with terrain
 * Integrates with existing LevelData interface while adding terrain generation
 */
export class LevelGenerator {
  private terrainGenerator: TerrainGenerator

  constructor() {
    // Will be initialized when generating levels
    this.terrainGenerator = null as any
  }

  /**
   * Generate a complete level with procedural terrain
   */
  async generateLevel(config: {
    biome?: BiomeType
    seed?: number
    size?: { width: number; height: number }
    racingFriendly?: boolean
  } = {}): Promise<{
    levelData: LevelData
    terrainMeshes: { visual: Group; collision: Mesh }
  }> {
    const {
      biome = 'temperate_forest',
      seed = Math.floor(Math.random() * 10000),
      size = { width: 200, height: 200 },
      racingFriendly = true
    } = config

    console.log(`🏁 Generating racing level: ${biome} (seed: ${seed})`)

    // Create terrain generator configuration
    const terrainConfig: TerrainConfig = {
      seed,
      size,
      biome,
      detail: 'medium',
      racingFriendly
    }

    // Initialize terrain generator
    this.terrainGenerator = new TerrainGenerator(terrainConfig)

    // Generate terrain
    const terrainResult = await this.terrainGenerator.generate()

    // Create level data compatible with existing system
    const levelData: LevelData = {
      id: `generated-${biome}-${seed}`,
      biome,
      aiGeneratedImage: undefined, // TODO: Could generate preview image
      geometry: {
        terrain: this.createTerrainGeometry(terrainResult, size),
        obstacles: this.generateObstacles(terrainResult),
        portals: this.generatePortals(size, terrainResult)
      },
      metadata: {
        difficulty: this.calculateDifficulty(biome),
        theme: this.getBiomeTheme(biome),
        mood: this.getBiomeMood(biome),
        seed
      }
    }

    console.log(`✅ Level generated: ${levelData.id}`)

    return {
      levelData,
      terrainMeshes: {
        visual: terrainResult.visualMesh,
        collision: terrainResult.collisionMesh
      }
    }
  }

  /**
   * Convert terrain result to LevelData terrain format
   */
  private createTerrainGeometry(terrainResult: any, size: { width: number; height: number }) {
    // Create a height map matching TerrainGenerator's medium detail resolution
    const resolution = 2 // Sample every 2 units to match TerrainGenerator
    const mapWidth = Math.floor(size.width / resolution) + 1
    const mapHeight = Math.floor(size.height / resolution) + 1
    const heightMap: number[][] = []

    for (let z = 0; z < mapHeight; z++) {
      const row: number[] = []
      for (let x = 0; x < mapWidth; x++) {
        const worldX = (x - mapWidth / 2) * resolution
        const worldZ = (z - mapHeight / 2) * resolution
        const height = this.terrainGenerator.getHeightAt(worldX, worldZ)
        row.push(height)
      }
      heightMap.push(row)
    }

    return {
      width: size.width,
      height: size.height,
      heightMap
    }
  }

  /**
   * Generate obstacles based on terrain features
   */
  private generateObstacles(terrainResult: any): ObstacleData[] {
    const obstacles: ObstacleData[] = []

    // For now, add some simple obstacles based on biome
    // TODO: Extract from terrain vegetation data
    const obstacleCount = Math.floor(Math.random() * 10) + 5

    for (let i = 0; i < obstacleCount; i++) {
      const x = (Math.random() - 0.5) * 150
      const z = (Math.random() - 0.5) * 150
      const y = this.terrainGenerator.getHeightAt(x, z)

      // Only place obstacles on suitable terrain
      if (this.terrainGenerator.isSuitableForPlacement(x, z)) {
        obstacles.push({
          id: `obstacle-${i}`,
          type: Math.random() > 0.5 ? 'rock' : 'tree',
          position: { x, y, z },
          rotation: Math.random() * Math.PI * 2,
          scale: {
            x: 0.5 + Math.random() * 1.5,
            y: 0.5 + Math.random() * 1.5,
            z: 0.5 + Math.random() * 1.5
          }
        })
      }
    }

    console.log(`🏗️ Generated ${obstacles.length} obstacles`)
    return obstacles
  }

  /**
   * Generate start and end portals on suitable terrain
   */
  private generatePortals(size: { width: number; height: number }, terrainResult: any): {
    start: Vector3
    end: Vector3
  } {
    // Place start portal on the left side
    const startX = -size.width * 0.4
    const startZ = 0
    const startY = this.terrainGenerator.getHeightAt(startX, startZ) + 0.5

    // Place end portal on the right side
    const endX = size.width * 0.4
    const endZ = 0
    const endY = this.terrainGenerator.getHeightAt(endX, endZ) + 0.5

    return {
      start: { x: startX, y: startY, z: startZ },
      end: { x: endX, y: endY, z: endZ }
    }
  }

  /**
   * Calculate difficulty based on biome characteristics
   */
  private calculateDifficulty(biome: BiomeType): number {
    const difficultyMap: Record<BiomeType, number> = {
      temperate_forest: 0.3,
      wetlands: 0.4,
      desert: 0.6,
      alpine: 0.8
    }
    return difficultyMap[biome] || 0.5
  }

  /**
   * Get theme description for biome
   */
  private getBiomeTheme(biome: BiomeType): string {
    const themeMap: Record<BiomeType, string> = {
      temperate_forest: 'Lush Forest',
      wetlands: 'Misty Wetlands',
      desert: 'Arid Desert',
      alpine: 'Mountain Peak'
    }
    return themeMap[biome] || 'Unknown'
  }

  /**
   * Get mood description for biome
   */
  private getBiomeMood(biome: BiomeType): string {
    const moodMap: Record<BiomeType, string> = {
      temperate_forest: 'Peaceful and green',
      wetlands: 'Mysterious and foggy',
      desert: 'Hot and challenging',
      alpine: 'Cold and majestic'
    }
    return moodMap[biome] || 'Neutral'
  }

  /**
   * Generate a random level with random biome
   */
  async generateRandomLevel(): Promise<{
    levelData: LevelData
    terrainMeshes: { visual: Group; collision: Mesh }
  }> {
    const biomes: BiomeType[] = ['temperate_forest', 'desert', 'alpine', 'wetlands']
    const randomBiome = biomes[Math.floor(Math.random() * biomes.length)]
    
    return this.generateLevel({ biome: randomBiome })
  }

  /**
   * Generate a level with specific racing characteristics
   */
  async generateRacingLevel(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<{
    levelData: LevelData
    terrainMeshes: { visual: Group; collision: Mesh }
  }> {
    const configs = {
      easy: {
        biome: 'temperate_forest' as BiomeType,
        size: { width: 150, height: 150 }
      },
      medium: {
        biome: 'wetlands' as BiomeType,
        size: { width: 200, height: 200 }
      },
      hard: {
        biome: 'alpine' as BiomeType,
        size: { width: 250, height: 250 }
      }
    }

    return this.generateLevel({
      ...configs[difficulty],
      racingFriendly: true
    })
  }

  /**
   * Generate terrain meshes from existing level data (for multiplayer sync)
   */
  async generateTerrainMeshesFromLevel(level: LevelData): Promise<{ visual: Group; collision: Mesh }> {
    const terrainConfig: TerrainConfig = {
      seed: level.metadata.seed || 12345,
      size: { width: level.geometry.terrain.width, height: level.geometry.terrain.height },
      biome: (level.biome || 'temperate_forest') as BiomeType,
      detail: 'medium',
      racingFriendly: true
    }

    // Initialize terrain generator
    this.terrainGenerator = new TerrainGenerator(terrainConfig)
    
    // Generate terrain with the provided heightmap (flatten 2D array to 1D)
    const flatHeightMap = level.geometry.terrain.heightMap.flat()
    const terrainResult = await this.terrainGenerator.generateFromHeightMap(flatHeightMap)
    
    return {
      visual: terrainResult.visualMesh,
      collision: terrainResult.collisionMesh
    }
  }

  /**
   * Dispose of terrain generator resources
   */
  dispose(): void {
    if (this.terrainGenerator) {
      this.terrainGenerator.dispose()
    }
  }
}