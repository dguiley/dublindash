import type { Vector3 } from '@shared/types'
import { Raycaster, Vector3 as ThreeVector3, Mesh } from 'three'

export interface AABB {
  min: Vector3
  max: Vector3
}

export class CollisionDetector {
  private raycaster: Raycaster
  private terrainMesh: Mesh | undefined
  private terrainHeightCache: Map<string, number> = new Map()

  constructor() {
    this.raycaster = new Raycaster()
  }

  /**
   * Set the terrain mesh for height queries
   */
  setTerrainMesh(mesh: Mesh): void {
    this.terrainMesh = mesh
    this.terrainHeightCache.clear() // Clear cache when terrain changes
  }

  /**
   * Get terrain height at a specific X,Z position
   */
  getTerrainHeightAt(x: number, z: number): number {
    if (!this.terrainMesh) {
      return 0 // Default ground level
    }

    // Check cache first
    const cacheKey = `${x.toFixed(2)},${z.toFixed(2)}`
    const cached = this.terrainHeightCache.get(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    // Cast a ray downward from high above the terrain
    const origin = new ThreeVector3(x, 1000, z) // Start high above
    const direction = new ThreeVector3(0, -1, 0) // Straight down
    
    this.raycaster.set(origin, direction)
    
    // Check for intersection with terrain
    const intersects = this.raycaster.intersectObject(this.terrainMesh, false)
    
    let height = 0
    if (intersects.length > 0) {
      // Use the first (highest) intersection point
      height = intersects[0].point.y
    }

    // Cache the result
    this.terrainHeightCache.set(cacheKey, height)
    
    // Limit cache size
    if (this.terrainHeightCache.size > 1000) {
      // Remove oldest entries
      const firstKey = this.terrainHeightCache.keys().next().value
      if (firstKey) {
        this.terrainHeightCache.delete(firstKey)
      }
    }

    return height
  }

  /**
   * Check collision between a sphere and an AABB (Axis-Aligned Bounding Box)
   */
  checkSphereAABBCollision(
    sphereCenter: Vector3,
    sphereRadius: number,
    boxCenter: Vector3,
    boxSize: Vector3
  ): boolean {
    // Calculate AABB min and max
    const halfSize = {
      x: boxSize.x / 2,
      y: boxSize.y / 2,
      z: boxSize.z / 2
    }
    
    const boxMin = {
      x: boxCenter.x - halfSize.x,
      y: boxCenter.y - halfSize.y,
      z: boxCenter.z - halfSize.z
    }
    
    const boxMax = {
      x: boxCenter.x + halfSize.x,
      y: boxCenter.y + halfSize.y,
      z: boxCenter.z + halfSize.z
    }

    // Find the closest point on the AABB to the sphere center
    const closestPoint = {
      x: Math.max(boxMin.x, Math.min(sphereCenter.x, boxMax.x)),
      y: Math.max(boxMin.y, Math.min(sphereCenter.y, boxMax.y)),
      z: Math.max(boxMin.z, Math.min(sphereCenter.z, boxMax.z))
    }

    // Check if the closest point is within the sphere radius
    const distanceSquared = 
      (closestPoint.x - sphereCenter.x) ** 2 +
      (closestPoint.y - sphereCenter.y) ** 2 +
      (closestPoint.z - sphereCenter.z) ** 2

    return distanceSquared <= sphereRadius ** 2
  }

  /**
   * Check collision between two spheres
   */
  checkSphereSphereCollision(
    center1: Vector3,
    radius1: number,
    center2: Vector3,
    radius2: number
  ): boolean {
    const distanceSquared = 
      (center1.x - center2.x) ** 2 +
      (center1.y - center2.y) ** 2 +
      (center1.z - center2.z) ** 2

    const radiusSum = radius1 + radius2
    return distanceSquared <= radiusSum ** 2
  }

  /**
   * Get AABB for an obstacle based on its type and scale
   */
  getObstacleAABB(position: Vector3, scale: Vector3, type: string): AABB {
    // Default sizes for different obstacle types
    let baseSize = { x: 1, y: 1, z: 1 }
    
    switch (type) {
      case 'tree':
        baseSize = { x: 1, y: 2, z: 1 } // Trees are taller
        break
      case 'rock':
        baseSize = { x: 1.5, y: 1, z: 1.5 } // Rocks are wider
        break
      case 'building':
        baseSize = { x: 2, y: 3, z: 2 } // Buildings are larger
        break
      case 'barrier':
        baseSize = { x: 3, y: 1, z: 0.5 } // Barriers are wide and thin
        break
    }

    // Apply scale
    const size = {
      x: baseSize.x * scale.x,
      y: baseSize.y * scale.y,
      z: baseSize.z * scale.z
    }

    return {
      min: {
        x: position.x - size.x / 2,
        y: position.y,
        z: position.z - size.z / 2
      },
      max: {
        x: position.x + size.x / 2,
        y: position.y + size.y,
        z: position.z + size.z / 2
      }
    }
  }

  /**
   * Clear the height cache (useful when terrain changes)
   */
  clearCache(): void {
    this.terrainHeightCache.clear()
  }
}