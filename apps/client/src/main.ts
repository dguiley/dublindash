import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import IndexPage from './pages/index.vue'
import GamePage from './pages/game.vue'
import './style.css'

const routes = [
  { path: '/', component: IndexPage, meta: { title: 'DublinDash - Racing Game' } },
  { path: '/game', component: GamePage, meta: { title: 'DublinDash - Racing' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Add some fun console messages for developers
console.log('%c🎮 DublinDash Loaded!', 'color: #00ff00; font-size: 20px; font-weight: bold;')
console.log('%cPress Konami Code (↑↑↓↓←→←→BA) for debug mode!', 'color: #ffff00; font-size: 12px;')
console.log('%cMade with ❤️ for a 16th birthday!', 'color: #ff69b4; font-size: 12px;')