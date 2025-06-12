# DublinDash Coding Standards

## Frontend Conventions

### 1. TypeScript Conventions
- **Prefer `undefined` over `null`**: Use `user?: User` not `user: User | null`
- **No implicit `any`**: Always specify types explicitly
- **Interfaces vs Classes**: Use interfaces for data shapes, classes for entities with behavior
- **Strict types**: Enable strict mode, no type assertions without good reason

### 2. Component Patterns
- **Component ordering**: script → template → style → route (for pages)
- **Props immutability**: Never mutate props directly - use emits or local state
- **Page meta**: Use `<route lang="json">` blocks with meta.title for pages
- **Composables**: Extract reusable logic into composables (use* pattern)

### 3. Vue 3 Specific
- **Composition API**: Prefer over Options API for new components
- **Script setup**: Use `<script setup lang="ts">` for cleaner syntax
- **Reactive refs**: Use `ref()` for primitives, `reactive()` for objects
- **Computed**: Always use `computed()` for derived state

### 4. Naming Conventions
- **Components**: PascalCase (e.g., `GameCanvas.vue`)
- **Files**: kebab-case for non-components (e.g., `game-store.ts`)
- **Functions**: camelCase (e.g., `handlePlayerMove`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PLAYERS`)

### 5. Error Handling
- **No silent failures**: Always handle errors appropriately
- **Type guards**: Use type guards for runtime type checking
- **Graceful degradation**: Handle missing data gracefully

## Backend Conventions

### 1. TypeScript Patterns
- **Interfaces first**: Define interfaces before implementation
- **Return types**: Always specify return types for public methods
- **Error types**: Use typed errors, not generic Error objects

### 2. API Design
- **RESTful**: Follow REST conventions for HTTP endpoints
- **Socket events**: Use typed events with clear naming
- **Validation**: Validate all inputs at API boundaries

### 3. Code Organization
- **Single responsibility**: One class/function per responsibility
- **Dependency injection**: Use constructor injection for dependencies
- **Pure functions**: Prefer pure functions where possible

## Game-Specific Patterns

### 1. Performance
- **60 FPS target**: Keep game loop under 16ms
- **Memory management**: Avoid creating objects in game loop
- **Batch operations**: Group similar operations together

### 2. State Management
- **Pinia stores**: Use Pinia for global state
- **Local state**: Use local state for component-specific data
- **Immutable updates**: Don't mutate state directly

### 3. Multiplayer
- **Client prediction**: Apply movements locally, sync with server
- **Authoritative server**: Server has final say on game state
- **Graceful disconnection**: Handle network issues smoothly

## Examples

### Good TypeScript:
```typescript
interface Player {
  id: string
  position: Vector3
  avatar?: AvatarData  // Optional, not null
}

// Type guard
function isPlayer(obj: unknown): obj is Player {
  return typeof obj === 'object' && obj !== null && 'id' in obj
}
```

### Good Vue Component:
```vue
<script setup lang="ts">
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
  <div @click="emit('player-click', props.player)">
    <!-- template -->
  </div>
</template>

<style scoped>
/* component styles */
</style>

<route lang="json">
{
  "meta": {
    "title": "Component Page"
  }
}
</route>
```