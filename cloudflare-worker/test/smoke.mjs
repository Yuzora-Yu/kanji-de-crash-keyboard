const base = process.env.BASE_URL || 'http://127.0.0.1:8787';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function post(path, body) {
  const response = await fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Origin: 'http://localhost:8000' },
    body: JSON.stringify(body)
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${JSON.stringify(json)}`);
  return json;
}

function wsUrl(code, playerId, token) {
  return `${base.replace(/^http/, 'ws')}/api/rooms/${code}/ws?playerId=${encodeURIComponent(playerId)}&token=${encodeURIComponent(token)}`;
}

function connect(url) {
  const ws = new WebSocket(url);
  const queue = [];
  const waiters = [];
  ws.addEventListener('message', (event) => {
    const value = JSON.parse(String(event.data));
    const waiterIndex = waiters.findIndex((w) => w.predicate(value));
    if (waiterIndex >= 0) {
      const [waiter] = waiters.splice(waiterIndex, 1);
      waiter.resolve(value);
    } else queue.push(value);
  });
  function waitFor(predicate, timeout = 7000) {
    const queuedIndex = queue.findIndex(predicate);
    if (queuedIndex >= 0) return Promise.resolve(queue.splice(queuedIndex, 1)[0]);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = waiters.findIndex((w) => w.resolve === wrappedResolve);
        if (idx >= 0) waiters.splice(idx, 1);
        reject(new Error('WebSocket message timeout'));
      }, timeout);
      const wrappedResolve = (value) => { clearTimeout(timer); resolve(value); };
      waiters.push({ predicate, resolve: wrappedResolve });
    });
  }
  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve({ ws, waitFor }), { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
}

const health = await fetch(base + '/health', { headers: { Origin: 'http://localhost:8000' } }).then((r) => r.json());
assert(health.ok, 'health failed');

const host = await post('/api/rooms', {
  name: 'HOST',
  settings: { mode: 'time', difficulty: 'beginner', maxPlayers: 4, dictionaryVersion: 'test', gameVersion: 'test' }
});
assert(/^[A-Z2-9]{6}$/.test(host.roomCode), 'room code invalid');

const guest = await post(`/api/rooms/${host.roomCode}/join`, { name: 'GUEST', dictionaryVersion: 'test', gameVersion: 'test' });
const hostConn = await connect(wsUrl(host.roomCode, host.playerId, host.token));
const guestConn = await connect(wsUrl(guest.roomCode, guest.playerId, guest.token));
await hostConn.waitFor((m) => m.type === 'room_state');
await guestConn.waitFor((m) => m.type === 'room_state');

hostConn.ws.send(JSON.stringify({ type: 'ready', ready: true }));
guestConn.ws.send(JSON.stringify({ type: 'ready', ready: true }));
await hostConn.waitFor((m) => m.type === 'room_state' && m.room.players.every((p) => p.ready));
hostConn.ws.send(JSON.stringify({ type: 'start' }));
const start = await hostConn.waitFor((m) => m.type === 'match_start');
assert(start.seed && start.startAt, 'match start payload invalid');
await guestConn.waitFor((m) => m.type === 'match_start');

const progress = {
  score: 1234, correct: 5, mistakes: 1, crashes: 2, lives: 4,
  integrity: 72, elapsed: 15.2, status: 'プレイ中', keyStages: { a: 2, i: 3 }
};
hostConn.ws.send(JSON.stringify({ type: 'progress', progress }));
await guestConn.waitFor((m) => m.type === 'player_progress' && m.player.id === host.playerId);

hostConn.ws.send(JSON.stringify({ type: 'finish', reason: 'TIME UP', progress: { ...progress, score: 2000, elapsed: 30 } }));
guestConn.ws.send(JSON.stringify({ type: 'finish', reason: 'TIME UP', progress: { ...progress, score: 1800, elapsed: 30 } }));
const finished = await hostConn.waitFor((m) => m.type === 'match_finished');
assert(finished.standings.length === 2, 'standings size invalid');
assert(finished.standings[0].playerId === host.playerId, 'ranking invalid');

hostConn.ws.close();
guestConn.ws.close();
console.log(`SMOKE OK room=${host.roomCode}`);
