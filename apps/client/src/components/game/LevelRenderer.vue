<script setup lang="ts">
import { computed } from 'vue'
import type { LevelData } from '@shared/types'

interface Props {
  level: LevelData
}

const props = defineProps<Props>()

// Mock simple level data for now
const start = computed(() => ({ x: -20, y: 0, z: 0 }))
const end = computed(() => ({ x: 20, y: 0, z: 0 }))

// Simple track markers for visual boundaries
const trackMarkers = computed(() => [
  [-10, 1, -5], [-10, 1, 5],
  [0, 1, -5], [0, 1, 5],
  [10, 1, -5], [10, 1, 5]
])
</script>

<template>
  <group>
    <!-- Ground Plane -->
    <mesh :position="[0, -0.1, 0]" receive-shadow>
      <planeGeometry :args="[100, 100]" />
      <meshLambertMaterial color="#2d5016" />
    </mesh>
    
    <!-- Start Portal -->
    <mesh 
      :position="[start.x, start.y + 2, start.z]"
      @click="() => console.log('Start portal clicked!')"
    >
      <ringGeometry :args="[1.5, 2, 16]" />
      <meshBasicMaterial 
        color="#00ffff" 
        :transparent="true" 
        :opacity="0.7"
      />
    </mesh>
    
    <!-- End Portal -->
    <mesh 
      :position="[end.x, end.y + 2, end.z]"
      @click="() => console.log('End portal clicked!')"
    >
      <ringGeometry :args="[1.5, 2, 16]" />
      <meshBasicMaterial 
        color="#ffff00" 
        :transparent="true" 
        :opacity="0.7"
      />
    </mesh>
    
    <!-- Simple racing track boundary markers -->
    <mesh 
      v-for="(marker, index) in trackMarkers" 
      :key="`marker-${index}`"
      :position="marker"
    >
      <boxGeometry :args="[0.2, 2, 0.2]" />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
    
    <!-- Simple obstacles for demo -->
    <mesh :position="[-5, 0.5, 0]">
      <boxGeometry :args="[1, 1, 1]" />
      <meshLambertMaterial color="#666666" />
    </mesh>
    
    <mesh :position="[5, 1.5, 0]">
      <cylinderGeometry :args="[0.5, 0.5, 3, 8]" />
      <meshLambertMaterial color="#8B4513" />
    </mesh>
  </group>
</template>