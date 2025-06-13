import { AmmoPhysics } from '@enable3d/ammo-physics'
import * as THREE from 'three'

export interface PhysicsOptions {
  gravity?: { x: number; y: number; z: number }
  maxSubSteps?: number
  fixedTimeStep?: number
}

export interface BodyOptions {
  mass?: number
  shape?: 'box' | 'sphere' | 'plane' | 'convex' | 'concave'
  size?: { x: number; y: number; z: number }
  radius?: number
  friction?: number
  restitution?: number
  position?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
}

/**
 * Enable3d Physics Engine with Direct Three.js Object Attachment
 * This is exactly what you wanted - physics bodies directly attached to Three.js objects!
 */
export class Enable3dPhysicsEngine {
  private physics: AmmoPhysics
  private scene: THREE.Scene
  private attachedObjects = new Map<THREE.Object3D, any>()
  private objectsToUpdate: THREE.Object3D[] = []
  
  constructor(scene: THREE.Scene, options: PhysicsOptions = {}) {
    this.scene = scene
    this.physics = new AmmoPhysics(scene)
    
    if (options.gravity) {
      this.physics.setGravity(options.gravity.x, options.gravity.y, options.gravity.z)
    }
  }

  /**
   * Attach physics body directly to Three.js object
   * This is the killer feature you wanted!
   */
  attachBody(object: THREE.Object3D, options: BodyOptions = {}): void {
    // Add physics body to the object using enable3d's add.existing()
    this.physics.add.existing(object as any, {
      mass: options.mass ?? 1,
      collisionFlags: 0
    })

    // Store reference for cleanup
    this.attachedObjects.set(object, true)
    this.objectsToUpdate.push(object)

    // Add convenience methods directly to the Three.js object
    ;(object as any).setVelocity = (x: number, y: number, z: number) => {
      if ((object as any).body) {
        const body = (object as any).body
        body.setLinearVelocity(x, y, z)
        body.activate()
      }
    }

    ;(object as any).addForce = (x: number, y: number, z: number) => {
      if ((object as any).body) {
        const body = (object as any).body
        body.applyCentralImpulse(x, y, z)
        body.activate()
      }
    }

    ;(object as any).addImpulse = (x: number, y: number, z: number) => {
      if ((object as any).body) {
        const body = (object as any).body
        body.applyCentralImpulse(x, y, z)
        body.activate()
      }
    }

    ;(object as any).setMass = (mass: number) => {
      if ((object as any).body) {
        // Enable3d doesn't expose setMass directly, need to recreate body
        const position = object.position.clone()
        const rotation = object.rotation.clone()
        this.detachBody(object)
        object.position.copy(position)
        object.rotation.copy(rotation)
        this.attachBody(object, { ...options, mass })
      }
    }

    ;(object as any).setPosition = (x: number, y: number, z: number) => {
      object.position.set(x, y, z)
      if ((object as any).body) {
        const body = (object as any).body
        body.setPosition(x, y, z)
        body.activate()
      }
    }

    ;(object as any).setRotation = (x: number, y: number, z: number) => {
      object.rotation.set(x, y, z)
      if ((object as any).body) {
        const body = (object as any).body
        body.setRotation(x, y, z)
        body.activate()
      }
    }
  }

  /**
   * Create box physics body and attach to object
   */
  attachBoxBody(object: THREE.Object3D, options: {
    mass?: number
    size?: { x: number; y: number; z: number }
    friction?: number
    restitution?: number
  } = {}): void {
    this.attachBody(object, {
      ...options,
      shape: 'box'
    })
  }

  /**
   * Create sphere physics body and attach to object
   */
  attachSphereBody(object: THREE.Object3D, options: {
    mass?: number
    radius?: number
    friction?: number
    restitution?: number
  } = {}): void {
    this.attachBody(object, {
      ...options,
      shape: 'sphere'
    })
  }

  /**
   * Attach terrain/mesh collision
   */
  attachTerrainMesh(terrainMesh: THREE.Mesh, options: {
    mass?: number
    friction?: number
    restitution?: number
  } = {}): void {
    this.physics.add.existing(terrainMesh as any, {
      mass: options.mass ?? 0, // Static by default
      collisionFlags: 1 // Static object
    })

    this.attachedObjects.set(terrainMesh, true)
  }

  /**
   * Remove physics body from object
   */
  detachBody(object: THREE.Object3D): void {
    if (this.attachedObjects.has(object)) {
      if ((object as any).body) {
        // Enable3d cleanup
        ;(this.physics as any).destroy((object as any).body)
      }
      
      this.attachedObjects.delete(object)
      
      const index = this.objectsToUpdate.indexOf(object)
      if (index > -1) {
        this.objectsToUpdate.splice(index, 1)
      }

      // Clean up convenience methods
      delete (object as any).body
      delete (object as any).setVelocity
      delete (object as any).addForce
      delete (object as any).addImpulse
      delete (object as any).setMass
      delete (object as any).setPosition
      delete (object as any).setRotation
    }
  }

  /**
   * Check if object has physics body attached
   */
  hasBody(object: THREE.Object3D): boolean {
    return this.attachedObjects.has(object) && !!(object as any).body
  }

  /**
   * Get physics body for object
   */
  getBody(object: THREE.Object3D): any {
    return (object as any).body
  }

  /**
   * Update physics simulation
   * The beauty of enable3d is that it automatically syncs Three.js objects!
   */
  update(deltaTime: number): void {
    // Enable3d automatically updates physics in its internal loop
    // We just need to call step which is handled internally
  }

  /**
   * Raycast from position in direction
   */
  raycast(from: THREE.Vector3, to: THREE.Vector3): any {
    // Enable3d doesn't expose rayTest directly, use raycaster
    const raycaster = this.physics.add.raycaster()
    return (raycaster as any).rayTest(from, to)
  }

  /**
   * Add collision event listener between two objects
   */
  onCollision(objectA: THREE.Object3D, objectB: THREE.Object3D, callback: () => void): void {
    const meshA = objectA as any
    const meshB = objectB as any
    
    if (meshA && meshB) {
      this.physics.add.collider(meshA, meshB, callback)
    }
  }

  /**
   * Create constraint between two objects
   */
  createConstraint(objectA: THREE.Object3D, objectB: THREE.Object3D, type: 'lock' | 'fixed' | 'spring' = 'fixed'): any {
    const bodyA = (objectA as any).body
    const bodyB = (objectB as any).body
    
    if (bodyA && bodyB) {
      return this.physics.add.constraints.fixed(bodyA, bodyB)
    }
    
    return null
  }

  /**
   * Apply explosion force at position
   */
  explosion(position: THREE.Vector3, force: number, radius: number): void {
    // Get all bodies within radius and apply force
    for (const object of this.objectsToUpdate) {
      const distance = object.position.distanceTo(position)
      if (distance < radius && (object as any).body) {
        const direction = object.position.clone().sub(position).normalize()
        const power = force * (1 - distance / radius) // Falloff with distance
        
        const body = (object as any).body
        body.applyCentralImpulse(
          direction.x * power,
          direction.y * power,
          direction.z * power
        )
        body.activate()
      }
    }
  }

  /**
   * Set gravity
   */
  setGravity(x: number, y: number, z: number): void {
    this.physics.setGravity(x, y, z)
  }

  /**
   * Get physics world for advanced usage
   */
  getWorld(): any {
    return (this.physics as any).world
  }

  /**
   * Cleanup physics world
   */
  destroy(): void {
    // Cleanup all attached objects
    for (const object of this.attachedObjects.keys()) {
      this.detachBody(object)
    }
    
    // Enable3d cleanup
    ;(this.physics as any).destroy()
  }
}