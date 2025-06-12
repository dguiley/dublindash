<template>
  <div class="absolute top-4 right-4 bg-slate-900/95 text-white p-4 rounded-lg max-w-md max-h-96 overflow-y-auto">
    <h3 class="text-lg font-bold mb-3 text-green-400">🚀 DEBUG MODE</h3>
    
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
      <div v-if="gameStore.localPlayer" class="border-t border-slate-600 pt-2 mt-2">
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
      <div class="border-t border-slate-600 pt-2 mt-2">
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
      
      <!-- Terrain Controls -->
      <div class="border-t border-slate-600 pt-2 mt-2">
        <strong>Terrain Generation:</strong>
        <div class="grid grid-cols-2 gap-1 mt-1">
          <button 
            @click="generateForest"
            :disabled="gameStore.isGeneratingTerrain"
            class="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-xs transition-colors"
          >
            🌲 Forest
          </button>
          
          <button 
            @click="generateDesert"
            :disabled="gameStore.isGeneratingTerrain"
            class="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded text-xs transition-colors"
          >
            🏜️ Desert
          </button>
          
          <button 
            @click="generateAlpine"
            :disabled="gameStore.isGeneratingTerrain"
            class="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-xs transition-colors"
          >
            🏔️ Alpine
          </button>
          
          <button 
            @click="generateWetlands"
            :disabled="gameStore.isGeneratingTerrain"
            class="px-2 py-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 rounded text-xs transition-colors"
          >
            🌿 Wetlands
          </button>
        </div>
        
        <button 
          @click="generateRandom"
          :disabled="gameStore.isGeneratingTerrain"
          class="w-full mt-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-xs transition-colors"
        >
          {{ gameStore.isGeneratingTerrain ? '⏳ Generating...' : '🎲 Random Terrain' }}
        </button>
      </div>
      
      <!-- Level Info -->
      <div v-if="gameStore.currentLevel" class="border-t border-slate-600 pt-2 mt-2">
        <strong>Level:</strong>
        <div class="ml-2 text-xs">
          <div>Biome: {{ gameStore.currentLevel.biome }}</div>
          <div>Theme: {{ gameStore.currentLevel.metadata.theme }}</div>
          <div>Obstacles: {{ gameStore.currentLevel.geometry.obstacles.length }}</div>
        </div>
      </div>
      
      <!-- Event Stream -->
      <div class="border-t border-slate-600 pt-2 mt-2">
        <strong>Event Stream:</strong>
        <div class="mt-1 max-h-32 overflow-y-auto bg-black/30 p-2 rounded text-xs font-mono">
          <div v-if="multiplayerStore.eventStream.length === 0" class="text-gray-400">
            No events yet...
          </div>
          <div 
            v-for="event in multiplayerStore.eventStream.slice(0, 10)" 
            :key="event.id"
            class="mb-1 text-xs"
            :class="{
              'text-green-400': event.type === 'connect',
              'text-blue-400': event.type === 'game-state',
              'text-yellow-400': event.type === 'game-state-update',
              'text-gray-300': !['connect', 'game-state', 'game-state-update'].includes(event.type)
            }"
          >
            <span class="text-gray-500">{{ formatTimestamp(event.timestamp) }}</span>
            <span class="font-semibold">{{ event.type }}</span>
            <span v-if="event.type === 'game-state'" class="text-xs">
              ({{ event.data.phase }}, {{ event.data.playersCount }}p)
            </span>
            <span v-else-if="event.type === 'game-state-update'" class="text-xs">
              ({{ event.data.playersCount }}p)
            </span>
            <span v-else-if="event.type === 'connect'" class="text-xs">
              ({{ event.data.socketId?.slice(-6) }})
            </span>
          </div>
        </div>
      </div>
      
      <!-- Console Commands -->
      <div class="border-t border-slate-600 pt-2 mt-2 text-xs">
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
        class="w-full mt-3 px-3 py-2 bg-slate-600 hover:bg-slate-700 rounded font-semibold transition-colors"
      >
        Close Debug Panel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/game'
import { useMultiplayerStore } from '@/stores/multiplayer'
import type { Vector3 } from '@shared/types'
import '@/terrain/TerrainDemo' // Load terrain demo for console access

const gameStore = useGameStore()
const multiplayerStore = useMultiplayerStore()

const formatTimestamp = (timestamp: number) => {
  const now = Date.now()
  const diff = Math.floor((now - timestamp) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  return `${Math.floor(diff / 3600)}h`
}

// Terrain generation functions
const generateForest = () => {
  gameStore.generateTerrainLevel('temperate_forest')
}

const generateDesert = () => {
  gameStore.generateTerrainLevel('desert')
}

const generateAlpine = () => {
  gameStore.generateTerrainLevel('alpine')
}

const generateWetlands = () => {
  gameStore.generateTerrainLevel('wetlands')
}

const generateRandom = () => {
  gameStore.generateRandomLevel()
}

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