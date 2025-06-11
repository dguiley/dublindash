# Vue + Three.js Architecture Design

## The Perfect Marriage: Vue UI + Three.js 3D

This architecture gives you **reactive web components** around a **high-performance 3D canvas**. Perfect for a 16-year-old who wants to learn modern web dev!

## Component Architecture

### 1. App Layout Structure
```vue
<!-- App.vue -->
<template>
  <div id="app" class="h-screen bg-gradient-to-br from-purple-900 to-blue-900">
    <!-- Game HUD Overlay -->
    <GameHUD 
      v-if="gameState.playing"
      :timer="gameState.timer"
      :position="gameState.playerRank"
      :players="gameState.players"
    />
    
    <!-- Avatar Creation Modal -->
    <AvatarCreator 
      v-if="showAvatarCreator"
      @avatar-created="handleAvatarCreated"
      @skip="useRandomAvatar"
    />
    
    <!-- Main Game Canvas -->
    <GameCanvas 
      v-if="gameState.ready"
      class="absolute inset-0"
      @player-move="handlePlayerMove"
    />
    
    <!-- Lobby/Menu System -->
    <GameLobby 
      v-else
      :available-worlds="availableWorlds"
      @world-selected="joinWorld"
      @create-world="createNewWorld"
    />
    
    <!-- Developer Debug Panel (for your son to experiment!) -->
    <DebugPanel 
      v-if="debugMode"
      :bot-ai="botAI"
      :physics="physicsWorld"
      @tweak-setting="updateGameSetting"
    />
  </div>
</template>
```

### 2. Game Canvas Component (The 3D Magic)
```vue
<!-- GameCanvas.vue -->
<template>
  <div ref="canvasContainer" class="w-full h-full">
    <!-- TresJS declarative 3D scene -->
    <TresCanvas v-bind="canvasConfig" @created="onCanvasCreated">
      <!-- Lighting Setup -->
      <TresAmbientLight :intensity="0.6" />
      <TresDirectionalLight 
        :position="[50, 50, 25]" 
        :intensity="0.8"
        cast-shadow
      />
      
      <!-- Dynamic Game World -->
      <GameWorld 
        :level-data="currentLevel"
        :players="allPlayers"
        :bots="botPlayers"
      />
      
      <!-- Player Character -->
      <PlayerCharacter
        v-if="localPlayer"
        :avatar="localPlayer.avatar"
        :position="localPlayer.position"
        :velocity="localPlayer.velocity"
        @collision="handleCollision"
      />
      
      <!-- Bot Characters -->
      <BotCharacter
        v-for="bot in botPlayers"
        :key="bot.id"
        :bot="bot"
        :personality="bot.personality"
      />
      
      <!-- Physics World -->
      <Physics :gravity="[0, -9.81, 0]" @step="onPhysicsStep">
        <!-- All physics bodies go here -->
      </Physics>
      
      <!-- Camera Controller -->
      <TresPerspectiveCamera
        ref="camera"
        :position="cameraPosition"
        :look-at="cameraTarget"
      />
    </TresCanvas>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { TresCanvas, TresMesh, TresDirectionalLight } from '@tresjs/core'
import { Physics } from '@tresjs/rapier'
import { useGameStore } from '@/stores/game'
import { useMultiplayerStore } from '@/stores/multiplayer'

interface Player {
  id: string
  position: [number, number, number]
  velocity: [number, number, number]
  avatar: AvatarData
}

const gameStore = useGameStore()
const multiplayerStore = useMultiplayerStore()

// Reactive camera that follows player
const cameraPosition = computed(() => {
  const player = gameStore.localPlayer
  if (!player) return [0, 15, 10]
  
  return [
    player.position[0],
    player.position[1] + 15,
    player.position[2] + 10
  ]
})

const cameraTarget = computed(() => {
  const player = gameStore.localPlayer
  return player?.position || [0, 0, 0]
})

// Handle player input
const handlePlayerMove = (direction: Vector3) => {
  gameStore.movePlayer(direction)
  multiplayerStore.sendMovement(direction)
}

// Physics integration
const onPhysicsStep = (delta: number) => {
  gameStore.updatePhysics(delta)
}
</script>
```

### 3. Game HUD (Vue's Strength)
```vue
<!-- GameHUD.vue -->
<template>
  <div class="absolute inset-0 pointer-events-none">
    <!-- Top Bar -->
    <div class="flex justify-between items-center p-4 pointer-events-auto">
      <!-- Timer -->
      <div class="bg-black/50 rounded-lg px-4 py-2">
        <span class="text-2xl font-mono text-green-400">{{ formatTime(timer) }}</span>
      </div>
      
      <!-- Position -->
      <div class="bg-black/50 rounded-lg px-4 py-2">
        <span class="text-xl text-white">{{ position }}/{{ totalPlayers }}</span>
      </div>
      
      <!-- Settings -->
      <button 
        @click="toggleSettings"
        class="bg-black/50 rounded-lg p-2 hover:bg-black/70 transition-colors"
      >
        ⚙️
      </button>
    </div>
    
    <!-- Side Panel - Player List -->
    <div class="absolute right-4 top-20 bg-black/30 rounded-lg p-3 min-w-48">
      <h3 class="text-white font-bold mb-2">Players</h3>
      <div v-for="player in players" :key="player.id" class="flex items-center gap-2 mb-1">
        <!-- Mini avatar -->
        <div 
          class="w-6 h-6 rounded border-2"
          :style="{ backgroundColor: player.avatar.primaryColor }"
        ></div>
        <span class="text-white text-sm">{{ player.name || 'Player' }}</span>
        <span class="text-green-400 text-xs ml-auto">{{ player.lapTime || '—' }}</span>
      </div>
    </div>
    
    <!-- Bottom - Controls Help -->
    <div class="absolute bottom-4 left-4 bg-black/30 rounded-lg p-3">
      <div class="text-white text-sm space-y-1">
        <div><kbd class="bg-gray-700 px-2 py-1 rounded">WASD</kbd> Move</div>
        <div><kbd class="bg-gray-700 px-2 py-1 rounded">Space</kbd> Jump</div>
        <div><kbd class="bg-gray-700 px-2 py-1 rounded">B</kbd> Debug Bots</div>
      </div>
    </div>
    
    <!-- Developer Easter Eggs -->
    <div v-if="debugMode" class="absolute top-1/2 left-4 bg-red-900/80 rounded p-2">
      <p class="text-white text-xs">🚀 DEV MODE ACTIVE</p>
      <p class="text-green-400 text-xs">FPS: {{ currentFPS }}</p>
      <p class="text-blue-400 text-xs">Bots: {{ activeBots }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  timer: number
  position: number
  players: Player[]
}

defineProps<Props>()

// Easter egg: Konami code activates debug mode
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
let konamiProgress = 0

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if (e.code === konamiCode[konamiProgress]) {
      konamiProgress++
      if (konamiProgress === konamiCode.length) {
        gameStore.toggleDebugMode()
        konamiProgress = 0
      }
    } else {
      konamiProgress = 0
    }
  })
})
</script>
```

### 4. Avatar Creator (Sophisticated)
```vue
<!-- AvatarCreator.vue -->
<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div class="bg-gray-900 rounded-xl p-8 max-w-md w-full mx-4">
      <h2 class="text-2xl font-bold text-white mb-6">Create Your Character</h2>
      
      <!-- Camera View -->
      <div class="relative mb-6">
        <video 
          ref="videoElement"
          class="w-full aspect-video bg-gray-800 rounded-lg"
          autoplay
          muted
          playsinline
        ></video>
        
        <!-- MediaPipe overlay canvas -->
        <canvas 
          ref="overlayCanvas"
          class="absolute inset-0 w-full h-full"
        ></canvas>
        
        <!-- Face detection status -->
        <div 
          v-if="faceDetected"
          class="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm"
        >
          Face Detected! 😎
        </div>
      </div>
      
      <!-- Avatar Preview -->
      <div class="mb-6">
        <h3 class="text-white font-semibold mb-2">Preview:</h3>
        <div class="bg-gray-800 rounded-lg aspect-square relative">
          <!-- Mini 3D preview using TresJS -->
          <TresCanvas v-bind="previewConfig">
            <TresAmbientLight :intensity="0.8" />
            <TresDirectionalLight :position="[2, 2, 2]" />
            <AvatarMesh 
              :avatar-data="currentAvatar"
              :position="[0, 0, 0]"
              :rotation="[0, avatarRotation, 0]"
            />
            <TresPerspectiveCamera :position="[0, 1, 3]" />
          </TresCanvas>
        </div>
      </div>
      
      <!-- Style Options -->
      <div class="mb-6">
        <h3 class="text-white font-semibold mb-2">Style:</h3>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="style in avatarStyles"
            :key="style"
            @click="currentStyle = style"
            :class="[
              'px-3 py-2 rounded text-sm transition-colors',
              currentStyle === style 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            ]"
          >
            {{ style }}
          </button>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button
          @click="captureAvatar"
          :disabled="!faceDetected"
          class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          {{ faceDetected ? 'Create Character' : 'Looking for face...' }}
        </button>
        
        <button
          @click="useRandomAvatar"
          class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
        >
          Random
        </button>
        
        <button
          @click="$emit('skip')"
          class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { MediaPipeAvatarGenerator } from '@/utils/avatarGenerator'
import type { AvatarData } from '@/types/avatar'

const emit = defineEmits<{
  'avatar-created': [avatar: AvatarData]
  'skip': []
}>()

const videoElement = ref<HTMLVideoElement>()
const overlayCanvas = ref<HTMLCanvasElement>()
const faceDetected = ref(false)
const currentAvatar = ref<AvatarData | null>(null)
const avatarRotation = ref(0)

const avatarStyles = ['Blocky', 'Smooth', 'Pixel', 'Cyberpunk', 'Anime', 'Realistic']
const currentStyle = ref('Blocky')

let avatarGenerator: MediaPipeAvatarGenerator | null = null
let stream: MediaStream | null = null

onMounted(async () => {
  await setupCamera()
  setupAvatarGenerator()
  
  // Rotate avatar preview
  setInterval(() => {
    avatarRotation.value += 0.02
  }, 16)
})

const setupCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' }
    })
    if (videoElement.value) {
      videoElement.value.srcObject = stream
    }
  } catch (error) {
    console.warn('Camera not available:', error)
  }
}

const setupAvatarGenerator = () => {
  if (videoElement.value && overlayCanvas.value) {
    avatarGenerator = new MediaPipeAvatarGenerator(
      videoElement.value,
      overlayCanvas.value
    )
    
    avatarGenerator.onFaceDetected = (detected: boolean) => {
      faceDetected.value = detected
    }
    
    avatarGenerator.start()
  }
}

const captureAvatar = async () => {
  if (avatarGenerator && faceDetected.value) {
    const avatar = await avatarGenerator.generateAvatar(currentStyle.value)
    emit('avatar-created', avatar)
  }
}

const useRandomAvatar = () => {
  const randomAvatar = generateRandomAvatar(currentStyle.value)
  emit('avatar-created', randomAvatar)
}

onUnmounted(() => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
  avatarGenerator?.stop()
})
</script>
```

## TypeScript Integration

### Game Store (Pinia + TypeScript)
```typescript
// stores/game.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, GameState, LevelData } from '@/types/game'

export const useGameStore = defineStore('game', () => {
  // State
  const players = ref<Map<string, Player>>(new Map())
  const localPlayerId = ref<string | null>(null)
  const currentLevel = ref<LevelData | null>(null)
  const gameTimer = ref(0)
  const debugMode = ref(false)
  
  // Getters
  const localPlayer = computed(() => 
    localPlayerId.value ? players.value.get(localPlayerId.value) : null
  )
  
  const otherPlayers = computed(() => 
    Array.from(players.value.values()).filter(p => p.id !== localPlayerId.value)
  )
  
  const playerRank = computed(() => {
    const sorted = Array.from(players.value.values())
      .sort((a, b) => b.lapProgress - a.lapProgress)
    
    return sorted.findIndex(p => p.id === localPlayerId.value) + 1
  })
  
  // Actions
  const movePlayer = (direction: Vector3) => {
    const player = localPlayer.value
    if (!player) return
    
    // Apply movement with physics
    player.velocity.x += direction.x * 0.5
    player.velocity.z += direction.z * 0.5
    
    // Clamp velocity
    const maxSpeed = 10
    const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.z ** 2)
    if (speed > maxSpeed) {
      player.velocity.x = (player.velocity.x / speed) * maxSpeed
      player.velocity.z = (player.velocity.z / speed) * maxSpeed
    }
  }
  
  const updatePhysics = (deltaTime: number) => {
    players.value.forEach(player => {
      // Update position
      player.position.x += player.velocity.x * deltaTime
      player.position.z += player.velocity.z * deltaTime
      
      // Apply friction
      player.velocity.x *= 0.95
      player.velocity.z *= 0.95
      
      // Update lap progress
      player.lapProgress = calculateLapProgress(player.position)
    })
  }
  
  const addPlayer = (player: Player) => {
    players.value.set(player.id, player)
  }
  
  const removePlayer = (playerId: string) => {
    players.value.delete(playerId)
  }
  
  const toggleDebugMode = () => {
    debugMode.value = !debugMode.value
    
    // Easter egg for your son!
    if (debugMode.value) {
      console.log('🎮 Debug mode activated! Try these:')
      console.log('- window.gameStore.players (see all players)')
      console.log('- window.gameStore.setGodMode(true) (unlimited speed)')
      console.log('- window.gameStore.spawnBot("Chaos") (add chaos bot)')
      
      // Expose to window for debugging
      ;(window as any).gameStore = {
        players: players.value,
        setGodMode: (enabled: boolean) => {
          if (localPlayer.value) {
            localPlayer.value.godMode = enabled
          }
        },
        spawnBot: (personality: string) => {
          // Will implement bot spawning
        }
      }
    }
  }
  
  return {
    // State
    players,
    localPlayerId,
    currentLevel,
    gameTimer,
    debugMode,
    
    // Getters
    localPlayer,
    otherPlayers,
    playerRank,
    
    // Actions
    movePlayer,
    updatePhysics,
    addPlayer,
    removePlayer,
    toggleDebugMode
  }
})
```

## Development Experience

### Hot Reload + TypeScript
```bash
# Your son can see changes instantly:
npm run dev

# TypeScript catches errors before runtime:
npm run type-check

# Build for production:
npm run build
```

### Perfect for Learning:
1. **Vue components** teach modern web development
2. **TypeScript** prevents common bugs and improves code quality
3. **Three.js integration** shows how to bridge different libraries
4. **Reactive state** makes complex game state manageable
5. **Developer tools** provide visibility into what's happening

This architecture gives you the **best of both worlds**: professional development practices with the flexibility to experiment and learn!