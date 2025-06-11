<template>
  <div class="absolute top-4 right-4 bg-red-900/90 text-white p-4 rounded-lg max-w-xs">
    <h3 class="text-lg font-bold mb-3 text-red-400">🚀 DEBUG MODE</h3>
    
    <div class="space-y-2 text-sm">
      <!-- Game State -->
      <div>
        <strong>Phase:</strong> {{ gameStore.phase }}
      </div>
      <div>
        <strong>Players:</strong> {{ gameStore.players.size }}
      </div>
      <div>
        <strong>Timer:</strong> {{ gameStore.gameTimer.toFixed(2) }}s
      </div>
      
      <!-- Local Player Info -->
      <div v-if="gameStore.localPlayer" class="border-t border-red-600 pt-2 mt-2">
        <strong>Local Player:</strong>
        <div class="ml-2 text-xs">
          <div>ID: {{ gameStore.localPlayer.id.slice(-8) }}</div>
          <div>Pos: {{ formatVector(gameStore.localPlayer.position) }}</div>
          <div>Vel: {{ formatVector(gameStore.localPlayer.velocity) }}</div>
          <div>Progress: {{ (gameStore.localPlayer.lapProgress * 100).toFixed(1) }}%</div>
          <div v-if="gameStore.localPlayer.godMode" class="text-purple-400">
            👑 GOD MODE ACTIVE
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="border-t border-red-600 pt-2 mt-2">
        <strong>Quick Actions:</strong>
        <div class="grid grid-cols-2 gap-1 mt-1">
          <button 
            @click="enableGodMode"
            class="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs transition-colors"
          >
            God Mode
          </button>
          
          <button 
            @click="teleportToFinish"
            class="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs transition-colors"
          >
            Teleport
          </button>
          
          <button 
            @click="resetPlayer"
            class="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
          >
            Reset Pos
          </button>
          
          <button 
            @click="spawnBot"
            class="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
          >
            Add Bot
          </button>
        </div>
      </div>
      
      <!-- Level Info -->
      <div v-if="gameStore.currentLevel" class="border-t border-red-600 pt-2 mt-2">
        <strong>Level:</strong>
        <div class="ml-2 text-xs">
          <div>Biome: {{ gameStore.currentLevel.biome }}</div>
          <div>Theme: {{ gameStore.currentLevel.metadata.theme }}</div>
          <div>Obstacles: {{ gameStore.currentLevel.geometry.obstacles.length }}</div>
        </div>
      </div>
      
      <!-- Console Commands -->
      <div class="border-t border-red-600 pt-2 mt-2 text-xs">
        <strong>Console Commands:</strong>
        <div class="text-green-400 font-mono">
          <div>gameStore.enableGodMode()</div>
          <div>gameStore.teleportToFinish()</div>
          <div>gameStore.spawnBot("chaos")</div>
        </div>
      </div>
      
      <!-- Close Button -->
      <button 
        @click="gameStore.toggleDebugMode()"
        class="w-full mt-3 px-3 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold transition-colors"
      >
        Close Debug Panel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/game'
import type { Vector3 } from '@shared/types'

const gameStore = useGameStore()

const formatVector = (v: Vector3) => 
  `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)})`

const enableGodMode = () => {
  if (gameStore.localPlayer) {
    gameStore.localPlayer.godMode = !gameStore.localPlayer.godMode
    console.log(`🚀 God mode ${gameStore.localPlayer.godMode ? 'enabled' : 'disabled'}`)
  }
}

const teleportToFinish = () => {
  if (gameStore.localPlayer && gameStore.currentLevel) {
    const finish = gameStore.currentLevel.geometry.portals.end
    gameStore.localPlayer.position = { ...finish, y: 0 }
    gameStore.localPlayer.velocity = { x: 0, y: 0, z: 0 }
    console.log('📍 Teleported to finish line')
  }
}

const resetPlayer = () => {
  if (gameStore.localPlayer && gameStore.currentLevel) {
    const start = gameStore.currentLevel.geometry.portals.start
    gameStore.localPlayer.position = { ...start, y: 0 }
    gameStore.localPlayer.velocity = { x: 0, y: 0, z: 0 }
    gameStore.localPlayer.lapProgress = 0
    gameStore.localPlayer.finished = false
    console.log('🔄 Player position reset')
  }
}

const spawnBot = () => {
  // TODO: Implement bot spawning
  console.log('🤖 Bot spawning not implemented yet')
}
</script>