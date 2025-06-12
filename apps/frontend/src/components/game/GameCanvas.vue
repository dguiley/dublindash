<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { useGameStore } from '@/stores/game'
import { useMultiplayerStore } from '@/stores/multiplayer'
import { useInput } from '@/composables/useInput'
import LevelRenderer from './LevelRenderer.vue'
import PlayerAvatar from './PlayerAvatar.vue'
import type { Vector3 } from '@shared/types'

const gameStore = useGameStore()
const multiplayerStore = useMultiplayerStore()
const { movement, inputs, zoomOut, mapView } = useInput()

const camera = ref()
const fps = ref(60)
const cameraZoom = ref(1) // 1 = normal, higher = zoomed out
const isMapView = ref(false)

// Other players (excluding local player)
const otherPlayers = computed(() => 
  gameStore.allPlayers.filter(p => p.id !== gameStore.localPlayerId)
)

// Watch for input changes
watch([zoomOut, mapView], ([newZoomOut, newMapView]) => {
  cameraZoom.value = newZoomOut ? 3 : 1
  isMapView.value = newMapView
})

// Camera follows player with smooth interpolation
const cameraPosition = computed((): [number, number, number] => {
  const player = gameStore.localPlayer
  const level = gameStore.currentLevel
  
  if (isMapView.value && level) {
    // Map view - show whole level
    const start = level.geometry.portals.start
    const end = level.geometry.portals.end
    const centerX = (start.x + end.x) / 2
    const centerZ = (start.z + end.z) / 2
    const distance = Math.sqrt((end.x - start.x) ** 2 + (end.z - start.z) ** 2)
    const height = Math.max(80, distance * 1.2)
    return [centerX, height, centerZ] as [number, number, number]
  }
  
  if (!player) {
    // Default camera position when no player
    if (level) {
      const start = level.geometry.portals.start
      return [start.x, start.y + 25 * cameraZoom.value, start.z + 15 * cameraZoom.value] as [number, number, number]
    }
    return [0, 25 * cameraZoom.value, 15 * cameraZoom.value] as [number, number, number]
  }
  
  // Follow player with zoom
  const baseHeight = 25 * cameraZoom.value
  const baseDistance = 15 * cameraZoom.value
  
  return [
    player.position.x,
    player.position.y + baseHeight,
    player.position.z + baseDistance
  ] as [number, number, number]
})

const cameraTarget = computed(() => {
  const player = gameStore.localPlayer
  const level = gameStore.currentLevel
  
  if (isMapView.value && level) {
    // Map view - look at center of level
    const start = level.geometry.portals.start
    const end = level.geometry.portals.end
    const centerX = (start.x + end.x) / 2
    const centerZ = (start.z + end.z) / 2
    return [centerX, 0, centerZ]
  }
  
  if (!player) {
    // Default camera target when no player
    if (level) {
      const start = level.geometry.portals.start
      return [start.x, start.y, start.z]
    }
    return [0, 0, 0]
  }
  
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
let lastInputSent = 0
const INPUT_SEND_RATE = 20 // Send inputs 20 times per second

const gameLoop = (): void => {
  const now = performance.now()
  const deltaTime = (now - lastTime) / 1000 // Convert to seconds
  lastTime = now
  
  // Client-side physics: Update our local player first
  if (movement.value.x !== 0 || movement.value.z !== 0) {
    console.log('🚀 Game loop detected movement:', movement.value)
    gameStore.movePlayer(movement.value)
  }
  
  // Update all physics (including our local player and other players)
  gameStore.updatePhysics(deltaTime)
  
  // Send inputs to server for validation (throttled to reduce network traffic)
  if (now - lastInputSent >= 1000 / INPUT_SEND_RATE) {
    if (inputs.value.forward || inputs.value.backward || inputs.value.left || inputs.value.right || inputs.value.jump) {
      multiplayerStore.sendInputs(inputs.value)
      lastInputSent = now
    }
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
  
  // Focus the canvas for keyboard input
  const canvasElement = document.querySelector('canvas')
  if (canvasElement) {
    canvasElement.focus()
    console.log('🎯 Canvas focused for input')
  }
  
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
  <div 
    class="relative w-full h-full"
    tabindex="0"
    @click="(event) => (event.target as HTMLElement)?.focus()"
  >
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
      <div>Local Player ID: {{ gameStore.localPlayerId || 'None' }}</div>
      <div v-if="gameStore.localPlayer">
        Player Position: {{ formatVector(gameStore.localPlayer.position) }}
      </div>
      <div v-if="!gameStore.localPlayer" class="text-red-400">
        ⚠️ No Local Player Found!
      </div>
      <div v-if="gameStore.localPlayer">
        Velocity: {{ formatVector(gameStore.localPlayer.velocity) }}
      </div>
      <div>Camera: {{ formatVector({ x: cameraPosition[0], y: cameraPosition[1], z: cameraPosition[2] }) }}</div>
      <div>Zoom: {{ cameraZoom.toFixed(1) }}x {{ isMapView ? '(Map View)' : '' }}</div>
      <div>Phase: {{ gameStore.phase }}</div>
      <div>All Players: {{ gameStore.allPlayers.length }}</div>
    </div>
  </div>
</template>

