<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GameCanvas from '@/components/game/GameCanvas.vue'
import GameHUD from '@/components/ui/GameHUD.vue'
import DebugPanel from '@/components/ui/DebugPanel.vue'
import { useGameStore } from '@/stores/game'
import { useMultiplayerStore } from '@/stores/multiplayer'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const multiplayerStore = useMultiplayerStore()

// Generate or use existing level ID
const generateLevelId = () => {
  return `level_${Math.random().toString(36).substr(2, 9)}`
}

const loadLevel = async (levelId: string) => {
  console.log(`🌍 Loading level: ${levelId}`)
  
  // Request level from server instead of generating locally
  if (multiplayerStore.isConnected) {
    // Request specific level from server
    multiplayerStore.requestLevel({ levelId })
  } else {
    // Fallback: generate locally if not connected to server
    const seed = levelId.split('_')[1] ? parseInt(levelId.split('_')[1], 36) : Math.floor(Math.random() * 10000)
    await gameStore.generateTerrainLevel('temperate_forest', seed)
  }
}

onMounted(async () => {
  let levelId = route.params.levelId as string
  
  // If no level ID in URL, generate one and redirect
  if (!levelId) {
    levelId = generateLevelId()
    router.replace(`/game/${levelId}`)
    return
  }
  
  // Load the specific level
  await loadLevel(levelId)
  
  // Connect to multiplayer
  multiplayerStore.connect()
})

// Watch for level ID changes in URL
watch(() => route.params.levelId, async (newLevelId) => {
  if (newLevelId && typeof newLevelId === 'string') {
    await loadLevel(newLevelId)
  }
})
</script>

<template>
  <div class="w-full h-screen overflow-hidden">
    <!-- Game Canvas (Full Screen) -->
    <GameCanvas />
    
    <!-- Game UI Overlays -->
    <GameHUD />
    
    <!-- Debug Panel -->
    <DebugPanel v-if="gameStore.debugMode" />
  </div>
</template>

