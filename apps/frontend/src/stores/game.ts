import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, GameState, LevelData, AvatarData, Vector3 } from '@shared/types'
import { LevelGenerator } from '@/terrain/LevelGenerator'
import type { BiomeType } from '@/terrain/config/TerrainTypes'
import * as THREE from 'three'
import type { Group, Mesh } from 'three'
import { PhysicsEngine, type PhysicsBody } from '@/physics/PhysicsEngine'
import { PortalRushPhysics } from '@/physics/PortalRushPhysics'

export const useGameStore = defineStore('game', () => {
  // State - Initialize all refs properly for reactivity
  const players = ref<Map<string, Player>>(new Map())
  const localPlayerId = ref<string | undefined>(undefined)
  const localAvatar = ref<AvatarData | undefined>(undefined)
  const currentLevel = ref<LevelData | undefined>(undefined)
  const gameTimer = ref<number>(0)
  const debugMode = ref<boolean>(false)
  const phase = ref<'lobby' | 'loading' | 'racing' | 'finished'>('lobby')
  
  // Terrain generation state
  const terrainMeshes = ref<{ visual: Group; collision: Mesh } | undefined>(undefined)
  const levelGenerator = ref<LevelGenerator | undefined>(undefined)
  const isGeneratingTerrain = ref<boolean>(false)
  
  // Physics state
  const physicsEngine = ref<PhysicsEngine>(new PhysicsEngine())
  const physicsBodies = ref<Map<string, PhysicsBody>>(new Map())
  const portalRushPhysics = ref<PortalRushPhysics | undefined>(undefined)
  
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
    
    if (portalRushPhysics.value) {
      // Use portal rush physics for bouncing movement
      portalRushPhysics.value.movePlayer(player.id, direction, player.godMode)
    } else {
      // Fallback to old physics system
      const body = physicsBodies.value.get(player.id)
      if (!body) {
        console.warn('❌ No physics body found for player!')
        return
      }
      
      // Apply movement through physics engine
      physicsEngine.value.applyMovement(body, direction, player.godMode)
    }
  }
  
  const updatePhysics = (deltaTime: number) => {
    if (portalRushPhysics.value) {
      // Use portal rush physics for bouncing gameplay
      portalRushPhysics.value.update(deltaTime)
      
      // Sync player positions from physics
      allPlayers.value.forEach(player => {
        const position = portalRushPhysics.value?.getPlayerPosition(player.id)
        const velocity = portalRushPhysics.value?.getPlayerVelocity(player.id)
        
        if (position) {
          player.position = position
        }
        if (velocity) {
          player.velocity = velocity
        }
        
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
    } else {
      // Fallback to old physics system
      allPlayers.value.forEach(player => {
        const body = physicsBodies.value.get(player.id)
        if (!body) return
        
        // Update physics body
        physicsEngine.value.updateBody(body, deltaTime, player.godMode)
        
        // Sync player position with physics body
        player.position.x = body.position.x
        player.position.y = body.position.y
        player.position.z = body.position.z
        player.velocity.x = body.velocity.x
        player.velocity.y = body.velocity.y
        player.velocity.z = body.velocity.z
        
        // Check obstacle collisions
        if (currentLevel.value) {
          currentLevel.value.geometry.obstacles.forEach(obstacle => {
            const collision = physicsEngine.value.checkObstacleCollision(
              body,
              obstacle.position,
              obstacle.scale
            )
            
            if (collision) {
              physicsEngine.value.resolveObstacleCollision(
                body,
                obstacle.position,
                obstacle.scale
              )
            }
          })
          
          // Update lap progress
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
    }
    
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
    
    // Create physics body for the player
    const body = physicsEngine.value.createPhysicsBody(player.position)
    physicsBodies.value.set(player.id, body)
  }
  
  const removePlayer = (playerId: string) => {
    players.value.delete(playerId)
    physicsBodies.value.delete(playerId)
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

  // Enhanced terrain generation functions
  const generateTerrainLevel = async (biome: BiomeType = 'temperate_forest') => {
    if (isGeneratingTerrain.value) {
      console.warn('⚠️ Terrain generation already in progress')
      return
    }

    try {
      isGeneratingTerrain.value = true
      phase.value = 'loading'
      
      console.log(`🌍 Generating terrain level: ${biome}`)
      
      // Initialize level generator if not exists
      if (!levelGenerator.value) {
        levelGenerator.value = new LevelGenerator()
      }

      // Generate the complete level with terrain
      const result = await levelGenerator.value.generateLevel({
        biome,
        seed: Math.floor(Math.random() * 10000),
        size: { width: 150, height: 150 },
        racingFriendly: true
      })

      // Store terrain meshes
      terrainMeshes.value = result.terrainMeshes
      
      // Update physics engine with collision mesh
      if (result.terrainMeshes.collision) {
        physicsEngine.value.setTerrainMesh(result.terrainMeshes.collision)
        
        // Also update portal rush physics if initialized
        if (portalRushPhysics.value) {
          portalRushPhysics.value.setTerrainMesh(result.terrainMeshes.collision)
          console.log('🎮 Portal rush physics updated with terrain collision mesh')
        }
        
        console.log('🎮 Physics engine updated with terrain collision mesh')
      }

      // Set the level data
      setLevel(result.levelData)

      console.log(`✅ Terrain level generated successfully!`)
      console.log(`📊 Biome: ${result.levelData.biome}`)
      console.log(`🌲 Features: ${result.levelData.geometry.obstacles.length}`)
      
      phase.value = 'lobby'

    } catch (error) {
      console.error('❌ Failed to generate terrain level:', error)
      // Fallback to demo level
      createDemoLevel()
      phase.value = 'lobby'
    } finally {
      isGeneratingTerrain.value = false
    }
  }

  const generateRandomLevel = async () => {
    const biomes: BiomeType[] = ['temperate_forest', 'desert', 'alpine', 'wetlands']
    const randomBiome = biomes[Math.floor(Math.random() * biomes.length)]
    return generateTerrainLevel(randomBiome)
  }

  const generateNewLevel = async (biome?: BiomeType) => {
    console.log('🔄 Generating new level...')
    
    if (biome) {
      await generateTerrainLevel(biome)
    } else {
      await generateRandomLevel()
    }
    
    // Reset all players to new start position if they exist
    if (currentLevel.value) {
      const startPos = currentLevel.value.geometry.portals.start
      allPlayers.value.forEach(player => {
        player.position = { ...startPos, y: startPos.y + 1 }
        player.velocity = { x: 0, y: 0, z: 0 }
        player.lapProgress = 0
        player.finished = false
        player.lapTime = undefined
      })
      console.log('🎮 Players reset to new start position')
    }
  }

  // Initialize portal rush physics
  const initializePortalRushPhysics = async (scene: THREE.Scene) => {
    try {
      portalRushPhysics.value = new PortalRushPhysics(scene, {
        gravity: -15,
        playerConfig: {
          mass: 1,
          radius: 0.5,
          speed: 12,
          jumpForce: 8,
          bounciness: 0.6,
          friction: 0.3
        },
        portalForce: 25,
        obstacleBounciness: 0.8
      })
      
      await portalRushPhysics.value.init()
      console.log('🎮 Portal Rush Physics initialized with bouncing gameplay')
      
      // Setup level if one exists
      if (currentLevel.value) {
        portalRushPhysics.value.setupLevel(currentLevel.value)
      }
      
      // Setup terrain if it exists
      if (terrainMeshes.value?.collision) {
        portalRushPhysics.value.setTerrainMesh(terrainMeshes.value.collision)
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize Portal Rush Physics:', error)
    }
  }

  // Add player to portal rush physics
  const addPlayerToPortalRush = (playerId: string, mesh: THREE.Object3D, position: Vector3) => {
    if (portalRushPhysics.value) {
      portalRushPhysics.value.addPlayer(playerId, mesh, position)
      console.log(`🎮 Player ${playerId} added to portal rush physics`)
    }
  }

  // Add obstacle to portal rush physics
  const addObstacleToPortalRush = (mesh: THREE.Object3D, position: Vector3, scale: Vector3) => {
    if (portalRushPhysics.value) {
      portalRushPhysics.value.addObstacle(mesh, position, scale)
      console.log('🗿 Obstacle added to portal rush physics')
    }
  }

  // Add portal to portal rush physics
  const addPortalToPortalRush = (portalId: string, mesh: THREE.Object3D, position: Vector3, type: 'start' | 'end') => {
    if (portalRushPhysics.value) {
      portalRushPhysics.value.addPortal(portalId, mesh, position, type)
      console.log(`🌀 Portal ${portalId} added to portal rush physics`)
    }
  }

  // Jump player in portal rush physics
  const jumpPlayer = () => {
    const player = localPlayer.value
    if (player && portalRushPhysics.value) {
      portalRushPhysics.value.jumpPlayer(player.id)
      console.log('🦘 Player jumped!')
    }
  }

  // Initialize with terrain level by default
  const initializeDefaultLevel = async (skipIfMultiplayer = false) => {
    // Don't generate local terrain if we're in multiplayer mode
    if (skipIfMultiplayer) {
      console.log('🌍 Skipping local terrain generation - using server terrain')
      return
    }
    
    if (!currentLevel.value) {
      console.log('🌍 No level exists, generating default terrain level...')
      await generateTerrainLevel('temperate_forest')
    }
  }
  
  // Generate terrain meshes from level data (for multiplayer sync)
  const generateTerrainMeshesFromLevel = async (level: LevelData) => {
    // Don't regenerate if we already have terrain for this exact level
    if (terrainMeshes.value && currentLevel.value?.id === level.id) {
      console.log('🌍 Terrain meshes already exist for this level, skipping regeneration')
      return
    }
    
    if (!levelGenerator.value) {
      levelGenerator.value = new LevelGenerator()
    }
    
    try {
      console.log('🌍 Generating terrain meshes from level data...', level.id)
      const meshes = await levelGenerator.value.generateTerrainMeshesFromLevel(level)
      terrainMeshes.value = meshes
      
      // Update physics engine with collision mesh
      if (meshes.collision) {
        physicsEngine.value.setTerrainMesh(meshes.collision)
        
        if (portalRushPhysics.value) {
          portalRushPhysics.value.setTerrainMesh(meshes.collision)
        }
      }
      
      console.log('✅ Terrain meshes generated from level data')
    } catch (error) {
      console.error('❌ Failed to generate terrain meshes:', error)
    }
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
    terrainMeshes,
    isGeneratingTerrain,
    physicsEngine,
    physicsBodies,
    portalRushPhysics,
    
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
    generateTerrainLevel,
    generateRandomLevel,
    generateNewLevel,
    initializeDefaultLevel,
    generateTerrainMeshesFromLevel,
    toggleDebugMode,
    
    // Portal Rush Physics
    initializePortalRushPhysics,
    addPlayerToPortalRush,
    addObstacleToPortalRush,
    addPortalToPortalRush,
    jumpPlayer
  }
})