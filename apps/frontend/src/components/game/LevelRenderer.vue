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
const trackMarkers = computed((): [number, number, number][] => [
  [-10, 1, -5], 
  [-10, 1, 5],
  [0, 1, -5], 
  [0, 1, 5],
  [10, 1, -5], 
  [10, 1, 5]
])
</script>

<template>
  <TresGroup>
    <!-- Ground Plane -->
    <TresMesh :position="[0, -0.1, 0]" :rotation="[-Math.PI / 2, 0, 0]" :receive-shadow="true">
      <TresPlaneGeometry :args="[100, 100]" />
      <TresMeshLambertMaterial color="#4a7c2a" />
    </TresMesh>
    
    <!-- Start Portal -->
    <TresMesh 
      :position="[start.x, start.y + 2, start.z]"
      @click="() => console.log('Start portal clicked!')"
    >
      <TresRingGeometry :args="[1.5, 2, 16]" />
      <TresMeshBasicMaterial 
        color="#00ffff" 
        :transparent="true" 
        :opacity="0.7"
      />
    </TresMesh>
    
    <!-- End Portal -->
    <TresMesh 
      :position="[end.x, end.y + 2, end.z]"
      @click="() => console.log('End portal clicked!')"
    >
      <TresRingGeometry :args="[1.5, 2, 16]" />
      <TresMeshBasicMaterial 
        color="#ffff00" 
        :transparent="true" 
        :opacity="0.7"
      />
    </TresMesh>
    
    <!-- Simple racing track boundary markers -->
    <TresMesh 
      v-for="(marker, index) in trackMarkers" 
      :key="`marker-${index}`"
      :position="marker"
    >
      <TresBoxGeometry :args="[0.2, 2, 0.2]" />
      <TresMeshBasicMaterial color="#ffffff" />
    </TresMesh>
    
    <!-- Simple obstacles for demo -->
    <TresMesh :position="[-5, 0.5, 0]">
      <TresBoxGeometry :args="[1, 1, 1]" />
      <TresMeshLambertMaterial color="#666666" />
    </TresMesh>
    
    <TresMesh :position="[5, 1.5, 0]">
      <TresCylinderGeometry :args="[0.5, 0.5, 3, 8]" />
      <TresMeshLambertMaterial color="#8B4513" />
    </TresMesh>
  </TresGroup>
</template>