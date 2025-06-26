// @ts-nocheck
// it is test assignment - the typescript is peak in a big projects but in test assignment it is not really needed

import express from 'express';
import http from 'http';
import cors from 'cors';
import router from './router.js';
import cookieParser from 'cookie-parser';
import { WebSocketServer } from 'ws';
import { DbManipulation, CreateConnection } from './db.js';
import dotenv from 'dotenv';

// TODO
/*
сделано +

TODO:
+
Убрать страницу с vue HomeView, что занимает авторизованный путь /
Оно должно просто пересылать на /login или сразу на /gameboard если авторизовано
А неавторизованный путь перешлет на /login

+
Также реализовать кнопку logout в /gameboard - должна убирать auth токен
и пересылать на /login

+
Сделать вебсокет сервер, линкнуть его с 4000 портом экспресса и настроить
события вебсокета, необходимые для функционирования игрового поля по пути /gameboard
Все названия сообщений вебсокета можно найти на фронтенде в файле GameBoardView.vue

+
Переместить все переменные с PRIVATE_KEY и прочим(вариаблы для создания коннекшона с дб)
В env и в example env. Потом написать readme в gitlab как их правильно использовать

+
Сделать более подробные сообщения ошибок/успеха на фронтенде по пути /login
В основном это будет успешная регистрация(вне фронта)
например валидация что логин или пароль меньше 5 символов(фронт)
А не только одни ошибки и те достаточно расплывчатые

Сделать в корневом package.json скрипт сборки и запуска фронта и бэка используя concurrently

Другая страница: Игровое поле
- Игровое поле размером 10x10 клеток +

- Игроки могут перемещаться по клеткам + 

- Ограничение: 1 движение каждые 10 секунд +

- Максимальное расстояние перемещения: 2 клетки за ход + 

- Визуальное отображение всех игроков(real-time websocket) + 

Интерфейс:
- Визуальное отображение игрового поля +
- Индикация позиций игроков(внутри поля, позиции передаются в лайв формате через вебсокет) +
- Список онлайн-игроков - отдельное окошко внутри страницы игрового поля +
будет справа от клеток (нужно проверить как оно будет работать если у нас никнеймы а не uuid)

Система игроков:
- Простая регистрация/авторизация +
- Уникальные никнеймы +
- Сохранение позиции между сессиями(хранить в базе данных клетку на которой остановился)
*/

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
    credentials: true,
  }),
);
app.use(router);

// Create ONE http server for both express and ws
const server = http.createServer(app);

server.listen(4000, () => {
  console.log('active server (http+ws) at port 4000');
});

// Attach WebSocket server to the same HTTP server
export const wss = new WebSocketServer({ server, path: '/api/gameboard' });
import { v4 as uuidv4 } from 'uuid';
import { QueryResult } from 'mysql2';

type Player = {
  id: string;
  name: string;
  x: number;
  y: number;
  lastMove: number; // timestamp
  ws: any;
};

const players: Player[] = [];

function broadcast(type: string, data: any) {
  const msg = JSON.stringify({ type, ...data });
  players.forEach((p) => {
    if (p.ws.readyState === 1) p.ws.send(msg);
  });
}

// Setup DB connection (reuse your existing code)
dotenv.config();
const pool = new CreateConnection( // yes there is 2 connections here and in service.ts
  // but I don't know yet how to make it only in service.ts when I am interacting with websocket here
  // essentially service.ts meant to be only for controller.ts so I think we are good here(for this assignment)
  process.env.DB_HOST!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD!,
  process.env.DB_DATABASE!,
).createPool();
const db = new DbManipulation(pool);

wss.on('connection', (ws) => {
  let player: Player | null = null;

  ws.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === 'join') {
      const name = msg.name;
      // Remove any existing player with this name
      const existingIdx = players.findIndex((p) => p.name === name);
      if (existingIdx !== -1) {
        try {
          players[existingIdx].ws.close();
        } catch {}
        players.splice(existingIdx, 1);
      }

      // --- NEW: Try to get position from DB ---
      let x: number | null = null;
      let y: number | null = null;
      try {
        const result = await db.getFields(name);
        const row = result?.[0]?.[0];
        if (row && row.currentCellX != null && row.currentCellY != null) {
          x = row.currentCellX;
          y = row.currentCellY;
        }
      } catch (e) {
        // ignore, fallback to random
      }
      // If not found, assign random
      if (x == null || y == null) {
        do {
          x = Math.floor(Math.random() * 10);
          y = Math.floor(Math.random() * 10);
        } while (players.some((p) => p.x === x && p.y === y));
        // Save to DB
        await db.setFields(x, y, name);
      }

      const id = uuidv4();
      player = { id, name, x, y, lastMove: 0, ws };
      players.push(player);
      ws.send(
        JSON.stringify({
          type: 'init',
          players: players.map(({ ws, ...rest }) => rest),
          you: { id, name },
        }),
      );
      broadcast('joined', { player: { id, name, x, y } });
    }

    if (msg.type === 'move' && player) {
      const now = Date.now();
      if (now - player.lastMove < 10000) return; // 10s cooldown
      const dx = Math.abs(player.x - msg.x);
      const dy = Math.abs(player.y - msg.y);
      if (Math.max(dx, dy) === 0 || Math.max(dx, dy) > 2) return; // diagonal allowed
      // Check if cell is occupied
      if (players.some((p) => p !== player && p.x === msg.x && p.y === msg.y))
        return;
      player.x = msg.x;
      player.y = msg.y;
      player.lastMove = now;
      // --- NEW: Save new position to DB ---
      await db.setFields(player.x, player.y, player.name);
      broadcast('move', { id: player.id, x: player.x, y: player.y });
    }
  });

  ws.on('close', () => {
    if (player) {
      const idx = players.findIndex((p) => p.id === player!.id);
      if (idx !== -1) players.splice(idx, 1);
      broadcast('left', { id: player.id });
    }
  });
});
