<script setup lang="ts">
import type { Player } from '@shared/types'

interface Props {
  player: Player
  isLocal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLocal: false
})
</script>

<template>
  <TresGroup 
    :position="[player.position.x, player.position.y, player.position.z]"
    :rotation-y="player.rotation"
  >
    <!-- Player Body (Simple Box for now) -->
    <TresMesh :position="[0, 0.5, 0]">
      <TresBoxGeometry :args="[0.8, 1, 0.4]" />
      <TresMeshLambertMaterial :color="player.avatar.colors.clothing" />
    </TresMesh>
    
    <!-- Player Head -->
    <TresMesh :position="[0, 1.2, 0]">
      <TresBoxGeometry :args="[0.4, 0.4, 0.4]" />
      <TresMeshLambertMaterial :color="player.avatar.colors.skin" />
    </TresMesh>
    
    <!-- Hair -->
    <TresMesh :position="[0, 1.4, 0]">
      <TresBoxGeometry :args="[0.45, 0.2, 0.45]" />
      <TresMeshLambertMaterial :color="player.avatar.colors.hair" />
    </TresMesh>
    
    <!-- Local Player Indicator -->
    <TresMesh 
      v-if="isLocal" 
      :position="[0, 2.5, 0]"
    >
      <TresRingGeometry :args="[0.3, 0.5, 8]" />
      <TresMeshBasicMaterial 
        color="#00ff00" 
        :transparent="true" 
        :opacity="0.8"
      />
    </TresMesh>
    
    <!-- Player Name/ID (floating text would go here in a real implementation) -->
    <TresMesh :position="[0, 2, 0]">
      <TresBoxGeometry :args="[0.1, 0.1, 0.1]" />
      <TresMeshBasicMaterial 
        :color="isLocal ? '#00ff00' : '#ffffff'" 
        :transparent="true" 
        :opacity="0.6"
      />
    </TresMesh>
  </TresGroup>
</template>