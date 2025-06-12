<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div class="bg-gray-900 rounded-xl p-8 max-w-md w-full mx-4">
      <h2 class="text-2xl font-bold text-white mb-6">Create Your Character</h2>
      
      <!-- Simple Avatar Creator for now -->
      <div class="space-y-4">
        <!-- Hair Color -->
        <div>
          <label class="text-white text-sm mb-2 block">Hair Color:</label>
          <div class="flex gap-2">
            <button
              v-for="color in hairColors"
              :key="color"
              @click="avatar.colors.hair = color"
              class="w-8 h-8 rounded border-2 transition-all"
              :style="{ backgroundColor: color }"
              :class="avatar.colors.hair === color ? 'border-white scale-110' : 'border-gray-500'"
            ></button>
          </div>
        </div>
        
        <!-- Skin Color -->
        <div>
          <label class="text-white text-sm mb-2 block">Skin Tone:</label>
          <div class="flex gap-2">
            <button
              v-for="color in skinColors"
              :key="color"
              @click="avatar.colors.skin = color"
              class="w-8 h-8 rounded border-2 transition-all"
              :style="{ backgroundColor: color }"
              :class="avatar.colors.skin === color ? 'border-white scale-110' : 'border-gray-500'"
            ></button>
          </div>
        </div>
        
        <!-- Clothing Color -->
        <div>
          <label class="text-white text-sm mb-2 block">Clothing:</label>
          <div class="flex gap-2">
            <button
              v-for="color in clothingColors"
              :key="color"
              @click="avatar.colors.clothing = color"
              class="w-8 h-8 rounded border-2 transition-all"
              :style="{ backgroundColor: color }"
              :class="avatar.colors.clothing === color ? 'border-white scale-110' : 'border-gray-500'"
            ></button>
          </div>
        </div>
        
        <!-- Style Selection -->
        <div>
          <label class="text-white text-sm mb-2 block">Style:</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="style in availableStyles"
              :key="style"
              @click="avatar.style = style"
              :class="[
                'px-3 py-2 rounded text-sm transition-colors',
                avatar.style === style 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
            >
              {{ style }}
            </button>
          </div>
        </div>
        
        <!-- Preview -->
        <div class="bg-gray-800 rounded-lg p-4">
          <div class="text-white text-sm mb-2">Preview:</div>
          <div class="flex justify-center">
            <div class="relative">
              <!-- Simple 2D preview -->
              <div 
                class="w-16 h-20 rounded"
                :style="{ backgroundColor: avatar.colors.clothing }"
              >
                <div 
                  class="w-12 h-12 mx-auto rounded"
                  :style="{ backgroundColor: avatar.colors.skin }"
                >
                  <div 
                    class="w-full h-4 rounded-t"
                    :style="{ backgroundColor: avatar.colors.hair }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex gap-3 mt-6">
        <button
          @click="createAvatar"
          class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          Create Character
        </button>
        
        <button
          @click="randomizeAvatar"
          class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
        >
          Random
        </button>
        
        <button
          @click="$emit('skip')"
          class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
        >
          Skip
        </button>
      </div>
      
      <!-- Camera Feature Coming Soon -->
      <div class="mt-4 text-center">
        <p class="text-gray-400 text-sm">📸 Camera avatar generation coming soon!</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AvatarData } from '@shared/types'

const emit = defineEmits<{
  'avatar-created': [avatar: AvatarData]
  'skip': []
}>()

const avatar = ref<AvatarData>({
  id: 'avatar-' + Date.now(),
  colors: {
    hair: '#8B4513',
    skin: '#DDBEA9',
    clothing: '#4A90E2'
  },
  style: 'blocky'
})

const hairColors = [
  '#8B4513', // Brown
  '#FFD700', // Blonde
  '#000000', // Black
  '#FF4500', // Red
  '#A0522D', // Auburn
  '#808080', // Gray
  '#800080', // Purple
  '#00CED1'  // Cyan
]

const skinColors = [
  '#DDBEA9', // Light
  '#CB997E', // Medium Light
  '#A68B5B', // Medium
  '#8B7355', // Medium Dark
  '#6F4E37', // Dark
  '#4A4A4A'  // Very Dark
]

const clothingColors = [
  '#4A90E2', // Blue
  '#50C878', // Green
  '#FF6B6B', // Red
  '#FFD93D', // Yellow
  '#9B59B6', // Purple
  '#E67E22', // Orange
  '#2C3E50', // Dark Blue
  '#E74C3C'  // Crimson
]

const availableStyles = ['blocky', 'smooth', 'pixel'] as const

const createAvatar = () => {
  emit('avatar-created', { ...avatar.value })
}

const randomizeAvatar = () => {
  avatar.value = {
    id: 'avatar-' + Date.now(),
    colors: {
      hair: hairColors[Math.floor(Math.random() * hairColors.length)],
      skin: skinColors[Math.floor(Math.random() * skinColors.length)],
      clothing: clothingColors[Math.floor(Math.random() * clothingColors.length)]
    },
    style: availableStyles[Math.floor(Math.random() * availableStyles.length)]
  }
}
</script>