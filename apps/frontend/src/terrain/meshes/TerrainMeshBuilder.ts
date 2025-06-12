import { 
  PlaneGeometry, 
  Mesh, 
  MeshLambertMaterial, 
  BufferGeometry,
  BufferAttribute,
  Color
} from 'three'
import type { BiomeConfig } from '../config/TerrainTypes'

export class TerrainMeshBuilder {
  private biomeConfig: BiomeConfig

  constructor(biomeConfig: BiomeConfig) {
    this.biomeConfig = biomeConfig
  }

  /**
   * Create visual terrain mesh from height map
   */
  createTerrainMesh(
    heightMap: Float32Array,
    startX: number,
    startZ: number,
    width: number,
    height: number,
    resolution: number
  ): Mesh {
    const widthSegments = Math.floor(width / resolution)
    const heightSegments = Math.floor(height / resolution)

    // Create base plane geometry
    const geometry = new PlaneGeometry(
      width, 
      height, 
      widthSegments, 
      heightSegments
    )

    // Rotate to horizontal plane (PlaneGeometry is vertical by default)
    geometry.rotateX(-Math.PI / 2)

    // Apply height map to vertices
    this.applyHeightMap(geometry, heightMap, widthSegments + 1, heightSegments + 1)

    // Position the geometry correctly
    geometry.translate(startX + width / 2, 0, startZ + height / 2)

    // Create material based on biome
    const material = this.createTerrainMaterial()

    // Create mesh
    const mesh = new Mesh(geometry, material)
    mesh.receiveShadow = true
    mesh.name = `terrain-${this.biomeConfig.name}`

    return mesh
  }

  /**
   * Create simplified collision mesh from height map
   */
  createCollisionMesh(
    heightMap: Float32Array,
    startX: number,
    startZ: number,
    width: number,
    height: number,
    resolution: number,
    simplificationFactor: number = 2
  ): Mesh {
    // Use lower resolution for collision mesh
    const collisionResolution = resolution * simplificationFactor
    const widthSegments = Math.floor(width / collisionResolution)
    const heightSegments = Math.floor(height / collisionResolution)

    // Create simplified height map
    const simplifiedHeightMap = this.simplifyHeightMap(
      heightMap, 
      Math.floor(width / resolution) + 1,
      Math.floor(height / resolution) + 1,
      simplificationFactor
    )

    // Create geometry
    const geometry = new PlaneGeometry(
      width, 
      height, 
      widthSegments, 
      heightSegments
    )

    geometry.rotateX(-Math.PI / 2)

    // Apply simplified height map
    this.applyHeightMap(geometry, simplifiedHeightMap, widthSegments + 1, heightSegments + 1)

    // Position the geometry
    geometry.translate(startX + width / 2, 0, startZ + height / 2)

    // Create simple material (invisible)
    const material = new MeshLambertMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0,
      wireframe: false
    })

    const mesh = new Mesh(geometry, material)
    mesh.visible = false // Hide collision mesh
    mesh.name = `terrain-collision-${this.biomeConfig.name}`

    return mesh
  }

  /**
   * Apply height map data to geometry vertices
   */
  private applyHeightMap(
    geometry: BufferGeometry, 
    heightMap: Float32Array, 
    mapWidth: number, 
    mapHeight: number
  ): void {
    const positionAttribute = geometry.getAttribute('position') as BufferAttribute
    const positions = positionAttribute.array as Float32Array

    // Apply height to each vertex
    for (let i = 0; i < positions.length; i += 3) {
      // Calculate which height map point this vertex corresponds to
      const vertexIndex = Math.floor(i / 3)
      const row = Math.floor(vertexIndex / mapWidth)
      const col = vertexIndex % mapWidth

      // Ensure we don't go out of bounds
      if (row < mapHeight && col < mapWidth) {
        const heightIndex = row * mapWidth + col
        positions[i + 1] = heightMap[heightIndex] // Y coordinate
      }
    }

    positionAttribute.needsUpdate = true
    geometry.computeVertexNormals()
  }

  /**
   * Create terrain material based on biome configuration
   */
  private createTerrainMaterial(): MeshLambertMaterial {
    const color = new Color(this.biomeConfig.terrainColor)
    
    return new MeshLambertMaterial({
      color,
      // TODO: Add texture support in future phases
      // map: terrainTexture,
      // normalMap: normalTexture,
    })
  }

  /**
   * Simplify height map for collision mesh
   */
  private simplifyHeightMap(
    originalHeightMap: Float32Array,
    originalWidth: number,
    originalHeight: number,
    factor: number
  ): Float32Array {
    const newWidth = Math.floor(originalWidth / factor)
    const newHeight = Math.floor(originalHeight / factor)
    const simplifiedMap = new Float32Array(newWidth * newHeight)

    for (let z = 0; z < newHeight; z++) {
      for (let x = 0; x < newWidth; x++) {
        // Sample from original height map
        const origX = Math.min(x * factor, originalWidth - 1)
        const origZ = Math.min(z * factor, originalHeight - 1)
        const origIndex = origZ * originalWidth + origX
        
        const newIndex = z * newWidth + x
        simplifiedMap[newIndex] = originalHeightMap[origIndex]
      }
    }

    return simplifiedMap
  }

  /**
   * Add vertex colors based on height (future enhancement)
   */
  private addVertexColors(geometry: BufferGeometry, heightMap: Float32Array): void {
    const positionAttribute = geometry.getAttribute('position') as BufferAttribute
    const colors = new Float32Array(positionAttribute.count * 3)

    // Calculate height range for color mapping
    let minHeight = Infinity
    let maxHeight = -Infinity
    for (const height of heightMap) {
      minHeight = Math.min(minHeight, height)
      maxHeight = Math.max(maxHeight, height)
    }

    const heightRange = maxHeight - minHeight

    for (let i = 0; i < positionAttribute.count; i++) {
      const height = positionAttribute.getY(i)
      const normalizedHeight = heightRange > 0 ? (height - minHeight) / heightRange : 0

      // Create color based on height (green at bottom, brown at top)
      const baseColor = new Color(this.biomeConfig.terrainColor)
      const heightColor = new Color().lerpColors(
        baseColor,
        new Color(0x8B4513), // Brown
        normalizedHeight
      )

      colors[i * 3] = heightColor.r
      colors[i * 3 + 1] = heightColor.g
      colors[i * 3 + 2] = heightColor.b
    }

    geometry.setAttribute('color', new BufferAttribute(colors, 3))
  }

  /**
   * Generate normal map for terrain (future enhancement)
   */
  private generateNormalMap(heightMap: Float32Array, width: number, height: number): Float32Array {
    // Implementation for generating normal vectors from height map
    // This will be useful for more realistic lighting
    const normals = new Float32Array(width * height * 3)
    
    // TODO: Implement normal calculation
    // For now, just return default up normals
    for (let i = 0; i < normals.length; i += 3) {
      normals[i] = 0     // X
      normals[i + 1] = 1 // Y (up)
      normals[i + 2] = 0 // Z
    }

    return normals
  }
}