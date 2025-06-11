# DublinDash: TypeScript + Vue Implementation Guide

## 🎯 For the 16-Year-Old Co-Developer

This is the **sophisticated version** - TypeScript everywhere, Vue 3 with Composition API, proper physics, and enough edge to impress your friends while learning real modern web development.

## 🚀 Project Setup

### 1. Initialize with Vite + Vue + TypeScript
```bash
npm create vue@latest dublindash
cd dublindash

# Select these options:
# ✅ TypeScript
# ✅ Router
# ✅ Pinia (state management)
# ✅ Vitest (testing)
# ✅ ESLint
# ✅ Prettier

npm install
```

### 2. Install Game-Specific Dependencies
```bash
# 3D and Physics
npm install three @types/three
npm install @tresjs/core @tresjs/cientos
npm install @rapier3d/rapier3d-compat

# MediaPipe for avatar generation
npm install @mediapipe/face_mesh @mediapipe/camera_utils @mediapipe/drawing_utils

# Multiplayer
npm install socket.io-client @types/socket.io-client

# Server dependencies (separate folder)
npm install -g pnpm  # For monorepo management
```

### 3. Project Structure
```
dublindash/
├── apps/
│   ├── client/                 # Vue frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── game/       # 3D game components
│   │   │   │   ├── ui/         # UI components
│   │   │   │   └── avatar/     # Avatar creation
│   │   │   ├── stores/         # Pinia stores
│   │   │   ├── composables/    # Vue composables
│   │   │   ├── utils/          # Utility functions
│   │   │   └── types/          # TypeScript types
│   │   └── package.json
│   └── server/                 # Node.js server
│       ├── src/
│       │   ├── game/           # Game logic
│       │   ├── bot-ai/         # Bot personalities
│       │   └── level-gen/      # AI level generation
│       └── package.json
└── packages/
    └── shared/                 # Shared types
        └── types.ts
```

## 🎮 Frontend Implementation

### 4. Type Definitions (packages/shared/types.ts)
```typescript
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface AvatarData {
  id: string;
  meshData: {
    vertices: Float32Array;
    colors: Float32Array;
    indices: Uint16Array;
  };
  style: 'blocky' | 'smooth' | 'pixel' | 'cyberpunk' | 'anime';
  colors: {
    hair: string;
    skin: string;
    clothing: string;
  };
  accessories?: string[];
}

export interface Player {
  id: string;
  position: Vector3;
  velocity: Vector3;
  rotation: number;
  avatar: AvatarData;
  lapProgress: number;
  lapTime?: number;
  finished: boolean;
  godMode?: boolean; // For debug mode
}

export interface BotPersonality {
  name: string;
  style: 'tryhard' | 'chaos' | 'boomer' | 'npc' | 'speedster' | 'wanderer';
  traits: {
    baseSpeed: number;
    randomness: number;
    aggression: number;
    skill: number;
  };
  taunts: string[];
  specialAbilities?: string[];
}

export interface LevelData {
  id: string;
  biome: string;
  aiGeneratedImage: string;
  geometry: {
    terrain: TerrainMesh;
    obstacles: ObstacleData[];
    portals: {
      start: Vector3;
      end: Vector3;
    };
  };
  metadata: {
    difficulty: number;
    theme: string;
    mood: string;
  };
}

export interface GameState {
  players: Map<string, Player>;
  bots: Map<string, Player & { personality: BotPersonality }>;
  level: LevelData | null;
  timer: number;
  phase: 'lobby' | 'loading' | 'racing' | 'finished';
}
```

### 5. Game Store (stores/game.ts)
```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Player, GameState, LevelData } from '@shared/types';

export const useGameStore = defineStore('game', () => {
  // State
  const players = ref<Map<string, Player>>(new Map());
  const bots = ref<Map<string, Player>>(new Map());
  const localPlayerId = ref<string | null>(null);
  const currentLevel = ref<LevelData | null>(null);
  const gameTimer = ref(0);
  const debugMode = ref(false);
  const gamePhase = ref<'lobby' | 'loading' | 'racing' | 'finished'>('lobby');
  
  // Getters
  const localPlayer = computed(() => 
    localPlayerId.value ? players.value.get(localPlayerId.value) : null
  );
  
  const allPlayers = computed(() => 
    [...players.value.values(), ...bots.value.values()]
  );
  
  const playerRank = computed(() => {
    const sorted = allPlayers.value
      .sort((a, b) => b.lapProgress - a.lapProgress);
    
    const localPlayerIndex = sorted.findIndex(p => p.id === localPlayerId.value);
    return localPlayerIndex + 1;
  });
  
  const isRacing = computed(() => gamePhase.value === 'racing');
  
  // Actions
  const movePlayer = (direction: Vector3) => {
    const player = localPlayer.value;
    if (!player || !isRacing.value) return;
    
    // Apply movement with momentum
    const acceleration = player.godMode ? 2.0 : 0.5;
    player.velocity.x += direction.x * acceleration;
    player.velocity.z += direction.z * acceleration;
    
    // Apply speed limits (unless god mode)
    if (!player.godMode) {
      const maxSpeed = 10;
      const currentSpeed = Math.sqrt(
        player.velocity.x ** 2 + player.velocity.z ** 2
      );
      
      if (currentSpeed > maxSpeed) {
        const factor = maxSpeed / currentSpeed;
        player.velocity.x *= factor;
        player.velocity.z *= factor;
      }
    }
  };
  
  const updatePhysics = (deltaTime: number) => {
    // Update all players
    [...players.value.values(), ...bots.value.values()].forEach(player => {
      // Update position
      player.position.x += player.velocity.x * deltaTime;
      player.position.z += player.velocity.z * deltaTime;
      
      // Apply friction
      const friction = 0.95;
      player.velocity.x *= friction;
      player.velocity.z *= friction;
      
      // Update lap progress
      if (currentLevel.value) {
        player.lapProgress = calculateLapProgress(player.position, currentLevel.value);
        
        // Check for finish
        if (player.lapProgress >= 1.0 && !player.finished) {
          player.finished = true;
          player.lapTime = gameTimer.value;
        }
      }
    });
    
    // Update timer
    if (isRacing.value) {
      gameTimer.value += deltaTime;
    }
  };
  
  const addPlayer = (player: Player) => {
    players.value.set(player.id, player);
  };
  
  const addBot = (bot: Player & { personality: BotPersonality }) => {
    bots.value.set(bot.id, bot);
  };
  
  const removePlayer = (playerId: string) => {
    players.value.delete(playerId);
    bots.value.delete(playerId);
  };
  
  const setLevel = (level: LevelData) => {
    currentLevel.value = level;
    
    // Reset all players to start position
    const startPos = level.geometry.portals.start;
    [...players.value.values(), ...bots.value.values()].forEach(player => {
      player.position = { ...startPos };
      player.velocity = { x: 0, y: 0, z: 0 };
      player.lapProgress = 0;
      player.finished = false;
      player.lapTime = undefined;
    });
  };
  
  const startRace = () => {
    gamePhase.value = 'racing';
    gameTimer.value = 0;
  };
  
  // Easter eggs and debug functions
  const toggleDebugMode = () => {
    debugMode.value = !debugMode.value;
    
    if (debugMode.value) {
      console.log('🎮 DEBUG MODE ACTIVATED');
      console.log('Available commands:');
      console.log('- gameStore.enableGodMode()');
      console.log('- gameStore.spawnChaosBot()');
      console.log('- gameStore.breakPhysics()');
      
      // Expose debug functions globally
      (window as any).gameStore = {
        enableGodMode: () => {
          if (localPlayer.value) {
            localPlayer.value.godMode = true;
            console.log('🚀 God mode enabled. Touch grass occasionally.');
          }
        },
        
        spawnChaosBot: () => {
          // Will implement chaos bot spawning
          console.log('🤖 Chaos bot spawned. Prepare for mayhem.');
        },
        
        breakPhysics: () => {
          // Temporarily disable friction
          console.log('🌌 Physics.exe has stopped working');
        }
      };
    }
  };
  
  return {
    // State
    players,
    bots,
    localPlayerId,
    currentLevel,
    gameTimer,
    debugMode,
    gamePhase,
    
    // Getters
    localPlayer,
    allPlayers,
    playerRank,
    isRacing,
    
    // Actions
    movePlayer,
    updatePhysics,
    addPlayer,
    addBot,
    removePlayer,
    setLevel,
    startRace,
    toggleDebugMode
  };
});

// Helper function
function calculateLapProgress(position: Vector3, level: LevelData): number {
  const start = level.geometry.portals.start;
  const end = level.geometry.portals.end;
  
  // Simple linear progress based on distance to end
  const totalDistance = Math.sqrt(
    (end.x - start.x) ** 2 + (end.z - start.z) ** 2
  );
  
  const currentDistance = Math.sqrt(
    (end.x - position.x) ** 2 + (end.z - position.z) ** 2
  );
  
  return Math.max(0, Math.min(1, 1 - (currentDistance / totalDistance)));
}
```

### 6. Main Game Component (components/game/GameCanvas.vue)
```vue
<template>
  <div class="relative w-full h-full">
    <!-- TresJS 3D Scene -->
    <TresCanvas 
      v-bind="canvasConfig" 
      @created="onCanvasCreated"
      class="absolute inset-0"
    >
      <!-- Lighting -->
      <TresAmbientLight :intensity="0.6" />
      <TresDirectionalLight 
        :position="[50, 50, 25]" 
        :intensity="0.8"
        cast-shadow
        :shadow-map-size="[2048, 2048]"
      />
      
      <!-- Physics World -->
      <Physics :gravity="[0, -9.81, 0]" @step="onPhysicsStep">
        <!-- Level Geometry -->
        <LevelRenderer 
          v-if="gameStore.currentLevel"
          :level="gameStore.currentLevel"
        />
        
        <!-- Local Player -->
        <PlayerAvatar
          v-if="gameStore.localPlayer"
          :player="gameStore.localPlayer"
          :is-local="true"
        />
        
        <!-- Other Players -->
        <PlayerAvatar
          v-for="player in gameStore.allPlayers.filter(p => p.id !== gameStore.localPlayerId)"
          :key="player.id"
          :player="player"
          :is-local="false"
        />
      </Physics>
      
      <!-- Camera -->
      <TresPerspectiveCamera
        ref="camera"
        :position="cameraPosition"
        :look-at="cameraTarget"
        :fov="60"
      />
    </TresCanvas>
    
    <!-- Debug Visualization -->
    <div 
      v-if="gameStore.debugMode"
      class="absolute top-4 left-4 bg-black/80 text-green-400 p-4 rounded font-mono text-sm"
    >
      <div>FPS: {{ fps }}</div>
      <div>Players: {{ gameStore.players.size }}</div>
      <div>Bots: {{ gameStore.bots.size }}</div>
      <div v-if="gameStore.localPlayer">
        Position: {{ formatVector(gameStore.localPlayer.position) }}
      </div>
      <div v-if="gameStore.localPlayer">
        Velocity: {{ formatVector(gameStore.localPlayer.velocity) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { TresCanvas, TresPerspectiveCamera, TresAmbientLight, TresDirectionalLight } from '@tresjs/core';
import { Physics } from '@tresjs/rapier';
import { useGameStore } from '@/stores/game';
import { useInput } from '@/composables/useInput';
import type { Vector3 } from '@shared/types';

const gameStore = useGameStore();
const { movement } = useInput();

const camera = ref();
const fps = ref(60);

// Camera follows player with smooth interpolation
const cameraPosition = computed(() => {
  const player = gameStore.localPlayer;
  if (!player) return [0, 15, 10];
  
  // Top-down angled view that follows player
  return [
    player.position.x,
    player.position.y + 15,
    player.position.z + 10
  ];
});

const cameraTarget = computed(() => {
  const player = gameStore.localPlayer;
  if (!player) return [0, 0, 0];
  
  return [player.position.x, player.position.y, player.position.z];
});

const canvasConfig = {
  clearColor: '#1a1a2e',
  shadows: true,
  alpha: false,
  powerPreference: 'high-performance'
};

const onCanvasCreated = ({ renderer, scene }: any) => {
  // Configure renderer for better performance
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
};

const onPhysicsStep = (delta: number) => {
  // Update game physics
  gameStore.updatePhysics(delta);
  
  // Apply player movement
  if (movement.value.length() > 0) {
    gameStore.movePlayer(movement.value);
  }
};

// FPS counter
let lastTime = performance.now();
let frameCount = 0;

const updateFPS = () => {
  frameCount++;
  const now = performance.now();
  
  if (now - lastTime >= 1000) {
    fps.value = Math.round((frameCount * 1000) / (now - lastTime));
    frameCount = 0;
    lastTime = now;
  }
  
  requestAnimationFrame(updateFPS);
};

const formatVector = (v: Vector3) => 
  `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)})`;

onMounted(() => {
  updateFPS();
});

// Konami code easter egg
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
let konamiProgress = 0;

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.code === konamiCode[konamiProgress]) {
    konamiProgress++;
    if (konamiProgress === konamiCode.length) {
      gameStore.toggleDebugMode();
      konamiProgress = 0;
    }
  } else {
    konamiProgress = 0;
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress);
});
</script>
```

### 7. Input Composable (composables/useInput.ts)
```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import type { Vector3 } from '@shared/types';

export function useInput() {
  const keys = ref<Set<string>>(new Set());
  const movement = ref<Vector3>({ x: 0, y: 0, z: 0 });
  
  const handleKeyDown = (e: KeyboardEvent) => {
    keys.value.add(e.code);
    updateMovement();
  };
  
  const handleKeyUp = (e: KeyboardEvent) => {
    keys.value.delete(e.code);
    updateMovement();
  };
  
  const updateMovement = () => {
    const newMovement = { x: 0, y: 0, z: 0 };
    
    // WASD movement
    if (keys.value.has('KeyW') || keys.value.has('ArrowUp')) {
      newMovement.z -= 1;
    }
    if (keys.value.has('KeyS') || keys.value.has('ArrowDown')) {
      newMovement.z += 1;
    }
    if (keys.value.has('KeyA') || keys.value.has('ArrowLeft')) {
      newMovement.x -= 1;
    }
    if (keys.value.has('KeyD') || keys.value.has('ArrowRight')) {
      newMovement.x += 1;
    }
    
    // Jump
    if (keys.value.has('Space')) {
      newMovement.y += 1;
    }
    
    // Normalize diagonal movement
    const length = Math.sqrt(newMovement.x ** 2 + newMovement.z ** 2);
    if (length > 0) {
      newMovement.x /= length;
      newMovement.z /= length;
    }
    
    movement.value = newMovement;
  };
  
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  });
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  });
  
  return {
    keys: keys.value,
    movement
  };
}
```

## 🖥️ Server Implementation

### 8. Server Main File (apps/server/src/index.ts)
```typescript
import Fastify from 'fastify';
import { Server as SocketServer } from 'socket.io';
import { GameManager } from './game/GameManager';
import { BotAI } from './bot-ai/BotAI';
import { LevelGenerator } from './level-gen/LevelGenerator';
import type { Player, GameState } from '@shared/types';

const fastify = Fastify({
  logger: true,
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://dublindash.vercel.app'] 
      : ['http://localhost:5173']
  }
});

const io = new SocketServer(fastify.server, {
  cors: {
    origin: "*", // Configure properly for production
    methods: ["GET", "POST"]
  }
});

const gameManager = new GameManager();
const botAI = new BotAI();
const levelGenerator = new LevelGenerator();

// Health check endpoint
fastify.get('/health', async () => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    players: gameManager.getPlayerCount(),
    uptime: process.uptime()
  };
});

// Level generation endpoint
fastify.post<{
  Body: { biome: string; difficulty: number; mood?: string }
}>('/api/generate-level', async (request, reply) => {
  try {
    const { biome, difficulty, mood = 'normal' } = request.body;
    
    const level = await levelGenerator.generateLevel({
      biome,
      difficulty,
      mood
    });
    
    return { level };
  } catch (error) {
    reply.status(500);
    return { 
      error: 'Level generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      easter_egg: 'The AI is probably having an existential crisis 🤖'
    };
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🎮 Player connected: ${socket.id}`);
  
  socket.on('join-game', (data: { avatar: any }) => {
    const player = gameManager.addPlayer(socket.id, data.avatar);
    
    // Send current game state
    socket.emit('game-state', gameManager.getGameState());
    
    // Notify other players
    socket.broadcast.emit('player-joined', player);
    
    // Add some bots if needed
    botAI.ensureBots(gameManager, 6); // Always maintain 6 bots
  });
  
  socket.on('player-move', (movement: { x: number; z: number }) => {
    gameManager.updatePlayerMovement(socket.id, movement);
  });
  
  socket.on('chat-message', (message: string) => {
    // Simple chat system with humor
    const responses = [
      'Skill issue tbh',
      'Have you tried turning it off and on again?',
      'This is fine 🔥',
      'No cap fr fr',
      'Sus'
    ];
    
    if (Math.random() < 0.1) { // 10% chance of bot response
      setTimeout(() => {
        io.emit('chat-message', {
          player: 'Definitely_Not_AI',
          message: responses[Math.floor(Math.random() * responses.length)]
        });
      }, 1000);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`👋 Player disconnected: ${socket.id}`);
    gameManager.removePlayer(socket.id);
    socket.broadcast.emit('player-left', { playerId: socket.id });
  });
});

// Game loop
setInterval(() => {
  // Update bot AI
  botAI.updateBots(gameManager);
  
  // Update physics
  gameManager.updatePhysics(1/20); // 20 FPS server tick
  
  // Broadcast game state
  io.emit('game-state-update', gameManager.getGameState());
}, 1000 / 20);

// Start server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    
    console.log(`🚀 DublinDash server running on port ${port}`);
    console.log('🎮 Ready for some chaotic racing!');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

## 🎨 Development Experience

### Quick Commands
```bash
# Frontend development
cd apps/client
npm run dev     # Hot reload at localhost:5173

# Backend development  
cd apps/server
npm run dev     # Auto-restart on changes

# Type checking
npm run type-check

# Build for production
npm run build
```

### Developer Tools
- **Vue DevTools** - See reactive state changes in real-time
- **Browser Debug Console** - TypeScript errors with source maps
- **Physics Debug Renderer** - Visualize collision boundaries
- **Network Tab** - Monitor WebSocket messages

This setup gives you a **professional development environment** while keeping the code **accessible and fun to hack on**. Perfect for learning modern web development with a 16-year-old! 🚀