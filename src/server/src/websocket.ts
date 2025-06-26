/*import { wss } from './index.js'
import { v4 as uuidv4 } from 'uuid'

type Player = {
  id: string
  name: string
  x: number
  y: number
  lastMove: number // timestamp
  ws: any
}

const players: Player[] = []

function broadcast(type: string, data: any) {
  const msg = JSON.stringify({ type, ...data })
  players.forEach(p => {
    if (p.ws.readyState === 1) p.ws.send(msg)
  })
}

wss.on('connection', (ws) => {
  console.log('connection established')
  // For demo: assign a random name, in real app get from session/JWT
  let player: Player | null = null

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }

    if (msg.type === 'join') {
      // In real app: extract user from cookie/session
      const name = 'User' + Math.floor(Math.random() * 1000)
      const id = uuidv4()
      // Place player at random empty cell
      let x, y
      do {
        x = Math.floor(Math.random() * 10)
        y = Math.floor(Math.random() * 10)
      } while (players.some(p => p.x === x && p.y === y))
      player = { id, name, x, y, lastMove: 0, ws }
      players.push(player)
      // Send initial state to this player
      ws.send(JSON.stringify({
        type: 'init',
        players: players.map(({ ws, ...rest }) => rest),
        you: { id, name }
      }))
      // Notify others
      broadcast('joined', { player: { id, name, x, y } })
    }

    if (msg.type === 'move' && player) {
      const now = Date.now()
      if (now - player.lastMove < 10000) return // 10s cooldown
      const dx = Math.abs(player.x - msg.x)
      const dy = Math.abs(player.y - msg.y)
      if (dx + dy === 0 || dx + dy > 2) return // max 2 cells, can't stay
      // Check if cell is occupied
      if (players.some(p => p !== player && p.x === msg.x && p.y === msg.y)) return
      player.x = msg.x
      player.y = msg.y
      player.lastMove = now
      broadcast('move', { id: player.id, x: player.x, y: player.y })
    }
  })

  ws.on('close', () => {
    if (player) {
      const idx = players.findIndex(p => p.id === player!.id)
      if (idx !== -1) players.splice(idx, 1)
      broadcast('left', { id: player.id })
    }
  })
})*/
