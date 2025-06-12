import { 
  Group, 
  Mesh, 
  ConeGeometry, 
  CylinderGeometry, 
  SphereGeometry,
  BoxGeometry,
  MeshLambertMaterial, 
  InstancedMesh,
  Matrix4,
  Vector3,
  Color
} from 'three'
import type { VegetationData, VegetationType } from '../config/TerrainTypes'

export class VegetationMeshBuilder {
  private materials: Map<VegetationType, MeshLambertMaterial>

  constructor() {
    this.materials = new Map()
    this.initializeMaterials()
  }

  /**
   * Create vegetation meshes from placement data
   */
  createVegetationMeshes(vegetationData: VegetationData[]): Group {
    const vegetationGroup = new Group()
    vegetationGroup.name = 'vegetation'

    // Group vegetation by type for instanced rendering
    const vegetationByType = this.groupVegetationByType(vegetationData)

    // Create instanced meshes for each vegetation type
    for (const [type, instances] of vegetationByType) {
      if (instances.length === 0) continue

      const instancedMesh = this.createInstancedMesh(type, instances)
      if (instancedMesh) {
        vegetationGroup.add(instancedMesh)
      }
    }

    console.log(`🌿 Created vegetation meshes: ${vegetationData.length} total items`)
    return vegetationGroup
  }

  /**
   * Group vegetation data by type for efficient rendering
   */
  private groupVegetationByType(vegetationData: VegetationData[]): Map<VegetationType, VegetationData[]> {
    const grouped = new Map<VegetationType, VegetationData[]>()

    for (const item of vegetationData) {
      if (!grouped.has(item.type)) {
        grouped.set(item.type, [])
      }
      grouped.get(item.type)!.push(item)
    }

    return grouped
  }

  /**
   * Create instanced mesh for a specific vegetation type
   */
  private createInstancedMesh(type: VegetationType, instances: VegetationData[]): InstancedMesh | null {
    const geometry = this.createVegetationGeometry(type)
    if (!geometry) return null

    const material = this.materials.get(type)
    if (!material) return null

    const instancedMesh = new InstancedMesh(geometry, material, instances.length)
    instancedMesh.name = `vegetation-${type}`
    instancedMesh.castShadow = true
    instancedMesh.receiveShadow = true

    // Set transformation matrix for each instance
    const matrix = new Matrix4()
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i]
      
      matrix.makeRotationY(instance.rotation)
      matrix.scale(new Vector3(instance.scale, instance.scale, instance.scale))
      matrix.setPosition(instance.position.x, instance.position.y, instance.position.z)
      
      instancedMesh.setMatrixAt(i, matrix)
    }

    instancedMesh.instanceMatrix.needsUpdate = true
    return instancedMesh
  }

  /**
   * Create geometry for different vegetation types
   */
  private createVegetationGeometry(type: VegetationType) {
    switch (type) {
      case 'pine_tree':
        return this.createPineTreeGeometry()
      case 'oak_tree':
        return this.createOakTreeGeometry()
      case 'birch_tree':
        return this.createBirchTreeGeometry()
      case 'bush':
        return this.createBushGeometry()
      case 'rock':
        return this.createRockGeometry()
      default:
        console.warn(`Unknown vegetation type: ${type}`)
        return null
    }
  }

  /**
   * Create pine tree geometry (cone + cylinder trunk)
   */
  private createPineTreeGeometry() {
    // Tree crown (main geometry for instanced rendering)
    const crown1 = new ConeGeometry(2.5, 6, 8)
    crown1.translate(0, 6, 0)
    
    // For now, return the main crown geometry
    // TODO: Implement proper geometry merging for trunk + crown
    return crown1
  }

  /**
   * Create oak tree geometry (sphere crown + cylinder trunk)
   */
  private createOakTreeGeometry() {
    // Crown (irregular sphere)
    const crownGeometry = new SphereGeometry(3, 8, 6)
    crownGeometry.translate(0, 4.5, 0)
    crownGeometry.scale(1, 0.8, 1) // Flatten slightly

    // For now, return the crown geometry
    return crownGeometry
  }

  /**
   * Create birch tree geometry (tall thin trunk + small crown)
   */
  private createBirchTreeGeometry() {
    // Tall, thin trunk
    const trunkGeometry = new CylinderGeometry(0.2, 0.3, 6, 8)
    trunkGeometry.translate(0, 3, 0)
    
    // Small, delicate crown
    const crownGeometry = new SphereGeometry(1.5, 8, 6)
    crownGeometry.translate(0, 6, 0)
    crownGeometry.scale(1, 1.2, 1) // Slightly elongated

    return crownGeometry
  }

  /**
   * Create bush geometry (small sphere)
   */
  private createBushGeometry() {
    const bushGeometry = new SphereGeometry(1, 8, 6)
    bushGeometry.translate(0, 1, 0)
    bushGeometry.scale(1, 0.6, 1) // Flatten to look more bush-like
    
    return bushGeometry
  }

  /**
   * Create rock geometry (irregular box)
   */
  private createRockGeometry() {
    const rockGeometry = new BoxGeometry(1, 1, 1)
    rockGeometry.translate(0, 0.5, 0)
    
    // Add some irregularity to vertices
    const positions = rockGeometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)
      
      // Add small random offsets
      positions.setX(i, x + (Math.random() - 0.5) * 0.2)
      positions.setY(i, y + (Math.random() - 0.5) * 0.2)
      positions.setZ(i, z + (Math.random() - 0.5) * 0.2)
    }
    
    rockGeometry.computeVertexNormals()
    return rockGeometry
  }

  /**
   * Initialize materials for different vegetation types
   */
  private initializeMaterials(): void {
    this.materials.set('pine_tree', new MeshLambertMaterial({ 
      color: new Color(0x0d4f1c) // Dark green
    }))

    this.materials.set('oak_tree', new MeshLambertMaterial({ 
      color: new Color(0x228B22) // Forest green
    }))

    this.materials.set('birch_tree', new MeshLambertMaterial({ 
      color: new Color(0x32CD32) // Lime green
    }))

    this.materials.set('bush', new MeshLambertMaterial({ 
      color: new Color(0x6B8E23) // Olive drab
    }))

    this.materials.set('rock', new MeshLambertMaterial({ 
      color: new Color(0x696969) // Dark gray
    }))
  }

  /**
   * Update instanced mesh positions (for future dynamic vegetation)
   */
  updateInstancedMesh(mesh: InstancedMesh, instances: VegetationData[]): void {
    if (mesh.count !== instances.length) {
      console.warn('Instance count mismatch in vegetation update')
      return
    }

    const matrix = new Matrix4()
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i]
      
      matrix.makeRotationY(instance.rotation)
      matrix.scale(new Vector3(instance.scale, instance.scale, instance.scale))
      matrix.setPosition(instance.position.x, instance.position.y, instance.position.z)
      
      mesh.setMatrixAt(i, matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  }

  /**
   * Get material for a vegetation type
   */
  getMaterial(type: VegetationType): MeshLambertMaterial | undefined {
    return this.materials.get(type)
  }

  /**
   * Dispose of all vegetation materials
   */
  dispose(): void {
    for (const material of this.materials.values()) {
      material.dispose()
    }
    this.materials.clear()
  }
}