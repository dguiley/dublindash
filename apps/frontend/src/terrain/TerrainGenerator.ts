import { Group } from 'three'
import type { 
  TerrainConfig, 
  TerrainResult, 
  BoundingBox, 
  TerrainMetadata 
} from './config/TerrainTypes'
import { BIOME_CONFIGS } from './config/BiomeConfigs'
import { NoiseGenerator } from './core/NoiseGenerator'
import { HeightMapGenerator } from './core/HeightMapGenerator'
import { VegetationPlacer } from './features/VegetationPlacer'
import { TerrainMeshBuilder } from './meshes/TerrainMeshBuilder'
import { VegetationMeshBuilder } from './meshes/VegetationMeshBuilder'

/**
 * Main terrain generation interface - the only class the game needs to import
 * 
 * Usage:
 * ```typescript
 * const terrainGenerator = new TerrainGenerator({
 *   seed: 12345,
 *   size: { width: 1000, height: 1000 },
 *   biome: 'temperate_forest',
 *   detail: 'medium',
 *   racingFriendly: true
 * })
 * 
 * const terrain = await terrainGenerator.generate()
 * scene.add(terrain.visualMesh)
 * physics.addCollisionMesh(terrain.collisionMesh)
 * ```
 */
export class TerrainGenerator {
  private config: TerrainConfig
  private noiseGenerator!: NoiseGenerator
  private heightMapGenerator!: HeightMapGenerator
  private vegetationPlacer!: VegetationPlacer
  private terrainMeshBuilder!: TerrainMeshBuilder
  private vegetationMeshBuilder!: VegetationMeshBuilder

  constructor(config: TerrainConfig) {
    this.config = {
      chunkSize: 64, // Default chunk size
      ...config
    }

    // Validate configuration
    this.validateConfig()

    // Initialize all internal systems
    this.initializeSystems()
  }

  /**
   * Generate terrain and return ready-to-use Three.js meshes
   */
  async generate(): Promise<TerrainResult> {
    const startTime = performance.now()
    console.log(`🌍 Generating ${this.config.biome} terrain (${this.config.size.width}x${this.config.size.height})...`)

    try {
      // Calculate terrain bounds
      const bounds = this.calculateBounds()

      // Determine resolution based on detail level
      const resolution = this.getResolution()

      // Generate height map
      console.log('📏 Generating height map...')
      const heightMap = this.heightMapGenerator.generateHeightMap(
        bounds.minX,
        bounds.minZ,
        this.config.size.width,
        this.config.size.height,
        resolution
      )

      // Generate terrain meshes
      console.log('🏔️ Creating terrain meshes...')
      const visualMesh = this.terrainMeshBuilder.createTerrainMesh(
        heightMap,
        bounds.minX,
        bounds.minZ,
        this.config.size.width,
        this.config.size.height,
        resolution
      )

      const collisionMesh = this.terrainMeshBuilder.createCollisionMesh(
        heightMap,
        bounds.minX,
        bounds.minZ,
        this.config.size.width,
        this.config.size.height,
        resolution,
        2 // Simplification factor for collision
      )

      // Place vegetation
      console.log('🌲 Placing vegetation...')
      const vegetationData = this.vegetationPlacer.placeVegetation(
        heightMap,
        bounds.minX,
        bounds.minZ,
        Math.floor(this.config.size.width / resolution) + 1,
        Math.floor(this.config.size.height / resolution) + 1,
        resolution
      )

      // Create vegetation meshes
      const vegetationMeshes = this.vegetationMeshBuilder.createVegetationMeshes(vegetationData)

      // Combine visual meshes
      const terrainGroup = new Group()
      terrainGroup.name = 'terrain-group'
      terrainGroup.add(visualMesh)
      terrainGroup.add(vegetationMeshes)

      // Create metadata
      const generationTime = performance.now() - startTime
      const metadata: TerrainMetadata = {
        biome: this.config.biome,
        features: this.extractFeatures(vegetationData),
        seed: this.config.seed,
        chunkCount: 1, // Single chunk for now
        generationTime
      }

      console.log(`✅ Terrain generation complete in ${generationTime.toFixed(2)}ms`)

      return {
        visualMesh: terrainGroup,
        collisionMesh,
        bounds,
        metadata
      }

    } catch (error) {
      console.error('❌ Terrain generation failed:', error)
      throw new Error(`Terrain generation failed: ${error}`)
    }
  }

  /**
   * Generate terrain asynchronously in chunks (future enhancement)
   */
  async generateChunked(): Promise<TerrainResult> {
    // TODO: Implement chunk-based generation for large terrains
    return this.generate()
  }

  /**
   * Update terrain configuration and regenerate if needed
   */
  updateConfig(newConfig: Partial<TerrainConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.validateConfig()
    this.initializeSystems()
  }

  /**
   * Get current configuration
   */
  getConfig(): TerrainConfig {
    return { ...this.config }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.vegetationMeshBuilder.dispose()
  }

  /**
   * Validate configuration parameters
   */
  private validateConfig(): void {
    if (!BIOME_CONFIGS[this.config.biome]) {
      throw new Error(`Unknown biome type: ${this.config.biome}`)
    }

    if (this.config.size.width <= 0 || this.config.size.height <= 0) {
      throw new Error('Terrain size must be positive')
    }

    if (!this.config.chunkSize || this.config.chunkSize <= 0) {
      throw new Error('Chunk size must be positive')
    }
  }

  /**
   * Initialize all terrain generation systems
   */
  private initializeSystems(): void {
    const biomeConfig = BIOME_CONFIGS[this.config.biome]

    // Initialize core systems
    this.noiseGenerator = new NoiseGenerator(this.config.seed)
    this.heightMapGenerator = new HeightMapGenerator(
      this.noiseGenerator, 
      biomeConfig, 
      this.config.racingFriendly
    )
    this.vegetationPlacer = new VegetationPlacer(
      this.noiseGenerator,
      this.heightMapGenerator,
      biomeConfig
    )

    // Initialize mesh builders
    this.terrainMeshBuilder = new TerrainMeshBuilder(biomeConfig)
    this.vegetationMeshBuilder = new VegetationMeshBuilder()
  }

  /**
   * Calculate terrain bounds
   */
  private calculateBounds(): BoundingBox {
    const halfWidth = this.config.size.width / 2
    const halfHeight = this.config.size.height / 2

    return {
      minX: -halfWidth,
      maxX: halfWidth,
      minZ: -halfHeight,
      maxZ: halfHeight,
      minY: -50, // Will be updated based on actual terrain
      maxY: 50   // Will be updated based on actual terrain
    }
  }

  /**
   * Get resolution based on detail level
   */
  private getResolution(): number {
    switch (this.config.detail) {
      case 'low': return 4
      case 'medium': return 2
      case 'high': return 1
      default: return 2
    }
  }

  /**
   * Extract feature list from vegetation data
   */
  private extractFeatures(vegetationData: any[]): string[] {
    const features = new Set<string>()
    
    features.add('terrain')
    if (vegetationData.length > 0) {
      features.add('vegetation')
    }

    // Add biome-specific features
    const biomeConfig = BIOME_CONFIGS[this.config.biome]
    for (const vegType of biomeConfig.vegetationTypes) {
      if (vegetationData.some(v => v.type === vegType)) {
        features.add(vegType)
      }
    }

    return Array.from(features)
  }

  /**
   * Get height at specific world coordinates (useful for placing objects)
   */
  getHeightAt(x: number, z: number): number {
    return this.noiseGenerator.getHeight(x, z) * BIOME_CONFIGS[this.config.biome].heightScale
  }

  /**
   * Check if a position is suitable for placing objects
   */
  isSuitableForPlacement(x: number, z: number): boolean {
    const slope = Math.abs(this.noiseGenerator.getHeight(x + 1, z) - this.noiseGenerator.getHeight(x - 1, z))
    return slope < 0.3 // Not too steep
  }
}