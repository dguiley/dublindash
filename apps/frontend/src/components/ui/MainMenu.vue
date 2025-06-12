<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useMultiplayerStore } from '@/stores/multiplayer'

const gameStore = useGameStore()
const multiplayerStore = useMultiplayerStore()
const loading = ref(false)
const loadingMessage = ref('')

const loadingMessages = [
  "Teaching AI to generate art that doesn't look like abstract nightmares...",
  "Convincing bots that they're real players (spoiler: they're not)...",
  "Downloading more RAM (this is a joke, please don't)...",
  "Calculating optimal meme-to-gameplay ratio...",
  "Converting dad jokes to 3D mesh geometry...",
  "Loading the concept of 'fun' into memory...",
  "Explaining to physics why players want to fly...",
  "Generating worlds prettier than your Minecraft builds..."
]

const emit = defineEmits<{
  'show-avatar-creator': []
}>()

const startMultiplayer = (): void => {
  if (!multiplayerStore.isConnected) {
    console.warn('Not connected to server')
    return
  }
  
  console.log('🚨 START RACING CLICKED!!! 🚨')
  console.log('🎮 Connected:', multiplayerStore.isConnected)
  console.log('🎮 Avatar exists:', !!gameStore.localAvatar)
  console.log('🎮 Avatar:', gameStore.localAvatar)
  console.log('🎮 Current phase BEFORE join:', gameStore.phase)
  console.log('🎮 Phase ref type:', typeof gameStore.phase, gameStore.phase)
  
  loading.value = true
  loadingMessage.value = loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
  
  // Join multiplayer game if we have an avatar
  if (gameStore.localAvatar) {
    console.log('🎮 Joining game with avatar...')
    multiplayerStore.joinGame(gameStore.localAvatar)
    
    // Server will automatically create demo level and start racing
    setTimeout(() => {
      console.log('🎮 Phase after join timeout:', gameStore.phase)
      console.log('🎮 Phase value:', gameStore.phase)
      console.log('🎮 Is racing computed:', gameStore.isRacing)
      loading.value = false
    }, 2000) // Give server more time to respond
  } else {
    console.log('🎮 No avatar found, showing creator')
    // Show avatar creator first
    emit('show-avatar-creator')
    loading.value = false
  }
}

const showAvatarCreator = (): void => {
  emit('show-avatar-creator')
}
</script>

<template>
  <div class="w-full h-full flex items-center justify-center bg-game-gradient">
    <div class="text-center text-white">
      <!-- Game Title -->
      <h1 class="text-6xl font-bold mb-4 text-gradient">
        DublinDash
      </h1>
      <p class="text-xl mb-8 opacity-80">
        Race through AI-generated worlds with style
      </p>
      
      <!-- Connection Status -->
      <div class="mb-6">
        <div v-if="multiplayerStore.isConnected" class="text-green-400 text-sm">
          ✅ Connected to server
        </div>
        <div v-else-if="multiplayerStore.isConnecting" class="text-yellow-400 text-sm">
          🔗 Connecting to server...
        </div>
        <div v-else class="text-red-400 text-sm">
          ❌ Not connected to server
        </div>
      </div>
      
      <!-- Menu Options -->
      <div class="space-y-4">
        <button 
          @click="startMultiplayer"
          :disabled="!multiplayerStore.isConnected"
          class="block mx-auto btn btn-primary px-8 py-4 text-xl font-bold disabled:cursor-not-allowed"
        >
          🎮 Start Racing
        </button>
        
        <button 
          @click="showAvatarCreator"
          class="block mx-auto btn btn-secondary"
        >
          👤 Change Avatar
        </button>
        
        <button 
          @click="gameStore.toggleDebugMode()"
          class="block mx-auto btn btn-danger"
        >
          🚀 Debug Mode
        </button>
      </div>
      
      <!-- Current Avatar Preview -->
      <div v-if="gameStore.localAvatar" class="mt-8">
        <p class="text-sm opacity-60 mb-2">Your Avatar:</p>
        <div class="inline-block p-3 bg-black/30 rounded-lg">
          <div 
            class="w-16 h-16 rounded border-2 border-white/20"
            :style="{ backgroundColor: gameStore.localAvatar.colors.skin }"
          >
            <div 
              class="w-full h-4 rounded-t"
              :style="{ backgroundColor: gameStore.localAvatar.colors.hair }"
            ></div>
            <div 
              class="w-full h-8 mt-4"
              :style="{ backgroundColor: gameStore.localAvatar.colors.clothing }"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- Fun Loading Messages -->
      <div v-if="loading" class="mt-8">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
        <p class="mt-2 text-sm opacity-80">{{ loadingMessage }}</p>
      </div>
      
      <!-- Easter Egg Hint -->
      <div class="mt-12 text-xs opacity-50">
        <p>Psst... try the Konami code 😉</p>
      </div>
      
      <!-- Version Info -->
      <div class="absolute bottom-4 right-4 text-xs opacity-30">
        <p>v1.0.0-birthday-edition</p>
        <p>Made with ❤️ for a special 16th birthday</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.bg-clip-text {
  background-clip: text;
  -webkit-background-clip: text;
}
</style>