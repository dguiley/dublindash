import type { BiomeConfig } from '../config/TerrainTypes'
import { RACING_CONSTRAINTS } from '../config/BiomeConfigs'
import type { NoiseGenerator } from './NoiseGenerator'

export class HeightMapGenerator {
  private noiseGenerator: NoiseGenerator
  private biomeConfig: BiomeConfig
  private racingFriendly: boolean

  constructor(noiseGenerator: NoiseGenerator, biomeConfig: BiomeConfig, racingFriendly: boolean = true) {
    this.noiseGenerator = noiseGenerator
    this.biomeConfig = biomeConfig
    this.racingFriendly = racingFriendly
  }

  /**
   * Generate height map for a given area
   */
  generateHeightMap(
    startX: number, 
    startZ: number, 
    width: number, 
    height: number, 
    resolution: number = 1
  ): Float32Array {
    const widthSegments = Math.floor(width / resolution)
    const heightSegments = Math.floor(height / resolution)
    const heightMap = new Float32Array((widthSegments + 1) * (heightSegments + 1))

    for (let z = 0; z <= heightSegments; z++) {
      for (let x = 0; x <= widthSegments; x++) {
        const worldX = startX + (x * resolution)
        const worldZ = startZ + (z * resolution)
        
        // Generate base height using noise
        let terrainHeight = this.noiseGenerator.getHeight(worldX, worldZ) * this.biomeConfig.heightScale

        // Apply racing-friendly constraints if enabled
        if (this.racingFriendly) {
          terrainHeight = this.applyRacingConstraints(terrainHeight, worldX, worldZ)
        }

        const index = z * (widthSegments + 1) + x
        heightMap[index] = terrainHeight
      }
    }

    // Apply smoothing if racing-friendly mode is enabled
    if (this.racingFriendly) {
      return this.smoothHeightMap(heightMap, widthSegments + 1, heightSegments + 1)
    }

    return heightMap
  }

  /**
   * Apply racing-friendly constraints to terrain height
   */
  private applyRacingConstraints(height: number, x: number, z: number): number {
    // Clamp extreme heights for better racing
    const maxHeight = this.biomeConfig.heightScale * 0.8
    const minHeight = this.biomeConfig.heightScale * -0.2
    
    return Math.max(minHeight, Math.min(maxHeight, height))
  }

  /**
   * Smooth height map to reduce steep slopes
   */
  private smoothHeightMap(
    heightMap: Float32Array, 
    width: number, 
    height: number
  ): Float32Array {
    const smoothed = new Float32Array(heightMap.length)
    const radius = RACING_CONSTRAINTS.smoothingRadius

    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        const index = z * width + x
        
        // Calculate average height in smoothing radius
        let totalHeight = 0
        let sampleCount = 0

        for (let dz = -radius; dz <= radius; dz++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const sampleX = x + dx
            const sampleZ = z + dz

            // Check bounds
            if (sampleX >= 0 && sampleX < width && sampleZ >= 0 && sampleZ < height) {
              const sampleIndex = sampleZ * width + sampleX
              const distance = Math.sqrt(dx * dx + dz * dz)
              
              // Weight samples by distance (closer = more influence)
              if (distance <= radius) {
                const weight = 1 - (distance / radius)
                totalHeight += heightMap[sampleIndex] * weight
                sampleCount += weight
              }
            }
          }
        }

        smoothed[index] = sampleCount > 0 ? totalHeight / sampleCount : heightMap[index]
      }
    }

    return smoothed
  }

  /**
   * Calculate slope at a given point (for vegetation placement)
   */
  calculateSlope(heightMap: Float32Array, x: number, z: number, width: number, height: number): number {
    if (x <= 0 || x >= width - 1 || z <= 0 || z >= height - 1) {
      return 0
    }

    const index = z * width + x
    const leftHeight = heightMap[index - 1]
    const rightHeight = heightMap[index + 1]
    const topHeight = heightMap[(z - 1) * width + x]
    const bottomHeight = heightMap[(z + 1) * width + x]

    const slopeX = rightHeight - leftHeight
    const slopeZ = bottomHeight - topHeight

    return Math.sqrt(slopeX * slopeX + slopeZ * slopeZ)
  }

  /**
   * Get height at specific world coordinates (with interpolation)
   */
  getHeightAtPosition(
    heightMap: Float32Array, 
    worldX: number, 
    worldZ: number, 
    mapStartX: number, 
    mapStartZ: number, 
    mapWidth: number, 
    mapHeight: number, 
    resolution: number
  ): number {
    // Convert world coordinates to height map coordinates
    const mapX = (worldX - mapStartX) / resolution
    const mapZ = (worldZ - mapStartZ) / resolution

    // Get integer coordinates
    const x0 = Math.floor(mapX)
    const z0 = Math.floor(mapZ)
    const x1 = x0 + 1
    const z1 = z0 + 1

    // Check bounds
    if (x0 < 0 || x1 >= mapWidth || z0 < 0 || z1 >= mapHeight) {
      return 0
    }

    // Get fractional parts for interpolation
    const fx = mapX - x0
    const fz = mapZ - z0

    // Get height values at corners
    const h00 = heightMap[z0 * mapWidth + x0]
    const h10 = heightMap[z0 * mapWidth + x1]
    const h01 = heightMap[z1 * mapWidth + x0]
    const h11 = heightMap[z1 * mapWidth + x1]

    // Bilinear interpolation
    const h0 = h00 * (1 - fx) + h10 * fx
    const h1 = h01 * (1 - fx) + h11 * fx
    
    return h0 * (1 - fz) + h1 * fz
  }
}