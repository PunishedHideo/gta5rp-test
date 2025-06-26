<template>
  <div class="gameboard-page">
    <div class="board-container">
      <h2>Game Board</h2>
      <div class="board">
        <div
          v-for="row in 10"
          :key="row"
          class="board-row"
        >
          <div
            v-for="col in 10"
            :key="col"
            class="cell"
            :class=" [
              cellClass(row-1, col-1),
              hoveredCell.x === row-1 && hoveredCell.y === col-1 ? 'cell-hover' : ''
            ]"
            @click="tryMove(row-1, col-1)"
            @mouseenter="hoveredCell = { x: row-1, y: col-1 }"
            @mouseleave="hoveredCell = { x: -1, y: -1 }"
          >
            <template v-if="playerAt(row-1, col-1)">
              <span
                class="player-avatar"
                :style="{ backgroundColor: playerColor(playerAt(row-1, col-1)!.name) }"
                :title="playerAt(row-1, col-1)!.name"
              >
                {{ playerAt(row-1, col-1)!.name[0].toUpperCase() }}
              </span>
            </template>
          </div>
        </div>
      </div>
      <div class="move-info">
        <span v-if="moveCooldown > 0">
          Next move in: {{ moveCooldown }}s
        </span>
        <span v-else>
          Click a cell to move (max 2 cells per turn)
        </span>
      </div>
    </div>
    <div class="sidebar">
      <h3>Online Players</h3>
      <ul>
        <li
          v-for="p in players"
          :key="p.id"
          :class="{ you: p.id === myId }"
        >
          <span
            class="player-avatar"
            :style="{ backgroundColor: playerColor(p.name) }"
            :title="p.name"
          >
            {{ p.name[0].toUpperCase() }}
          </span>
          {{ p.name }} <span v-if="p.id === myId">(You)</span>
        </li>
      </ul>
      <button @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Player type
 */
type Player = {
  id: string
  name: string
  x: number
  y: number
}

const router = useRouter()
const players = ref<Player[]>([])
const myId = ref<string>('') // Set after join
const myPlayer = computed(() => players.value.find(p => p.id === myId.value))
const moveCooldown = ref(0)
let ws: WebSocket | null = null
let cooldownTimer: any = null

const hoveredCell = ref({ x: -1, y: -1 })

function playerAt(x: number, y: number) {
  return players.value.find(p => p.x === x && p.y === y)
}

function cellClass(x: number, y: number) {
  const p = playerAt(x, y)
  if (p && p.id === myId.value) return 'cell you'
  if (p) return 'cell occupied'
  return 'cell'
}

// Generate a unique color for each player based on their name
function playerColor(name: string) {
  // Simple hash to color
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 55%)`
}

function tryMove(x: number, y: number) {
  if (moveCooldown.value > 0) return
  if (!myPlayer.value) return
  // Allow diagonal: Chebyshev distance (max(dx, dy))
  const dx = Math.abs(myPlayer.value.x - x)
  const dy = Math.abs(myPlayer.value.y - y)
  const dist = Math.max(dx, dy)
  if (dist === 0 || dist > 2) return
  // Send move to backend via WebSocket
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type: 'move', x, y }))
    moveCooldown.value = 10
    startCooldown()
  }
}

function startCooldown() {
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    moveCooldown.value--
    if (moveCooldown.value <= 0) {
      clearInterval(cooldownTimer)
      moveCooldown.value = 0
    }
  }, 1000)
}

async function logout() {
  await fetch('http://127.0.0.1:4000/api/auth/logout', {
    credentials: 'include'
  })
  localStorage.removeItem('nickname')
  router.push('/login')
}

onMounted(() => {
  ws = new WebSocket('ws://127.0.0.1:4000/api/gameboard') // ws://127.0.0.1:4001/
  ws.onopen = () => {
    const nickname = localStorage.getItem('nickname') // or from Pinia, or from checkAuth
    ws?.send(JSON.stringify({ type: 'join', name: nickname }))
  }
  ws.onmessage = (event) => { // all messages must have it's purpose on backend
    const msg = JSON.parse(event.data)
    if (msg.type === 'init') {
      players.value = msg.players
      myId.value = msg.you.id
    } else if (msg.type === 'state') {
      // Update all players' positions
      players.value = msg.players
    } else if (msg.type === 'move') {
      // One player moved
      const idx = players.value.findIndex(p => p.id === msg.id)
      if (idx !== -1) {
        players.value[idx].x = msg.x
        players.value[idx].y = msg.y
      }
    } else if (msg.type === 'joined') {
      if (msg.player.id !== myId.value && !players.value.some(p => p.id === msg.player.id)) {
        players.value.push(msg.player)
      }
    } else if (msg.type === 'left') {
      // Player left
      players.value = players.value.filter(p => p.id !== msg.id)
    }
  }
  ws.onclose = () => {
  }
})

onUnmounted(() => {
  if (ws) ws.close()
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>

<style scoped>
.gameboard-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #181818;
  color: #fff;
  gap: 0;
}

.board-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: none;
  padding: 2rem 2.5rem 2rem 2rem;
  background: #222;
  border-radius: 16px;
  box-shadow: 0 4px 24px #0004;
  border: 2px solid #FDD017;
  margin-right: 0;
}

.board {
  display: flex;
  flex-direction: column;
  border: 2px solid #FDD017;
  background: #222;
  margin-bottom: 1rem;
  width: 360px; /* 10 cells * 36px */
  border-radius: 8px;
  overflow: hidden;
}

.board-row {
  display: flex;
}

.cell {
  width: 36px;
  height: 36px;
  border: 1px solid #444;
  border-right: none;
  border-bottom: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  background: #333;
  transition: background 0.2s;
  position: relative;
}

.cell-hover {
  outline: 2px solid #FDD017;
  z-index: 2;
}

.cell.occupied .player-avatar {
  border: 2px solid #FDD017;
}

.cell.you .player-avatar {
  border: 2px solid #4caf50;
}

.player-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #fff;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 2px 6px #0003;
  border: 2px solid #333;
  transition: border 0.2s;
  cursor: pointer;
  user-select: none;
}

.move-info {
  margin-top: 1rem;
  font-size: 1rem;
}

.sidebar {
  width: 240px;
  min-height: 440px;
  background: #232323;
  border-left: 2px solid #FDD017;
  border-top: 2px solid #FDD017;
  border-bottom: 2px solid #FDD017;
  border-radius: 0 16px 16px 0;
  box-shadow: 4px 0 16px #0002;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: -2px; /* visually connect with board */
}

.sidebar h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  letter-spacing: 0.5px;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
  width: 100%;
}

.sidebar li {
  padding: 0.4rem 0.7rem;
  border-radius: 6px;
  margin-bottom: 0.3rem;
  background: #292929;
  border: 1px solid #333;
  font-size: 1rem;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sidebar li.you {
  background: #4caf50;
  color: #fff;
  border: 1.5px solid #388e3c;
}

.sidebar .player-avatar {
  width: 22px;
  height: 22px;
  font-size: 1rem;
  margin-right: 0.5rem;
  border: 2px solid #333;
}

button {
  padding: 0.5rem 1.2rem;
  background: #FDD017;
  color: #222;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  margin-top: auto;
  align-self: stretch;
  transition: background 0.2s;
}
button:hover {
  background: #ffe066;
}
</style>