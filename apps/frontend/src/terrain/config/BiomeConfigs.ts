import type { BiomeConfig, BiomeType } from './TerrainTypes'

export const BIOME_CONFIGS: Record<BiomeType, BiomeConfig> = {
  temperate_forest: {
    name: 'temperate_forest',
    heightScale: 20,
    vegetationDensity: 0.7,
    vegetationTypes: ['oak_tree', 'birch_tree', 'bush'],
    terrainColor: '#4a7c59',
    moistureRange: [0.4, 0.8],
    temperatureRange: [0.3, 0.7]
  },

  desert: {
    name: 'desert',
    heightScale: 30,
    vegetationDensity: 0.1,
    vegetationTypes: ['rock'],
    terrainColor: '#d4a574',
    moistureRange: [0.0, 0.2],
    temperatureRange: [0.7, 1.0]
  },

  alpine: {
    name: 'alpine',
    heightScale: 50,
    vegetationDensity: 0.3,
    vegetationTypes: ['pine_tree', 'rock'],
    terrainColor: '#6b8e6b',
    moistureRange: [0.3, 0.6],
    temperatureRange: [0.0, 0.3]
  },

  wetlands: {
    name: 'wetlands',
    heightScale: 5,
    vegetationDensity: 0.5,
    vegetationTypes: ['birch_tree', 'bush'],
    terrainColor: '#5a7a5a',
    moistureRange: [0.8, 1.0],
    temperatureRange: [0.4, 0.6]
  }
}

// Noise configuration for terrain generation
export const NOISE_CONFIG = {
  // Height map generation
  height: {
    scale: 0.01,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0
  },
  
  // Moisture map for biome generation
  moisture: {
    scale: 0.005,
    octaves: 3,
    persistence: 0.4,
    lacunarity: 2.0
  },
  
  // Temperature map for biome generation
  temperature: {
    scale: 0.003,
    octaves: 2,
    persistence: 0.3,
    lacunarity: 2.0
  },

  // Vegetation placement noise
  vegetation: {
    scale: 0.02,
    threshold: 0.3 // Only place vegetation where noise > threshold
  }
}

// Racing-friendly terrain constraints
export const RACING_CONSTRAINTS = {
  maxSlope: 0.3, // Maximum terrain slope (0.3 = ~17 degrees)
  smoothingRadius: 5, // Radius for slope smoothing
  roadClearance: 8, // Minimum distance to keep vegetation away from roads
  minFlatArea: 100 // Minimum flat area size for racing sections
}