import type { Player, GameState, LevelData, AvatarData, Vector3 } from '@shared/types.js'

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
    
    const player: Player = {
      id: socketId,
      position: { x: 0, y: 0, z: -10 },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: 0,
      avatar,
      lapProgress: 0,
      finished: false,
      name: name || randomNames[Math.floor(Math.random() * randomNames.length)]
    }
    
    // Add some random starting position variation
    player.position.x += (Math.random() - 0.5) * 4
    player.position.z += (Math.random() - 0.5) * 2
    
    this.players.set(socketId, player)
    
    // Start a demo level if this is the first player
    if (this.players.size === 1 && !this.currentLevel) {
      this.createDemoLevel()
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
  
  updatePhysics(deltaTime: number): void {
    // Update all players
    this.players.forEach(player => {
      // Update position
      player.position.x += player.velocity.x * deltaTime
      player.position.z += player.velocity.z * deltaTime
      
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
  
  createDemoLevel(biome = 'tutorial'): LevelData {
    const demoLevel: LevelData = {
      id: `demo-${Date.now()}`,
      biome,
      geometry: {
        terrain: {
          width: 100,
          height: 100,
          heightMap: []
        },
        obstacles: [
          {
            id: 'tree1',
            type: 'tree',
            position: { x: 5, y: 0, z: 5 },
            rotation: 0,
            scale: { x: 1, y: 2, z: 1 }
          },
          {
            id: 'rock1',
            type: 'rock',
            position: { x: -8, y: 0, z: 10 },
            rotation: 0,
            scale: { x: 2, y: 1.5, z: 2 }
          },
          {
            id: 'tree2',
            type: 'tree',
            position: { x: 12, y: 0, z: -3 },
            rotation: 0,
            scale: { x: 1.2, y: 2.5, z: 1.2 }
          },
          {
            id: 'rock2',
            type: 'rock',
            position: { x: -5, y: 0, z: 15 },
            rotation: Math.PI / 4,
            scale: { x: 1.5, y: 1, z: 1.5 }
          },
          {
            id: 'barrier1',
            type: 'barrier',
            position: { x: 0, y: 0, z: 8 },
            rotation: 0,
            scale: { x: 3, y: 1, z: 0.5 }
          }
        ],
        portals: {
          start: { x: 0, y: 0, z: -15 },
          end: { x: 0, y: 0, z: 25 }
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
    this.gamePhase = 'racing'
    this.gameTimer = 0
    
    // Reset all players
    this.players.forEach(player => {
      const start = demoLevel.geometry.portals.start
      player.position = { ...start, y: 0 }
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
    return {
      phase: this.gamePhase,
      timer: this.gameTimer,
      players: Array.from(this.players.values()).map(p => this.sanitizePlayer(p)),
      level: this.currentLevel,
      maxPlayers: 50
    }
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