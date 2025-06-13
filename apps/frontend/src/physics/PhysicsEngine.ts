import type { Vector3 } from '@shared/types'
import type { Mesh } from 'three'
import { CollisionDetector } from './CollisionDetector'

export interface PhysicsConfig {
  gravity: number // Y-axis gravity (negative for downward)
  friction: number // Ground friction coefficient
  airResistance: number // Air resistance coefficient
  maxSpeed: number // Maximum horizontal speed
  jumpVelocity: number // Initial jump velocity
}

export interface PhysicsBody {
  position: Vector3
  velocity: Vector3
  acceleration: Vector3
  mass: number
  radius: number // For sphere collider
  isGrounded: boolean
  lastGroundY: number
}

export class PhysicsEngine {
  private config: PhysicsConfig
  private collisionDetector: CollisionDetector
  private terrainCollisionMesh: Mesh | undefined

  constructor(config?: Partial<PhysicsConfig>) {
    this.config = {
      gravity: -30, // Reasonable gravity for arcade racing
      friction: 0.95, // Ground friction
      airResistance: 0.98, // Air resistance
      maxSpeed: 20, // Max horizontal speed
      jumpVelocity: 15, // Jump power
      ...config
    }
    
    this.collisionDetector = new CollisionDetector()
  }

  /**
   * Set the terrain collision mesh for height queries
   */
  setTerrainMesh(mesh: Mesh): void {
    this.terrainCollisionMesh = mesh
    this.collisionDetector.setTerrainMesh(mesh)
  }

  /**
   * Create a physics body for a player
   */
  createPhysicsBody(position: Vector3, radius = 0.5): PhysicsBody {
    return {
      position: { ...position },
      velocity: { x: 0, y: 0, z: 0 },
      acceleration: { x: 0, y: 0, z: 0 },
      mass: 1,
      radius,
      isGrounded: false,
      lastGroundY: position.y
    }
  }

  /**
   * Apply movement input to a physics body
   */
  applyMovement(body: PhysicsBody, direction: Vector3, isGodMode = false): void {
    const acceleration = isGodMode ? 40.0 : 10.0
    
    // Apply horizontal acceleration
    body.acceleration.x += direction.x * acceleration
    body.acceleration.z += direction.z * acceleration
    
    // Handle jump
    if (direction.y > 0 && body.isGrounded) {
      body.velocity.y = this.config.jumpVelocity
      body.isGrounded = false
    }
  }

  /**
   * Update physics for a single body
   */
  updateBody(body: PhysicsBody, deltaTime: number, isGodMode = false): void {
    // Apply gravity (unless in god mode and flying)
    if (!isGodMode || body.isGrounded) {
      body.acceleration.y = this.config.gravity
    } else if (isGodMode) {
      // God mode can fly
      body.acceleration.y = 0
    }

    // Update velocity from acceleration
    body.velocity.x += body.acceleration.x * deltaTime
    body.velocity.y += body.acceleration.y * deltaTime
    body.velocity.z += body.acceleration.z * deltaTime

    // Apply speed limits (unless god mode)
    if (!isGodMode) {
      const horizontalSpeed = Math.sqrt(body.velocity.x ** 2 + body.velocity.z ** 2)
      if (horizontalSpeed > this.config.maxSpeed) {
        const factor = this.config.maxSpeed / horizontalSpeed
        body.velocity.x *= factor
        body.velocity.z *= factor
      }
    }

    // Update position from velocity
    const newPosition: Vector3 = {
      x: body.position.x + body.velocity.x * deltaTime,
      y: body.position.y + body.velocity.y * deltaTime,
      z: body.position.z + body.velocity.z * deltaTime
    }

    // Check terrain collision
    if (this.terrainCollisionMesh) {
      const terrainHeight = this.collisionDetector.getTerrainHeightAt(newPosition.x, newPosition.z)
      const playerBottom = newPosition.y - body.radius

      if (playerBottom <= terrainHeight) {
        // Player is on or below terrain
        newPosition.y = terrainHeight + body.radius
        body.velocity.y = Math.max(0, body.velocity.y) // Stop downward velocity
        body.isGrounded = true
        body.lastGroundY = newPosition.y

        // Apply ground friction
        body.velocity.x *= this.config.friction
        body.velocity.z *= this.config.friction
      } else {
        // Player is in the air
        body.isGrounded = false
        
        // Apply air resistance
        body.velocity.x *= this.config.airResistance
        body.velocity.z *= this.config.airResistance
      }
    } else {
      // No terrain mesh - use simple ground plane at y=0
      if (newPosition.y <= body.radius) {
        newPosition.y = body.radius
        body.velocity.y = Math.max(0, body.velocity.y)
        body.isGrounded = true
        body.lastGroundY = newPosition.y

        // Apply ground friction
        body.velocity.x *= this.config.friction
        body.velocity.z *= this.config.friction
      } else {
        body.isGrounded = false
        
        // Apply air resistance
        body.velocity.x *= this.config.airResistance
        body.velocity.z *= this.config.airResistance
      }
    }

    // Update body position
    body.position.x = newPosition.x
    body.position.y = newPosition.y
    body.position.z = newPosition.z

    // Reset acceleration (it's reapplied each frame)
    body.acceleration.x = 0
    body.acceleration.y = 0
    body.acceleration.z = 0
  }

  /**
   * Check collision between a physics body and an obstacle
   */
  checkObstacleCollision(body: PhysicsBody, obstaclePosition: Vector3, obstacleSize: Vector3): boolean {
    return this.collisionDetector.checkSphereAABBCollision(
      body.position,
      body.radius,
      obstaclePosition,
      obstacleSize
    )
  }

  /**
   * Handle collision response for obstacles
   */
  resolveObstacleCollision(body: PhysicsBody, obstaclePosition: Vector3, obstacleSize: Vector3): void {
    // Simple push-out collision response
    const dx = body.position.x - obstaclePosition.x
    const dz = body.position.z - obstaclePosition.z
    
    // Determine which side to push out from
    const halfWidth = obstacleSize.x / 2
    const halfDepth = obstacleSize.z / 2
    
    const overlapX = (halfWidth + body.radius) - Math.abs(dx)
    const overlapZ = (halfDepth + body.radius) - Math.abs(dz)
    
    if (overlapX < overlapZ) {
      // Push out on X axis
      body.position.x += Math.sign(dx) * overlapX
      body.velocity.x *= -0.5 // Bounce with energy loss
    } else {
      // Push out on Z axis
      body.position.z += Math.sign(dz) * overlapZ
      body.velocity.z *= -0.5 // Bounce with energy loss
    }
  }

  /**
   * Get current physics stats for debugging
   */
  getPhysicsStats(body: PhysicsBody): string {
    return `Pos: (${body.position.x.toFixed(1)}, ${body.position.y.toFixed(1)}, ${body.position.z.toFixed(1)}) ` +
           `Vel: (${body.velocity.x.toFixed(1)}, ${body.velocity.y.toFixed(1)}, ${body.velocity.z.toFixed(1)}) ` +
           `Grounded: ${body.isGrounded}`
  }
}