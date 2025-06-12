import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, GameState, LevelData, AvatarData, Vector3 } from '@shared/types'

export const useGameStore = defineStore('game', () => {
  // State - Initialize all refs properly for reactivity
  const players = ref<Map<string, Player>>(new Map())
  const localPlayerId = ref<string | undefined>(undefined)
  const localAvatar = ref<AvatarData | undefined>(undefined)
  const currentLevel = ref<LevelData | undefined>(undefined)
  const gameTimer = ref<number>(0)
  const debugMode = ref<boolean>(false)
  const phase = ref<'lobby' | 'loading' | 'racing' | 'finished'>('lobby')
  
  // Getters
  const localPlayer = computed(() => 
    localPlayerId.value ? players.value.get(localPlayerId.value) : undefined
  )
  
  const allPlayers = computed(() => 
    Array.from(players.value.values())
  )
  
  const playerRank = computed(() => {
    if (!localPlayer.value) return 0
    
    const sorted = allPlayers.value
      .sort((a, b) => b.lapProgress - a.lapProgress)
    
    const index = sorted.findIndex(p => p.id === localPlayerId.value)
    return index + 1
  })
  
  const isRacing = computed(() => phase.value === 'racing')
  
  // Actions
  const setLocalAvatar = (avatar: AvatarData) => {
    localAvatar.value = avatar
  }
  
  const movePlayer = (direction: Vector3) => {
    const player = localPlayer.value
    console.log('🎮 movePlayer called - Player exists:', !!player, 'ID:', localPlayerId.value)
    if (!player) {
      console.warn('❌ No local player found!')
      return
    }
    
    console.log('🎮 Moving player:', direction, 'Racing:', isRacing.value)
    
    // Apply movement with momentum
    const acceleration = player.godMode ? 2.0 : 0.5
    player.velocity.x += direction.x * acceleration
    player.velocity.z += direction.z * acceleration
    
    // Apply speed limits (unless god mode)
    if (!player.godMode) {
      const maxSpeed = 10
      const currentSpeed = Math.sqrt(
        player.velocity.x ** 2 + player.velocity.z ** 2
      )
      
      if (currentSpeed > maxSpeed) {
        const factor = maxSpeed / currentSpeed
        player.velocity.x *= factor
        player.velocity.z *= factor
      }
    }
  }
  
  const updatePhysics = (deltaTime: number) => {
    // Update all players
    allPlayers.value.forEach(player => {
      // Update position
      player.position.x += player.velocity.x * deltaTime
      player.position.z += player.velocity.z * deltaTime
      
      // Apply friction
      const friction = 0.95
      player.velocity.x *= friction
      player.velocity.z *= friction
      
      // Keep player above ground
      player.position.y = Math.max(0, player.position.y)
      
      // Update lap progress
      if (currentLevel.value) {
        player.lapProgress = calculateLapProgress(player.position)
        
        // Check for finish
        if (player.lapProgress >= 1.0 && !player.finished) {
          player.finished = true
          player.lapTime = gameTimer.value
          
          if (player.id === localPlayerId.value) {
            console.log(`🏁 Finished in ${gameTimer.value.toFixed(2)}s!`)
          }
        }
      }
    })
    
    // Update timer
    if (isRacing.value) {
      gameTimer.value += deltaTime
    }
  }
  
  const calculateLapProgress = (position: Vector3): number => {
    if (!currentLevel.value) return 0
    
    const start = currentLevel.value.geometry.portals.start
    const end = currentLevel.value.geometry.portals.end
    
    // Simple linear progress based on distance to end
    const totalDistance = Math.sqrt(
      (end.x - start.x) ** 2 + (end.z - start.z) ** 2
    )
    
    const currentDistance = Math.sqrt(
      (end.x - position.x) ** 2 + (end.z - position.z) ** 2
    )
    
    return Math.max(0, Math.min(1, 1 - (currentDistance / totalDistance)))
  }
  
  const addPlayer = (player: Player) => {
    players.value.set(player.id, player)
  }
  
  const removePlayer = (playerId: string) => {
    players.value.delete(playerId)
  }
  
  const setLevel = (level: LevelData) => {
    currentLevel.value = level
    
    // Reset all players to start position
    const startPos = level.geometry.portals.start
    allPlayers.value.forEach(player => {
      player.position = { ...startPos }
      player.velocity = { x: 0, y: 0, z: 0 }
      player.lapProgress = 0
      player.finished = false
      player.lapTime = undefined
    })
    
    console.log(`🌍 Level loaded: ${level.biome} (${level.metadata.theme})`)
  }
  
  const createLocalPlayer = () => {
    console.log('🎮 createLocalPlayer called - Avatar exists:', !!localAvatar.value)
    if (!localAvatar.value) return
    
    const playerId = 'player-' + Date.now()
    
    // Spawn at start portal if level exists, otherwise default position
    const startPos = currentLevel.value 
      ? { ...currentLevel.value.geometry.portals.start, y: 1 }
      : { x: 0, y: 1, z: -15 }
    
    console.log('🎮 Creating player with ID:', playerId, 'at position:', startPos)
    
    const player: Player = {
      id: playerId,
      position: startPos,
      velocity: { x: 0, y: 0, z: 0 },
      rotation: 0,
      avatar: localAvatar.value,
      lapProgress: 0,
      finished: false
    }
    
    localPlayerId.value = playerId
    addPlayer(player)
    
    console.log('🎮 Local player created and added. Total players:', players.value.size)
    console.log('🎮 Local player ID set to:', localPlayerId.value)
    console.log('🎮 Player retrieved:', players.value.get(playerId))
    
    return player
  }
  
  const startRace = () => {
    phase.value = 'racing'
    gameTimer.value = 0
    console.log('🏁 Race started!')
  }
  
  const createDemoLevel = () => {
    const demoLevel: LevelData = {
      id: 'demo-level',
      biome: 'demo',
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
            position: { x: -5, y: 0, z: 10 },
            rotation: 0,
            scale: { x: 1.5, y: 1, z: 1.5 }
          }
        ],
        portals: {
          start: { x: 0, y: 0, z: -15 },
          end: { x: 0, y: 0, z: 20 }
        }
      },
      metadata: {
        difficulty: 1,
        theme: 'tutorial',
        mood: 'friendly',
        seed: 12345
      }
    }
    
    setLevel(demoLevel)
  }
  
  // Easter eggs and debug functions
  const toggleDebugMode = () => {
    debugMode.value = !debugMode.value
    
    if (debugMode.value) {
      console.log('%c🚀 DEBUG MODE ACTIVATED', 'color: #00ff00; font-size: 16px; font-weight: bold;')
      console.log('Available commands:')
      console.log('- gameStore.enableGodMode()')
      console.log('- gameStore.teleportToFinish()')
      console.log('- gameStore.spawnBot("chaos")')
      
      // Expose debug functions globally
      ;(window as any).gameStore = {
        enableGodMode: () => {
          if (localPlayer.value) {
            localPlayer.value.godMode = true
            console.log('🚀 God mode enabled. Touch grass occasionally.')
          }
        },
        
        teleportToFinish: () => {
          if (localPlayer.value && currentLevel.value) {
            const finish = currentLevel.value.geometry.portals.end
            localPlayer.value.position = { ...finish, y: 0 }
            console.log('📍 Teleported to finish line')
          }
        },
        
        spawnBot: (type: string) => {
          console.log(`🤖 Spawning ${type} bot... (not implemented yet)`)
        }
      }
    }
  }
  
  return {
    // State
    players,
    localPlayerId,
    localAvatar,
    currentLevel,
    gameTimer,
    debugMode,
    phase,
    
    // Getters
    localPlayer,
    allPlayers,
    playerRank,
    isRacing,
    
    // Actions
    setLocalAvatar,
    movePlayer,
    updatePhysics,
    addPlayer,
    removePlayer,
    setLevel,
    createLocalPlayer,
    startRace,
    createDemoLevel,
    toggleDebugMode
  }
})