<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import * as THREE from 'three'

const gameStore = useGameStore()
const scene = ref<THREE.Scene>()
const playerMeshes = ref<Map<string, THREE.Mesh>>(new Map())

// Initialize portal rush physics when scene is ready
watch(scene, async (newScene) => {
  if (newScene) {
    await gameStore.initializePortalRushPhysics(newScene)
    setupDemo()
  }
})

// Setup demo with players, obstacles, and portals
const setupDemo = () => {
  if (!scene.value) return
  
  // Create start portal
  const startPortal = new THREE.Mesh(
    new THREE.TorusGeometry(2, 0.5, 16, 32),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  )
  scene.value.add(startPortal)
  gameStore.addPortalToPortalRush('start', startPortal, { x: 0, y: 1, z: -10 }, 'start')
  
  // Create end portal
  const endPortal = new THREE.Mesh(
    new THREE.TorusGeometry(2, 0.5, 16, 32),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  )
  scene.value.add(endPortal)
  gameStore.addPortalToPortalRush('end', endPortal, { x: 0, y: 1, z: 10 }, 'end')
  
  // Create obstacles
  const obstacle1 = new THREE.Mesh(
    new THREE.BoxGeometry(2, 3, 2),
    new THREE.MeshBasicMaterial({ color: 0x808080 })
  )
  scene.value.add(obstacle1)
  gameStore.addObstacleToPortalRush(obstacle1, { x: -3, y: 1.5, z: 0 }, { x: 1, y: 1, z: 1 })
  
  const obstacle2 = new THREE.Mesh(
    new THREE.BoxGeometry(2, 3, 2),
    new THREE.MeshBasicMaterial({ color: 0x808080 })
  )
  scene.value.add(obstacle2)
  gameStore.addObstacleToPortalRush(obstacle2, { x: 3, y: 1.5, z: 0 }, { x: 1, y: 1, z: 1 })
  
  // Create demo players
  createDemoPlayer('player1', 0x0000ff, { x: -2, y: 1, z: -5 })
  createDemoPlayer('player2', 0xff00ff, { x: 2, y: 1, z: -5 })
}

const createDemoPlayer = (id: string, color: number, position: { x: number; y: number; z: number }) => {
  if (!scene.value) return
  
  const playerMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color })
  )
  
  scene.value.add(playerMesh)
  playerMeshes.value.set(id, playerMesh)
  gameStore.addPlayerToPortalRush(id, playerMesh, position)
}

// Animation loop
let animationId: number
const animate = () => {
  gameStore.updatePhysics(1/60) // 60 FPS
  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

// Controls
const movePlayer1 = (direction: { x: number; y: number; z: number }) => {
  gameStore.portalRushPhysics?.movePlayer('player1', direction)
}

const jumpPlayer1 = () => {
  gameStore.portalRushPhysics?.jumpPlayer('player1')
}
</script>

<template>
  <div class="portal-rush-demo">
    <h2 class="text-2xl font-bold mb-4">Enable3d Portal Rush Demo</h2>
    
    <!-- 3D Scene -->
    <div class="canvas-container">
      <TresCanvas>
        <TresPerspectiveCamera :position="[0, 10, 20]" :look-at="[0, 0, 0]" />
        <OrbitControls />
        
        <!-- Lighting -->
        <TresAmbientLight :intensity="0.5" />
        <TresDirectionalLight :position="[10, 10, 5]" :intensity="1" />
        
        <!-- Ground plane -->
        <TresMesh :position="[0, 0, 0]" :rotation="[-Math.PI / 2, 0, 0]">
          <TresPlaneGeometry :args="[50, 50]" />
          <TresMeshBasicMaterial :color="0x333333" />
        </TresMesh>
        
        <!-- Get scene reference -->
        <TresScene @created="(s) => scene = s" />
      </TresCanvas>
    </div>
    
    <!-- Controls -->
    <div class="controls mt-4">
      <h3 class="text-lg font-semibold mb-2">Player 1 Controls (Blue)</h3>
      <div class="grid grid-cols-3 gap-2 max-w-xs">
        <div></div>
        <button @click="movePlayer1({ x: 0, y: 0, z: -1 })" class="btn">↑</button>
        <div></div>
        <button @click="movePlayer1({ x: -1, y: 0, z: 0 })" class="btn">←</button>
        <button @click="jumpPlayer1" class="btn btn-jump">Jump</button>
        <button @click="movePlayer1({ x: 1, y: 0, z: 0 })" class="btn">→</button>
        <div></div>
        <button @click="movePlayer1({ x: 0, y: 0, z: 1 })" class="btn">↓</button>
        <div></div>
      </div>
      
      <div class="mt-4 text-sm text-gray-400">
        <p>• Players bounce off each other</p>
        <p>• Obstacles have high bounciness</p>
        <p>• Red portal attracts players</p>
        <p>• Enable3d physics directly on Three.js objects!</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portal-rush-demo {
  @apply p-6 bg-gray-900 rounded-lg;
}

.canvas-container {
  @apply w-full h-96 bg-black rounded-lg overflow-hidden;
}

.btn {
  @apply px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors;
}

.btn-jump {
  @apply bg-green-600 hover:bg-green-700;
}
</style>