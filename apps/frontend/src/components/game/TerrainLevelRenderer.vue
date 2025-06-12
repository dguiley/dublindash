<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { LevelData } from '@shared/types'
import type { Group, Mesh } from 'three'

interface Props {
  level: LevelData
  terrainMeshes?: {
    visual: Group
    collision: Mesh
  }
}

const props = defineProps<Props>()
const route = useRoute()

// Refs for Three.js objects
const terrainGroupRef = ref<any>()
const visualMeshRef = ref<any>()

// Computed properties for portals
const start = computed(() => props.level.geometry.portals.start)
const end = computed(() => props.level.geometry.portals.end)

// Track markers for racing boundaries (if no terrain provided)
const trackMarkers = computed((): [number, number, number][] => {
  if (props.terrainMeshes) {
    // With terrain, we don't need simple track markers
    return []
  }
  
  // Fallback to simple markers for legacy levels
  return [
    [-10, 1, -5], 
    [-10, 1, 5],
    [0, 1, -5], 
    [0, 1, 5],
    [10, 1, -5], 
    [10, 1, 5]
  ]
})

// Handle terrain mesh integration
const setupTerrainMeshes = () => {
  if (!props.terrainMeshes || !terrainGroupRef.value) return
  
  const group = terrainGroupRef.value
  
  // Add the visual terrain mesh to the scene
  if (props.terrainMeshes.visual) {
    group.add(props.terrainMeshes.visual)
    console.log('🌍 Added terrain visual mesh to scene')
  }
  
  // Note: Collision mesh will be handled separately by physics system
  // We don't add it to the visible scene
}

const cleanupTerrainMeshes = () => {
  if (!terrainGroupRef.value) return
  
  // Clean up any existing terrain meshes
  const group = terrainGroupRef.value
  const childrenToRemove = []
  
  for (let i = 0; i < group.children.length; i++) {
    const child = group.children[i]
    if (child.name && child.name.includes('terrain')) {
      childrenToRemove.push(child)
    }
  }
  
  childrenToRemove.forEach(child => {
    group.remove(child)
  })
}

// Watch for terrain mesh changes
watch(() => props.terrainMeshes, (newMeshes, oldMeshes) => {
  if (oldMeshes) {
    cleanupTerrainMeshes()
  }
  
  if (newMeshes) {
    setupTerrainMeshes()
  }
}, { immediate: false })

onMounted(() => {
  // Set up terrain meshes when component mounts
  setupTerrainMeshes()
})

onUnmounted(() => {
  // Clean up when component unmounts
  cleanupTerrainMeshes()
})

// Handle portal clicks
const handleStartPortalClick = () => {
  console.log('🚀 Start portal clicked!')
  // TODO: Implement race start logic
}

const handleEndPortalClick = () => {
  console.log('🏁 End portal clicked!')
  // TODO: Implement race finish logic
}
</script>

<template>
  <TresGroup ref="terrainGroupRef" name="level-group">
    <!-- Terrain will be added programmatically via setupTerrainMeshes -->
    
    <!-- Fallback ground plane (only if no terrain meshes) -->
    <TresMesh 
      v-if="!terrainMeshes"
      :position="[0, -0.1, 0]" 
      :rotation="[-Math.PI / 2, 0, 0]" 
      :receive-shadow="true"
      name="fallback-ground"
    >
      <TresPlaneGeometry :args="[level.geometry.terrain.width, level.geometry.terrain.height]" />
      <TresMeshLambertMaterial color="#4a7c2a" />
    </TresMesh>
    
    <!-- Start Portal -->
    <TresMesh 
      :position="[start.x, start.y + 2, start.z]"
      @click="handleStartPortalClick"
      name="start-portal"
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
      @click="handleEndPortalClick"
      name="end-portal"
    >
      <TresRingGeometry :args="[1.5, 2, 16]" />
      <TresMeshBasicMaterial 
        color="#ffff00" 
        :transparent="true" 
        :opacity="0.7"
      />
    </TresMesh>
    
    <!-- Track boundary markers (fallback for non-terrain levels) -->
    <TresMesh 
      v-for="(marker, index) in trackMarkers" 
      :key="`marker-${index}`"
      :position="marker"
      name="track-marker"
    >
      <TresBoxGeometry :args="[0.2, 2, 0.2]" />
      <TresMeshBasicMaterial color="#ffffff" />
    </TresMesh>
    
    <!-- Level obstacles from terrain or traditional system -->
    <TresMesh
      v-for="obstacle in level.geometry.obstacles"
      :key="obstacle.id"
      :position="[obstacle.position.x, obstacle.position.y, obstacle.position.z]"
      :rotation="[0, obstacle.rotation, 0]"
      :scale="[obstacle.scale.x, obstacle.scale.y, obstacle.scale.z]"
      :name="`obstacle-${obstacle.type}`"
    >
      <!-- Different geometries based on obstacle type -->
      <TresBoxGeometry 
        v-if="obstacle.type === 'rock' || obstacle.type === 'building'"
        :args="[1, 1, 1]" 
      />
      <TresCylinderGeometry 
        v-else-if="obstacle.type === 'tree'"
        :args="[0.5, 0.5, 2, 8]" 
      />
      <TresBoxGeometry 
        v-else
        :args="[1, 1, 1]" 
      />
      
      <!-- Materials based on obstacle type -->
      <TresMeshLambertMaterial 
        v-if="obstacle.type === 'rock'"
        color="#666666" 
      />
      <TresMeshLambertMaterial 
        v-else-if="obstacle.type === 'tree'"
        color="#8B4513" 
      />
      <TresMeshLambertMaterial 
        v-else-if="obstacle.type === 'building'"
        color="#888888" 
      />
      <TresMeshLambertMaterial 
        v-else
        color="#999999" 
      />
    </TresMesh>
    
    <!-- Biome-specific atmospheric effects -->
    <TresGroup v-if="level.biome === 'desert'" name="desert-effects">
      <!-- TODO: Add sand particles, heat shimmer -->
    </TresGroup>
    
    <TresGroup v-if="level.biome === 'alpine'" name="alpine-effects">
      <!-- TODO: Add snow particles, fog -->
    </TresGroup>
    
    <TresGroup v-if="level.biome === 'wetlands'" name="wetland-effects">
      <!-- TODO: Add mist, water reflections -->
    </TresGroup>
    
    <!-- Debug information -->
    <TresMesh 
      v-if="route?.query?.debug === 'true'"
      :position="[0, 10, 0]"
      name="debug-info"
    >
      <TresTextGeometry 
        :text="`${level.biome} | Seed: ${level.metadata.seed} | Difficulty: ${level.metadata.difficulty}`"
        :parameters="{ font: undefined, size: 2, height: 0.1 }"
      />
      <TresMeshBasicMaterial color="#ffffff" />
    </TresMesh>
  </TresGroup>
</template>

<style scoped>
/* Component-specific styles if needed */
</style>