export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface AvatarData {
  id: string
  colors: {
    hair: string
    skin: string
    clothing: string
  }
  style: 'blocky' | 'smooth' | 'pixel' | 'cyberpunk' | 'anime'
  meshData?: {
    vertices: Float32Array
    colors: Float32Array
    indices: Uint16Array
  }
}

export interface Player {
  id: string
  position: Vector3
  velocity: Vector3
  rotation: number
  avatar: AvatarData
  lapProgress: number
  lapTime?: number
  finished: boolean
  godMode?: boolean
  name?: string
}

export interface BotPersonality {
  name: string
  style: 'tryhard' | 'chaos' | 'boomer' | 'npc' | 'speedster' | 'wanderer'
  traits: {
    baseSpeed: number
    randomness: number
    aggression: number
    skill: number
    [key: string]: number
  }
  taunts: string[]
  specialAbilities?: string[]
}

export interface ObstacleData {
  id: string
  type: 'tree' | 'rock' | 'building' | 'barrier'
  position: Vector3
  rotation: number
  scale: Vector3
}

export interface LevelData {
  id: string
  biome: string
  aiGeneratedImage?: string
  geometry: {
    terrain: {
      width: number
      height: number
      heightMap: number[][]
    }
    obstacles: ObstacleData[]
    portals: {
      start: Vector3
      end: Vector3
    }
  }
  metadata: {
    difficulty: number
    theme: string
    mood: string
    seed: number
  }
}

export interface GameState {
  phase: 'lobby' | 'loading' | 'racing' | 'finished'
  timer: number
  players: Player[]
  level: LevelData | undefined
  maxPlayers: number
}

export interface NetworkMessage {
  type: 'join' | 'move' | 'chat' | 'leave' | 'game-state' | 'level-update'
  data: unknown
  timestamp: number
}

export interface MovementInput {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
}