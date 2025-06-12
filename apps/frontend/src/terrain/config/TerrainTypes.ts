import type { Group, Mesh } from 'three'

export interface TerrainConfig {
  seed: number
  size: { width: number; height: number }
  biome: BiomeType
  detail: DetailLevel
  racingFriendly: boolean
  chunkSize?: number
}

export interface TerrainResult {
  visualMesh: Group
  collisionMesh: Mesh
  bounds: BoundingBox
  metadata: TerrainMetadata
}

export interface BoundingBox {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  minY: number
  maxY: number
}

export interface TerrainMetadata {
  biome: BiomeType
  features: string[]
  seed: number
  chunkCount: number
  generationTime: number
}

export type BiomeType = 'temperate_forest' | 'desert' | 'alpine' | 'wetlands'
export type DetailLevel = 'low' | 'medium' | 'high'

export interface ChunkCoords {
  x: number
  z: number
}

export interface ChunkData {
  coords: ChunkCoords
  heightMap: Float32Array
  visualMesh: Mesh
  collisionMesh: Mesh
  vegetation: VegetationData[]
}

export interface VegetationData {
  position: { x: number; y: number; z: number }
  type: VegetationType
  scale: number
  rotation: number
}

export type VegetationType = 'pine_tree' | 'oak_tree' | 'birch_tree' | 'bush' | 'rock'

export interface BiomeConfig {
  name: BiomeType
  heightScale: number
  vegetationDensity: number
  vegetationTypes: VegetationType[]
  terrainColor: string
  moistureRange: [number, number]
  temperatureRange: [number, number]
}