import { ref, onMounted, onUnmounted } from 'vue'
import type { Vector3 } from '@shared/types'

export function useInput() {
  const keys = ref<Set<string>>(new Set())
  const movement = ref<Vector3>({ x: 0, y: 0, z: 0 })
  
  const handleKeyDown = (e: KeyboardEvent) => {
    keys.value.add(e.code)
    updateMovement()
  }
  
  const handleKeyUp = (e: KeyboardEvent) => {
    keys.value.delete(e.code)
    updateMovement()
  }
  
  const updateMovement = () => {
    const newMovement = { x: 0, y: 0, z: 0 }
    
    // WASD movement
    if (keys.value.has('KeyW') || keys.value.has('ArrowUp')) {
      newMovement.z -= 1
    }
    if (keys.value.has('KeyS') || keys.value.has('ArrowDown')) {
      newMovement.z += 1
    }
    if (keys.value.has('KeyA') || keys.value.has('ArrowLeft')) {
      newMovement.x -= 1
    }
    if (keys.value.has('KeyD') || keys.value.has('ArrowRight')) {
      newMovement.x += 1
    }
    
    // Jump (for later when we add physics)
    if (keys.value.has('Space')) {
      newMovement.y += 1
    }
    
    // Normalize diagonal movement
    const length = Math.sqrt(newMovement.x ** 2 + newMovement.z ** 2)
    if (length > 0) {
      newMovement.x /= length
      newMovement.z /= length
    }
    
    movement.value = newMovement
  }
  
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    console.log('🎮 Input system initialized (WASD to move)')
  })
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
  })
  
  return {
    keys: keys.value,
    movement
  }
}