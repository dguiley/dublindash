/**
 * Utility functions for terrain generation mathematics
 */

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Bilinear interpolation for height maps
 */
export function bilinearInterpolation(
  h00: number, h10: number, h01: number, h11: number,
  fx: number, fz: number
): number {
  const h0 = lerp(h00, h10, fx)
  const h1 = lerp(h01, h11, fx)
  return lerp(h0, h1, fz)
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Smooth step function for smooth transitions
 */
export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Calculate distance between two 2D points
 */
export function distance2D(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1
  const dz = z2 - z1
  return Math.sqrt(dx * dx + dz * dz)
}

/**
 * Calculate distance between two 3D points
 */
export function distance3D(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const dz = z2 - z1
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Convert world coordinates to grid coordinates
 */
export function worldToGrid(worldCoord: number, gridSize: number, offset: number = 0): number {
  return Math.floor((worldCoord - offset) / gridSize)
}

/**
 * Convert grid coordinates to world coordinates
 */
export function gridToWorld(gridCoord: number, gridSize: number, offset: number = 0): number {
  return gridCoord * gridSize + offset
}

/**
 * Calculate slope between two height values
 */
export function calculateSlope(height1: number, height2: number, distance: number): number {
  if (distance === 0) return 0
  return Math.abs(height2 - height1) / distance
}

/**
 * Normalize value to 0-1 range
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0
  return (value - min) / (max - min)
}

/**
 * Map value from one range to another
 */
export function mapRange(
  value: number,
  fromMin: number, fromMax: number,
  toMin: number, toMax: number
): number {
  const normalized = normalize(value, fromMin, fromMax)
  return lerp(toMin, toMax, normalized)
}

/**
 * Generate seeded random number
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/**
 * Generate random number in range using seeded random
 */
export function seededRandomRange(seed: number, min: number, max: number): number {
  const random = seededRandom(seed)
  return lerp(min, max, random)
}

/**
 * Calculate fractal Brownian motion (fBm)
 */
export function fbm(
  x: number, 
  z: number, 
  noiseFunction: (x: number, z: number) => number,
  octaves: number = 4,
  persistence: number = 0.5,
  lacunarity: number = 2.0,
  scale: number = 1.0
): number {
  let value = 0
  let amplitude = 1
  let frequency = scale

  for (let i = 0; i < octaves; i++) {
    value += noiseFunction(x * frequency, z * frequency) * amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }

  return value
}

/**
 * Calculate ridged noise (inverted absolute value)
 */
export function ridgedNoise(
  x: number,
  z: number,
  noiseFunction: (x: number, z: number) => number
): number {
  return 1 - Math.abs(noiseFunction(x, z))
}

/**
 * Calculate turbulence (sum of absolute values)
 */
export function turbulence(
  x: number,
  z: number,
  noiseFunction: (x: number, z: number) => number,
  octaves: number = 4,
  persistence: number = 0.5,
  lacunarity: number = 2.0,
  scale: number = 1.0
): number {
  let value = 0
  let amplitude = 1
  let frequency = scale

  for (let i = 0; i < octaves; i++) {
    value += Math.abs(noiseFunction(x * frequency, z * frequency)) * amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }

  return value
}

/**
 * Check if point is inside circle
 */
export function isInsideCircle(
  pointX: number, pointZ: number,
  centerX: number, centerZ: number,
  radius: number
): boolean {
  const distanceSquared = (pointX - centerX) ** 2 + (pointZ - centerZ) ** 2
  return distanceSquared <= radius ** 2
}

/**
 * Check if point is inside rectangle
 */
export function isInsideRectangle(
  pointX: number, pointZ: number,
  rectX: number, rectZ: number,
  rectWidth: number, rectHeight: number
): boolean {
  return pointX >= rectX && 
         pointX <= rectX + rectWidth &&
         pointZ >= rectZ && 
         pointZ <= rectZ + rectHeight
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI)
}