import { DurableObject } from "cloudflare:workers";

interface Env {
  MATCH_ROOMS: DurableObjectNamespace<MatchRoom>;
  ALLOWED_ORIGINS?: string;
  ROOM_TTL_MINUTES?: string;
}

type GameMode = "time" | "words";
type Difficulty = "beginner" | "intermediate" | "advanced" | "expert" | "oni";
type RoomStatus = "lobby" | "playing" | "finished";

interface RoomSettings {
  mode: GameMode;
  difficulty: Difficulty;
  maxPlayers: number;
  dictionaryVersion: string;
  gameVersion: string;
}

interface PlayerProgress {
  score: number;
  correct: number;
  mistakes: number;
  crashes: number;
  lives: number;
  integrity: number;
  elapsed: number;
  status: string;
  keyStages: Record<string, number>;
}

interface StoredPlayer {
  id: string;
  token: string;
  name: string;
  joinedAt: number;
  ready: boolean;
  connected: boolean;
  finished: boolean;
  finishReason: string;
  finishTime: number;
  lastSeenAt: number;
  lastProgressAt: number;
  progress: PlayerProgress;
}

interface Standing {
  rank: number;
  playerId: string;
  name: string;
  score: number;
  correct: number;
  mistakes: number;
  crashes: number;
  finishTime: number;
  finishReason: string;
  connected: boolean;
}

interface RoomData {
  code: string;
  status: RoomStatus;
  hostId: string;
  settings: RoomSettings;
  players: Record<string, StoredPlayer>;
  participantIds: string[];
  seed: string;
  startAt: number;
  matchDeadline: number;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  standings: Standing[];
}

interface SocketAttachment {
  playerId: string;
}

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 6;
const MAX_MESSAGE_BYTES = 12_000;
const PROGRESS_INTERVAL_MS = 180;
const DEFAULT_TTL_MINUTES = 180;
const EMPTY_PROGRESS: PlayerProgress = Object.freeze({
  score: 0,
  correct: 0,
  mistakes: 0,
  crashes: 0,
  lives: 5,
  integrity: 100,
  elapsed: 0,
  status: "待機中",
  keyStages: {}
});

function cloneProgress(): PlayerProgress {
  return { ...EMPTY_PROGRESS, keyStages: {} };
}

function randomString(length: number, alphabet = ROOM_CODE_CHARS): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function randomToken(): string {
  return randomString(32, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, ROOM_CODE_LENGTH);
}

function sanitizeName(value: unknown): string {
  const raw = String(value ?? "").normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return (raw || `プレイヤー${Math.floor(1000 + Math.random() * 9000)}`).slice(0, 16);
}

function sanitizeSettings(value: unknown, fallback?: RoomSettings): RoomSettings {
  const input = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const mode: GameMode = input.mode === "words" || input.mode === "time"
    ? input.mode
    : fallback?.mode ?? "time";
  const difficulties: Difficulty[] = ["beginner", "intermediate", "advanced", "expert", "oni"];
  const difficulty = difficulties.includes(input.difficulty as Difficulty)
    ? input.difficulty as Difficulty
    : fallback?.difficulty ?? "beginner";
  const maxPlayers = Math.min(8, Math.max(2, Math.trunc(Number(input.maxPlayers ?? fallback?.maxPlayers ?? 8)) || 8));
  const dictionaryVersion = String(input.dictionaryVersion ?? fallback?.dictionaryVersion ?? "unknown").slice(0, 64);
  const gameVersion = String(input.gameVersion ?? fallback?.gameVersion ?? "unknown").slice(0, 32);
  return { mode, difficulty, maxPlayers, dictionaryVersion, gameVersion };
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

function clampNumber(value: unknown, min: number, max: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

function sanitizeProgress(value: unknown, previous?: PlayerProgress): PlayerProgress {
  const input = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const prev = previous ?? cloneProgress();
  const stages: Record<string, number> = {};
  const rawStages = input.keyStages && typeof input.keyStages === "object"
    ? input.keyStages as Record<string, unknown>
    : {};
  for (const [key, stage] of Object.entries(rawStages).slice(0, 27)) {
    if (/^[a-z]$/.test(key) || key === "BACKSPACE") stages[key] = clampInt(stage, 0, 3);
  }
  return {
    score: Math.max(prev.score, clampInt(input.score, 0, 2_000_000_000)),
    correct: Math.max(prev.correct, clampInt(input.correct, 0, 10_000)),
    mistakes: Math.max(prev.mistakes, clampInt(input.mistakes, 0, 10_000)),
    crashes: Math.max(prev.crashes, clampInt(input.crashes, 0, 10_000)),
    lives: clampInt(input.lives, 0, 5),
    integrity: clampInt(input.integrity, 0, 100),
    elapsed: Math.max(prev.elapsed, clampNumber(input.elapsed, 0, 600)),
    status: String(input.status ?? prev.status ?? "プレイ中").slice(0, 32),
    keyStages: stages
  };
}

function publicPlayer(player: StoredPlayer) {
  return {
    id: player.id,
    name: player.name,
    ready: player.ready,
    connected: player.connected,
    finished: player.finished,
    finishReason: player.finishReason,
    finishTime: player.finishTime,
    progress: player.progress
  };
}

function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers }
  });
}

function error(message: string, status = 400, headers: HeadersInit = {}): Response {
  return json({ ok: false, error: message }, status, headers);
}

function allowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("Origin");
  const configured = (env.ALLOWED_ORIGINS || "*").split(",").map((v) => v.trim()).filter(Boolean);
  if (!origin) return "*";
  if (configured.includes("*")) return origin;
  return configured.includes(origin) ? origin : null;
}

function corsHeaders(request: Request, env: Env): HeadersInit | null {
  const origin = allowedOrigin(request, env);
  if (!origin) return null;
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "Origin"
  };
}

async function parseJson(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > MAX_MESSAGE_BYTES) throw new Error("リクエストが大きすぎます。");
  if (!text) return {};
  const parsed = JSON.parse(text);
  return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
}

function buildRoomCode(): string {
  return randomString(ROOM_CODE_LENGTH);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (!cors) return error("このOriginからの接続は許可されていません。", 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (url.pathname === "/health") {
      return json({ ok: true, service: "kanji-crash-match-server", serverTime: Date.now() }, 200, cors);
    }

    if (request.method === "POST" && url.pathname === "/api/rooms") {
      let body: Record<string, unknown>;
      try { body = await parseJson(request); } catch { return error("JSONを読み取れませんでした。", 400, cors); }
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = buildRoomCode();
        const stub = env.MATCH_ROOMS.getByName(code);
        const response = await stub.fetch("https://room.internal/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            code,
            name: body.name,
            settings: body.settings,
            ttlMinutes: clampInt(env.ROOM_TTL_MINUTES || DEFAULT_TTL_MINUTES, 30, 1440)
          })
        });
        if (response.status === 409) continue;
        const payload = await response.text();
        return new Response(payload, { status: response.status, headers: { ...cors, "content-type": "application/json; charset=utf-8" } });
      }
      return error("ルームコードを発行できませんでした。もう一度お試しください。", 503, cors);
    }

    const joinMatch = url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})\/join$/i);
    if (request.method === "POST" && joinMatch) {
      const code = normalizeCode(joinMatch[1]);
      const stub = env.MATCH_ROOMS.getByName(code);
      let body: Record<string, unknown>;
      try { body = await parseJson(request); } catch { return error("JSONを読み取れませんでした。", 400, cors); }
      const response = await stub.fetch("https://room.internal/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: body.name,
          dictionaryVersion: body.dictionaryVersion,
          gameVersion: body.gameVersion
        })
      });
      return new Response(await response.text(), { status: response.status, headers: { ...cors, "content-type": "application/json; charset=utf-8" } });
    }

    const wsMatch = url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})\/ws$/i);
    if (request.method === "GET" && wsMatch) {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return error("WebSocket接続が必要です。", 426, cors);
      const code = normalizeCode(wsMatch[1]);
      const stub = env.MATCH_ROOMS.getByName(code);
      return stub.fetch(request);
    }

    return error("エンドポイントが見つかりません。", 404, cors);
  }
} satisfies ExportedHandler<Env>;

export class MatchRoom extends DurableObject<Env> {
  private room: RoomData | null = null;
  private lastPersistAt = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    this.ctx.blockConcurrencyWhile(async () => {
      this.room = await this.ctx.storage.get<RoomData>("room") ?? null;
      if (this.room) {
        const connectedIds = new Set(
          this.ctx.getWebSockets()
            .map((socket) => (socket.deserializeAttachment() as SocketAttachment | null)?.playerId)
            .filter((id): id is string => Boolean(id))
        );
        for (const player of Object.values(this.room.players)) player.connected = connectedIds.has(player.id);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/create") return this.createRoom(request);
    if (request.method === "POST" && url.pathname === "/join") return this.joinRoom(request);
    if (request.method === "GET" && url.pathname.endsWith("/ws")) return this.connectWebSocket(request);
    return error("Room endpoint not found", 404);
  }

  private async createRoom(request: Request): Promise<Response> {
    if (this.room) return error("ルームはすでに存在します。", 409);
    const body = await parseJson(request);
    const now = Date.now();
    const hostId = `p_${randomString(12)}`;
    const token = randomToken();
    const ttlMinutes = clampInt(body.ttlMinutes, 30, 1440);
    const settings = sanitizeSettings(body.settings);
    const host: StoredPlayer = {
      id: hostId,
      token,
      name: sanitizeName(body.name),
      joinedAt: now,
      ready: false,
      connected: false,
      finished: false,
      finishReason: "",
      finishTime: 0,
      lastSeenAt: now,
      lastProgressAt: 0,
      progress: cloneProgress()
    };
    this.room = {
      code: normalizeCode(String(body.code ?? "")),
      status: "lobby",
      hostId,
      settings,
      players: { [hostId]: host },
      participantIds: [],
      seed: "",
      startAt: 0,
      matchDeadline: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: now + ttlMinutes * 60_000,
      standings: []
    };
    await this.persist(true);
    return json({ ok: true, roomCode: this.room.code, playerId: hostId, token, serverTime: now, room: this.snapshot() });
  }

  private async joinRoom(request: Request): Promise<Response> {
    if (!this.room) return error("ルームが見つかりません。", 404);
    if (this.room.status !== "lobby") return error("このルームは対戦中です。", 409);
    if (Object.keys(this.room.players).length >= this.room.settings.maxPlayers) return error("ルームが満員です。", 409);
    const body = await parseJson(request);
    const requestedDictionary = String(body.dictionaryVersion ?? "");
    const requestedGame = String(body.gameVersion ?? "");
    if (requestedDictionary !== this.room.settings.dictionaryVersion || requestedGame !== this.room.settings.gameVersion) {
      return error("ゲームまたは辞書のバージョンがルームと一致しません。ページを再読み込みしてください。", 409);
    }
    const now = Date.now();
    const playerId = `p_${randomString(12)}`;
    const token = randomToken();
    this.room.players[playerId] = {
      id: playerId,
      token,
      name: this.uniqueName(sanitizeName(body.name)),
      joinedAt: now,
      ready: false,
      connected: false,
      finished: false,
      finishReason: "",
      finishTime: 0,
      lastSeenAt: now,
      lastProgressAt: 0,
      progress: cloneProgress()
    };
    this.touch();
    await this.persist(true);
    await this.broadcast({ type: "room_state", room: this.snapshot(), serverTime: now });
    return json({ ok: true, roomCode: this.room.code, playerId, token, serverTime: now, room: this.snapshot() });
  }

  private uniqueName(name: string): string {
    if (!this.room) return name;
    const names = new Set(Object.values(this.room.players).map((p) => p.name));
    if (!names.has(name)) return name;
    for (let i = 2; i <= 99; i++) {
      const candidate = `${name.slice(0, 13)}${i}`;
      if (!names.has(candidate)) return candidate;
    }
    return `${name.slice(0, 10)}${randomString(4)}`;
  }

  private async connectWebSocket(request: Request): Promise<Response> {
    if (!this.room) return error("ルームが見つかりません。", 404);
    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId") || "";
    const token = url.searchParams.get("token") || "";
    const player = this.room.players[playerId];
    if (!player || player.token !== token) return error("接続情報が無効です。", 401);

    for (const existing of this.ctx.getWebSockets(playerId)) {
      try { existing.close(4001, "別の接続から再接続されました。"); } catch {}
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server, [playerId]);
    server.serializeAttachment({ playerId } satisfies SocketAttachment);
    player.connected = true;
    player.connected = true;
    player.lastSeenAt = Date.now();
    this.touch();
    await this.persist(true);
    server.send(JSON.stringify({ type: "room_state", room: this.snapshot(), serverTime: Date.now() }));
    await this.broadcast({ type: "room_state", room: this.snapshot(), serverTime: Date.now() }, playerId);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (!this.room) return;
    const attachment = ws.deserializeAttachment() as SocketAttachment | null;
    const playerId = attachment?.playerId;
    const player = playerId ? this.room.players[playerId] : undefined;
    if (!playerId || !player) { ws.close(4003, "プレイヤー情報がありません。"); return; }
    const text = typeof message === "string" ? message : new TextDecoder().decode(message);
    if (text.length > MAX_MESSAGE_BYTES) { ws.close(1009, "メッセージが大きすぎます。"); return; }
    let data: Record<string, unknown>;
    try { data = JSON.parse(text) as Record<string, unknown>; } catch { return; }
    player.lastSeenAt = Date.now();
    this.touch();

    switch (data.type) {
      case "ready":
        if (this.room.status !== "lobby") return;
        player.ready = Boolean(data.ready);
        await this.persist(true);
        await this.broadcast({ type: "room_state", room: this.snapshot(), serverTime: Date.now() });
        return;

      case "settings":
        if (this.room.status !== "lobby" || playerId !== this.room.hostId) return;
        this.room.settings = sanitizeSettings(data.settings, this.room.settings);
        await this.persist(true);
        await this.broadcast({ type: "room_state", room: this.snapshot(), serverTime: Date.now() });
        return;

      case "start":
        if (playerId !== this.room.hostId) return;
        await this.startMatch(ws);
        return;

      case "progress":
        await this.receiveProgress(player, data.progress);
        return;

      case "finish":
        await this.finishPlayer(player, data.progress, String(data.reason ?? "終了").slice(0, 32));
        return;

      case "rematch":
        if (playerId !== this.room.hostId || this.room.status !== "finished") return;
        await this.resetToLobby();
        return;

      case "leave":
        await this.removePlayer(playerId);
        try { ws.close(1000, "退出しました。"); } catch {}
        return;
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.markDisconnected(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.markDisconnected(ws);
  }

  private async markDisconnected(ws: WebSocket): Promise<void> {
    if (!this.room) return;
    const attachment = ws.deserializeAttachment() as SocketAttachment | null;
    const player = attachment?.playerId ? this.room.players[attachment.playerId] : undefined;
    if (!player) return;
    player.connected = this.ctx.getWebSockets(player.id).some((socket) => socket !== ws);
    player.lastSeenAt = Date.now();
    await this.persist(true);
    await this.broadcast({ type: "room_state", room: this.snapshot(), serverTime: Date.now() });
  }

  private async startMatch(ws: WebSocket): Promise<void> {
    if (!this.room || this.room.status !== "lobby") return;
    const connected = Object.values(this.room.players).filter((p) => p.connected);
    if (connected.length < 2) { ws.send(JSON.stringify({ type: "error", message: "2人以上の接続が必要です。" })); return; }
    if (connected.some((p) => !p.ready)) { ws.send(JSON.stringify({ type: "error", message: "全員が準備完了になるまで開始できません。" })); return; }

    const now = Date.now();
    this.room.status = "playing";
    this.room.seed = randomString(24, "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
    this.room.startAt = now + 4_000;
    this.room.matchDeadline = this.room.startAt + (this.room.settings.mode === "time" ? 45_000 : 180_000);
    this.room.participantIds = connected.map((p) => p.id);
    this.room.standings = [];
    for (const player of connected) {
      player.finished = false;
      player.finishReason = "";
      player.finishTime = 0;
      player.progress = cloneProgress();
      player.ready = false;
    }
    await this.persist(true);
    await this.scheduleAlarm();
    await this.broadcast({
      type: "match_start",
      room: this.snapshot(),
      seed: this.room.seed,
      startAt: this.room.startAt,
      serverTime: now
    });
  }

  private async receiveProgress(player: StoredPlayer, rawProgress: unknown): Promise<void> {
    if (!this.room || this.room.status !== "playing" || player.finished || !this.room.participantIds.includes(player.id)) return;
    const now = Date.now();
    if (now - player.lastProgressAt < PROGRESS_INTERVAL_MS) return;
    player.lastProgressAt = now;
    player.progress = sanitizeProgress(rawProgress, player.progress);
    player.lastSeenAt = now;
    await this.persist(false);
    await this.broadcast({ type: "player_progress", player: publicPlayer(player), serverTime: now }, player.id);
  }

  private async finishPlayer(player: StoredPlayer, rawProgress: unknown, reason: string): Promise<void> {
    if (!this.room || this.room.status !== "playing" || player.finished || !this.room.participantIds.includes(player.id)) return;
    player.progress = sanitizeProgress(rawProgress, player.progress);
    player.finished = true;
    player.finishReason = reason || "終了";
    player.finishTime = player.progress.elapsed;
    player.progress.status = player.finishReason;
    await this.persist(true);
    await this.broadcast({ type: "player_progress", player: publicPlayer(player), serverTime: Date.now() });
    if (this.room.participantIds.every((id) => this.room?.players[id]?.finished)) await this.finalizeMatch();
  }

  private async finalizeMatch(): Promise<void> {
    if (!this.room || this.room.status !== "playing") return;
    for (const id of this.room.participantIds) {
      const player = this.room.players[id];
      if (!player.finished) {
        player.finished = true;
        player.finishReason = "DNF";
        player.finishTime = Math.max(player.progress.elapsed, (this.room.matchDeadline - this.room.startAt) / 1000);
        player.progress.status = "DNF";
      }
    }
    const sorted = this.room.participantIds.map((id) => this.room!.players[id]).sort((a, b) => {
      if (b.progress.score !== a.progress.score) return b.progress.score - a.progress.score;
      if (b.progress.correct !== a.progress.correct) return b.progress.correct - a.progress.correct;
      if (a.progress.crashes !== b.progress.crashes) return a.progress.crashes - b.progress.crashes;
      if (a.finishTime !== b.finishTime) return a.finishTime - b.finishTime;
      if (a.progress.mistakes !== b.progress.mistakes) return a.progress.mistakes - b.progress.mistakes;
      return a.joinedAt - b.joinedAt;
    });
    let rank = 0;
    let lastKey = "";
    this.room.standings = sorted.map((player, index) => {
      const key = [player.progress.score, player.progress.correct, -player.progress.crashes, -player.finishTime, -player.progress.mistakes].join(":");
      if (key !== lastKey) rank = index + 1;
      lastKey = key;
      return {
        rank,
        playerId: player.id,
        name: player.name,
        score: player.progress.score,
        correct: player.progress.correct,
        mistakes: player.progress.mistakes,
        crashes: player.progress.crashes,
        finishTime: player.finishTime,
        finishReason: player.finishReason,
        connected: player.connected
      };
    });
    this.room.status = "finished";
    this.room.updatedAt = Date.now();
    this.room.matchDeadline = 0;
    await this.persist(true);
    await this.scheduleAlarm();
    await this.broadcast({ type: "match_finished", room: this.snapshot(), standings: this.room.standings, serverTime: Date.now() });
  }

  private async resetToLobby(): Promise<void> {
    if (!this.room) return;
    this.room.status = "lobby";
    this.room.seed = "";
    this.room.startAt = 0;
    this.room.matchDeadline = 0;
    this.room.participantIds = [];
    this.room.standings = [];
    for (const player of Object.values(this.room.players)) {
      player.ready = false;
      player.finished = false;
      player.finishReason = "";
      player.finishTime = 0;
      player.progress = cloneProgress();
    }
    await this.persist(true);
    await this.scheduleAlarm();
    await this.broadcast({ type: "room_state", room: this.snapshot(), serverTime: Date.now() });
  }

  private async removePlayer(playerId: string): Promise<void> {
    if (!this.room || !this.room.players[playerId]) return;
    if (this.room.status === "playing") {
      const player = this.room.players[playerId];
      player.connected = false;
      player.lastSeenAt = Date.now();
      if (this.room.participantIds.includes(playerId) && !player.finished) {
        player.finished = true;
        player.finishReason = "退出";
        player.finishTime = Math.max(player.progress.elapsed, (Date.now() - this.room.startAt) / 1000);
        player.progress.status = "退出";
      }
      await this.persist(true);
      if (this.room.participantIds.every((id) => this.room?.players[id]?.finished)) await this.finalizeMatch();
      else await this.broadcast({ type: "room_state", room: this.snapshot(), serverTime: Date.now() });
      return;
    }
    delete this.room.players[playerId];
    if (this.room.hostId === playerId) {
      const next = Object.values(this.room.players).sort((a, b) => a.joinedAt - b.joinedAt)[0];
      this.room.hostId = next?.id ?? "";
    }
    if (!Object.keys(this.room.players).length) {
      for (const socket of this.ctx.getWebSockets()) { try { socket.close(1000, "ルームを終了しました。"); } catch {} }
      await this.ctx.storage.deleteAll();
      this.room = null;
      return;
    }
    await this.persist(true);
    await this.broadcast({ type: "room_state", room: this.snapshot(), serverTime: Date.now() });
  }

  private snapshot() {
    if (!this.room) return null;
    return {
      code: this.room.code,
      status: this.room.status,
      hostId: this.room.hostId,
      settings: this.room.settings,
      players: Object.values(this.room.players).sort((a, b) => a.joinedAt - b.joinedAt).map(publicPlayer),
      participantIds: this.room.participantIds,
      seed: this.room.seed,
      startAt: this.room.startAt,
      standings: this.room.standings,
      expiresAt: this.room.expiresAt
    };
  }

  private touch(): void {
    if (!this.room) return;
    const ttl = clampInt(this.env.ROOM_TTL_MINUTES || DEFAULT_TTL_MINUTES, 30, 1440);
    this.room.updatedAt = Date.now();
    this.room.expiresAt = Date.now() + ttl * 60_000;
  }

  private async persist(force: boolean): Promise<void> {
    if (!this.room) return;
    const now = Date.now();
    if (!force && now - this.lastPersistAt < 1_500) return;
    this.lastPersistAt = now;
    this.room.updatedAt = now;
    await this.ctx.storage.put("room", this.room);
    if (force) await this.scheduleAlarm();
  }

  private async scheduleAlarm(): Promise<void> {
    if (!this.room) return;
    const candidates = [this.room.expiresAt];
    if (this.room.status === "playing" && this.room.matchDeadline) candidates.push(this.room.matchDeadline);
    await this.ctx.storage.setAlarm(Math.min(...candidates));
  }

  async alarm(): Promise<void> {
    if (!this.room) return;
    const now = Date.now();
    if (this.room.status === "playing" && this.room.matchDeadline && now >= this.room.matchDeadline) {
      await this.finalizeMatch();
      return;
    }
    if (now >= this.room.expiresAt) {
      for (const socket of this.ctx.getWebSockets()) { try { socket.close(4000, "ルームの有効期限が切れました。"); } catch {} }
      await this.ctx.storage.deleteAll();
      this.room = null;
      return;
    }
    await this.scheduleAlarm();
  }

  private async broadcast(payload: unknown, exceptPlayerId?: string): Promise<void> {
    const text = JSON.stringify(payload);
    for (const socket of this.ctx.getWebSockets()) {
      const attachment = socket.deserializeAttachment() as SocketAttachment | null;
      if (exceptPlayerId && attachment?.playerId === exceptPlayerId) continue;
      try { socket.send(text); } catch {}
    }
  }
}
