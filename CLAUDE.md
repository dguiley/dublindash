# CLAUDE.md - DublinDash Development Guide

## Project Context

**DublinDash** is a multiplayer browser racing game built as a 16th birthday gift. Players navigate personalized avatars through AI-generated worlds with real-time multiplayer and bot AI.

## Development Mode vs Planning Mode

### 🚀 **Development Mode** (Default for coding tasks)
When doing implementation work, focus on:
- Follow coding standards in `CODING-STANDARDS.md`
- TypeScript everywhere with strict typing
- Vue 3 Composition API patterns
- Performance-first game development
- Run-and-gun iteration speed

### 📋 **Planning Mode** (When explicitly requested)
For strategic planning, use BMAD Method:
- Reference `bmad-agent/` for templates and personas
- Use formal documentation patterns
- Apply phase gates and checklists
- Switch personas explicitly: `[Developer]`, `[Architect]`, etc.

## Quick Architecture Reference

### Tech Stack
- **Frontend**: Vue 3 + TypeScript + TresJS (Three.js) + Pinia
- **Backend**: Node.js + TypeScript + Fastify + Socket.IO
- **Physics**: Rapier WASM (when added)
- **AI**: OpenAI API for level generation (future)

### Key Files
```
apps/
├── frontend/src/
│   ├── stores/          # Pinia stores (game, multiplayer)
│   ├── components/      # Vue components
│   └── composables/     # Reusable logic
└── backend/src/
    ├── game/           # Game logic & state
    ├── bot-ai/         # Bot personalities
    └── level-gen/      # AI level generation
```

### Game Architecture
- **Client**: Handles rendering, input, UI
- **Server**: Authoritative game state, bot AI, physics
- **Sync**: WebSocket real-time multiplayer
- **Bots**: 4 personalities auto-spawn for crowd feel

## Development Workflow

### For Code Changes:
1. **Identify**: Which component needs changes
2. **Implement**: Follow TypeScript/Vue patterns
3. **Test**: Both servers running (frontend:5173, backend:3001)
4. **Iterate**: Hot reload for fast feedback

### For Planning:
1. **Specify BMAD persona**: `[Architect]`, `[Designer]`, etc.
2. **Use templates**: Reference `bmad-agent/templates/`
3. **Document**: Update relevant docs in `docs/`

## Coding Standards Summary

### TypeScript
```typescript
// Good: Optional with undefined
interface Player {
  id: string
  avatar?: AvatarData  // not AvatarData | null
}

// Good: Type guards
function isPlayer(obj: unknown): obj is Player {
  return typeof obj === 'object' && obj !== null && 'id' in obj
}
```

### Vue Components
```vue
<script setup lang="ts">
// Good: Strict typing
interface Props {
  player: Player
  isLocal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLocal: false
})

const emit = defineEmits<{
  'player-click': [player: Player]
}>()
</script>

<template>
  <!-- template -->
</template>

<route lang="yaml">
meta:
  title: Component Name
</route>
```

## Game-Specific Patterns

### Performance
- 60 FPS target (16ms budget)
- No object creation in game loop
- Use object pooling for bullets/particles

### Multiplayer
- Client prediction for local player
- Server authority for all validation
- Smooth interpolation for remote players

### State Management
```typescript
// Game store pattern
const gameStore = useGameStore()
const multiplayerStore = useMultiplayerStore()

// Local state for UI
const showDialog = ref(false)
```

## Common Tasks

### Add New Feature
1. Design interface/types in `packages/shared/types.ts`
2. Implement client logic in appropriate component
3. Add server handling if needed
4. Test with multiple players

### Debug Multiplayer
1. Check browser console for client errors
2. Check server logs for backend issues
3. Use debug mode (Konami code) for game state
4. Verify WebSocket connection in dev tools

### Bot Behavior
- Modify `apps/server/src/bot-ai/BotAI.ts`
- 4 personalities: tryhard, npc, boomer, chaos
- Easy to add new personalities

## Error Resolution
1. **Type errors**: Fix TypeScript strict mode issues first
2. **Runtime errors**: Check both client and server consoles
3. **Multiplayer sync**: Verify message format matches types
4. **Performance**: Use browser dev tools performance tab

## Project Files Reference

### Essential Files
- `CODING-STANDARDS.md` - Development patterns
- `apps/frontend/src/stores/game.ts` - Main game state
- `apps/backend/src/index.ts` - Backend entry point
- `packages/shared/types.ts` - Shared TypeScript types

### Documentation
- `docs/` - Planning documents (use when doing BMAD planning)
- `README.md` - Project overview

## Development Commands
```bash
# Start development
cd apps/frontend && npm run dev  # Frontend (port 5173)
cd apps/backend && npm run dev  # Backend (port 3001)

# Type checking
npm run type-check

# Build for production
npm run build
```

## Memories

- route elements should always be json format

---

**For quick development**:  Claude Code is great.
**For strategic planning**: Choose BMAD methodology.  Pick persona based on task and iterate on plan.
```