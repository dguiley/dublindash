<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { useGameStore } from '@/stores/game'
import { useMultiplayerStore } from '@/stores/multiplayer'
import { useInput } from '@/composables/useInput'
import LevelRenderer from './LevelRenderer.vue'
import PlayerAvatar from './PlayerAvatar.vue'
import type { Vector3 } from '@shared/types'

const gameStore = useGameStore()
const multiplayerStore = useMultiplayerStore()
const { movement } = useInput()

const camera = ref()
const fps = ref(60)

// Other players (excluding local player)
const otherPlayers = computed(() => 
  gameStore.allPlayers.filter(p => p.id !== gameStore.localPlayerId)
)

// Camera follows player with smooth interpolation
const cameraPosition = computed(() => {
  const player = gameStore.localPlayer
  if (!player) return [0, 25, 15]
  
  // Top-down angled view that follows player
  return [
    player.position.x,
    player.position.y + 25,
    player.position.z + 15
  ]
})

const cameraTarget = computed(() => {
  const player = gameStore.localPlayer
  if (!player) return [0, 0, 0]
  
  return [player.position.x, player.position.y, player.position.z]
})

const canvasConfig = {
  clearColor: '#1a1a2e',
  shadows: false, // Disable for now, enable later with physics
  alpha: false,
  powerPreference: 'high-performance' as const
}

const onCanvasCreated = ({ renderer }: any): void => {
  // Configure renderer for better performance
  renderer.outputColorSpace = 'srgb'
  renderer.toneMapping = 5 // ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  
  console.log('🎮 3D Canvas created successfully!')
}

// Game loop
let lastTime = performance.now()

const gameLoop = (): void => {
  const now = performance.now()
  const deltaTime = (now - lastTime) / 1000 // Convert to seconds
  lastTime = now
  
  // Update game physics
  gameStore.updatePhysics(deltaTime)
  
  // Apply player movement and send to server
  if (movement.value.x !== 0 || movement.value.z !== 0) {
    gameStore.movePlayer(movement.value)
    multiplayerStore.sendMovement(movement.value)
  }
  
  requestAnimationFrame(gameLoop)
}

// FPS counter
let frameCount = 0
let fpsLastTime = performance.now()

const updateFPS = (): void => {
  frameCount++
  const now = performance.now()
  
  if (now - fpsLastTime >= 1000) {
    fps.value = Math.round((frameCount * 1000) / (now - fpsLastTime))
    frameCount = 0
    fpsLastTime = now
  }
}

const formatVector = (v: Vector3): string => 
  `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)})`

onMounted(() => {
  console.log('🎮 GameCanvas mounted!')
  
  // Start game loop
  gameLoop()
  
  // Start FPS counter
  const fpsInterval = setInterval(updateFPS, 100)
  
  onUnmounted(() => {
    clearInterval(fpsInterval)
  })
})
</script>

<template>
  <div class="relative w-full h-full">
    <!-- TresJS 3D Scene -->
    <TresCanvas 
      v-bind="canvasConfig" 
      @created="onCanvasCreated"
      class="absolute inset-0"
    >
      <!-- Lighting -->
      <TresAmbientLight :intensity="0.8" />
      <TresDirectionalLight 
        :position="[50, 50, 50]" 
        :intensity="1.2"
        :cast-shadow="true"
      />
      
      <!-- Camera -->
      <TresPerspectiveCamera
        ref="camera"
        :position="cameraPosition"
        :look-at="cameraTarget"
        :fov="60"
      />
      
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
        v-for="player in otherPlayers"
        :key="player.id"
        :player="player"
        :is-local="false"
      />
    </TresCanvas>
    
    <!-- Debug Visualization -->
    <div 
      v-if="gameStore.debugMode"
      class="absolute top-4 left-4 bg-black opacity-80 text-white p-4 rounded font-mono text-sm"
    >
      <div>FPS: {{ fps }}</div>
      <div>Players: {{ gameStore.players.size }}</div>
      <div v-if="gameStore.localPlayer">
        Position: {{ formatVector(gameStore.localPlayer.position) }}
      </div>
      <div v-if="gameStore.localPlayer">
        Velocity: {{ formatVector(gameStore.localPlayer.velocity) }}
      </div>
      <div>Phase: {{ gameStore.phase }}</div>
    </div>
  </div>
</template>

