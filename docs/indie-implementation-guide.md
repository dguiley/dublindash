# DublinDash Indie Implementation Guide

## 🎯 Goal: Build a Fun, Hackable Game in One Session

This guide creates a **simple, educational browser game** perfect for father-son coding adventures. No enterprise complexity - just pure coding fun!

## 📁 Project Structure (Keep It Simple!)

```
dublindash/
├── client/
│   ├── index.html          # Main game page
│   ├── style.css           # Simple styling
│   ├── game.js             # Main game logic
│   ├── avatar.js           # Camera avatar system
│   ├── level-gen.js        # AI level generation
│   └── assets/
│       ├── models/         # Simple 3D models
│       └── textures/       # Basic textures
├── server/
│   ├── server.js           # Single server file!
│   ├── bot-ai.js           # Bot player logic
│   └── level-cache/        # Generated levels
└── package.json            # Minimal dependencies
```

## 🚀 Quick Start Setup

### 1. Initialize Project
```bash
mkdir dublindash
cd dublindash

# Frontend (no build process!)
mkdir client client/assets client/assets/models client/assets/textures

# Backend
mkdir server server/level-cache

npm init -y
```

### 2. Install Minimal Dependencies
```bash
# Server dependencies
npm install express ws openai canvas

# Client dependencies (CDN links in HTML)
# - Three.js: https://cdnjs.cloudflare.com/ajax/libs/three.js/r150/three.min.js
# - face-api.js: https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js
```

## 🎮 Client Implementation

### 3. Main HTML (client/index.html)
```html
<!DOCTYPE html>
<html>
<head>
    <title>DublinDash</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r150/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
</head>
<body>
    <!-- Avatar Creation -->
    <div id="avatar-screen" class="screen">
        <h1>Create Your Character</h1>
        <video id="camera" autoplay muted></video>
        <button id="take-photo">Take Selfie!</button>
        <canvas id="avatar-preview"></canvas>
        <button id="start-game">Start Racing!</button>
    </div>
    
    <!-- Game Screen -->
    <div id="game-screen" class="screen hidden">
        <div id="hud">
            <div id="timer">0:00</div>
            <div id="players">Players: 1/8</div>
            <div id="position">Position: 1st</div>
        </div>
        <canvas id="game-canvas"></canvas>
    </div>
    
    <!-- Scripts -->
    <script src="avatar.js"></script>
    <script src="level-gen.js"></script>
    <script src="game.js"></script>
</body>
</html>
```

### 4. Simple Game Engine (client/game.js)
```javascript
class DublinDashGame {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
        
        this.player = null;
        this.bots = new Map();
        this.level = null;
        this.ws = null;
        
        this.init();
    }
    
    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Setup camera position (top-down angled view)
        this.camera.position.set(0, 15, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Setup lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Connect to server
        this.connectToServer();
        
        // Start game loop
        this.gameLoop();
    }
    
    connectToServer() {
        // Try local server first, fallback to any deployed server
        const serverUrl = 'ws://localhost:3001';
        this.ws = new WebSocket(serverUrl);
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        };
        
        this.ws.onopen = () => {
            console.log('Connected to game server!');
            // Send player avatar data
            this.ws.send(JSON.stringify({
                type: 'join',
                avatar: window.playerAvatar
            }));
        };
    }
    
    handleServerMessage(data) {
        switch(data.type) {
            case 'gameState':
                this.updateGameState(data.state);
                break;
            case 'newLevel':
                this.loadLevel(data.level);
                break;
            case 'playerJoined':
                this.addPlayer(data.player);
                break;
        }
    }
    
    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        
        this.update();
        this.render();
    }
    
    update() {
        // Update player movement
        if (this.player) {
            this.handleInput();
            this.updatePlayer();
        }
        
        // Update bots (they're just visual - server controls them)
        this.bots.forEach(bot => bot.update());
        
        // Update camera to follow player
        if (this.player) {
            this.updateCamera();
        }
    }
    
    handleInput() {
        const keys = this.getKeys();
        const movement = new THREE.Vector3();
        
        if (keys.w || keys.ArrowUp) movement.z -= 1;
        if (keys.s || keys.ArrowDown) movement.z += 1;
        if (keys.a || keys.ArrowLeft) movement.x -= 1;
        if (keys.d || keys.ArrowRight) movement.x += 1;
        
        if (movement.length() > 0) {
            movement.normalize();
            
            // Send to server
            this.ws.send(JSON.stringify({
                type: 'move',
                direction: movement
            }));
        }
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

// Simple keyboard handling
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Start the game when avatar is ready
window.startGame = () => {
    document.getElementById('avatar-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    window.game = new DublinDashGame();
};
```

### 5. Avatar System (client/avatar.js)
```javascript
class AvatarCreator {
    constructor() {
        this.video = document.getElementById('camera');
        this.canvas = document.getElementById('avatar-preview');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupCamera();
        this.setupControls();
    }
    
    async setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            this.video.srcObject = stream;
        } catch (err) {
            console.log('Camera not available, using random avatar');
            this.generateRandomAvatar();
        }
    }
    
    setupControls() {
        document.getElementById('take-photo').onclick = () => {
            this.captureAndProcess();
        };
        
        document.getElementById('start-game').onclick = () => {
            window.startGame();
        };
    }
    
    captureAndProcess() {
        // Capture photo from video
        this.canvas.width = 640;
        this.canvas.height = 480;
        this.ctx.drawImage(this.video, 0, 0);
        
        // Process into simple avatar data
        const imageData = this.ctx.getImageData(0, 0, 640, 480);
        const avatarData = this.extractSimpleFeatures(imageData);
        
        // Create 3D representation
        window.playerAvatar = avatarData;
        this.displayAvatarPreview(avatarData);
        
        // Stop camera
        const stream = this.video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
    
    extractSimpleFeatures(imageData) {
        // Super simple color sampling (no complex face detection needed)
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Sample key regions
        const hairColor = this.sampleRegion(data, width, 0, 0, width, height * 0.3);
        const skinColor = this.sampleRegion(data, width, width * 0.3, height * 0.3, width * 0.7, height * 0.7);
        const clothingColor = this.sampleRegion(data, width, 0, height * 0.7, width, height);
        
        return {
            hair: hairColor,
            skin: skinColor,
            clothing: clothingColor,
            style: 'blocky' // Simple blocky style
        };
    }
    
    sampleRegion(data, width, x1, y1, x2, y2) {
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let y = Math.floor(y1); y < Math.floor(y2); y += 10) {
            for (let x = Math.floor(x1); x < Math.floor(x2); x += 10) {
                const i = (y * width + x) * 4;
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
        }
        
        return {
            r: Math.floor(r / count),
            g: Math.floor(g / count),
            b: Math.floor(b / count)
        };
    }
    
    generateRandomAvatar() {
        // Fallback for no camera
        window.playerAvatar = {
            hair: { r: 100 + Math.random() * 100, g: 50, b: 0 },
            skin: { r: 200 + Math.random() * 55, g: 150 + Math.random() * 55, b: 100 + Math.random() * 55 },
            clothing: { r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 },
            style: 'blocky'
        };
        
        this.displayAvatarPreview(window.playerAvatar);
    }
    
    displayAvatarPreview(avatar) {
        // Draw simple preview
        this.ctx.fillStyle = `rgb(${avatar.skin.r}, ${avatar.skin.g}, ${avatar.skin.b})`;
        this.ctx.fillRect(250, 150, 140, 200); // Body
        
        this.ctx.fillStyle = `rgb(${avatar.hair.r}, ${avatar.hair.g}, ${avatar.hair.b})`;
        this.ctx.fillRect(270, 100, 100, 80); // Head
        
        this.ctx.fillStyle = `rgb(${avatar.clothing.r}, ${avatar.clothing.g}, ${avatar.clothing.b})`;
        this.ctx.fillRect(260, 200, 120, 150); // Clothing
        
        document.getElementById('start-game').style.display = 'block';
    }
}

// Initialize avatar creator
new AvatarCreator();
```

## 🖥️ Server Implementation

### 6. Single Server File (server/server.js)
```javascript
const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const BotAI = require('./bot-ai');

class GameServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        
        this.players = new Map();
        this.bots = new Map();
        this.gameState = {
            level: null,
            startTime: Date.now()
        };
        
        this.botAI = new BotAI();
        this.setupServer();
        this.startGameLoop();
    }
    
    setupServer() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../client')));
        
        // Create HTTP server
        this.server = this.app.listen(this.port, () => {
            console.log(`🎮 DublinDash server running on port ${this.port}`);
        });
        
        // Setup WebSocket server
        this.wss = new WebSocket.Server({ server: this.server });
        this.wss.on('connection', (ws) => this.handleConnection(ws));
        
        // Generate initial level
        this.generateNewLevel();
        
        // Spawn some bots
        this.spawnInitialBots();
    }
    
    handleConnection(ws) {
        console.log('🔌 Player connected');
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handlePlayerMessage(ws, message);
            } catch (err) {
                console.error('Invalid message:', err);
            }
        });
        
        ws.on('close', () => {
            this.removePlayer(ws);
        });
        
        // Send current game state
        ws.send(JSON.stringify({
            type: 'gameState',
            state: this.gameState
        }));
    }
    
    handlePlayerMessage(ws, message) {
        switch (message.type) {
            case 'join':
                this.addPlayer(ws, message.avatar);
                break;
            case 'move':
                this.updatePlayerMovement(ws, message.direction);
                break;
        }
    }
    
    addPlayer(ws, avatar) {
        const player = {
            id: this.generateId(),
            ws: ws,
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            avatar: avatar,
            lapTime: null,
            finished: false
        };
        
        this.players.set(ws, player);
        
        // Broadcast to all players
        this.broadcast({
            type: 'playerJoined',
            player: this.sanitizePlayer(player)
        });
    }
    
    updatePlayerMovement(ws, direction) {
        const player = this.players.get(ws);
        if (!player) return;
        
        // Apply movement (simple physics)
        const speed = 5.0;
        player.velocity.x = direction.x * speed;
        player.velocity.z = direction.z * speed;
    }
    
    startGameLoop() {
        setInterval(() => {
            this.updateGame();
        }, 1000 / 20); // 20 FPS
    }
    
    updateGame() {
        // Update all players
        this.players.forEach(player => {
            this.updatePlayerPhysics(player);
        });
        
        // Update bots
        this.botAI.updateBots(this.bots, this.gameState);
        
        // Broadcast game state
        this.broadcastGameState();
    }
    
    updatePlayerPhysics(player) {
        // Simple physics update
        player.position.x += player.velocity.x * 0.05;
        player.position.z += player.velocity.z * 0.05;
        
        // Apply friction
        player.velocity.x *= 0.9;
        player.velocity.z *= 0.9;
        
        // Check if finished
        if (!player.finished && this.checkIfFinished(player)) {
            player.finished = true;
            player.lapTime = (Date.now() - this.gameState.startTime) / 1000;
        }
    }
    
    spawnInitialBots() {
        // Create 6 bots to make the world feel alive
        for (let i = 0; i < 6; i++) {
            const bot = this.botAI.createBot();
            this.bots.set(bot.id, bot);
        }
    }
    
    generateNewLevel() {
        // For now, simple hard-coded level
        // Later: integrate with GenAI system
        this.gameState.level = {
            biome: 'forest',
            obstacles: [
                { type: 'tree', position: { x: 5, y: 0, z: 5 } },
                { type: 'rock', position: { x: -3, y: 0, z: 8 } },
                { type: 'tree', position: { x: 10, y: 0, z: -2 } }
            ],
            startPortal: { x: 0, y: 0, z: -10 },
            endPortal: { x: 0, y: 0, z: 20 }
        };
    }
    
    broadcast(message) {
        this.players.forEach(player => {
            if (player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify(message));
            }
        });
    }
    
    broadcastGameState() {
        const state = {
            type: 'gameState',
            players: Array.from(this.players.values()).map(p => this.sanitizePlayer(p)),
            bots: Array.from(this.bots.values()),
            level: this.gameState.level
        };
        
        this.broadcast(state);
    }
    
    sanitizePlayer(player) {
        return {
            id: player.id,
            position: player.position,
            velocity: player.velocity,
            avatar: player.avatar,
            finished: player.finished,
            lapTime: player.lapTime
        };
    }
    
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

// Start the server
new GameServer();
```

### 7. Simple Bot AI (server/bot-ai.js)
```javascript
class BotAI {
    constructor() {
        this.personalities = [
            { name: 'Speedy', speed: 1.2, randomness: 0.1 },
            { name: 'Wanderer', speed: 0.8, randomness: 0.8 },
            { name: 'Steady', speed: 1.0, randomness: 0.3 },
            { name: 'Wild', speed: 1.1, randomness: 0.9 }
        ];
    }
    
    createBot() {
        const personality = this.personalities[Math.floor(Math.random() * this.personalities.length)];
        
        return {
            id: 'bot_' + Math.random().toString(36).substr(2, 9),
            position: { x: Math.random() * 10 - 5, y: 0, z: -8 },
            velocity: { x: 0, y: 0, z: 0 },
            personality: personality,
            target: null,
            avatar: this.generateRandomAvatar()
        };
    }
    
    updateBots(bots, gameState) {
        bots.forEach(bot => {
            this.updateBot(bot, gameState);
        });
    }
    
    updateBot(bot, gameState) {
        // Simple AI: move toward end portal with some randomness
        const target = gameState.level.endPortal;
        const dx = target.x - bot.position.x;
        const dz = target.z - bot.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance > 1) {
            // Normalize direction
            const dirX = dx / distance;
            const dirZ = dz / distance;
            
            // Add randomness based on personality
            const randomX = (Math.random() - 0.5) * bot.personality.randomness;
            const randomZ = (Math.random() - 0.5) * bot.personality.randomness;
            
            // Update velocity
            const speed = bot.personality.speed * 3;
            bot.velocity.x = (dirX + randomX) * speed;
            bot.velocity.z = (dirZ + randomZ) * speed;
        }
        
        // Update position
        bot.position.x += bot.velocity.x * 0.05;
        bot.position.z += bot.velocity.z * 0.05;
        
        // Apply friction
        bot.velocity.x *= 0.85;
        bot.velocity.z *= 0.85;
    }
    
    generateRandomAvatar() {
        return {
            hair: { 
                r: Math.floor(Math.random() * 255), 
                g: Math.floor(Math.random() * 255), 
                b: Math.floor(Math.random() * 255) 
            },
            skin: { 
                r: 180 + Math.floor(Math.random() * 75), 
                g: 140 + Math.floor(Math.random() * 75), 
                b: 100 + Math.floor(Math.random() * 75) 
            },
            clothing: { 
                r: Math.floor(Math.random() * 255), 
                g: Math.floor(Math.random() * 255), 
                b: Math.floor(Math.random() * 255) 
            },
            style: 'blocky'
        };
    }
}

module.exports = BotAI;
```

## 🚀 Quick Test Run

### 8. Start Everything
```bash
# Start server
cd server
node server.js

# Open browser to http://localhost:3001
# Take a selfie or skip to random avatar
# Start racing!
```

## 🎨 Easy Customization Ideas

### For Your Son to Experiment With:

1. **Bot Personalities** (server/bot-ai.js):
```javascript
// Add new bot types
{ name: 'Ninja', speed: 1.5, randomness: 0.05, stealth: true },
{ name: 'Dancer', speed: 0.9, randomness: 0.7, spinning: true }
```

2. **Avatar Styles** (client/avatar.js):
```javascript
// Try different avatar shapes
// Change colors, add accessories, make them taller/shorter
```

3. **Game Physics** (client/game.js):
```javascript
// Adjust speed, jumping, collision
const playerSpeed = 10; // Make it faster!
const jumpPower = 15;   // Higher jumps!
```

4. **Level Themes** (server/server.js):
```javascript
// Add different obstacle types and layouts
{ type: 'bounce-pad', position: { x: 0, y: 0, z: 5 } },
{ type: 'teleporter', position: { x: 8, y: 0, z: 10 } }
```

## 🔮 Next Steps (When Ready)

1. **Add GenAI Level Generation** using the design in `genai-level-system.md`
2. **Improve Graphics** with better models and textures  
3. **Add Sound Effects** for jumps, collisions, victory
4. **Create More Biomes** with unique obstacles
5. **Add Power-ups** for temporary speed boosts
6. **Implement Leaderboards** with local storage

This implementation gives you a **fully playable game** that's perfect for learning, experimenting, and having fun together! 🎮✨