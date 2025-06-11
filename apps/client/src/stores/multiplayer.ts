import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { useGameStore } from './game'
import type { Player, GameState, Vector3 } from '@shared/types'

export const useMultiplayerStore = defineStore('multiplayer', () => {
  // State
  const socket = ref<Socket | null>(null)
  const connected = ref(false)
  const connecting = ref(false)
  const serverMessage = ref('')
  
  // Getters
  const isConnected = computed(() => connected.value)
  const isConnecting = computed(() => connecting.value)
  
  // Actions
  const connect = () => {
    if (socket.value?.connected) return
    
    connecting.value = true
    
    // Connect to local server
    const serverUrl = import.meta.env.PROD 
      ? 'https://your-production-server.com' 
      : 'http://localhost:3010'
    
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
    
    const gameStore = useGameStore()
    
    socket.value.on('connect', () => {
      console.log('🔗 Connected to server!')
      connected.value = true
      connecting.value = false
      
      // Join game with local avatar
      if (gameStore.localAvatar) {
        joinGame(gameStore.localAvatar)
      }
    })
    
    socket.value.on('disconnect', () => {
      console.log('📡 Disconnected from server')
      connected.value = false
      connecting.value = false
    })
    
    socket.value.on('connect_error', (error) => {
      console.error('Connection error:', error)
      connecting.value = false
      serverMessage.value = 'Failed to connect to server. Is it running?'
    })
    
    socket.value.on('server-message', (data) => {
      console.log('📨 Server message:', data.message)
      serverMessage.value = data.message
    })
    
    socket.value.on('game-state', (gameState: GameState) => {
      console.log('🎮 Received initial game state:', gameState)
      
      // Update local game store
      if (gameState.level) {
        gameStore.setLevel(gameState.level)
      }
      
      // Add other players
      gameState.players.forEach(player => {
        if (player.id !== socket.value?.id) {
          gameStore.addPlayer(player)
        }
      })
      
      gameStore.phase = gameState.phase
    })
    
    socket.value.on('game-state-update', (gameState: GameState) => {
      // Update all players except local player (we handle that locally)
      gameState.players.forEach(serverPlayer => {
        if (serverPlayer.id === socket.value?.id) {
          // This is our player - update from server for authoritative position
          const localPlayer = gameStore.localPlayer
          if (localPlayer) {
            localPlayer.position = serverPlayer.position
            localPlayer.lapProgress = serverPlayer.lapProgress
            localPlayer.finished = serverPlayer.finished
            localPlayer.lapTime = serverPlayer.lapTime
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
      
      gameStore.gameTimer = gameState.timer
    })
    
    socket.value.on('player-joined', (data: { player: Player }) => {
      console.log(`👤 Player joined: ${data.player.name}`)
      gameStore.addPlayer(data.player)
    })
    
    socket.value.on('player-left', (data: { playerId: string; playerName: string }) => {
      console.log(`👋 Player left: ${data.playerName}`)
      gameStore.removePlayer(data.playerId)
    })
    
    socket.value.on('chat-message', (data: any) => {
      console.log(`💬 ${data.playerName}: ${data.message}`)
      // Could add a chat UI here
    })
    
    socket.value.on('level-data', (levelData) => {
      console.log('🌍 Received new level:', levelData)
      gameStore.setLevel(levelData)
    })
    
    socket.value.on('error', (data) => {
      console.error('❌ Server error:', data.message)
      serverMessage.value = data.message
    })
  }
  
  const joinGame = (avatar: any, name?: string) => {
    if (!socket.value?.connected) {
      console.warn('Not connected to server')
      return
    }
    
    console.log('🎮 Joining game with avatar...')
    socket.value.emit('join-game', { avatar, name })
    
    // Set local player ID
    const gameStore = useGameStore()
    gameStore.localPlayerId = socket.value.id ?? undefined
  }
  
  const sendMovement = (movement: Vector3) => {
    if (!socket.value?.connected) return
    
    socket.value.emit('player-move', movement)
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
    
    // Getters
    isConnected,
    isConnecting,
    
    // Actions
    connect,
    disconnect,
    joinGame,
    sendMovement,
    sendChatMessage,
    requestLevel
  }
})