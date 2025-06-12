import PoissonDiskSampling from 'poisson-disk-sampling'
import type { VegetationData, VegetationType, BiomeConfig } from '../config/TerrainTypes'
import type { NoiseGenerator } from '../core/NoiseGenerator'
import type { HeightMapGenerator } from '../core/HeightMapGenerator'

export class VegetationPlacer {
  private noiseGenerator: NoiseGenerator
  private heightMapGenerator: HeightMapGenerator
  private biomeConfig: BiomeConfig

  constructor(
    noiseGenerator: NoiseGenerator, 
    heightMapGenerator: HeightMapGenerator, 
    biomeConfig: BiomeConfig
  ) {
    this.noiseGenerator = noiseGenerator
    this.heightMapGenerator = heightMapGenerator
    this.biomeConfig = biomeConfig
  }

  /**
   * Place vegetation using Poisson disk sampling for natural distribution
   */
  placeVegetation(
    heightMap: Float32Array,
    mapStartX: number,
    mapStartZ: number, 
    mapWidth: number,
    mapHeight: number,
    resolution: number
  ): VegetationData[] {
    const vegetation: VegetationData[] = []
    
    // Calculate world bounds
    const worldWidth = mapWidth * resolution
    const worldHeight = mapHeight * resolution

    // Configure Poisson disk sampling based on biome density
    const minDistance = this.calculateMinDistance()
    const maxDistance = minDistance * 1.5

    const pds = new PoissonDiskSampling({
      shape: [worldWidth, worldHeight],
      minDistance,
      maxDistance,
      tries: 30
    })

    // Generate candidate positions
    const points = pds.fill()

    for (const point of points) {
      const worldX = mapStartX + point[0]
      const worldZ = mapStartZ + point[1]

      // Check if vegetation should be placed here
      if (!this.shouldPlaceVegetationAt(worldX, worldZ, heightMap, mapStartX, mapStartZ, mapWidth, mapHeight, resolution)) {
        continue
      }

      // Get height at this position
      const height = this.heightMapGenerator.getHeightAtPosition(
        heightMap, worldX, worldZ, mapStartX, mapStartZ, mapWidth, mapHeight, resolution
      )

      // Select vegetation type based on biome and local conditions
      const vegetationType = this.selectVegetationType(worldX, worldZ, height)
      if (!vegetationType) continue

      // Create vegetation data
      const vegetationItem: VegetationData = {
        position: { x: worldX, y: height, z: worldZ },
        type: vegetationType,
        scale: this.generateScale(vegetationType),
        rotation: Math.random() * Math.PI * 2
      }

      vegetation.push(vegetationItem)
    }

    console.log(`🌲 Placed ${vegetation.length} vegetation items in ${this.biomeConfig.name} biome`)
    return vegetation
  }

  /**
   * Calculate minimum distance between vegetation based on biome density
   */
  private calculateMinDistance(): number {
    // Higher density = closer spacing
    const baseDensity = 20 // Base spacing in world units
    return baseDensity * (1 - this.biomeConfig.vegetationDensity * 0.7)
  }

  /**
   * Determine if vegetation should be placed at a specific position
   */
  private shouldPlaceVegetationAt(
    worldX: number, 
    worldZ: number,
    heightMap: Float32Array,
    mapStartX: number,
    mapStartZ: number,
    mapWidth: number,
    mapHeight: number,
    resolution: number
  ): boolean {
    // Check noise-based vegetation placement
    if (!this.noiseGenerator.shouldPlaceVegetation(worldX, worldZ)) {
      return false
    }

    // Check terrain slope (no vegetation on steep slopes)
    const mapX = Math.floor((worldX - mapStartX) / resolution)
    const mapZ = Math.floor((worldZ - mapStartZ) / resolution)
    
    if (mapX < 1 || mapX >= mapWidth - 1 || mapZ < 1 || mapZ >= mapHeight - 1) {
      return false
    }

    const slope = this.heightMapGenerator.calculateSlope(heightMap, mapX, mapZ, mapWidth, mapHeight)
    const maxSlope = 0.5 // Maximum slope for vegetation placement
    
    if (slope > maxSlope) {
      return false
    }

    // Use vegetation density noise for additional variation
    const densityValue = this.noiseGenerator.getVegetationDensity(worldX, worldZ)
    return densityValue > (1 - this.biomeConfig.vegetationDensity)
  }

  /**
   * Select vegetation type based on biome and local conditions
   */
  private selectVegetationType(worldX: number, worldZ: number, height: number): VegetationType | null {
    const availableTypes = this.biomeConfig.vegetationTypes
    if (availableTypes.length === 0) return null

    // Use noise to randomly select from available types
    const selectionNoise = this.noiseGenerator.getVegetationDensity(worldX * 0.1, worldZ * 0.1)
    const typeIndex = Math.floor(selectionNoise * availableTypes.length)
    
    return availableTypes[typeIndex] || availableTypes[0]
  }

  /**
   * Generate scale variation for vegetation
   */
  private generateScale(type: VegetationType): number {
    const baseScales: Record<VegetationType, number> = {
      pine_tree: 1.0,
      oak_tree: 1.2,
      birch_tree: 0.9,
      bush: 0.3,
      rock: 0.8
    }

    const baseScale = baseScales[type] || 1.0
    const variation = 0.3 // ±30% variation
    
    return baseScale * (1 + (Math.random() - 0.5) * variation)
  }

  /**
   * Get vegetation density for debugging/visualization
   */
  getDensityAt(worldX: number, worldZ: number): number {
    return this.noiseGenerator.getVegetationDensity(worldX, worldZ)
  }

  /**
   * Clear vegetation from racing areas (future enhancement)
   */
  clearRacingAreas(vegetation: VegetationData[], racingPaths: Array<{x: number, z: number, radius: number}>): VegetationData[] {
    return vegetation.filter(item => {
      for (const path of racingPaths) {
        const distance = Math.sqrt(
          (item.position.x - path.x) ** 2 + 
          (item.position.z - path.z) ** 2
        )
        if (distance < path.radius) {
          return false // Remove vegetation too close to racing path
        }
      }
      return true
    })
  }
}