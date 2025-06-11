# 🏃‍♂️ DublinDash

A browser-based multiplayer racing game where players navigate personalized 3D avatars through procedurally generated worlds. Created as a love letter to celebrate creativity, connection, and the joy of shared digital experiences.

## 🎮 Game Concept

DublinDash combines the accessibility of .io games with innovative avatar creation and beautiful procedural worlds. Players take a selfie that becomes their unique 3D character, then race from portal to portal through crowded worlds filled with other players, navigating like traffic in a vibrant obstacle course.

## ✨ Key Features

- **📸 Privacy-First Avatar Creation**: Camera capture processed entirely client-side
- **🌍 Procedural World Generation**: 8 unique biomes with dynamic terrain
- **👥 Crowded Multiplayer**: 50 players per world with continuous joining
- **🏆 Fair Progression**: Skill-based leveling that unlocks new challenges
- **⚡ Instant Play**: No downloads, accounts, or complex tutorials

## 🎯 Vision

Create a joyful, accessible multiplayer game that celebrates individuality through personalized avatars while fostering a sense of shared journey and friendly competition in beautifully generated worlds.

## 📁 Project Structure

This project uses the BMAD Method (Breakthrough Method of Agile AI-driven Development) for structured planning and development.

```
dublindash/
├── docs/                      # BMAD planning documents
│   ├── project-brief.md       # Project vision and goals
│   ├── prd.md                # Product requirements
│   ├── architecture.md        # Technical architecture
│   ├── game-design-document.md # Game mechanics and systems
│   ├── tech-stack-analysis.md # Technology decisions
│   └── implementation-guide.md # 1-shot development guide
├── bmad-agent/               # BMAD Method framework
│   ├── templates/            # Document templates
│   ├── personas/             # AI agent personas
│   ├── tasks/               # Structured workflows
│   └── checklists/          # Quality assurance
└── apps/                    # Application code (to be created)
    ├── web/                 # Next.js frontend
    └── server/              # Colyseus game server
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with app router
- **React Three Fiber** - React renderer for Three.js
- **Three.js** - 3D graphics and WebGL
- **Tailwind CSS** - Utility-first styling
- **face-api.js** - Client-side face detection

### Backend  
- **Colyseus** - Multiplayer game server framework
- **Node.js** - JavaScript runtime
- **Redis** - Real-time state management
- **PostgreSQL** - Player data persistence

### Infrastructure
- **Cloudflare** - Edge delivery and DDoS protection
- **Kubernetes** - Container orchestration
- **Docker** - Containerization

## 🎮 Game Mechanics

### Core Gameplay
- **Movement**: Physics-based with momentum and collision
- **Terrain**: Hills slow you down, valleys speed you up
- **Obstacles**: Trees, rocks, and biome-specific challenges
- **Portals**: Start zones spawn continuously, race to end zones

### Biome Types
1. **Forest** - Trees, logs, clearings
2. **Desert** - Cacti, dunes, oasis spots
3. **Tundra** - Ice blocks, slippery surfaces
4. **Volcanic** - Lava rocks, geysers, extreme terrain
5. **Crystal Cave** - Glowing formations, tight spaces
6. **Floating Islands** - Platform jumping, big gaps
7. **Jungle** - Dense vegetation, temple ruins
8. **Cyber City** - Neon buildings, moving platforms

### Progression
- **Levels 1-10**: Based on race performance percentiles
- **Top 30%**: Level up, unlock harder worlds
- **Bottom 30%**: Level down, return to easier challenges
- **Middle 40%**: Maintain current level

## 🚀 Implementation Strategy

This project is designed for **1-shot implementation** using comprehensive planning documents that enable rapid development with AI assistance (Claude Code, Lovable, etc.).

### Phase 1: MVP Foundation
- Basic 3D scene and player movement
- Avatar generation system
- Simple multiplayer connection
- 3 biome types (Forest, Desert, Tundra)

### Phase 2: Core Features
- Full world generation system
- Physics and collision detection  
- Portal racing mechanics
- Progression system

### Phase 3: Polish & Scale
- Remaining 5 biomes
- Performance optimization
- Visual effects and polish
- Deployment automation

## 📊 Success Metrics

- **Engagement**: 10+ minute average sessions
- **Performance**: 60 FPS on mid-range devices
- **Multiplayer**: 50 concurrent players per world
- **Privacy**: Zero photo data storage/transmission
- **Accessibility**: < 3 seconds from URL to gameplay

## 🔒 Privacy & Safety

- **No Data Collection**: Photos processed entirely client-side
- **COPPA Compliant**: Safe for children, no personal data
- **Anonymous Play**: No accounts or personal information required
- **Safe Interactions**: No chat, only physics-based bumping

## 📈 Business Model (Future)

- **No Pay-to-Win**: Cosmetic enhancements only
- **Premium Content**: Visual biome variants
- **Server Priority**: Faster matchmaking
- **Ad-Free Experience**: Clean, family-friendly gameplay

## 🤝 Contributing

This project uses the BMAD Method for structured development. To contribute:

1. **Review Planning Docs**: Start with `docs/project-brief.md`
2. **Follow Architecture**: Reference `docs/architecture.md` 
3. **Use Implementation Guide**: See `docs/implementation-guide.md`
4. **Apply BMAD Personas**: Use appropriate perspective (Developer, Architect, etc.)

## 🎂 Special Dedication

This game is created as a love letter for a special birthday celebration - a gift that combines technology, creativity, and the joy of play. May it bring smiles, laughter, and wonderful shared moments.

---

*Built with ❤️ using the BMAD Method and designed for joy, connection, and celebration.*