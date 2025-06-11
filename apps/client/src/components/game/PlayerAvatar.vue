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
  <group 
    :position="[player.position.x, player.position.y, player.position.z]"
    :rotation-y="player.rotation"
  >
    <!-- Player Body (Simple Box for now) -->
    <mesh :position="[0, 0.5, 0]">
      <boxGeometry :args="[0.8, 1, 0.4]" />
      <meshLambertMaterial :color="player.avatar.colors.clothing" />
    </mesh>
    
    <!-- Player Head -->
    <mesh :position="[0, 1.2, 0]">
      <boxGeometry :args="[0.4, 0.4, 0.4]" />
      <meshLambertMaterial :color="player.avatar.colors.skin" />
    </mesh>
    
    <!-- Hair -->
    <mesh :position="[0, 1.4, 0]">
      <boxGeometry :args="[0.45, 0.2, 0.45]" />
      <meshLambertMaterial :color="player.avatar.colors.hair" />
    </mesh>
    
    <!-- Local Player Indicator -->
    <mesh 
      v-if="isLocal" 
      :position="[0, 2.5, 0]"
    >
      <ringGeometry :args="[0.3, 0.5, 8]" />
      <meshBasicMaterial 
        color="#00ff00" 
        :transparent="true" 
        :opacity="0.8"
      />
    </mesh>
    
    <!-- Player Name/ID (floating text would go here in a real implementation) -->
    <mesh :position="[0, 2, 0]">
      <boxGeometry :args="[0.1, 0.1, 0.1]" />
      <meshBasicMaterial 
        :color="isLocal ? '#00ff00' : '#ffffff'" 
        :transparent="true" 
        :opacity="0.6"
      />
    </mesh>
  </group>
</template>