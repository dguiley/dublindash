<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { PhysicsEngine, type PhysicsBody } from '@/physics'
import type { Vector3 } from '@shared/types'

const engine = new PhysicsEngine()
const body = ref<PhysicsBody | undefined>()
const stats = ref<string>('')
const log = ref<string[]>([])

const addLog = (message: string) => {
  log.value.unshift(`${new Date().toLocaleTimeString()}: ${message}`)
  if (log.value.length > 10) log.value.pop()
}

onMounted(() => {
  // Create a test body
  body.value = engine.createPhysicsBody({ x: 0, y: 10, z: 0 })
  addLog('Created physics body at (0, 10, 0)')
  
  // Start physics simulation
  let lastTime = performance.now()
  
  const loop = () => {
    const now = performance.now()
    const deltaTime = (now - lastTime) / 1000
    lastTime = now
    
    if (body.value) {
      engine.updateBody(body.value, deltaTime)
      stats.value = engine.getPhysicsStats(body.value)
    }
    
    requestAnimationFrame(loop)
  }
  
  loop()
})

const applyForce = (direction: Vector3) => {
  if (!body.value) return
  
  engine.applyMovement(body.value, direction)
  addLog(`Applied force: (${direction.x}, ${direction.y}, ${direction.z})`)
}

const reset = () => {
  body.value = engine.createPhysicsBody({ x: 0, y: 10, z: 0 })
  addLog('Reset physics body to (0, 10, 0)')
}
</script>

<template>
  <div class="page-container">
    <h1 class="text-3xl font-bold mb-6">Physics Engine Test</h1>
    
    <div class="grid grid-cols-2 gap-6">
      <!-- Controls -->
      <div class="card">
        <h2 class="text-xl font-semibold mb-4">Controls</h2>
        
        <div class="grid grid-cols-3 gap-2 mb-4">
          <div></div>
          <button 
            @click="applyForce({ x: 0, y: 0, z: -1 })"
            class="btn btn-primary"
          >
            Forward ↑
          </button>
          <div></div>
          
          <button 
            @click="applyForce({ x: -1, y: 0, z: 0 })"
            class="btn btn-primary"
          >
            Left ←
          </button>
          <button 
            @click="applyForce({ x: 0, y: 1, z: 0 })"
            class="btn btn-secondary"
          >
            Jump
          </button>
          <button 
            @click="applyForce({ x: 1, y: 0, z: 0 })"
            class="btn btn-primary"
          >
            Right →
          </button>
          
          <div></div>
          <button 
            @click="applyForce({ x: 0, y: 0, z: 1 })"
            class="btn btn-primary"
          >
            Back ↓
          </button>
          <div></div>
        </div>
        
        <button 
          @click="reset"
          class="btn btn-danger w-full"
        >
          Reset Position
        </button>
      </div>
      
      <!-- Stats -->
      <div class="card">
        <h2 class="text-xl font-semibold mb-4">Physics Stats</h2>
        <pre class="bg-gray-800 p-4 rounded text-sm font-mono">{{ stats || 'No data' }}</pre>
        
        <h3 class="text-lg font-semibold mt-4 mb-2">Activity Log</h3>
        <div class="bg-gray-800 p-3 rounded h-48 overflow-y-auto">
          <div 
            v-for="(entry, i) in log" 
            :key="i"
            class="text-sm font-mono text-gray-300"
          >
            {{ entry }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="card mt-6">
      <h2 class="text-xl font-semibold mb-4">Physics Configuration</h2>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong>Gravity:</strong> -30 m/s²
        </div>
        <div>
          <strong>Max Speed:</strong> 20 m/s
        </div>
        <div>
          <strong>Jump Velocity:</strong> 15 m/s
        </div>
        <div>
          <strong>Friction:</strong> 0.95
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  @apply max-w-6xl mx-auto p-6;
}

.card {
  @apply bg-gray-900 p-6 rounded-lg shadow-lg;
}

.btn {
  @apply px-4 py-2 rounded font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white;
}

.btn-secondary {
  @apply bg-green-600 hover:bg-green-700 text-white;
}

.btn-danger {
  @apply bg-red-600 hover:bg-red-700 text-white;
}
</style>
