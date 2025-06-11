import type { Player, BotPersonality, AvatarData } from '@shared/types.js'
import type { GameManager } from '../game/GameManager.js'

export class BotAI {
  private botPersonalities: BotPersonality[] = [
    {
      name: 'xX_ProGamer_Xx',
      style: 'tryhard',
      traits: {
        baseSpeed: 1.3,
        randomness: 0.1,
        aggression: 0.9,
        skill: 0.8,
        ragequit: 0.05,
        emoteSpam: 0.9
      },
      taunts: [
        'git gud scrub',
        'EZ Clap',
        'skill issue',
        'touch grass noob',
        '360 no scope incoming'
      ]
    },
    {
      name: 'Definitely_Not_AI',
      style: 'npc',
      traits: {
        baseSpeed: 1.0,
        randomness: 0.05,
        aggression: 0.3,
        skill: 0.95,
        pathfindingPerfect: 0.95,
        responsesDelayed: 0.8,
        glitches: 0.2
      },
      taunts: [
        'EXECUTING: fun.exe',
        'I AM DEFINITELY A HUMAN PLAYER',
        'My favorite human activity is also racing',
        'BEEP BOOP... I mean, hello!',
        'Error 404: Emotion not found'
      ]
    },
    {
      name: 'Dave_1982',
      style: 'boomer',
      traits: {
        baseSpeed: 0.7,
        randomness: 0.6,
        aggression: 0.2,
        skill: 0.4,
        getsLost: 0.7,
        asksQuestions: 0.8,
        dadJokes: 0.95
      },
      taunts: [
        'How do I turn this thing off?',
        'Back in my day, we ran uphill both ways',
        'Is this one of those TikToks?',
        'Why is everything so complicated?',
        'I need to ask my grandson about this'
      ]
    },
    {
      name: 'Agent_of_Chaos',
      style: 'chaos',
      traits: {
        baseSpeed: 1.1,
        randomness: 0.95,
        aggression: 0.8,
        skill: 0.6,
        physicsBreaking: 0.3,
        memeReferences: 0.9,
        conspiracy: 0.7
      },
      taunts: [
        'Reality is a simulation anyway',
        'The shortest path is actually a lie',
        'I reject your physics and substitute my own',
        'Chaos is a ladder',
        'Why follow the path when you can make your own?'
      ]
    }
  ]
  
  private activeBots: Map<string, Player & { personality: BotPersonality }> = new Map()
  
  ensureBots(gameManager: GameManager, targetBotCount: number): void {
    const currentBotCount = this.activeBots.size
    
    if (currentBotCount < targetBotCount) {
      // Add bots
      const botsToAdd = targetBotCount - currentBotCount
      for (let i = 0; i < botsToAdd; i++) {
        this.spawnBot(gameManager)
      }
    } else if (currentBotCount > targetBotCount) {
      // Remove excess bots (gracefully)
      const botsToRemove = currentBotCount - targetBotCount
      let removed = 0
      
      for (const [botId, bot] of this.activeBots) {
        if (removed >= botsToRemove) break
        
        // Remove bot that's furthest behind
        if (bot.lapProgress < 0.8) {
          this.removeBot(gameManager, botId)
          removed++
        }
      }
    }
  }
  
  private spawnBot(gameManager: GameManager): void {
    const personality = this.botPersonalities[
      Math.floor(Math.random() * this.botPersonalities.length)
    ]
    
    const botId = `bot-${personality.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`
    
    const bot: Player & { personality: BotPersonality } = {
      id: botId,
      position: { x: (Math.random() - 0.5) * 8, y: 0, z: -12 + Math.random() * 4 },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: 0,
      avatar: this.generateBotAvatar(personality),
      lapProgress: 0,
      finished: false,
      name: personality.name,
      personality
    }
    
    this.activeBots.set(botId, bot)
    
    // Add to game manager (treating as player)
    gameManager.addPlayer(botId, bot.avatar, bot.name)
    
    console.log(`🤖 Spawned bot: ${personality.name} (${personality.style})`)
  }
  
  private removeBot(gameManager: GameManager, botId: string): void {
    const bot = this.activeBots.get(botId)
    if (bot) {
      this.activeBots.delete(botId)
      gameManager.removePlayer(botId)
      console.log(`👋 Removed bot: ${bot.name}`)
    }
  }
  
  updateBots(gameManager: GameManager): void {
    this.activeBots.forEach((bot, botId) => {
      this.updateBotAI(gameManager, bot)
    })
  }
  
  private updateBotAI(gameManager: GameManager, bot: Player & { personality: BotPersonality }): void {
    const personality = bot.personality
    const gameState = gameManager.getGameState()
    
    if (!gameState.level) return
    
    // Get target (end portal)
    const target = gameState.level.geometry.portals.end
    
    // Calculate basic direction to target
    let dx = target.x - bot.position.x
    let dz = target.z - bot.position.z
    const distance = Math.sqrt(dx * dx + dz * dz)
    
    if (distance > 1) {
      // Normalize direction
      dx /= distance
      dz /= distance
      
      // Apply personality-based modifications
      this.applyPersonalityBehavior(bot, { x: dx, y: 0, z: dz })
      
      // Update bot through game manager
      const movement = {
        x: bot.velocity.x * 0.1,
        y: 0,
        z: bot.velocity.z * 0.1
      }
      
      gameManager.updatePlayerMovement(bot.id, movement)
    }
    
    // Personality-specific behaviors
    this.executePersonalityBehaviors(bot)
  }
  
  private applyPersonalityBehavior(
    bot: Player & { personality: BotPersonality }, 
    direction: { x: number; y: number; z: number }
  ): void {
    const p = bot.personality.traits
    
    // Add randomness
    if (Math.random() < p.randomness) {
      const randomAngle = Math.random() * Math.PI * 2
      const randomMagnitude = p.randomness * 0.5
      direction.x += Math.cos(randomAngle) * randomMagnitude
      direction.z += Math.sin(randomAngle) * randomMagnitude
    }
    
    // Apply speed modifier
    const speed = p.baseSpeed * 5 // Base speed multiplier
    bot.velocity.x = direction.x * speed
    bot.velocity.z = direction.z * speed
    
    // Personality-specific behaviors
    switch (bot.personality.style) {
      case 'tryhard':
        // Sometimes goes for risky shortcuts
        if (Math.random() < 0.1) {
          bot.velocity.x *= 1.5
          bot.velocity.z *= 1.5
        }
        break
        
      case 'chaos':
        // Chaotic behavior - sometimes just does random things
        if (Math.random() < 0.2) {
          bot.velocity.x = (Math.random() - 0.5) * 10
          bot.velocity.z = (Math.random() - 0.5) * 10
        }
        break
        
      case 'boomer':
        // Sometimes stops and looks around confused
        if (Math.random() < 0.1) {
          bot.velocity.x *= 0.1
          bot.velocity.z *= 0.1
        }
        break
        
      case 'npc':
        // Perfect pathfinding but slightly delayed reactions
        // (Already implemented in base behavior)
        break
    }
  }
  
  private executePersonalityBehaviors(bot: Player & { personality: BotPersonality }): void {
    const p = bot.personality.traits
    
    // Rage quit behavior (tryhard)
    if (p.ragequit && Math.random() < p.ragequit * 0.001) {
      // Bot stops moving for a few seconds
      bot.velocity.x = 0
      bot.velocity.z = 0
      console.log(`😡 ${bot.name} is having a rage quit moment`)
    }
    
    // Glitch behavior (NPC)
    if (p.glitches && Math.random() < p.glitches * 0.001) {
      // Bot does something weird
      bot.velocity.x = 0
      bot.velocity.z = 0
      console.log(`🔧 ${bot.name}.exe has encountered an error`)
    }
    
    // Gets lost behavior (boomer)
    if (p.getsLost && Math.random() < p.getsLost * 0.005) {
      // Bot goes in wrong direction
      bot.velocity.x *= -0.5
      bot.velocity.z *= -0.5
      console.log(`🤔 ${bot.name} is looking for the manager`)
    }
  }
  
  private generateBotAvatar(personality: BotPersonality): AvatarData {
    // Generate avatar based on personality
    const styleColors = {
      tryhard: {
        hair: ['#000000', '#FF0000', '#00FF00'],
        skin: ['#FFDBAC', '#F1C27D', '#E0AC69'],
        clothing: ['#000000', '#FF0000', '#333333']
      },
      npc: {
        hair: ['#8B4513', '#654321'],
        skin: ['#FFDBAC'],
        clothing: ['#4169E1', '#32CD32', '#FF6347']
      },
      boomer: {
        hair: ['#808080', '#A0A0A0', '#696969'],
        skin: ['#FFDBAC', '#F1C27D'],
        clothing: ['#8B4513', '#006400', '#4B0082']
      },
      chaos: {
        hair: ['#FF00FF', '#00FFFF', '#FF1493', '#7FFF00'],
        skin: ['#FFDBAC', '#F1C27D', '#E0AC69'],
        clothing: ['#FF00FF', '#00FFFF', '#FF4500', '#9400D3']
      }
    }
    
    const colors = styleColors[personality.style] || styleColors.npc
    
    return {
      id: `bot-avatar-${Date.now()}`,
      colors: {
        hair: colors.hair[Math.floor(Math.random() * colors.hair.length)],
        skin: colors.skin[Math.floor(Math.random() * colors.skin.length)],
        clothing: colors.clothing[Math.floor(Math.random() * colors.clothing.length)]
      },
      style: 'blocky'
    }
  }
  
  getBotCount(): number {
    return this.activeBots.size
  }
  
  // Debug function to spawn specific bot type
  spawnSpecificBot(gameManager: GameManager, personalityName: string): boolean {
    const personality = this.botPersonalities.find(p => 
      p.name.toLowerCase().includes(personalityName.toLowerCase())
    )
    
    if (personality) {
      this.spawnBot(gameManager)
      return true
    }
    
    return false
  }
  
  // Fun function to make all bots go chaotic
  enableChaosMode(): void {
    this.activeBots.forEach(bot => {
      bot.personality.traits.randomness = 0.95
      bot.personality.traits.baseSpeed = 1.5
      console.log(`🌪️ ${bot.name} has entered CHAOS MODE`)
    })
  }
}