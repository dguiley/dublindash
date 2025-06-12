<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { useMultiplayerStore } from '@/stores/multiplayer'
import GameCanvas from '@/components/game/GameCanvas.vue'
import MainMenu from '@/components/ui/MainMenu.vue'
import GameHUD from '@/components/ui/GameHUD.vue'
import AvatarCreator from '@/components/avatar/AvatarCreator.vue'
import DebugPanel from '@/components/ui/DebugPanel.vue'
import type { AvatarData } from '@shared/types'

const gameStore = useGameStore()
const multiplayerStore = useMultiplayerStore()
const showAvatarCreator = ref(false)

onMounted(() => {
  // Connect to multiplayer server
  multiplayerStore.connect()
  
  // Load existing avatar or show creator
  const savedAvatar = localStorage.getItem('dublin-avatar')
  if (savedAvatar) {
    try {
      const avatar = JSON.parse(savedAvatar)
      gameStore.setLocalAvatar(avatar)
      console.log('🎭 Loaded saved avatar:', avatar)
    } catch (error) {
      console.error('Failed to parse saved avatar:', error)
      showAvatarCreator.value = true
    }
  } else {
    showAvatarCreator.value = true
  }
  
  // Konami code easter egg
  let konamiSequence = ''
  const konamiCode = 'ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightKeyBKeyA'
  
  document.addEventListener('keydown', (e) => {
    konamiSequence += e.code
    if (konamiSequence.length > konamiCode.length) {
      konamiSequence = konamiSequence.slice(-konamiCode.length)
    }
    
    if (konamiSequence === konamiCode) {
      gameStore.toggleDebugMode()
      konamiSequence = ''
    }
  })
})

const handleAvatarCreated = (avatar: AvatarData): void => {
  gameStore.setLocalAvatar(avatar)
  localStorage.setItem('dublin-avatar', JSON.stringify(avatar))
  showAvatarCreator.value = false
  
  // Join multiplayer game if connected - server will handle racing
  if (multiplayerStore.isConnected) {
    multiplayerStore.joinGame(avatar)
    console.log('🎮 Joined game after avatar creation')
  }
}

const skipAvatarCreation = (): void => {
  const randomAvatar: AvatarData = {
    id: 'random-' + Date.now(),
    colors: {
      hair: `hsl(${Math.random() * 360}, 70%, 50%)`,
      skin: `hsl(${30 + Math.random() * 30}, 50%, 70%)`,
      clothing: `hsl(${Math.random() * 360}, 80%, 60%)`
    },
    style: 'blocky'
  }
  handleAvatarCreated(randomAvatar)
}
</script>

<template>
  <div id="app" class="w-full h-screen overflow-hidden">
    
    <!-- Game Canvas (Full Screen) -->
    <GameCanvas v-if="gameStore.phase === 'racing'" />
    
    <!-- Main Menu/Lobby -->
    <MainMenu 
      v-else 
      @show-avatar-creator="showAvatarCreator = true"
    />
    
    <!-- Global UI Overlays -->
    <GameHUD v-if="gameStore.phase === 'racing'" />
    
    <!-- Avatar Creator Modal -->
    <AvatarCreator 
      v-if="showAvatarCreator"
      @avatar-created="handleAvatarCreated"
      @skip="skipAvatarCreation"
    />
    
    <!-- Debug Panel -->
    <DebugPanel v-if="gameStore.debugMode" />
  </div>
</template>

