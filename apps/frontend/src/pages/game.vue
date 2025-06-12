<script setup lang="ts">
import GameCanvas from '@/components/game/GameCanvas.vue'
import GameHUD from '@/components/ui/GameHUD.vue'
import DebugPanel from '@/components/ui/DebugPanel.vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
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

