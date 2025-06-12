import { LevelGenerator } from './LevelGenerator'
import type { BiomeType } from './config/TerrainTypes'

/**
 * Simple terrain demo system for testing the terrain generation
 */
export class TerrainDemo {
  private levelGenerator: LevelGenerator

  constructor() {
    this.levelGenerator = new LevelGenerator()
  }

  /**
   * Generate a demo level for testing
   */
  async generateDemoLevel(biome: BiomeType = 'temperate_forest') {
    console.log(`🎮 Starting terrain demo: ${biome}`)
    
    try {
      const result = await this.levelGenerator.generateLevel({
        biome,
        seed: 42, // Fixed seed for consistent testing
        size: { width: 100, height: 100 },
        racingFriendly: true
      })

      console.log('✅ Demo terrain generated successfully!')
      console.log(`📊 Level: ${result.levelData.id}`)
      console.log(`🌍 Biome: ${result.levelData.biome}`)
      console.log(`🎯 Difficulty: ${result.levelData.metadata.difficulty}`)
      console.log(`🌲 Obstacles: ${result.levelData.geometry.obstacles.length}`)

      return result

    } catch (error) {
      console.error('❌ Terrain demo failed:', error)
      throw error
    }
  }

  /**
   * Generate multiple demo levels to test different biomes
   */
  async generateAllBiomes() {
    const biomes: BiomeType[] = ['temperate_forest', 'desert', 'alpine', 'wetlands']
    const results = []

    for (const biome of biomes) {
      console.log(`🔄 Generating ${biome} demo...`)
      const result = await this.generateDemoLevel(biome)
      results.push({ biome, ...result })
    }

    console.log(`🎉 Generated ${results.length} demo levels!`)
    return results
  }

  /**
   * Simple performance test
   */
  async performanceTest(iterations: number = 3) {
    console.log(`⏱️ Running terrain performance test (${iterations} iterations)`)
    
    const times = []
    const biomes: BiomeType[] = ['temperate_forest', 'desert', 'alpine', 'wetlands']

    for (let i = 0; i < iterations; i++) {
      const biome = biomes[i % biomes.length]
      const startTime = performance.now()
      
      await this.levelGenerator.generateLevel({
        biome,
        seed: Math.random() * 10000,
        size: { width: 150, height: 150 },
        racingFriendly: true
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      times.push(duration)
      
      console.log(`📊 Iteration ${i + 1}: ${duration.toFixed(2)}ms (${biome})`)
    }

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)

    console.log(`📈 Performance Results:`)
    console.log(`   Average: ${averageTime.toFixed(2)}ms`)
    console.log(`   Min: ${minTime.toFixed(2)}ms`)
    console.log(`   Max: ${maxTime.toFixed(2)}ms`)

    return { averageTime, minTime, maxTime, times }
  }

  /**
   * Test terrain at different detail levels
   */
  async detailLevelTest() {
    console.log('🔍 Testing terrain detail levels...')
    
    const detailLevels = ['low', 'medium', 'high'] as const
    const results = []

    for (const detail of detailLevels) {
      console.log(`🔄 Testing ${detail} detail...`)
      const startTime = performance.now()
      
      const result = await this.levelGenerator.generateLevel({
        biome: 'temperate_forest',
        seed: 123,
        size: { width: 100, height: 100 },
        racingFriendly: true
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      results.push({
        detail,
        duration,
        vegetationCount: result.levelData.geometry.obstacles.length
      })
      
      console.log(`📊 ${detail}: ${duration.toFixed(2)}ms, ${result.levelData.geometry.obstacles.length} features`)
    }

    return results
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.levelGenerator.dispose()
  }
}

// Global demo instance for easy access in console
if (typeof window !== 'undefined') {
  (window as any).terrainDemo = new TerrainDemo()
  console.log('🎮 Terrain demo available as window.terrainDemo')
  console.log('Try: terrainDemo.generateDemoLevel("temperate_forest")')
}