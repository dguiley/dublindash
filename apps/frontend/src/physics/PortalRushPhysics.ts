import { Enable3dPhysicsEngine } from './Enable3dPhysicsEngine'
import * as THREE from 'three'
import type { Vector3, LevelData, Player } from '@shared/types'

export interface PlayerPhysicsConfig {
  mass: number
  radius: number
  speed: number
  jumpForce: number
  bounciness: number
  friction: number
}

export interface PortalRushConfig {
  gravity: number
  playerConfig: PlayerPhysicsConfig
  portalForce: number
  obstacleBounciness: number
}

/**
 * Portal Rush Physics Manager using Enable3d
 * Handles players rushing between portals with bouncing collisions
 */
export class PortalRushPhysics {
  private physics: Enable3dPhysicsEngine
  private scene: THREE.Scene
  private playerMeshes = new Map<string, THREE.Object3D>()
  private portalMeshes = new Map<string, THREE.Object3D>()
  private obstacleMeshes: THREE.Object3D[] = []
  private terrainMesh?: THREE.Mesh
  private config: PortalRushConfig

  constructor(scene: THREE.Scene, config?: Partial<PortalRushConfig>) {
    this.scene = scene
    this.config = {
      gravity: -15, // Stronger gravity for fast-paced gameplay
      playerConfig: {
        mass: 1,
        radius: 0.5,
        speed: 12,
        jumpForce: 8,
        bounciness: 0.6, // Players bounce off each other
        friction: 0.3
      },
      portalForce: 25, // Strong portal attraction
      obstacleBounciness: 0.8,
      ...config
    }

    this.physics = new Enable3dPhysicsEngine(scene, {
      gravity: { x: 0, y: this.config.gravity, z: 0 }
    })
  }

  /**
   * Initialize physics world
   */
  async init(): Promise<void> {
    // Enable3d physics is ready to use after construction
    console.log('🎮 Portal Rush Physics initialized')
  }

  /**
   * Add player with sphere collision for bouncing
   */
  addPlayer(playerId: string, mesh: THREE.Object3D, position: Vector3): void {
    // Position the mesh
    mesh.position.set(position.x, position.y, position.z)
    
    // Attach sphere physics body for perfect bouncing
    this.physics.attachSphereBody(mesh, {
      mass: this.config.playerConfig.mass,
      radius: this.config.playerConfig.radius,
      friction: this.config.playerConfig.friction,
      restitution: this.config.playerConfig.bounciness
    })

    this.playerMeshes.set(playerId, mesh)

    // Add player-to-player collision bouncing
    this.setupPlayerCollisions(playerId, mesh)

    console.log(`🎮 Player ${playerId} added with bouncing physics`)
  }

  /**
   * Setup bouncing collisions between players
   */
  private setupPlayerCollisions(playerId: string, playerMesh: THREE.Object3D): void {
    // Add collision with all other players
    this.playerMeshes.forEach((otherMesh, otherPlayerId) => {
      if (otherPlayerId !== playerId) {
        this.physics.onCollision(playerMesh, otherMesh, () => {
          console.log(`💥 Players ${playerId} and ${otherPlayerId} bounced!`)
          
          // Add extra bounce force for dramatic effect
          const direction = playerMesh.position.clone()
            .sub(otherMesh.position)
            .normalize()
          
          ;(playerMesh as any).addImpulse(
            direction.x * 3,
            direction.y * 2,
            direction.z * 3
          )
        })
      }
    })
  }

  /**
   * Remove player from physics world
   */
  removePlayer(playerId: string): void {
    const mesh = this.playerMeshes.get(playerId)
    if (mesh) {
      this.physics.detachBody(mesh)
      this.playerMeshes.delete(playerId)
    }
  }

  /**
   * Move player towards direction with portal rush mechanics
   */
  movePlayer(playerId: string, direction: Vector3, godMode = false): void {
    const mesh = this.playerMeshes.get(playerId)
    if (!mesh || !(mesh as any).body) return

    const speed = this.config.playerConfig.speed
    const force = godMode ? speed * 2 : speed

    if (godMode) {
      // God mode: direct position control
      const newPos = mesh.position.clone()
      newPos.add(new THREE.Vector3(
        direction.x * force * 0.016, // 60fps
        direction.y * force * 0.016,
        direction.z * force * 0.016
      ))
      ;(mesh as any).setPosition(newPos.x, newPos.y, newPos.z)
    } else {
      // Normal mode: physics-based movement
      ;(mesh as any).addForce(
        direction.x * force,
        direction.y * force,
        direction.z * force
      )
    }
  }

  /**
   * Apply jump force to player
   */
  jumpPlayer(playerId: string): void {
    const mesh = this.playerMeshes.get(playerId)
    if (!mesh || !(mesh as any).body) return

    ;(mesh as any).addImpulse(0, this.config.playerConfig.jumpForce, 0)
  }

  /**
   * Add portal with attraction force
   */
  addPortal(portalId: string, mesh: THREE.Object3D, position: Vector3, type: 'start' | 'end'): void {
    mesh.position.set(position.x, position.y, position.z)
    
    // Portals are kinematic (don't fall but can interact)
    this.physics.attachBody(mesh, {
      mass: 0, // Static
      shape: 'sphere',
      radius: 2
    })

    this.portalMeshes.set(portalId, mesh)

    // Setup portal interactions
    this.playerMeshes.forEach((playerMesh, playerId) => {
      this.physics.onCollision(mesh, playerMesh, () => {
        this.handlePortalInteraction(playerId, type)
      })
    })

    console.log(`🌀 Portal ${portalId} (${type}) added`)
  }

  /**
   * Handle portal interactions
   */
  private handlePortalInteraction(playerId: string, portalType: 'start' | 'end'): void {
    if (portalType === 'end') {
      console.log(`🏁 Player ${playerId} reached the end portal!`)
      // Could trigger finish event here
    } else {
      console.log(`🌀 Player ${playerId} touched start portal`)
      // Could apply speed boost or reset
    }
  }

  /**
   * Add obstacle with bouncing collision
   */
  addObstacle(mesh: THREE.Object3D, position: Vector3, scale: Vector3): void {
    mesh.position.set(position.x, position.y, position.z)
    mesh.scale.set(scale.x, scale.y, scale.z)

    // Static obstacle with high bounciness
    this.physics.attachBoxBody(mesh, {
      mass: 0, // Static
      friction: 0.1,
      restitution: this.config.obstacleBounciness
    })

    this.obstacleMeshes.push(mesh)

    // Setup obstacle collisions with all players
    this.playerMeshes.forEach((playerMesh, playerId) => {
      this.physics.onCollision(mesh, playerMesh, () => {
        console.log(`💥 Player ${playerId} bounced off obstacle!`)
        
        // Add extra bounce effect
        const direction = playerMesh.position.clone()
          .sub(mesh.position)
          .normalize()
        
        ;(playerMesh as any).addImpulse(
          direction.x * 5,
          Math.abs(direction.y) * 3 + 2, // Always bounce up a bit
          direction.z * 5
        )
      })
    })

    console.log('🗿 Obstacle added with bouncing physics')
  }

  /**
   * Set terrain collision mesh
   */
  setTerrainMesh(mesh: THREE.Mesh): void {
    if (this.terrainMesh) {
      this.physics.detachBody(this.terrainMesh)
    }

    this.terrainMesh = mesh
    this.physics.attachTerrainMesh(mesh, {
      mass: 0, // Static
      friction: 0.8,
      restitution: 0.2
    })

    console.log('🌍 Terrain collision mesh set')
  }

  /**
   * Apply portal attraction forces
   */
  private applyPortalForces(): void {
    const endPortal = this.portalMeshes.get('end')
    if (!endPortal) return

    this.playerMeshes.forEach((playerMesh, playerId) => {
      const distance = playerMesh.position.distanceTo(endPortal.position)
      const maxDistance = 20 // Portal influence range

      if (distance < maxDistance) {
        const direction = endPortal.position.clone()
          .sub(playerMesh.position)
          .normalize()
        
        const force = this.config.portalForce * (1 - distance / maxDistance)
        
        ;(playerMesh as any).addForce(
          direction.x * force,
          direction.y * force * 0.5, // Less vertical pull
          direction.z * force
        )
      }
    })
  }

  /**
   * Update physics simulation
   */
  update(deltaTime: number): void {
    // Apply portal attraction forces
    this.applyPortalForces()
    
    // Update physics world
    this.physics.update(deltaTime)
  }

  /**
   * Get player position from physics
   */
  getPlayerPosition(playerId: string): Vector3 | undefined {
    const mesh = this.playerMeshes.get(playerId)
    if (!mesh) return undefined

    return {
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z
    }
  }

  /**
   * Get player velocity from physics
   */
  getPlayerVelocity(playerId: string): Vector3 | undefined {
    const mesh = this.playerMeshes.get(playerId)
    if (!mesh || !(mesh as any).body) return undefined

    const body = (mesh as any).body
    return {
      x: body.velocity?.x || 0,
      y: body.velocity?.y || 0,
      z: body.velocity?.z || 0
    }
  }

  /**
   * Setup level from level data
   */
  setupLevel(levelData: LevelData): void {
    // Clear existing obstacles
    this.obstacleMeshes.forEach(mesh => {
      this.physics.detachBody(mesh)
    })
    this.obstacleMeshes = []

    // Clear existing portals
    this.portalMeshes.forEach(mesh => {
      this.physics.detachBody(mesh)
    })
    this.portalMeshes.clear()

    console.log(`🎮 Level setup complete: ${levelData.geometry.obstacles.length} obstacles`)
  }

  /**
   * Create explosion effect at position
   */
  explode(position: Vector3, force: number, radius: number): void {
    this.physics.explosion(
      new THREE.Vector3(position.x, position.y, position.z),
      force,
      radius
    )
    console.log(`💥 Explosion at (${position.x}, ${position.y}, ${position.z})`)
  }

  /**
   * Cleanup physics world
   */
  destroy(): void {
    this.physics.destroy()
    this.playerMeshes.clear()
    this.portalMeshes.clear()
    this.obstacleMeshes = []
  }
}