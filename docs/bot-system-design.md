# Bot Player System Design

## Core Philosophy: Make 1-2 Players Feel Like a Crowd

The bot system ensures DublinDash feels alive and crowded even with minimal human players. Bots should feel natural, varied, and fun to race against.

## Bot Personalities

### 1. The Speedster
```javascript
const SpeedsterBot = {
  name: "Turbo",
  style: "aggressive",
  traits: {
    baseSpeed: 1.2,        // 20% faster than average
    riskTaking: 0.8,       // Takes risky shortcuts
    collisionAvoidance: 0.3, // Bumps into things often
    pathOptimization: 0.9   // Finds good routes
  },
  behavior: "Charges ahead, takes shortcuts, crashes occasionally"
};
```

### 2. The Wanderer  
```javascript
const WandererBot = {
  name: "Explorer",
  style: "curious",
  traits: {
    baseSpeed: 0.8,        // Slower, more cautious
    riskTaking: 0.2,       // Plays it safe
    collisionAvoidance: 0.9, // Careful navigation
    distraction: 0.7       // Gets distracted by scenery
  },
  behavior: "Stops to look around, takes scenic routes"
};
```

### 3. The Competitor
```javascript
const CompetitorBot = {
  name: "Rival",
  style: "competitive", 
  traits: {
    baseSpeed: 1.0,        // Normal speed
    rubber_banding: 0.8,   // Speeds up if player is winning
    blocking: 0.6,         // Sometimes blocks player
    mimicry: 0.7          // Copies player's successful moves
  },
  behavior: "Provides good competition, adapts to player skill"
};
```

### 4. The Comedian
```javascript
const ComedianBot = {
  name: "Jester",
  style: "silly",
  traits: {
    baseSpeed: 0.9,
    randomness: 0.8,       // Does unexpected things
    spinning: 0.3,         // Occasionally spins in circles
    jumping: 0.5,          // Jumps at random times
    followPlayer: 0.4      // Sometimes follows the player
  },
  behavior: "Entertaining and unpredictable, makes you laugh"
};
```

## Dynamic Bot Spawning

### Crowd Management
```javascript
class BotManager {
  constructor() {
    this.targetCrowd = 8;     // Always maintain ~8 total players
    this.bots = new Map();
    this.personalities = [SpeedsterBot, WandererBot, CompetitorBot, ComedianBot];
  }
  
  update(humanPlayerCount) {
    const botsNeeded = this.targetCrowd - humanPlayerCount;
    
    // Add bots if needed
    while (this.bots.size < botsNeeded) {
      this.spawnRandomBot();
    }
    
    // Remove excess bots gracefully
    while (this.bots.size > botsNeeded) {
      this.removeOldestBot();
    }
  }
  
  spawnRandomBot() {
    const personality = this.randomPersonality();
    const bot = new Bot(personality);
    
    // Spawn at a random location behind the leaders
    bot.position = this.findSpawnPosition();
    this.bots.set(bot.id, bot);
  }
}
```

### Intelligent Spawn Positioning
```javascript
function findSpawnPosition() {
  const playerPositions = getAllPlayerPositions();
  const averageProgress = calculateAverageProgress(playerPositions);
  
  // Spawn bots slightly behind the pack
  const spawnProgress = averageProgress * 0.7; // 70% of average progress
  const spawnPosition = getPositionFromProgress(spawnProgress);
  
  // Add some randomness to avoid clustering
  return addRandomOffset(spawnPosition, 5.0);
}
```

## Adaptive AI Behavior

### Rubber Band AI
```javascript
class AdaptiveBot extends Bot {
  update(gameState) {
    // Adjust difficulty based on player performance
    const playerRank = this.getPlayerRank(gameState);
    
    if (playerRank === 1) {
      // Player is winning - bots get more competitive
      this.traits.baseSpeed *= 1.1;
      this.traits.pathOptimization *= 1.2;
    } else if (playerRank > 5) {
      // Player is struggling - bots ease up
      this.traits.baseSpeed *= 0.9;
      this.traits.randomness *= 1.3; // More silly behavior
    }
    
    super.update(gameState);
  }
}
```

### Learning from Player
```javascript
class LearningBot extends Bot {
  constructor() {
    super();
    this.playerPathHistory = [];
    this.successfulMoves = [];
  }
  
  observePlayer(player) {
    // Remember where the player went
    this.playerPathHistory.push({
      position: player.position.clone(),
      velocity: player.velocity.clone(),
      timestamp: Date.now()
    });
    
    // If player is doing well, copy their moves later
    if (player.lapTime < this.bestLapTime) {
      this.successfulMoves = this.playerPathHistory.slice(-50);
    }
  }
  
  moveToward(target) {
    // Sometimes use player's successful path instead of direct route
    if (Math.random() < 0.3 && this.successfulMoves.length > 0) {
      const nearestMove = this.findNearestSuccessfulMove();
      if (nearestMove) {
        return this.moveToward(nearestMove.position);
      }
    }
    
    return super.moveToward(target);
  }
}
```

## Simple Bot Movement

### Basic Pathfinding
```javascript
class SimpleBot extends Bot {
  update(deltaTime) {
    // Simple goal: move toward the end portal
    const target = gameState.endPortal.position;
    const direction = target.clone().sub(this.position).normalize();
    
    // Add personality-based modifications
    this.applyPersonalityTraits(direction);
    
    // Apply movement
    const speed = this.traits.baseSpeed * this.baseSpeed;
    this.velocity.add(direction.multiplyScalar(speed * deltaTime));
    
    // Handle collisions
    this.handleCollisions();
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
  }
  
  applyPersonalityTraits(direction) {
    // Add randomness based on personality
    if (this.traits.randomness > Math.random()) {
      const randomOffset = new Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
      ).multiplyScalar(this.traits.randomness);
      
      direction.add(randomOffset).normalize();
    }
    
    // Occasionally do silly things
    if (this.traits.spinning > Math.random()) {
      this.angularVelocity += Math.random() * 10;
    }
  }
}
```

### Collision Avoidance
```javascript
handleCollisions() {
  const nearbyBots = this.findNearbyBots(3.0);
  const obstacles = this.findNearbyObstacles(2.0);
  
  nearbyBots.forEach(bot => {
    const avoidance = this.calculateAvoidanceForce(bot);
    this.velocity.add(avoidance.multiplyScalar(this.traits.collisionAvoidance));
  });
  
  obstacles.forEach(obstacle => {
    const avoidance = this.calculateAvoidanceForce(obstacle);
    this.velocity.add(avoidance.multiplyScalar(0.8));
  });
}
```

## Bot Visual Variety

### Procedural Bot Avatars
```javascript
class BotAvatarGenerator {
  static generateRandomAvatar() {
    const colors = {
      hair: this.randomHairColor(),
      skin: this.randomSkinTone(), 
      clothing: this.randomClothingColor()
    };
    
    const features = {
      height: 0.8 + Math.random() * 0.4,  // Variety in height
      build: Math.random() < 0.5 ? 'slim' : 'wide',
      style: this.randomStyle()
    };
    
    return this.createAvatarMesh(colors, features);
  }
  
  static randomStyle() {
    const styles = ['casual', 'sporty', 'formal', 'punk', 'retro'];
    return styles[Math.floor(Math.random() * styles.length)];
  }
}
```

## Bot Lifecycle Management

### Natural Bot Behavior
```javascript
class BotLifecycle {
  update(bot) {
    // Bots finish races and start new ones
    if (bot.hasFinishedRace()) {
      // Small celebration animation
      bot.playVictoryAnimation();
      
      // Restart after a brief delay
      setTimeout(() => {
        bot.resetToStart();
        bot.personality = this.evolvPersonality(bot.personality);
      }, 2000);
    }
    
    // Remove bots that get too far behind
    if (bot.isHopelesslyBehind()) {
      this.gracefullyRemoveBot(bot);
    }
  }
  
  gracefullyRemoveBot(bot) {
    // Bots "give up" and walk off the track
    bot.setGoal(this.findExitPoint());
    bot.walkSpeed = 0.5; // Slow disappointed walk
    
    setTimeout(() => {
      this.removeBot(bot.id);
    }, 5000);
  }
}
```

## Performance Optimization

### Efficient Bot Updates
```javascript
class BotUpdateManager {
  constructor() {
    this.updateGroups = [[], [], [], []]; // 4 groups for staggered updates
    this.currentGroup = 0;
  }
  
  update(deltaTime) {
    // Only update 1/4 of bots each frame for 60fps
    const botsToUpdate = this.updateGroups[this.currentGroup];
    
    botsToUpdate.forEach(bot => {
      bot.update(deltaTime * 4); // Compensate for lower update rate
    });
    
    this.currentGroup = (this.currentGroup + 1) % 4;
  }
}
```

## Hackability Features

### Easy Bot Customization
```javascript
// In a config file that your son can easily edit:
const BOT_CONFIG = {
  personalities: {
    // Easy to add new personalities!
    "racer": { speed: 1.1, aggression: 0.8, skill: 0.9 },
    "newbie": { speed: 0.7, aggression: 0.2, skill: 0.3 },
    "wild": { speed: 1.0, aggression: 1.0, randomness: 0.9 }
  },
  
  crowdSize: 8,           // Easy to adjust
  spawnRate: 2.0,         // Bots per second
  difficultyAdjustment: true  // Auto-adjust to player skill
};
```

### Debug Visualization
```javascript
// Press 'B' to see bot AI decision making
function drawBotDebugInfo(bot) {
  if (debugMode) {
    // Draw bot's current goal
    drawLine(bot.position, bot.currentGoal, 'yellow');
    
    // Show personality traits as floating text
    drawText(`${bot.personality.name}: Speed ${bot.traits.baseSpeed}`, 
             bot.position.clone().add(new Vector3(0, 2, 0)));
    
    // Show avoidance forces
    bot.avoidanceForces.forEach(force => {
      drawArrow(bot.position, force, 'red');
    });
  }
}
```

This bot system ensures DublinDash feels alive and engaging even in single-player mode, while being simple enough to understand and modify!