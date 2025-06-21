import type { Player, GameState, LevelData, AvatarData, Vector3, MovementInput } from '@shared/types.js'

export class GameManager {
  private players: Map<string, Player> = new Map()
  private currentLevel: LevelData | null = null
  private gameTimer: number = 0
  private gamePhase: 'lobby' | 'loading' | 'racing' | 'finished' = 'lobby'
  
  addPlayer(socketId: string, avatar: AvatarData, name?: string): Player {
    // Generate a fun random name if none provided
    const randomNames = [
      'SpeedDemon', 'PixelRunner', 'DashMaster', 'TurboNinja',
      'RocketRacer', 'NeonSprint', 'CyberDash', 'QuantumRun',
      'NitroBoost', 'HyperDrive', 'VelocityVibe', 'RushMode'
    ]
    
    // Get start portal position if level exists
    const startPortal = this.currentLevel?.geometry.portals.start || { x: 0, y: 0, z: -15 }
    
    const player: Player = {
      id: socketId,
      position: { 
        x: startPortal.x + (Math.random() - 0.5) * 4, // Spread around portal
        y: startPortal.y + 1, 
        z: startPortal.z + (Math.random() - 0.5) * 2 
      },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: 0,
      avatar,
      lapProgress: 0,
      finished: false,
      name: name || randomNames[Math.floor(Math.random() * randomNames.length)]
    }
    
    this.players.set(socketId, player)
    
    // Create a terrain level if none exists
    if (!this.currentLevel) {
      console.log('🌍 No level exists, creating terrain level...')
      this.createDemoLevel('temperate_forest')
      console.log('🌍 Terrain level created, phase is now:', this.gamePhase)
    } else {
      console.log('🌍 Level exists, adding player to existing level')
      console.log('🌍 Current phase:', this.gamePhase)
      // Reset player to start position of existing level
      const start = this.currentLevel.geometry.portals.start
      player.position = { ...start, y: start.y }
      player.position.x += (Math.random() - 0.5) * 4 // Spread out players
    }
    
    return player
  }
  
  removePlayer(socketId: string): Player | null {
    const player = this.players.get(socketId)
    this.players.delete(socketId)
    return player || null
  }
  
  getPlayer(socketId: string): Player | null {
    return this.players.get(socketId) || null
  }
  
  updatePlayerMovement(socketId: string, movement: Vector3): void {
    const player = this.players.get(socketId)
    if (!player) return
    
    // Apply movement with physics
    const acceleration = player.godMode ? 2.0 : 0.8
    player.velocity.x += movement.x * acceleration
    player.velocity.z += movement.z * acceleration
    
    // Apply speed limits (unless god mode)
    if (!player.godMode) {
      const maxSpeed = 12
      const currentSpeed = Math.sqrt(
        player.velocity.x ** 2 + player.velocity.z ** 2
      )
      
      if (currentSpeed > maxSpeed) {
        const factor = maxSpeed / currentSpeed
        player.velocity.x *= factor
        player.velocity.z *= factor
      }
    }
    
    // Update rotation based on movement
    if (movement.x !== 0 || movement.z !== 0) {
      player.rotation = Math.atan2(movement.x, movement.z)
    }
  }
  
  updatePlayerInputs(socketId: string, inputs: MovementInput): void {
    const player = this.players.get(socketId)
    if (!player) return
    
    // Convert inputs to movement vector
    const movement = { x: 0, y: 0, z: 0 }
    
    if (inputs.forward) movement.z -= 1
    if (inputs.backward) movement.z += 1
    if (inputs.left) movement.x -= 1
    if (inputs.right) movement.x += 1
    if (inputs.jump) movement.y += 1
    
    // Normalize diagonal movement
    const length = Math.sqrt(movement.x ** 2 + movement.z ** 2)
    if (length > 0) {
      movement.x /= length
      movement.z /= length
    }
    
    // Validate inputs server-side (anti-cheat)
    // For now, just apply the movement like before
    // In the future, we can add more sophisticated validation
    this.updatePlayerMovement(socketId, movement)
  }
  
  updatePhysics(deltaTime: number): void {
    // Update all players
    this.players.forEach(player => {
      // Update position
      const oldX = player.position.x
      const oldZ = player.position.z
      player.position.x += player.velocity.x * deltaTime
      player.position.z += player.velocity.z * deltaTime
      
      // Log significant position changes
      if (Math.abs(player.velocity.x) > 0.1 || Math.abs(player.velocity.z) > 0.1) {
        console.log(`📍 Player ${player.id} moved from (${oldX.toFixed(1)}, ${oldZ.toFixed(1)}) to (${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)})`)
      }
      
      // Apply friction
      const friction = 0.92
      player.velocity.x *= friction
      player.velocity.z *= friction
      
      // Keep player above ground
      player.position.y = Math.max(0, player.position.y)
      
      // Update lap progress
      if (this.currentLevel) {
        player.lapProgress = this.calculateLapProgress(player.position)
        
        // Check for finish
        if (player.lapProgress >= 1.0 && !player.finished) {
          player.finished = true
          player.lapTime = this.gameTimer
          
          console.log(`🏁 Player ${player.name} finished in ${player.lapTime.toFixed(2)}s!`)
        }
      }
    })
    
    // Update timer
    if (this.gamePhase === 'racing') {
      this.gameTimer += deltaTime
    }
  }
  
  private calculateLapProgress(position: Vector3): number {
    if (!this.currentLevel) return 0
    
    const start = this.currentLevel.geometry.portals.start
    const end = this.currentLevel.geometry.portals.end
    
    // Simple linear progress based on distance to end
    const totalDistance = Math.sqrt(
      (end.x - start.x) ** 2 + (end.z - start.z) ** 2
    )
    
    const currentDistance = Math.sqrt(
      (end.x - position.x) ** 2 + (end.z - position.z) ** 2
    )
    
    return Math.max(0, Math.min(1, 1 - (currentDistance / totalDistance)))
  }
  
  createDemoLevel(biome = 'temperate_forest'): LevelData {
    // Generate the same test terrain as the frontend
    const size = 150
    const heightMap: number[][] = []
    
    // Generate simple hills for the test terrain
    for (let z = 0; z < size; z++) {
      const row: number[] = []
      for (let x = 0; x < size; x++) {
        // Create rolling hills using sine waves
        const nx = x / size - 0.5
        const nz = z / size - 0.5
        const height = 
          Math.sin(nx * Math.PI * 4) * 3 + 
          Math.sin(nz * Math.PI * 3) * 2 + 
          Math.sin((nx + nz) * Math.PI * 2) * 1.5
        row.push(height)
      }
      heightMap.push(row)
    }
    
    const demoLevel: LevelData = {
      id: `terrain-${Date.now()}`,
      biome,
      geometry: {
        terrain: {
          width: size,
          height: size,
          heightMap
        },
        obstacles: [
          // Place obstacles on the terrain
          {
            id: 'tree1',
            type: 'tree',
            position: { x: 20, y: 0, z: 10 },
            rotation: 0,
            scale: { x: 1.5, y: 3, z: 1.5 }
          },
          {
            id: 'rock1',
            type: 'rock',
            position: { x: -25, y: 0, z: 15 },
            rotation: 0,
            scale: { x: 2.5, y: 2, z: 2.5 }
          },
          {
            id: 'tree2',
            type: 'tree',
            position: { x: 30, y: 0, z: -20 },
            rotation: 0,
            scale: { x: 2, y: 4, z: 2 }
          },
          {
            id: 'rock2',
            type: 'rock',
            position: { x: -15, y: 0, z: 25 },
            rotation: Math.PI / 4,
            scale: { x: 3, y: 1.5, z: 3 }
          },
          {
            id: 'tree3',
            type: 'tree',
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            scale: { x: 1.8, y: 3.5, z: 1.8 }
          }
        ],
        portals: {
          start: { x: 0, y: 2, z: -40 },
          end: { x: 0, y: 2, z: 40 }
        }
      },
      metadata: {
        difficulty: 1,
        theme: biome,
        mood: 'friendly',
        seed: 12345
      }
    }
    
    this.currentLevel = demoLevel
    console.log('🌍 Setting game phase to racing...')
    this.gamePhase = 'racing'
    this.gameTimer = 0
    console.log('🌍 Game phase set to:', this.gamePhase)
    
    // Reset all players
    this.players.forEach(player => {
      const start = demoLevel.geometry.portals.start
      player.position = { ...start, y: start.y }
      player.position.x += (Math.random() - 0.5) * 4 // Spread out players
      player.velocity = { x: 0, y: 0, z: 0 }
      player.lapProgress = 0
      player.finished = false
      player.lapTime = undefined
    })
    
    console.log(`🌍 Demo level created: ${biome}`)
    return demoLevel
  }
  
  getGameState(): GameState {
    const gameState = {
      phase: this.gamePhase,
      timer: this.gameTimer,
      players: Array.from(this.players.values()).map(p => this.sanitizePlayer(p)),
      level: this.currentLevel || undefined,
      maxPlayers: 50
    }
    // Only log phase changes, not every call
    return gameState
  }
  
  sanitizePlayer(player: Player): Player {
    // Remove any sensitive data and return clean player object
    return {
      id: player.id,
      position: { ...player.position },
      velocity: { ...player.velocity },
      rotation: player.rotation,
      avatar: player.avatar,
      lapProgress: player.lapProgress,
      lapTime: player.lapTime,
      finished: player.finished,
      name: player.name,
      // Don't send godMode to other players (keep it secret)
      ...(player.godMode && { godMode: true })
    }
  }
  
  getPlayerCount(): number {
    return this.players.size
  }
  
  // Fun server commands for debugging
  enableGodModeForPlayer(socketId: string): boolean {
    const player = this.players.get(socketId)
    if (player) {
      player.godMode = !player.godMode
      console.log(`🚀 God mode ${player.godMode ? 'enabled' : 'disabled'} for ${player.name}`)
      return player.godMode
    }
    return false
  }
  
  teleportPlayerToFinish(socketId: string): boolean {
    const player = this.players.get(socketId)
    if (player && this.currentLevel) {
      const finish = this.currentLevel.geometry.portals.end
      player.position = { ...finish, y: 0 }
      player.velocity = { x: 0, y: 0, z: 0 }
      console.log(`📍 Teleported ${player.name} to finish line`)
      return true
    }
    return false
  }
}