import Fastify from 'fastify'
import { Server as SocketServer } from 'socket.io'
import cors from '@fastify/cors'
import staticFiles from '@fastify/static'
import { GameManager } from './game/GameManager.js'
import { BotAI } from './bot-ai/BotAI.js'
import type { Player, AvatarData, Vector3 } from '@shared/types.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
})

// CORS configuration
await fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://dublindash.vercel.app'] 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
})

// Static file serving (for production)
if (process.env.NODE_ENV === 'production') {
  await fastify.register(staticFiles, {
    root: path.join(__dirname, '../client/dist'),
    prefix: '/'
  })
}

// Socket.IO setup
const io = new SocketServer(fastify.server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://dublindash.vercel.app'] 
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }
})

// Game instances
const gameManager = new GameManager()
const botAI = new BotAI()

// Health check endpoint
fastify.get('/health', async () => {
  return { 
    status: 'ok',
    message: 'DublinDash server is running! 🎮',
    timestamp: new Date().toISOString(),
    players: gameManager.getPlayerCount(),
    uptime: process.uptime(),
    version: '1.0.0-birthday-edition'
  }
})

// Fun API endpoints
fastify.get('/api/server-stats', async () => {
  return {
    players: gameManager.getPlayerCount(),
    bots: botAI.getBotCount(),
    uptime: process.uptime(),
    funny_fact: "The bots are plotting world domination, but they're bad at it",
    easter_egg: "The cake is a lie, but the game is real"
  }
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🎮 Player connected: ${socket.id}`)
  
  // Send welcome message
  socket.emit('server-message', {
    type: 'welcome',
    message: 'Welcome to DublinDash! 🏁',
    server_version: '1.0.0-birthday-edition'
  })
  
  socket.on('join-game', (data: { avatar: AvatarData; name?: string }) => {
    try {
      const player = gameManager.addPlayer(socket.id, data.avatar, data.name)
      
      // Send current game state to new player
      socket.emit('game-state', gameManager.getGameState())
      
      // Notify other players
      socket.broadcast.emit('player-joined', {
        player: gameManager.sanitizePlayer(player)
      })
      
      // Ensure we have some bots for fun
      botAI.ensureBots(gameManager, 4) // Maintain 4 bots
      
      console.log(`👤 Player ${player.name || 'Anonymous'} joined the game`)
      
    } catch (error) {
      console.error('Error adding player:', error)
      socket.emit('error', { 
        message: 'Failed to join game. Try refreshing the page.',
        error_code: 'JOIN_FAILED'
      })
    }
  })
  
  socket.on('player-move', (movement: Vector3) => {
    try {
      gameManager.updatePlayerMovement(socket.id, movement)
    } catch (error) {
      console.error('Error updating player movement:', error)
    }
  })
  
  socket.on('chat-message', (message: string) => {
    // Simple chat with bot responses
    const player = gameManager.getPlayer(socket.id)
    if (!player) return
    
    const chatData = {
      playerId: socket.id,
      playerName: player.name || 'Anonymous',
      message: message.slice(0, 100), // Limit message length
      timestamp: Date.now()
    }
    
    // Broadcast chat message
    io.emit('chat-message', chatData)
    
    // Bot response with some humor
    const responses = [
      'Skill issue tbh 🤖',
      'Have you tried turning it off and on again?',
      'This is fine 🔥',
      'No cap fr fr',
      'Sus',
      'I am definitely not an AI 👀',
      'BEEP BOOP... I mean, hello fellow human!',
      'The cake is a lie but this game is real'
    ]
    
    // 15% chance of bot response
    if (Math.random() < 0.15) {
      setTimeout(() => {
        io.emit('chat-message', {
          playerId: 'bot-definitely-not-ai',
          playerName: 'Definitely_Not_AI',
          message: responses[Math.floor(Math.random() * responses.length)],
          timestamp: Date.now(),
          isBot: true
        })
      }, 500 + Math.random() * 2000) // Random delay
    }
  })
  
  socket.on('request-level', (biome?: string) => {
    // For now, send a demo level
    const demoLevel = gameManager.createDemoLevel(biome)
    socket.emit('level-data', demoLevel)
  })
  
  socket.on('disconnect', () => {
    console.log(`👋 Player disconnected: ${socket.id}`)
    const removedPlayer = gameManager.removePlayer(socket.id)
    
    if (removedPlayer) {
      socket.broadcast.emit('player-left', { 
        playerId: socket.id,
        playerName: removedPlayer.name || 'Anonymous'
      })
    }
  })
})

// Game loop
const TICK_RATE = 20 // 20 FPS server tick
setInterval(() => {
  try {
    // Update bot AI
    botAI.updateBots(gameManager)
    
    // Update game physics
    gameManager.updatePhysics(1 / TICK_RATE)
    
    // Broadcast game state to all connected clients
    const gameState = gameManager.getGameState()
    if (gameState.players.length > 0) {
      io.emit('game-state-update', gameState)
    }
    
  } catch (error) {
    console.error('Game loop error:', error)
  }
}, 1000 / TICK_RATE)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server gracefully...')
  fastify.close(() => {
    console.log('👋 Server closed')
    process.exit(0)
  })
})

// Start server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3010
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'
    
    await fastify.listen({ port, host })
    
    console.log('🚀 DublinDash server is ready!')
    console.log(`🎮 Server running on http://${host}:${port}`)
    console.log('🎂 Made with ❤️ for a special 16th birthday!')
    console.log('👾 May the best racer win!')
    
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()