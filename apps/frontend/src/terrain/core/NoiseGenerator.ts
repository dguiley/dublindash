import { createNoise2D } from 'simplex-noise'
import { NOISE_CONFIG } from '../config/BiomeConfigs'

export class NoiseGenerator {
  private heightNoise: (x: number, y: number) => number
  private moistureNoise: (x: number, y: number) => number
  private temperatureNoise: (x: number, y: number) => number
  private vegetationNoise: (x: number, y: number) => number

  constructor(seed: number = Math.random()) {
    // Create separate noise functions for different purposes
    this.heightNoise = createNoise2D(() => this.seededRandom(seed))
    this.moistureNoise = createNoise2D(() => this.seededRandom(seed + 1000))
    this.temperatureNoise = createNoise2D(() => this.seededRandom(seed + 2000))
    this.vegetationNoise = createNoise2D(() => this.seededRandom(seed + 3000))
  }

  /**
   * Generate height value using fractal Brownian motion
   */
  getHeight(x: number, z: number): number {
    const config = NOISE_CONFIG.height
    let height = 0
    let amplitude = 1
    let frequency = config.scale

    for (let i = 0; i < config.octaves; i++) {
      height += this.heightNoise(x * frequency, z * frequency) * amplitude
      amplitude *= config.persistence
      frequency *= config.lacunarity
    }

    return height
  }

  /**
   * Generate moisture value (0-1)
   */
  getMoisture(x: number, z: number): number {
    const config = NOISE_CONFIG.moisture
    let moisture = 0
    let amplitude = 1
    let frequency = config.scale

    for (let i = 0; i < config.octaves; i++) {
      moisture += this.moistureNoise(x * frequency, z * frequency) * amplitude
      amplitude *= config.persistence
      frequency *= config.lacunarity
    }

    // Normalize to 0-1 range
    return (moisture + 1) * 0.5
  }

  /**
   * Generate temperature value (0-1)
   */
  getTemperature(x: number, z: number): number {
    const config = NOISE_CONFIG.temperature
    let temperature = 0
    let amplitude = 1
    let frequency = config.scale

    for (let i = 0; i < config.octaves; i++) {
      temperature += this.temperatureNoise(x * frequency, z * frequency) * amplitude
      amplitude *= config.persistence
      frequency *= config.lacunarity
    }

    // Normalize to 0-1 range
    return (temperature + 1) * 0.5
  }

  /**
   * Check if vegetation should be placed at this position
   */
  shouldPlaceVegetation(x: number, z: number): boolean {
    const value = this.vegetationNoise(x * NOISE_CONFIG.vegetation.scale, z * NOISE_CONFIG.vegetation.scale)
    return value > NOISE_CONFIG.vegetation.threshold
  }

  /**
   * Get vegetation density (0-1) for placement algorithms
   */
  getVegetationDensity(x: number, z: number): number {
    const value = this.vegetationNoise(x * NOISE_CONFIG.vegetation.scale, z * NOISE_CONFIG.vegetation.scale)
    return Math.max(0, (value + 1) * 0.5)
  }

  /**
   * Simple seeded random number generator
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
}