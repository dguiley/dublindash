import { ref, onMounted, onUnmounted } from 'vue'
import type { Vector3, MovementInput } from '@shared/types'

export function useInput() {
  const keys = ref<Set<string>>(new Set())
  const movement = ref<Vector3>({ x: 0, y: 0, z: 0 })
  const inputs = ref<MovementInput>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false
  })
  const zoomOut = ref(false)
  const mapView = ref(false)
  
  const handleKeyDown = (e: KeyboardEvent) => {
    console.log('🔽 Key down:', e.code)
    
    // Handle special keys
    if (e.code === 'KeyM') {
      mapView.value = !mapView.value
      console.log('🗺️  Map view:', mapView.value ? 'ON' : 'OFF')
      return
    }
    
    if (e.code === 'KeyZ') {
      zoomOut.value = true
      console.log('🔍 Zoom out: ON')
      return
    }
    
    keys.value.add(e.code)
    updateMovement()
  }
  
  const handleKeyUp = (e: KeyboardEvent) => {
    console.log('🔼 Key up:', e.code)
    
    // Handle special keys
    if (e.code === 'KeyZ') {
      zoomOut.value = false
      console.log('🔍 Zoom out: OFF')
      return
    }
    
    keys.value.delete(e.code)
    updateMovement()
  }
  
  const updateMovement = () => {
    const newMovement = { x: 0, y: 0, z: 0 }
    const newInputs: MovementInput = {
      forward: keys.value.has('KeyW') || keys.value.has('ArrowUp'),
      backward: keys.value.has('KeyS') || keys.value.has('ArrowDown'),
      left: keys.value.has('KeyA') || keys.value.has('ArrowLeft'),
      right: keys.value.has('KeyD') || keys.value.has('ArrowRight'),
      jump: keys.value.has('Space')
    }
    
    // Convert inputs to normalized movement vector
    if (newInputs.forward) newMovement.z -= 1
    if (newInputs.backward) newMovement.z += 1
    if (newInputs.left) newMovement.x -= 1
    if (newInputs.right) newMovement.x += 1
    if (newInputs.jump) newMovement.y += 1
    
    // Normalize diagonal movement
    const length = Math.sqrt(newMovement.x ** 2 + newMovement.z ** 2)
    if (length > 0) {
      newMovement.x /= length
      newMovement.z /= length
    }
    
    inputs.value = newInputs
    movement.value = newMovement
    if (newMovement.x !== 0 || newMovement.z !== 0) {
      console.log('🎮 Movement updated:', newMovement, 'Inputs:', newInputs)
    }
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
    movement,
    inputs,
    zoomOut,
    mapView
  }
}