(() => {
  'use strict';

  const CONFIG = window.KCK_ONLINE_CONFIG || {};
  const SERVER_URL = String(CONFIG.serverUrl || '').replace(/\/$/, '');
  const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const LEVEL_LABELS = { beginner:'初級', intermediate:'中級', advanced:'上級', expert:'超級', oni:'鬼' };
  const SESSION_KEY = 'kck-online-session-v1';
  const NAME_KEY = 'kck-online-name';
  const $ = id => document.getElementById(id);

  const els = {
    friendBattleButton:$('friendBattleButton'), friendSetupScreen:$('friendSetupScreen'), onlineLobbyScreen:$('onlineLobbyScreen'),
    serverNotice:$('onlineServerNotice'), createRoomForm:$('createRoomForm'), joinRoomForm:$('joinRoomForm'),
    createPlayerName:$('createPlayerName'), joinPlayerName:$('joinPlayerName'), joinRoomCode:$('joinRoomCode'),
    createRoomDifficulty:$('createRoomDifficulty'), createRoomMaxPlayers:$('createRoomMaxPlayers'),
    createRoomButton:$('createRoomButton'), joinRoomButton:$('joinRoomButton'), friendSetupBackButton:$('friendSetupBackButton'),
    lobbyRoomCode:$('lobbyRoomCode'), copyRoomCodeButton:$('copyRoomCodeButton'), copyInviteLinkButton:$('copyInviteLinkButton'),
    lobbyConnectionStatus:$('lobbyConnectionStatus'), lobbyMode:$('lobbyMode'), lobbyDifficulty:$('lobbyDifficulty'), lobbyPlayerCount:$('lobbyPlayerCount'),
    lobbyPlayerList:$('lobbyPlayerList'), lobbyMessage:$('lobbyMessage'), readyButton:$('readyButton'), startOnlineMatchButton:$('startOnlineMatchButton'),
    rematchRoomButton:$('rematchRoomButton'), leaveRoomButton:$('leaveRoomButton'),
    onlineDuelPanel:$('onlineDuelPanel'), onlineRoomLabel:$('onlineRoomLabel'), onlineSyncStatus:$('onlineSyncStatus'), onlinePlayerGrid:$('onlinePlayerGrid')
  };

  let session = loadSession();
  let room = null;
  let socket = null;
  let manualClose = false;
  let reconnectTimer = null;
  let reconnectCount = 0;
  let progressTimer = null;
  let clockOffset = 0;
  let activeSeed = '';

  function configured() {
    return /^https?:\/\//.test(SERVER_URL);
  }

  function selected(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value;
  }

  function defaultName() {
    const saved = localStorage.getItem(NAME_KEY);
    if (saved) return saved;
    return `プレイヤー${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function normalizeCode(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6);
  }

  function saveName(name) {
    try { localStorage.setItem(NAME_KEY, name); } catch {}
  }

  function saveSession() {
    try {
      if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }

  function loadSession() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      return parsed?.roomCode && parsed?.playerId && parsed?.token ? parsed : null;
    } catch { return null; }
  }

  function showScreen(name) {
    window.KCK_GAME_API?.showScreen(name);
  }

  function setNotice(text, kind = '') {
    els.serverNotice.textContent = text;
    els.serverNotice.className = `online-notice ${kind}`.trim();
  }

  function setLobbyMessage(text, kind = '') {
    els.lobbyMessage.textContent = text || '';
    els.lobbyMessage.className = `lobby-message ${kind}`.trim();
  }

  function setBusy(button, busy, label) {
    if (!button) return;
    button.disabled = busy;
    if (label) button.textContent = busy ? '通信中…' : label;
  }

  async function api(path, options = {}) {
    if (!configured()) throw new Error('対戦サーバーURLが未設定です。online-config.jsを編集してください。');
    const response = await fetch(SERVER_URL + path, {
      ...options,
      headers: { 'content-type':'application/json', ...(options.headers || {}) }
    });
    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok) throw new Error(data.error || `通信エラー (${response.status})`);
    updateClock(data.serverTime);
    return data;
  }

  function updateClock(serverTime) {
    if (!Number.isFinite(Number(serverTime))) return;
    const measured = Number(serverTime) - Date.now();
    clockOffset = clockOffset ? clockOffset * .7 + measured * .3 : measured;
  }

  function wsUrl() {
    return `${SERVER_URL.replace(/^http/, 'ws')}/api/rooms/${session.roomCode}/ws?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`;
  }

  async function checkServer() {
    if (!configured()) {
      setNotice('対戦サーバーはまだ未設定です。docs/ONLINE_MULTIPLAYER_SETUP.mdの手順でCloudflare Workerをデプロイしてください。', 'error');
      disableForms(true);
      return false;
    }
    setNotice('対戦サーバーへ接続確認中…');
    try {
      const response = await fetch(SERVER_URL + '/health');
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error();
      updateClock(data.serverTime);
      setNotice('対戦サーバーに接続できます。', 'ok');
      disableForms(false);
      return true;
    } catch {
      setNotice('対戦サーバーへ接続できません。URL・デプロイ状態・CORS設定を確認してください。', 'error');
      disableForms(true);
      return false;
    }
  }

  function disableForms(disabled) {
    [els.createRoomButton, els.joinRoomButton].forEach(button => { if (button) button.disabled = disabled; });
  }

  async function createRoom(event) {
    event.preventDefault();
    const name = els.createPlayerName.value.trim() || defaultName();
    saveName(name);
    setBusy(els.createRoomButton, true, 'ルーム作成');
    try {
      const data = await api('/api/rooms', {
        method:'POST',
        body:JSON.stringify({
          name,
          settings:{
            mode:selected('onlineCreateMode') || 'time',
            difficulty:els.createRoomDifficulty.value,
            maxPlayers:Number(els.createRoomMaxPlayers.value),
            dictionaryVersion:CONFIG.dictionaryVersion || 'unknown',
            gameVersion:CONFIG.gameVersion || 'unknown'
          }
        })
      });
      session = { roomCode:data.roomCode, playerId:data.playerId, token:data.token, name };
      room = data.room;
      saveSession();
      await connect();
      showScreen('lobby');
      renderLobby();
    } catch (error) {
      setNotice(error.message, 'error');
    } finally { setBusy(els.createRoomButton, false, 'ルーム作成'); }
  }

  async function joinRoom(event) {
    event.preventDefault();
    const name = els.joinPlayerName.value.trim() || defaultName();
    const code = normalizeCode(els.joinRoomCode.value);
    if (code.length !== 6) { setNotice('6文字のルームコードを入力してください。', 'error'); return; }
    saveName(name);
    setBusy(els.joinRoomButton, true, '参加する');
    try {
      const data = await api(`/api/rooms/${code}/join`, { method:'POST', body:JSON.stringify({ name, dictionaryVersion:CONFIG.dictionaryVersion || 'unknown', gameVersion:CONFIG.gameVersion || 'unknown' }) });
      session = { roomCode:data.roomCode, playerId:data.playerId, token:data.token, name };
      room = data.room;
      saveSession();
      await connect();
      showScreen('lobby');
      renderLobby();
    } catch (error) {
      setNotice(error.message, 'error');
    } finally { setBusy(els.joinRoomButton, false, '参加する'); }
  }

  function connect() {
    if (!session || !configured()) return Promise.reject(new Error('接続情報がありません。'));
    manualClose = false;
    clearTimeout(reconnectTimer);
    if (socket && socket.readyState <= WebSocket.OPEN) socket.close();
    els.lobbyConnectionStatus.textContent = '接続中…';
    els.lobbyConnectionStatus.className = 'connection-status';
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl());
      socket = ws;
      const timeout = setTimeout(() => { try { ws.close(); } catch {}; reject(new Error('WebSocket接続がタイムアウトしました。')); }, 8000);
      ws.addEventListener('open', () => {
        clearTimeout(timeout); reconnectCount = 0;
        els.lobbyConnectionStatus.textContent = '接続済み';
        els.lobbyConnectionStatus.className = 'connection-status ok';
        resolve();
      }, { once:true });
      ws.addEventListener('message', event => handleMessage(event.data));
      ws.addEventListener('close', () => {
        clearTimeout(timeout);
        stopProgressSync();
        els.lobbyConnectionStatus.textContent = manualClose ? '切断しました' : '接続が切れました。再接続します…';
        els.lobbyConnectionStatus.className = 'connection-status';
        window.KCK_GAME_API?.setOnlineSyncStatus('再接続中');
        if (!manualClose && session) scheduleReconnect();
      });
      ws.addEventListener('error', () => { if (ws.readyState !== WebSocket.OPEN) reject(new Error('WebSocket接続に失敗しました。')); });
    });
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    const delay = Math.min(8000, 1000 * 2 ** Math.min(reconnectCount++, 3));
    reconnectTimer = setTimeout(() => connect().catch(() => scheduleReconnect()), delay);
  }

  function send(type, payload = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ type, ...payload }));
    return true;
  }

  function handleMessage(raw) {
    let message;
    try { message = JSON.parse(raw); } catch { return; }
    updateClock(message.serverTime);
    if (message.type === 'error') { setLobbyMessage(message.message || '対戦サーバーでエラーが発生しました。', 'error'); return; }
    if (message.type === 'room_state') {
      room = message.room;
      renderLobby(); renderOnlinePlayers();
      syncStartedRoom();
      return;
    }
    if (message.type === 'player_progress') {
      if (!room?.players) return;
      const index = room.players.findIndex(player => player.id === message.player.id);
      if (index >= 0) room.players[index] = message.player; else room.players.push(message.player);
      renderOnlinePlayers();
      return;
    }
    if (message.type === 'match_start') {
      room = message.room;
      startMatch(message);
      return;
    }
    if (message.type === 'match_finished') {
      room = message.room;
      stopProgressSync();
      renderLobby(); renderOnlinePlayers();
      window.KCK_GAME_API?.finishOnlineMatch(message.standings || [], room);
    }
  }

  function syncStartedRoom() {
    if (!room || room.status !== 'playing' || !room.seed || activeSeed === room.seed) return;
    const localStartAt = Number(room.startAt) - clockOffset;
    if (Date.now() - localStartAt > 5000) {
      setLobbyMessage('対戦開始後のページ再読み込みからの復帰は、この試作版では未対応です。ルームの終了をお待ちください。', 'error');
      return;
    }
    startMatch({ room, seed:room.seed, startAt:room.startAt, serverTime:Date.now() + clockOffset });
  }

  function startMatch(message) {
    if (!session || !message.room || activeSeed === message.seed) return;
    updateClock(message.serverTime);
    room = message.room;
    activeSeed = message.seed;
    const localStartAt = Number(message.startAt) - clockOffset;
    window.KCK_GAME_API?.prepareOnlineMatch({
      settings:room.settings,
      seed:message.seed,
      startAt:message.startAt,
      localStartAt,
      roomCode:room.code,
      playerId:session.playerId
    });
    renderOnlinePlayers();
  }

  function beginProgressSync() {
    stopProgressSync();
    sendProgress();
    progressTimer = setInterval(sendProgress, 600);
  }

  function stopProgressSync() {
    clearInterval(progressTimer);
    progressTimer = null;
  }

  function sendProgress() {
    if (!room || room.status !== 'playing') return;
    const progress = window.KCK_GAME_API?.getOnlineProgress();
    if (!progress) return;
    const me = room.players?.find(player => player.id === session?.playerId);
    if (me) { me.progress = progress; me.connected = true; }
    renderOnlinePlayers();
    send('progress', { progress });
  }

  function finishMatch(reason, progress) {
    stopProgressSync();
    send('finish', { reason, progress });
  }

  function renderLobby() {
    if (!room || !session) return;
    els.lobbyRoomCode.textContent = room.code;
    els.lobbyMode.textContent = room.settings.mode === 'time' ? '30秒' : '10語';
    els.lobbyDifficulty.textContent = LEVEL_LABELS[room.settings.difficulty] || room.settings.difficulty;
    els.lobbyPlayerCount.textContent = `${room.players.length} / ${room.settings.maxPlayers}`;
    els.lobbyPlayerList.innerHTML = '';
    const me = room.players.find(player => player.id === session.playerId);
    room.players.forEach(player => {
      const li = document.createElement('li');
      if (player.id === session.playerId) li.classList.add('self');
      const badges = [];
      if (player.id === room.hostId) badges.push('<span class="lobby-badge host">HOST</span>');
      if (player.ready) badges.push('<span class="lobby-badge ready">READY</span>');
      if (!player.connected) badges.push('<span class="lobby-badge offline">OFFLINE</span>');
      li.innerHTML = `<span class="lobby-player-name">${escapeHtml(player.name)}${player.id === session.playerId ? '（あなた）' : ''}</span><span class="lobby-player-badges">${badges.join('')}</span>`;
      els.lobbyPlayerList.appendChild(li);
    });
    const isHost = session.playerId === room.hostId;
    const connected = room.players.filter(player => player.connected);
    const allReady = connected.length >= 2 && connected.every(player => player.ready);
    els.readyButton.hidden = room.status !== 'lobby';
    els.readyButton.textContent = me?.ready ? '準備を取り消す' : '準備完了';
    els.startOnlineMatchButton.hidden = room.status !== 'lobby' || !isHost;
    els.startOnlineMatchButton.disabled = !allReady;
    els.rematchRoomButton.hidden = room.status !== 'finished' || !isHost;
    if (room.status === 'lobby') setLobbyMessage(isHost ? (allReady ? '全員準備完了。対戦を開始できます。' : '2人以上が準備完了になると開始できます。') : '準備完了にして、ホストの開始を待ってください。');
    if (room.status === 'playing') setLobbyMessage('対戦中です。');
    if (room.status === 'finished') setLobbyMessage(isHost ? '再戦準備へ戻すことができます。' : 'ホストが再戦準備へ戻すのを待っています。');
  }

  function renderOnlinePlayers() {
    if (!room || !session || !els.onlinePlayerGrid) return;
    els.onlineDuelPanel.hidden = room.status !== 'playing';
    els.onlineRoomLabel.textContent = `ROOM ${room.code}`;
    els.onlinePlayerGrid.innerHTML = '';
    room.players.filter(player => room.participantIds?.includes(player.id)).forEach(player => {
      const progress = player.progress || {};
      const card = document.createElement('article');
      card.className = 'online-player-card';
      if (player.id === session.playerId) card.classList.add('self');
      if (!player.connected) card.classList.add('offline');
      if (player.finished) card.classList.add('finished');
      const progressText = room.settings.mode === 'words' ? `${progress.correct || 0}/10語` : `${progress.correct || 0}語`;
      const keys = LETTERS.map(key => `<i class="online-mini-key ${stageClass(progress.keyStages?.[key])}"></i>`).join('');
      card.innerHTML = `<div class="online-player-top"><strong>${escapeHtml(player.name)}</strong><span>${Number(progress.score || 0).toLocaleString('ja-JP')}</span></div><div class="online-player-meta"><span>${escapeHtml(progress.status || '待機中')}</span><span>${progressText}・破損${progress.crashes || 0}</span></div><div class="online-mini-keyboard">${keys}</div>`;
      els.onlinePlayerGrid.appendChild(card);
    });
  }

  function stageClass(stage) {
    return Number(stage) === 1 ? 'warm' : Number(stage) === 2 ? 'danger' : Number(stage) === 3 ? 'broken' : '';
  }

  function toggleReady() {
    const me = room?.players?.find(player => player.id === session?.playerId);
    if (!me) return;
    send('ready', { ready:!me.ready });
  }

  function startOnlineMatch() { send('start'); }
  function rematch() { activeSeed = ''; send('rematch'); }

  function returnToLobby() {
    stopProgressSync();
    showScreen('lobby');
    renderLobby();
  }

  function leaveRoom(options = {}) {
    manualClose = true;
    clearTimeout(reconnectTimer); stopProgressSync();
    if (socket?.readyState === WebSocket.OPEN) send('leave');
    try { socket?.close(1000, 'leave'); } catch {}
    socket = null; room = null; session = null; activeSeed = ''; saveSession();
    if (!options.silent) showScreen('battle');
  }

  async function copyText(text, button, label) {
    try {
      await navigator.clipboard.writeText(text);
      const original = button.textContent; button.textContent = label; setTimeout(() => button.textContent = original, 1300);
    } catch { prompt('コピーしてください', text); }
  }

  function inviteUrl() {
    const url = new URL(location.href);
    url.searchParams.set('room', room?.code || session?.roomCode || '');
    return url.toString();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  }

  function open() {
    const name = defaultName();
    els.createPlayerName.value ||= name;
    els.joinPlayerName.value ||= name;
    const queryCode = normalizeCode(new URL(location.href).searchParams.get('room'));
    if (queryCode) els.joinRoomCode.value = queryCode;
    showScreen('friend');
    checkServer();
  }

  function init() {
    const name = defaultName();
    els.createPlayerName.value = name;
    els.joinPlayerName.value = name;
    const queryCode = normalizeCode(new URL(location.href).searchParams.get('room'));
    if (queryCode) els.joinRoomCode.value = queryCode;
    els.createRoomForm.addEventListener('submit', createRoom);
    els.joinRoomForm.addEventListener('submit', joinRoom);
    els.joinRoomCode.addEventListener('input', () => { els.joinRoomCode.value = normalizeCode(els.joinRoomCode.value); });
    els.friendSetupBackButton.addEventListener('click', () => showScreen('battle'));
    els.readyButton.addEventListener('click', toggleReady);
    els.startOnlineMatchButton.addEventListener('click', startOnlineMatch);
    els.rematchRoomButton.addEventListener('click', rematch);
    els.leaveRoomButton.addEventListener('click', () => leaveRoom());
    els.copyRoomCodeButton.addEventListener('click', () => copyText(room?.code || '', els.copyRoomCodeButton, 'コピー済み'));
    els.copyInviteLinkButton.addEventListener('click', () => copyText(inviteUrl(), els.copyInviteLinkButton, 'コピー済み'));
    if (session && configured()) {
      connect().then(() => { showScreen('lobby'); renderLobby(); }).catch(() => {
        session = null; room = null; saveSession();
      });
    }
  }

  window.KCKOnline = Object.freeze({ open, beginProgressSync, finishMatch, returnToLobby, leaveRoom });
  init();
})();
