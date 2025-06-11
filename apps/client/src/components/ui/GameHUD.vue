<template>
  <div class="absolute inset-0 pointer-events-none">
    <!-- Top Bar -->
    <div class="flex justify-between items-center p-4 pointer-events-auto">
      <!-- Timer -->
      <div class="bg-black/50 rounded-lg px-4 py-2">
        <span class="text-2xl font-mono text-green-400">{{ formatTime(gameStore.gameTimer) }}</span>
      </div>
      
      <!-- Position -->
      <div class="bg-black/50 rounded-lg px-4 py-2">
        <span class="text-xl text-white">{{ gameStore.playerRank }}/{{ gameStore.allPlayers.length }}</span>
      </div>
      
      <!-- Settings -->
      <button 
        @click="showSettings = !showSettings"
        class="bg-black/50 rounded-lg p-2 hover:bg-black/70 transition-colors pointer-events-auto"
      >
        ⚙️
      </button>
    </div>
    
    <!-- Side Panel - Player List -->
    <div class="absolute right-4 top-20 bg-black/30 rounded-lg p-3 min-w-48">
      <h3 class="text-white font-bold mb-2">Players</h3>
      <div 
        v-for="(player, index) in sortedPlayers" 
        :key="player.id" 
        class="flex items-center gap-2 mb-1"
        :class="{ 'text-green-400': player.id === gameStore.localPlayerId }"
      >
        <!-- Position number -->
        <span class="text-xs w-4">{{ index + 1 }}.</span>
        
        <!-- Mini avatar -->
        <div 
          class="w-6 h-6 rounded border-2"
          :style="{ backgroundColor: player.avatar.colors.skin }"
          :class="{ 'border-green-400': player.id === gameStore.localPlayerId }"
        ></div>
        
        <!-- Player name -->
        <span class="text-white text-sm flex-1">
          {{ player.name || (player.id === gameStore.localPlayerId ? 'You' : 'Player') }}
        </span>
        
        <!-- Lap time or progress -->
        <span class="text-xs ml-auto">
          {{ player.finished ? formatTime(player.lapTime!) : `${Math.round(player.lapProgress * 100)}%` }}
        </span>
        
        <!-- Finished indicator -->
        <span v-if="player.finished" class="text-yellow-400">🏁</span>
        
        <!-- God mode indicator -->
        <span v-if="player.godMode" class="text-purple-400">👑</span>
      </div>
    </div>
    
    <!-- Bottom - Controls Help -->
    <div class="absolute bottom-4 left-4 bg-black/30 rounded-lg p-3">
      <div class="text-white text-sm space-y-1">
        <div><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">WASD</kbd> Move</div>
        <div><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Space</kbd> Jump (soon™)</div>
        <div><kbd class="bg-gray-700 px-2 py-1 rounded text-xs">Esc</kbd> Menu</div>
      </div>
    </div>
    
    <!-- Progress Bar -->
    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-64">
      <div class="bg-black/30 rounded-full h-4 overflow-hidden">
        <div 
          class="bg-gradient-to-r from-cyan-400 to-purple-400 h-full transition-all duration-300"
          :style="{ width: `${(gameStore.localPlayer?.lapProgress || 0) * 100}%` }"
        ></div>
      </div>
      <div class="text-center text-white text-xs mt-1">
        {{ Math.round((gameStore.localPlayer?.lapProgress || 0) * 100) }}% Complete
      </div>
    </div>
    
    <!-- Settings Panel -->
    <div 
      v-if="showSettings"
      class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 rounded-lg p-6 pointer-events-auto"
    >
      <h3 class="text-white text-xl font-bold mb-4">Settings</h3>
      
      <div class="space-y-4">
        <button 
          @click="gameStore.phase = 'lobby'; showSettings = false"
          class="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
        >
          Back to Menu
        </button>
        
        <button 
          @click="gameStore.toggleDebugMode(); showSettings = false"
          class="block w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
        >
          {{ gameStore.debugMode ? 'Disable' : 'Enable' }} Debug Mode
        </button>
        
        <button 
          @click="showSettings = false"
          class="block w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white transition-colors"
        >
          Close
        </button>
      </div>
    </div>
    
    <!-- Finish Celebration -->
    <div 
      v-if="gameStore.localPlayer?.finished"
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div class="text-center">
        <div class="text-6xl animate-bounce">🏁</div>
        <div class="text-4xl font-bold text-yellow-400 mt-4">
          Finished!
        </div>
        <div class="text-2xl text-white mt-2">
          {{ formatTime(gameStore.localPlayer.lapTime!) }}
        </div>
        <div class="text-lg text-gray-300 mt-2">
          Position: {{ gameStore.playerRank }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()
const showSettings = ref(false)

// Sort players by lap progress (descending)
const sortedPlayers = computed(() => 
  [...gameStore.allPlayers].sort((a, b) => b.lapProgress - a.lapProgress)
)

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(1)
  return `${mins}:${secs.padStart(4, '0')}`
}

// Handle escape key
document.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    showSettings.value = !showSettings.value
  }
})
</script>

<style scoped>
.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    transform: translate3d(0,-30px,0);
  }
  70% {
    transform: translate3d(0,-15px,0);
  }
  90% {
    transform: translate3d(0,-4px,0);
  }
}

kbd {
  font-family: monospace;
  font-size: 0.75rem;
}
</style>