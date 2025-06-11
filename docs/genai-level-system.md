# GenAI Level Generation System

## Core Innovation: Art-to-Geometry Pipeline

Instead of traditional procedural generation, DublinDash uses **AI-generated artwork** as the foundation for level geometry. This creates unique, artistic levels that feel hand-crafted while being completely automated.

## The Pipeline

### 1. Level Parameters → AI Prompt
```javascript
const levelConfig = {
  biome: 'forest',
  difficulty: 3,
  size: 'small',
  mood: 'mystical',
  obstacles: 'medium'
};

const prompt = `Top-down view of a mystical forest race track. 
Small winding path from bottom-left to top-right. 
Medieval fantasy style, vibrant greens and blues.
Medium density of trees and rocks as obstacles.
Start portal (glowing blue) at bottom, end portal (golden) at top.
Pixel art style, high contrast, game-ready.`;
```

### 2. AI Image Generation
```javascript
// Using OpenAI DALL-E, Midjourney, or local Stable Diffusion
async function generateLevelArt(prompt) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    size: "1024x1024",
    quality: "standard",
    style: "vivid"
  });
  
  return response.data[0].url;
}
```

### 3. Image Analysis → Geometry
```javascript
class ImageToGeometry {
  async processLevelImage(imageUrl) {
    // Download and analyze the AI-generated image
    const canvas = await this.loadImageToCanvas(imageUrl);
    const imageData = canvas.getImageData(0, 0, 1024, 1024);
    
    // Color analysis for different elements
    const analysis = {
      paths: this.findColorRegions(imageData, 'path_colors'),
      obstacles: this.findColorRegions(imageData, 'obstacle_colors'),
      elevation: this.analyzeColorIntensity(imageData),
      portals: this.findSpecificColors(imageData, ['blue', 'gold'])
    };
    
    // Convert to 3D world data
    return this.generateGeometry(analysis);
  }
  
  findColorRegions(imageData, elementType) {
    // Scan image pixels and cluster similar colors
    // Return coordinates of different elements
  }
  
  generateGeometry(analysis) {
    const world = {
      terrain: this.createTerrainMesh(analysis.elevation),
      obstacles: this.placeObstacles(analysis.obstacles),
      paths: this.createPathways(analysis.paths),
      portals: this.placePortals(analysis.portals)
    };
    
    return world;
  }
}
```

## Biome-Specific Prompts

### Forest Biome
```javascript
const forestPrompts = {
  base: "Top-down view of a magical forest racing course",
  obstacles: "Ancient trees, moss-covered rocks, fallen logs",
  colors: "Deep greens, earth browns, golden sunlight",
  style: "Fantasy pixel art with soft lighting",
  mood: ["peaceful", "mystical", "enchanted", "wild"]
};
```

### Desert Biome  
```javascript
const desertPrompts = {
  base: "Aerial view of a desert canyon race track",
  obstacles: "Cacti, sandstone pillars, dried riverbeds",
  colors: "Warm oranges, sandy yellows, sunset reds",
  style: "Western pixel art with harsh shadows",
  mood: ["harsh", "adventure", "blazing", "mysterious"]
};
```

### Cyber City
```javascript
const cyberPrompts = {
  base: "Neon-lit futuristic city racing circuit",
  obstacles: "Holographic barriers, floating platforms, energy fields",
  colors: "Electric blues, neon pinks, chrome silvers",
  style: "Cyberpunk pixel art with glowing effects",
  mood: ["high-tech", "electric", "fast-paced", "digital"]
};
```

## Dynamic Prompt Engineering

### Difficulty Scaling
```javascript
function adjustPromptForDifficulty(basePrompt, difficulty) {
  const modifiers = {
    1: "simple path, few obstacles, clear route",
    3: "winding path, moderate obstacles, some shortcuts", 
    5: "complex maze-like path, many obstacles, hidden routes",
    7: "extreme terrain, dense obstacles, vertical challenges",
    10: "nightmare mode, maximum obstacles, impossible-looking paths"
  };
  
  return `${basePrompt}. ${modifiers[difficulty]}`;
}
```

### Mood Variations
```javascript
const moodModifiers = {
  peaceful: "soft colors, gentle lighting, harmonious composition",
  intense: "sharp contrasts, dramatic lighting, dynamic angles", 
  mystical: "magical aura, glowing elements, ethereal atmosphere",
  chaotic: "irregular patterns, clashing colors, wild composition"
};
```

## Level Caching Strategy

### Smart Caching
```javascript
class LevelCache {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50; // Keep 50 generated levels
  }
  
  async getLevel(params) {
    const key = this.hashParams(params);
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // Generate new level
    const level = await this.generateNewLevel(params);
    this.cache.set(key, level);
    
    // Trim cache if needed
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    return level;
  }
}
```

## Image Processing Techniques

### Color Region Detection
```javascript
function analyzeImageRegions(imageData) {
  const regions = {
    walkable: [], // Light colors = paths
    obstacles: [], // Dark colors = obstacles  
    elevation: [], // Color intensity = height
    special: []    // Unique colors = portals/items
  };
  
  for (let y = 0; y < imageData.height; y += 4) {
    for (let x = 0; x < imageData.width; x += 4) {
      const pixel = getPixel(imageData, x, y);
      const region = classifyPixel(pixel);
      regions[region].push({x, y, color: pixel});
    }
  }
  
  return regions;
}
```

### Height Map Generation
```javascript
function generateHeightMap(imageData) {
  const heightMap = [];
  
  for (let y = 0; y < imageData.height; y++) {
    heightMap[y] = [];
    for (let x = 0; x < imageData.width; x++) {
      const pixel = getPixel(imageData, x, y);
      // Darker = lower, lighter = higher
      const height = (pixel.r + pixel.g + pixel.b) / (3 * 255);
      heightMap[y][x] = height * 10; // Scale to world units
    }
  }
  
  return heightMap;
}
```

## Bot Integration

### AI-Aware Bots
```javascript
class SmartBot {
  constructor(levelAnalysis) {
    this.pathHints = levelAnalysis.paths;
    this.obstacleMap = levelAnalysis.obstacles;
    this.shortcuts = this.findShortcuts(levelAnalysis);
  }
  
  move() {
    // Bots can use the AI-generated path data
    // to navigate intelligently
    const nextWaypoint = this.pathHints[this.currentTarget];
    return this.moveToward(nextWaypoint);
  }
}
```

## Hackability Features

### Debug Mode
```javascript
// Press 'D' to see the AI analysis overlay
function toggleDebugMode() {
  const debugCanvas = document.getElementById('debug-overlay');
  
  if (debugVisible) {
    // Show the original AI image
    drawImage(debugCanvas, currentLevel.sourceImage);
    // Overlay the extracted geometry
    drawGeometryOverlay(debugCanvas, currentLevel.analysis);
  }
}
```

### Level Editor
```javascript
// Manually tweak the AI prompt and regenerate
const levelEditor = {
  currentPrompt: "",
  
  editPrompt() {
    const newPrompt = prompt("Edit level prompt:", this.currentPrompt);
    if (newPrompt) {
      this.regenerateLevel(newPrompt);
    }
  },
  
  async regenerateLevel(prompt) {
    const newImage = await generateLevelArt(prompt);
    const newGeometry = await imageToGeometry(newImage);
    replaceCurrentLevel(newGeometry);
  }
};
```

## Implementation Phases

### Phase 1: Basic Pipeline
1. Simple prompt → DALL-E → basic geometry extraction
2. One biome (forest) with fixed prompts
3. Manual color thresholds for analysis

### Phase 2: Smart Analysis  
1. Machine learning for better image analysis
2. Multiple biomes with dynamic prompts
3. Intelligent obstacle placement

### Phase 3: Advanced Features
1. Player feedback influences future generation
2. Seasonal/time-based prompt variations
3. Community sharing of favorite generated levels

This GenAI system makes level creation feel magical while being technically straightforward to implement and incredibly fun to hack on!