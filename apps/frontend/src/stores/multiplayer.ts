import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { useGameStore } from './game'
import type { GameState, Player, Vector3, MovementInput } from '@shared/types'
import { env } from '../utils/env'

export const useMultiplayerStore = defineStore('multiplayer', () => {
  // State
  const socket = ref<Socket | null>(null)
  const connected = ref(false)
  const connecting = ref(false)
  const serverMessage = ref('')
  const eventStream = ref<Array<{id: number, timestamp: number, type: string, data: any}>>([])
  let eventId = 0

  // Helper to log events
  const logEvent = (type: string, data: any) => {
    eventStream.value.unshift({
      id: eventId++,
      timestamp: Date.now(),
      type,
      data
    })
    // Keep only last 50 events
    if (eventStream.value.length > 50) {
      eventStream.value = eventStream.value.slice(0, 50)
    }
  }

  // Getters
  const isConnected = computed(() => connected.value)
  const isConnecting = computed(() => connecting.value)

  // Actions
  const connect = () => {
    if (socket.value?.connected) return

    connecting.value = true

    // Connect to server
    const serverUrl = env.BACKEND_URL
        
    console.log('🔗 Connecting to:', serverUrl)

    socket.value = io(serverUrl, {
      transports: ['websocket', 'polling']
    })

    setupSocketListeners()
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
    connected.value = false
    connecting.value = false
  }

  const setupSocketListeners = () => {
    if (!socket.value) return

    const currentSocket = socket.value // Capture the socket reference
    const gameStore = useGameStore()
    
    console.log('🎮 Setting up socket listeners immediately')
    setupListeners(currentSocket, gameStore)
  }

  const setupListeners = (currentSocket: any, gameStore: any) => {

    currentSocket.on('connect', () => {
      console.log('🔗 Connected to server!')
      logEvent('connect', { socketId: currentSocket.id })
      connected.value = true
      connecting.value = false

      // Join game with local avatar
      if (gameStore.localAvatar) {
        joinGame(gameStore.localAvatar)
      }
    })

    currentSocket.on('disconnect', () => {
      console.log('📡 Disconnected from server')
      connected.value = false
      connecting.value = false
    })

    currentSocket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error)
      connecting.value = false
      serverMessage.value = 'Failed to connect to server. Is it running?'
    })

    currentSocket.on('server-message', (data: { message: string }) => {
      console.log('📨 Server message:', data.message)
      serverMessage.value = data.message
    })

    currentSocket.on('game-state', (gameState: GameState) => {
      console.log('🚨 GAME STATE RECEIVED!!! 🚨')
      logEvent('game-state', {
        phase: gameState.phase,
        timer: gameState.timer,
        playersCount: gameState.players.length,
        hasLevel: !!gameState.level
      })
      console.log('🎮 Received initial game state:', {
        phase: gameState.phase,
        timer: gameState.timer,
        playersCount: gameState.players.length,
        hasLevel: !!gameState.level,
        maxPlayers: gameState.maxPlayers
      })
      console.log('🚨 FULL GAME STATE:', gameState)
      console.log('🎮 My socket ID:', currentSocket.id)
      console.log('🎮 Players in game state:', gameState.players.map(p => ({ id: p.id, name: p.name })))
      console.log('🎮 Game state phase:', gameState.phase, typeof gameState.phase)

      // Update local game store
      if (gameState.level) {
        console.log('🌍 Setting level from server:', gameState.level.biome)
        gameStore.setLevel(gameState.level)
      }

      // Add ALL players including ourselves
      gameState.players.forEach(player => {
        console.log('🎮 Adding player:', player.id, player.id === currentSocket.id ? '(LOCAL)' : '(REMOTE)')
        gameStore.addPlayer(player)

        // If this is our player, set the local player ID
        if (player.id === currentSocket.id) {
          console.log('🎮 Setting local player ID to:', player.id)
          
          // Try setting localPlayerId via $state
          try {
            const store = gameStore as any
            if (store.$state) {
              store.$state.localPlayerId = player.id
              console.log('🎮 Local player ID set via $state:', store.$state.localPlayerId)
            } else {
              console.error('🎮 Cannot access store $state for localPlayerId')
            }
          } catch (error) {
            console.error('🎮 Error setting localPlayerId:', error)
          }
        }
      })

      console.log('🎮 Setting phase from server:', gameState.phase)
      console.log('🎮 gameStore.phase before:', gameStore.phase)
      console.log('🎮 gameStore.phase type:', typeof gameStore.phase)
      console.log('🎮 gameStore keys:', Object.keys(gameStore))
      console.log('🎮 gameStore.localPlayerId:', gameStore.localPlayerId)
      console.log('🎮 gameStore.localPlayerId type:', typeof gameStore.localPlayerId)
      
      // Try direct assignment since Pinia exposes reactive values directly
      console.log('🎮 Attempting direct phase assignment...')
      try {
        // In Pinia composition API, the store exposes the actual ref values
        // Let's access the internal ref through the store's $state
        const store = gameStore as any
        if (store.$state && store.$state.phase !== undefined) {
          store.$state.phase = gameState.phase
          console.log('🎮 Phase set via $state:', store.$state.phase)
        } else {
          console.error('🎮 Cannot access store $state')
        }
      } catch (error) {
        console.error('🎮 Error setting phase:', error)
      }
      
      console.log('🎮 Is racing computed after set:', gameStore.isRacing)
    })

    currentSocket.on('game-state-update', (gameState: GameState) => {
      logEvent('game-state-update', {
        phase: gameState.phase,
        timer: gameState.timer,
        playersCount: gameState.players.length
      })
      // Update all players except local player (we handle that locally)
      gameState.players.forEach(serverPlayer => {
        if (serverPlayer.id === currentSocket.id) {
          // This is our player - use server for non-position data only
          const localPlayer = gameStore.localPlayer
          if (localPlayer) {
            // Only update non-position data from server to avoid jumps
            // The client handles position locally for smooth movement
            localPlayer.lapProgress = serverPlayer.lapProgress
            localPlayer.finished = serverPlayer.finished
            localPlayer.lapTime = serverPlayer.lapTime
            
            // Optional: Server reconciliation with threshold
            const serverPos = serverPlayer.position
            const clientPos = localPlayer.position
            const distance = Math.sqrt(
              (serverPos.x - clientPos.x) ** 2 + 
              (serverPos.z - clientPos.z) ** 2
            )
            
            // Only correct position if we're way off (anti-cheat)
            if (distance > 5) {
              console.log('🔧 Large position difference detected, correcting:', distance)
              localPlayer.position = serverPlayer.position
            }
          }
        } else {
          // Other players - update their positions
          const existingPlayer = gameStore.players.get(serverPlayer.id)
          if (existingPlayer) {
            // Smooth interpolation for other players
            existingPlayer.position = serverPlayer.position
            existingPlayer.velocity = serverPlayer.velocity
            existingPlayer.rotation = serverPlayer.rotation
            existingPlayer.lapProgress = serverPlayer.lapProgress
            existingPlayer.finished = serverPlayer.finished
            existingPlayer.lapTime = serverPlayer.lapTime
          } else {
            // New player
            gameStore.addPlayer(serverPlayer)
          }
        }
      })

      // Update game timer
      if (gameStore.gameTimer && typeof gameStore.gameTimer === 'object' && 'value' in gameStore.gameTimer) {
        gameStore.gameTimer.value = gameState.timer
      }
    })

    currentSocket.on('player-joined', (data: { player: Player }) => {
      console.log(`👤 Player joined: ${data.player.name}`)
      gameStore.addPlayer(data.player)
    })

    currentSocket.on('player-left', (data: { playerId: string; playerName: string }) => {
      console.log(`👋 Player left: ${data.playerName}`)
      gameStore.removePlayer(data.playerId)
    })

    currentSocket.on('chat-message', (data: any) => {
      console.log(`💬 ${data.playerName}: ${data.message}`)
      // Could add a chat UI here
    })

    currentSocket.on('level-data', (levelData: any) => {
      console.log('🌍 Received new level:', levelData)
      gameStore.setLevel(levelData)
    })

    currentSocket.on('error', (data: { message: string }) => {
      console.error('❌ Server error:', data.message)
      serverMessage.value = data.message
    })
  } // End of setupListeners function

  const joinGame = (avatar: any, name?: string) => {
    if (!socket.value?.connected) {
      console.warn('Not connected to server')
      return
    }

    console.log('🚨 JOINING GAME!!! 🚨')
    console.log('🎮 Avatar:', avatar)
    console.log('🎮 Socket ID:', socket.value.id)
    socket.value.emit('join-game', { avatar, name })

    // Local player ID will be set when we receive game state from server
    console.log('🎮 Will set local player ID when game state is received')
  }

  const sendMovement = (movement: Vector3) => {
    if (!socket.value?.connected) return

    socket.value.emit('player-move', movement)
  }
  
  const sendInputs = (inputs: MovementInput) => {
    if (!socket.value?.connected) return
    
    socket.value.emit('player-input', inputs)
  }

  const sendChatMessage = (message: string) => {
    if (!socket.value?.connected) return

    socket.value.emit('chat-message', message)
  }

  const requestLevel = (biome?: string) => {
    if (!socket.value?.connected) return

    socket.value.emit('request-level', biome)
  }

  return {
    // State
    connected,
    connecting,
    serverMessage,
    eventStream,

    // Getters
    isConnected,
    isConnecting,

    // Actions
    connect,
    disconnect,
    joinGame,
    sendMovement,
    sendInputs,
    sendChatMessage,
    requestLevel
  }
})