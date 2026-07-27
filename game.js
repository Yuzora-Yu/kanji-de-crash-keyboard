(() => {
  'use strict';

  const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert', 'oni'];
  const LEVEL_LABELS = {
    beginner: '初級', intermediate: '中級', advanced: '上級', expert: '超級', oni: '鬼'
  };
  const LEVEL_MULTIPLIERS = { beginner: 1, intermediate: 1.35, advanced: 1.7, expert: 2.2, oni: 3 };
  const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const WEAR_KEYS = [...LETTERS, 'BACKSPACE'];
  const KEY_ROWS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m'],
    ['BACKSPACE','ENTER']
  ];
  const MAX_LIVES = 5;
  const WORD_TARGET = 10;
  const RECOVERY_SECONDS = 10;
  const SCORE_LIMIT = 5;
  const VOWELS = new Set(['a','i','u','e','o']);
  const SHORT_WORD_MAX = 10;
  const CPU_CONFIG = {
    1:{cps:2.6,reaction:[.95,1.55],accuracy:.78,knowledge:.82,difficultyPenalty:.12,rankPenalty:.05,strategy:1},
    2:{cps:3.8,reaction:[.70,1.20],accuracy:.86,knowledge:.89,difficultyPenalty:.09,rankPenalty:.04,strategy:2},
    3:{cps:5.2,reaction:[.50,.90],accuracy:.93,knowledge:.95,difficultyPenalty:.06,rankPenalty:.03,strategy:3},
    4:{cps:6.8,reaction:[.34,.65],accuracy:.975,knowledge:.985,difficultyPenalty:.032,rankPenalty:.016,strategy:4},
    5:{cps:8.6,reaction:[.20,.45],accuracy:.995,knowledge:.998,difficultyPenalty:.012,rankPenalty:.006,strategy:5}
  };

  const ROMAJI = {
    kya:'きゃ',kyu:'きゅ',kyo:'きょ',gya:'ぎゃ',gyu:'ぎゅ',gyo:'ぎょ',
    sha:'しゃ',shu:'しゅ',sho:'しょ',sya:'しゃ',syu:'しゅ',syo:'しょ',
    ja:'じゃ',ju:'じゅ',jo:'じょ',jya:'じゃ',jyu:'じゅ',jyo:'じょ',zya:'じゃ',zyu:'じゅ',zyo:'じょ',
    cha:'ちゃ',chu:'ちゅ',cho:'ちょ',cya:'ちゃ',cyu:'ちゅ',cyo:'ちょ',tya:'ちゃ',tyu:'ちゅ',tyo:'ちょ',
    nya:'にゃ',nyu:'にゅ',nyo:'にょ',hya:'ひゃ',hyu:'ひゅ',hyo:'ひょ',
    bya:'びゃ',byu:'びゅ',byo:'びょ',pya:'ぴゃ',pyu:'ぴゅ',pyo:'ぴょ',
    mya:'みゃ',myu:'みゅ',myo:'みょ',rya:'りゃ',ryu:'りゅ',ryo:'りょ',
    dya:'ぢゃ',dyu:'ぢゅ',dyo:'ぢょ',
    shi:'し',chi:'ち',tsu:'つ',
    ka:'か',ki:'き',ku:'く',ke:'け',ko:'こ',ga:'が',gi:'ぎ',gu:'ぐ',ge:'げ',go:'ご',
    sa:'さ',si:'し',su:'す',se:'せ',so:'そ',za:'ざ',zi:'じ',zu:'ず',ze:'ぜ',zo:'ぞ',ji:'じ',
    ta:'た',ti:'ち',tu:'つ',te:'て',to:'と',da:'だ',di:'ぢ',du:'づ',de:'で',do:'ど',
    na:'な',ni:'に',nu:'ぬ',ne:'ね',no:'の',
    ha:'は',hi:'ひ',hu:'ふ',fu:'ふ',he:'へ',ho:'ほ',ba:'ば',bi:'び',bu:'ぶ',be:'べ',bo:'ぼ',pa:'ぱ',pi:'ぴ',pu:'ぷ',pe:'ぺ',po:'ぽ',
    ma:'ま',mi:'み',mu:'む',me:'め',mo:'も',ya:'や',yu:'ゆ',yo:'よ',
    ra:'ら',ri:'り',ru:'る',re:'れ',ro:'ろ',wa:'わ',wo:'を',
    a:'あ',i:'い',u:'う',e:'え',o:'お'
  };
  const KANA_ROMAJI = {
    'きゃ':'kya','きゅ':'kyu','きょ':'kyo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
    'しゃ':'sha','しゅ':'shu','しょ':'sho','じゃ':'ja','じゅ':'ju','じょ':'jo',
    'ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo',
    'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','びゃ':'bya','びゅ':'byu','びょ':'byo',
    'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo','みゃ':'mya','みゅ':'myu','みょ':'myo',
    'りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぢゃ':'dya','ぢゅ':'dyu','ぢょ':'dyo',
    'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
    'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
    'だ':'da','ぢ':'di','づ':'du','で':'de','ど':'do','な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
    'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
    'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
    'や':'ya','ゆ':'yu','よ':'yo','ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'wo','ん':'n'
  };
  const ROMAJI_ALTERNATIVES = {
    'し':['shi','si'], 'しゃ':['sha','sya'], 'しゅ':['shu','syu'], 'しょ':['sho','syo'],
    'ち':['chi','ti'], 'ちゃ':['cha','tya','cya'], 'ちゅ':['chu','tyu','cyu'], 'ちょ':['cho','tyo','cyo'],
    'つ':['tsu','tu'], 'ふ':['fu','hu'], 'じ':['ji','zi'], 'じゃ':['ja','jya','zya'],
    'じゅ':['ju','jyu','zyu'], 'じょ':['jo','jyo','zyo'], 'ぢ':['di','ji'], 'づ':['du','zu'], 'を':['wo','o']
  };

  const $ = id => document.getElementById(id);
  const els = {
    titleScreen:$('titleScreen'), battleScreen:$('battleScreen'), cpuSetupScreen:$('cpuSetupScreen'), gameScreen:$('gameScreen'), resultScreen:$('resultScreen'), highscoreScreen:$('highscoreScreen'),
    startButton:$('startButton'), battleButton:$('battleButton'), cpuBattleButton:$('cpuBattleButton'), battleBackButton:$('battleBackButton'),
    startCpuButton:$('startCpuButton'), cpuSetupBackButton:$('cpuSetupBackButton'), tutorialButton:$('tutorialButton'), modalStartButton:$('modalStartButton'),
    helpButton:$('helpButton'), homeButton:$('homeButton'), soundButton:$('soundButton'), aboutButton:$('aboutButton'),
    highscoreButton:$('highscoreButton'), resultHighscoreButton:$('resultHighscoreButton'), highscoreBackButton:$('highscoreBackButton'),
    shareHighscoresButton:$('shareHighscoresButton'),
    wordCount:$('wordCount'), wordCards:$('wordCards'), inputDisplay:$('inputDisplay'), feedback:$('feedback'),
    keyboard:$('keyboard'), rerollButton:$('rerollButton'),
    hudMode:$('hudMode'), hudLabel:$('hudLabel'), hudValue:$('hudValue'), hudScore:$('hudScore'), hudCrashes:$('hudCrashes'), hudBest:$('hudBest'), hudBestLabel:$('hudBestLabel'), hudLives:$('hudLives'), hudLivesItem:$('hudLivesItem'),
    duelPanel:$('duelPanel'), duelPlayerScore:$('duelPlayerScore'), duelPlayerStatus:$('duelPlayerStatus'), duelCpuName:$('duelCpuName'),
    duelCpuScore:$('duelCpuScore'), duelCpuStatus:$('duelCpuStatus'), duelCpuProgress:$('duelCpuProgress'), duelCpuLives:$('duelCpuLives'), duelCpuCrashes:$('duelCpuCrashes'), cpuMiniKeyboard:$('cpuMiniKeyboard'),
    currentDifficulty:$('currentDifficulty'),
    modalBackdrop:$('modalBackdrop'), helpModal:$('helpModal'),
    resultTitle:$('resultTitle'), resultRank:$('resultRank'), resultMainLabel:$('resultMainLabel'), resultMainValue:$('resultMainValue'),
    resultCorrect:$('resultCorrect'), resultMistakes:$('resultMistakes'), resultCrashes:$('resultCrashes'), resultIntegrity:$('resultIntegrity'), resultComment:$('resultComment'),
    resultAnswers:$('resultAnswers'), resultAnswerList:$('resultAnswerList'), battleResult:$('battleResult'), battleResultHeading:$('battleResultHeading'),
    battlePlayerScore:$('battlePlayerScore'), battlePlayerDetail:$('battlePlayerDetail'), battleCpuLabel:$('battleCpuLabel'), battleCpuScore:$('battleCpuScore'), battleCpuDetail:$('battleCpuDetail'),
    retryButton:$('retryButton'), shareButton:$('shareButton'), backButton:$('backButton'),
    highscoreModeLabel:$('highscoreModeLabel'), highscoreDifficultyLabel:$('highscoreDifficultyLabel'), highscoreCount:$('highscoreCount'),
    highscoreList:$('highscoreList'), highscoreEmpty:$('highscoreEmpty')
  };

  let state = freshState();
  let keyEls = {};
  let rafId = null;
  let lastFrame = 0;
  let audioContext = null;
  let soundOn = storageGet('kck-sound') !== 'off';
  let highscoreReturnScreen = 'title';
  let lastPlayKind = 'solo';

  function freshState() {
    const health = {};
    WEAR_KEYS.forEach(k => health[k] = { stage:0, brokenRemaining:0 });
    return {
      active:false, paused:false, mode:'time', difficulty:'beginner', playKind:'solo', cpuLevel:3, health,
      input:'', pendingUsed:new Set(), wordUsed:new Set(), words:[], recent:[],
      score:0, correct:0, mistakes:0, crashes:0, rerolls:1, lives:MAX_LIVES,
      elapsed:0, remaining:30, finalIntegrity:100, resultReason:'', lastActualLevel:'beginner',
      playerFinished:false, playerFinishTime:0, playerResultReason:'', battle:null
    };
  }

  function init() {
    renderKeyboard();
    renderCpuMiniKeyboard();
    const total = Object.values(window.KCK_WORDS || {}).reduce((n,a) => n + a.length, 0);
    els.wordCount.textContent = total.toLocaleString('ja-JP');
    els.soundButton.textContent = soundOn ? '🔊' : '🔇';
    bindEvents();
    updateKeyboard();
    syncScoreFiltersFromSetup();
  }

  function bindEvents() {
    els.startButton.addEventListener('click', startGame);
    els.battleButton.addEventListener('click', () => showScreen('battle'));
    els.cpuBattleButton.addEventListener('click', openCpuSetup);
    els.battleBackButton.addEventListener('click', () => showScreen('title'));
    els.startCpuButton.addEventListener('click', startCpuBattle);
    els.cpuSetupBackButton.addEventListener('click', () => showScreen('battle'));
    els.retryButton.addEventListener('click', retryGame);
    els.backButton.addEventListener('click', () => showScreen(state.playKind === 'cpu' ? 'cpu' : 'title'));
    els.highscoreButton.addEventListener('click', () => openHighscores('title'));
    els.resultHighscoreButton.addEventListener('click', () => openHighscores('result'));
    els.highscoreBackButton.addEventListener('click', () => showScreen(highscoreReturnScreen));
    els.shareHighscoresButton.addEventListener('click', shareHighscores);
    document.querySelectorAll('input[name="scoreMode"], input[name="scoreDifficulty"]').forEach(input => input.addEventListener('change', renderHighscores));
    els.homeButton.addEventListener('click', () => {
      if (state.active && !confirm('現在のゲームを終了してタイトルへ戻りますか？')) return;
      stopGameLoop(); state.active = false; closeModals(); showScreen('title');
    });
    els.helpButton.addEventListener('click', () => openModal(els.helpModal));
    els.tutorialButton.addEventListener('click', () => openModal(els.helpModal));
    els.modalStartButton.addEventListener('click', closeModals);
    document.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', closeModals));
    els.modalBackdrop.addEventListener('click', e => { if (e.target === els.modalBackdrop) closeModals(); });
    els.rerollButton.addEventListener('click', useReroll);
    els.shareButton.addEventListener('click', shareResult);
    els.soundButton.addEventListener('click', () => {
      soundOn = !soundOn; storageSet('kck-sound', soundOn ? 'on' : 'off');
      els.soundButton.textContent = soundOn ? '🔊' : '🔇'; if (soundOn) beep('tap');
    });
    els.aboutButton.addEventListener('click', () => window.open('about.html', '_blank', 'noopener'));
    window.addEventListener('keydown', handleKeyDown, { passive:false });
  }

  function renderCpuMiniKeyboard() {
    els.cpuMiniKeyboard.innerHTML = '';
    LETTERS.forEach(key => {
      const el = document.createElement('i'); el.className = 'mini-key'; el.dataset.cpuKey = key;
      els.cpuMiniKeyboard.appendChild(el);
    });
  }

  function renderKeyboard() {
    els.keyboard.innerHTML = '';
    keyEls = {};
    KEY_ROWS.forEach(row => {
      const rowEl = document.createElement('div'); rowEl.className = 'key-row';
      row.forEach(key => {
        const el = document.createElement('div');
        el.className = 'key' + (['BACKSPACE','ENTER'].includes(key) ? ' wide' : '');
        el.dataset.key = key;
        const label = key === 'BACKSPACE' ? '⌫' : key === 'ENTER' ? 'ENTER' : key;
        el.innerHTML = `<span class="main">${label}</span>`;
        rowEl.appendChild(el); keyEls[key] = el;
      });
      els.keyboard.appendChild(rowEl);
    });
  }

  function selected(name) {
    return document.querySelector(`input[name="${name}"]:checked`).value;
  }

  function startGame() {
    closeModals();
    stopGameLoop();
    state = freshState();
    state.playKind = 'solo';
    state.mode = selected('mode');
    state.difficulty = selected('difficulty');
    state.remaining = 30;
    state.active = true;
    lastPlayKind = 'solo';
    document.body.classList.remove('player-finished');
    showScreen('game');
    drawWords();
    updateAll();
    lastFrame = performance.now();
    rafId = requestAnimationFrame(gameLoop);
    beep('start');
  }

  function openCpuSetup() {
    const mode = selected('mode');
    const difficulty = selected('difficulty');
    const modeInput = document.querySelector(`input[name="cpuMode"][value="${mode}"]`);
    const difficultyInput = document.querySelector(`input[name="cpuDifficulty"][value="${difficulty}"]`);
    if (modeInput) modeInput.checked = true;
    if (difficultyInput) difficultyInput.checked = true;
    showScreen('cpu');
  }

  function startCpuBattle() {
    closeModals();
    stopGameLoop();
    state = freshState();
    state.playKind = 'cpu';
    state.mode = selected('cpuMode');
    state.difficulty = selected('cpuDifficulty');
    state.cpuLevel = Number(selected('cpuLevel'));
    state.remaining = 30;
    state.active = true;
    state.battle = {
      seed:`${Date.now()}-${Math.random().toString(36).slice(2)}`,
      cpu:freshCpuState(state.cpuLevel), cache:new Map(), playerRerollRound:-1
    };
    lastPlayKind = 'cpu';
    document.body.classList.remove('player-finished');
    showScreen('game');
    drawWords();
    cpuDrawWords();
    updateAll();
    lastFrame = performance.now();
    rafId = requestAnimationFrame(gameLoop);
    beep('start');
  }

  function retryGame() { if (lastPlayKind === 'cpu') startCpuBattle(); else startGame(); }

  function gameLoop(now) {
    if (!state.active) return;
    const dt = Math.min(.1, (now - lastFrame) / 1000 || 0); lastFrame = now;
    if (!state.paused) {
      state.elapsed += dt;
      recoverTimedKeys(dt);
      if (state.playKind === 'cpu') updateCpu(dt);
      if (!state.active) return;
      if (state.mode === 'time') {
        state.remaining = Math.max(0, state.remaining - dt);
        if (state.remaining <= 0) {
          if (state.playKind === 'cpu') endTimedBattle(); else endGame('TIME UP');
          return;
        }
      }
      updateHud(); updateKeyboardRecoveryLabels(); updateWaitingNotice(); updateDuelPanel();
    }
    rafId = requestAnimationFrame(gameLoop);
  }

  function stopGameLoop() { if (rafId) cancelAnimationFrame(rafId); rafId = null; }

  function recoverTimedKeys(dt) {
    let changed = false;
    WEAR_KEYS.forEach(k => {
      const h = state.health[k];
      if (h.stage === 3) {
        h.brokenRemaining = Math.max(0, h.brokenRemaining - dt);
        if (h.brokenRemaining <= 0) { restoreKey(k); changed = true; }
      }
    });
    if (changed) updateKeyboard();
  }

  function handleKeyDown(e) {
    if (e.repeat) return;
    if (!state.active) {
      if (e.key === 'Enter' && !els.helpModal.hidden) { closeModals(); return; }
      if (e.key === 'Enter' && els.titleScreen.classList.contains('active')) startGame();
      else if (e.key === 'Enter' && els.cpuSetupScreen.classList.contains('active')) startCpuBattle();
      else if (e.key === 'Enter' && els.resultScreen.classList.contains('active')) retryGame();
      return;
    }
    if (state.paused || state.playerFinished) return;

    if (/^Key[A-Z]$/.test(e.code)) {
      e.preventDefault();
      const key = e.code.slice(3).toLowerCase();
      if (isBroken(key)) { blockedKey(key); return; }
      state.input += key;
      markUsed(key);
      animateKey(key); renderInput(); beep('key');
      return;
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (isBroken('BACKSPACE')) { blockedKey('BACKSPACE'); return; }
      markUsed('BACKSPACE'); animateKey('BACKSPACE');
      state.input = state.input.slice(0, -1); renderInput(); beep('back'); return;
    }
    if (e.key === 'Enter') {
      e.preventDefault(); animateKey('ENTER'); submitInput();
    }
  }

  function markUsed(k) { state.pendingUsed.add(k); state.wordUsed.add(k); }
  function isBroken(k) { return state.health[k] && state.health[k].stage === 3; }
  function blockedKey(k) {
    els.feedback.className = 'feedback ng';
    els.feedback.textContent = `${displayKey(k)} は破損中。復活まで ${Math.ceil(state.health[k].brokenRemaining)} 秒`;
    if (keyEls[k]) { keyEls[k].classList.add('just-hit'); setTimeout(() => keyEls[k]?.classList.remove('just-hit'), 160); }
    beep('block');
  }
  function displayKey(k) { return k === 'BACKSPACE' ? 'Backspace' : k.toUpperCase(); }

  function submitInput() {
    if (!state.input) { flashInput('error'); beep('error'); return; }
    let matched = null;
    for (const word of state.words) {
      const reading = word.readings.find(r => readingMatches(state.input, r));
      if (reading) { matched = { word, reading }; break; }
    }
    if (matched) correctAnswer(matched.word, matched.reading); else wrongAnswer();
  }

  function correctAnswer(word, matchedReading) {
    applyWear(state.pendingUsed);
    recoverUnusedKeys(state.wordUsed);

    const integrity = getIntegrity();
    const actualLevel = state.lastActualLevel;
    // 実際に確定した入力数を採点する。shi / si などの打ち方で得点と摩耗対象が変わる。
    const submittedRomaji = state.input.toLowerCase().replace(/[^a-z]/g, '');
    const romanLen = submittedRomaji.length;
    const lengthBonus = romanLen * 12;
    const mult = LEVEL_MULTIPLIERS[actualLevel];
    const gain = Math.round((100 + lengthBonus + integrity * 1.2 + (countBroken() === 0 ? 80 : 0)) * mult);
    state.score += gain;
    state.correct++;
    state.recent.push(word.word); if (state.recent.length > 24) state.recent.shift();
    state.input = ''; state.pendingUsed.clear(); state.wordUsed.clear();
    els.feedback.className = 'feedback ok';
    els.feedback.textContent = `正解：${word.word}（${matchedReading}） +${gain}｜入力${romanLen}字`;
    flashInput('success'); beep('correct');
    if (state.mode === 'words' && state.correct >= WORD_TARGET) {
      if (state.playKind === 'cpu') finishPlayerBattle('10語クリア'); else endGame('10語クリア');
      return;
    }
    drawWords(); updateAll();
  }

  function wrongAnswer() {
    applyWear(state.pendingUsed);
    state.pendingUsed.clear();
    state.mistakes++;
    state.score = Math.max(0, state.score - 35);
    if (state.mode === 'words') state.lives = Math.max(0, state.lives - 1);
    els.feedback.className = 'feedback ng';
    els.feedback.textContent = state.mode === 'words'
      ? `読みが違います（残りHP ${state.lives}）`
      : `読みが違います（入力：${state.input}）`;
    flashInput('error'); beep('error'); updateAll();
    if (state.mode === 'words' && state.lives <= 0) {
      if (state.playKind === 'cpu') finishPlayerBattle('GAME OVER'); else endGame('GAME OVER');
    }
  }

  function applyWear(keys) {
    keys.forEach(k => {
      const h = state.health[k]; if (!h || h.stage === 3) return;
      h.stage++;
      if (h.stage >= 3) {
        h.stage = 3; h.brokenRemaining = RECOVERY_SECONDS; state.crashes++;
        crashEffect(k);
      }
    });
  }

  function recoverUnusedKeys(usedAcrossWord) {
    WEAR_KEYS.forEach(k => {
      const h = state.health[k];
      if (h.stage > 0 && h.stage < 3 && !usedAcrossWord.has(k)) h.stage--;
    });
  }

  function restoreKey(k) {
    Object.assign(state.health[k], {stage:0, brokenRemaining:0});
    if (keyEls[k]) { keyEls[k].animate([{filter:'brightness(2)'},{filter:'none'}], {duration:350}); }
  }

  function crashEffect(k) {
    updateKeyboard(); beep('crash');
    const el = keyEls[k]; if (!el) return;
    el.animate([
      {transform:'translate(0,0) rotate(0)'}, {transform:'translate(-5px,1px) rotate(-4deg)'},
      {transform:'translate(5px,-2px) rotate(4deg)'}, {transform:'translateY(4px) rotate(-2deg)'}
    ], {duration:420, easing:'ease-out'});
    els.feedback.className = 'feedback ng'; els.feedback.textContent = `${displayKey(k)} がクラッシュ！`;
  }

  function drawWords() {
    state.input = ''; state.pendingUsed.clear(); state.wordUsed.clear(); renderInput();
    const level = chooseActualLevel(); state.lastActualLevel = level;
    if (state.playKind === 'cpu') {
      const variant = state.battle.playerRerollRound === state.correct ? 1 : 0;
      state.words = getBattleWordSet(state.correct, variant);
    } else {
      const source = window.KCK_WORDS[level] || [];
      const desiredRank = desiredRankFor(level, state.correct);
      let pool = source.filter(w => !state.recent.includes(w.word));
      pool = filterPoolByRank(pool, source, level, desiredRank);
      state.words = chooseBalancedWordSet(pool.length >= 3 ? pool : source, Math.random);
    }
    els.currentDifficulty.textContent = LEVEL_LABELS[level];
    renderWords(); updateWaitingNotice();
  }

  function chooseActualLevel() {
    if (state.mode === 'time' || state.difficulty === 'oni') return state.difficulty;
    const target = LEVELS.indexOf(state.difficulty);
    const start = Math.max(0, target - 2);
    const progress = Math.min(1, state.correct / Math.max(1, WORD_TARGET - 1));
    const idx = Math.min(target, Math.round(start + (target - start) * Math.pow(progress, .8)));
    return LEVELS[idx];
  }

  function desiredRankFor(level, round) {
    if (level === 'oni') return 5;
    if (state.mode === 'words') return Math.min(5, 1 + Math.floor((round / WORD_TARGET) * 5));
    return 3;
  }

  function filterPoolByRank(pool, fallback, level, desiredRank) {
    if (level === 'oni') {
      const rank5 = pool.filter(w => w.rank === 5);
      if (rank5.length >= 3) return rank5;
      const hard = pool.filter(w => w.rank >= 4);
      if (hard.length >= 3) return hard;
      const fallback5 = fallback.filter(w => w.rank === 5);
      return fallback5.length >= 3 ? fallback5 : fallback;
    }
    const rankPool = pool.filter(w => Math.abs(w.rank - desiredRank) <= 2);
    return rankPool.length >= 3 ? rankPool : pool;
  }

  const wordProfileCache = new WeakMap();
  function wordTypingProfile(word) {
    if (wordProfileCache.has(word)) return wordProfileCache.get(word);
    const variants = word.readings.flatMap(readingToRomajiVariants).filter(Boolean);
    variants.sort((a,b) => a.length - b.length || new Set(a).size - new Set(b).size || a.localeCompare(b));
    const romaji = variants[0] || '';
    const keys = new Set([...romaji].filter(c => LETTERS.includes(c)));
    const vowels = new Set([...keys].filter(c => VOWELS.has(c)));
    const profile = {romaji, length:romaji.length, keys, vowels};
    wordProfileCache.set(word, profile);
    return profile;
  }

  function setIntersection(sets) {
    if (!sets.length) return new Set();
    const out = new Set(sets[0]);
    for (const set of sets.slice(1)) for (const value of [...out]) if (!set.has(value)) out.delete(value);
    return out;
  }

  function setUnion(sets) {
    const out = new Set();
    sets.forEach(set => set.forEach(value => out.add(value)));
    return out;
  }

  function jaccard(a,b) {
    const union = new Set([...a,...b]);
    if (!union.size) return 0;
    let common=0; a.forEach(value => { if (b.has(value)) common++; });
    return common / union.size;
  }

  function wordSetBalanceScore(words) {
    const p = words.map(wordTypingProfile);
    const allShort = p.every(x => x.length <= SHORT_WORD_MAX);
    const keyUnion = setUnion(p.map(x => x.keys));
    const vowelUnion = setUnion(p.map(x => x.vowels));
    const commonKeys = setIntersection(p.map(x => x.keys));
    const commonVowels = setIntersection(p.map(x => x.vowels));
    const overlaps = [jaccard(p[0].keys,p[1].keys),jaccard(p[0].keys,p[2].keys),jaccard(p[1].keys,p[2].keys)];
    const avgOverlap = overlaps.reduce((a,b)=>a+b,0)/overlaps.length;
    const lengthSpread = Math.max(...p.map(x=>x.length)) - Math.min(...p.map(x=>x.length));
    let score = keyUnion.size * 7 + vowelUnion.size * 15 + lengthSpread * 1 - avgOverlap * 100 - commonKeys.size * 18;
    if (allShort) {
      score -= commonVowels.size * 120;
      if (vowelUnion.size <= 2) score -= 100;
      if (avgOverlap >= .55) score -= 90;
      if (commonKeys.size >= 3) score -= 90;
    } else {
      score += p.reduce((sum,x)=>sum+Math.max(0,x.length-SHORT_WORD_MAX)*3,0);
      score -= commonVowels.size * 28;
    }
    return score;
  }

  function chooseBalancedWordSet(pool, randomFn=Math.random) {
    const unique=[]; const seen=new Set();
    for (const item of pool) if (!seen.has(item.word)) { seen.add(item.word); unique.push(item); }
    if (unique.length <= 3) return unique.slice(0,3);
    const copy=unique.slice();
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(randomFn()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    const candidates=copy.slice(0,Math.min(72,copy.length));
    const trials=Math.min(360,Math.max(90,candidates.length*5));
    let best=null, bestScore=-Infinity;
    for(let t=0;t<trials;t++){
      const indices=new Set();
      while(indices.size<3) indices.add(Math.floor(randomFn()*candidates.length));
      const trio=[...indices].map(i=>candidates[i]);
      const score=wordSetBalanceScore(trio)+randomFn()*9;
      if(score>bestScore){bestScore=score;best=trio;}
    }
    return best || copy.slice(0,3);
  }

  function renderWords() {
    els.wordCards.innerHTML = '';
    state.words.forEach(w => {
      const card = document.createElement('article'); card.className = 'word-card';
      card.innerHTML = `<strong>${escapeHtml(w.word)}</strong>`;
      els.wordCards.appendChild(card);
    });
  }

  function useReroll() {
    if (!state.active || state.rerolls <= 0) return;
    state.rerolls--;
    if (state.playKind === 'cpu') state.battle.playerRerollRound = state.correct;
    drawWords(); updateAll(); beep('reroll');
  }

  function isWordTypeable(word) {
    return word.readings.some(reading => readingToRomajiVariants(reading).some(romaji =>
      [...romaji].every(char => !LETTERS.includes(char) || !isBroken(char))
    ));
  }

  function secondsUntilWordTypeable(word) {
    let best = Infinity;
    word.readings.forEach(reading => readingToRomajiVariants(reading).forEach(romaji => {
      let wait = 0;
      for (const char of romaji) {
        if (LETTERS.includes(char) && isBroken(char)) wait = Math.max(wait, state.health[char].brokenRemaining);
      }
      best = Math.min(best, wait);
    }));
    return best;
  }

  function updateWaitingNotice() {
    if (!state.active || state.playerFinished || !state.words.length) return;
    if (state.words.some(isWordTypeable)) {
      if (els.feedback.dataset.waiting === '1') {
        els.feedback.textContent = ''; els.feedback.className = 'feedback'; delete els.feedback.dataset.waiting;
      }
      return;
    }
    const wait = Math.min(...state.words.map(secondsUntilWordTypeable));
    els.feedback.dataset.waiting = '1';
    els.feedback.className = 'feedback ng waiting';
    els.feedback.textContent = `3語とも現在は入力不能。最短 ${Math.max(1, Math.ceil(wait))} 秒で復活します。待つか、再抽選できます。`;
  }

  function countBroken() { return WEAR_KEYS.filter(isBroken).length; }
  function getIntegrity() {
    const values = WEAR_KEYS.map(k => [1, .72, .38, 0][state.health[k].stage]);
    return Math.round(values.reduce((a,b)=>a+b,0) / values.length * 100);
  }

  function updateAll() { updateHud(); updateKeyboard(); renderInput(); updateReroll(); updateWaitingNotice(); updateDuelPanel(); }
  function updateHud() {
    if (state.mode === 'time') {
      els.hudMode.textContent = '30秒'; els.hudLabel.textContent = '残り時間'; els.hudValue.textContent = state.remaining.toFixed(1);
      els.hudLivesItem.hidden = true;
    } else {
      els.hudMode.textContent = `${state.elapsed.toFixed(1)}秒`; els.hudLabel.textContent = 'クリア数'; els.hudValue.textContent = `${state.correct} / ${WORD_TARGET}`;
      els.hudLivesItem.hidden = false; els.hudLives.innerHTML = renderHearts(state.lives);
    }
    els.hudScore.textContent = state.score.toLocaleString('ja-JP');
    els.hudCrashes.textContent = state.crashes;
    if (state.playKind === 'cpu') {
      els.hudBestLabel.textContent = 'CPU LV'; els.hudBest.textContent = state.cpuLevel;
    } else {
      els.hudBestLabel.textContent = 'BEST';
      const best = loadScores(state.mode, state.difficulty)[0]; els.hudBest.textContent = best ? best.score.toLocaleString('ja-JP') : '-';
    }
  }

  function renderHearts(lives) {
    return Array.from({length:MAX_LIVES}, (_,i) => `<span class="heart ${i < lives ? 'alive' : 'lost'}">♥</span>`).join('');
  }

  function updateReroll() {
    els.rerollButton.disabled = state.rerolls <= 0;
    const b = els.rerollButton.querySelector('b'); if (b) b.textContent = state.rerolls;
  }

  function updateKeyboard() {
    WEAR_KEYS.forEach(k => {
      const el = keyEls[k]; if (!el) return;
      el.classList.remove('warm','danger','broken');
      const stage = state.health[k].stage;
      if (stage === 1) el.classList.add('warm');
      if (stage === 2) el.classList.add('danger');
      if (stage === 3) el.classList.add('broken');
      el.setAttribute('aria-label', `${displayKey(k)} ${['正常','黄色','赤色','破損'][stage]}`);
    });
    updateKeyboardRecoveryLabels();
  }

  function updateKeyboardRecoveryLabels() {
    WEAR_KEYS.forEach(k => {
      const el = keyEls[k]; if (!el) return;
      el.querySelector('.recover')?.remove();
      const h = state.health[k]; if (h.stage !== 3) return;
      const r = document.createElement('span'); r.className = 'recover';
      r.textContent = `${Math.ceil(h.brokenRemaining)}s`;
      el.appendChild(r);
    });
  }

  function renderInput() {
    const safe = escapeHtml(state.input);
    els.inputDisplay.innerHTML = state.input ? `<span>${safe}</span><i class="caret"></i>` : `<span class="placeholder">ここに入力</span><i class="caret"></i>`;
    els.inputDisplay.classList.toggle('active', state.active && !state.paused);
  }

  function flashInput(cls) {
    els.inputDisplay.classList.remove('error','success'); void els.inputDisplay.offsetWidth;
    els.inputDisplay.classList.add(cls); setTimeout(() => els.inputDisplay.classList.remove(cls), 350);
  }
  function animateKey(k) {
    const el=keyEls[k]; if(!el)return; el.classList.remove('just-hit'); void el.offsetWidth; el.classList.add('just-hit');
    setTimeout(()=>el.classList.remove('just-hit'),160);
  }

  function makeHealth() {
    const health = {}; WEAR_KEYS.forEach(k => health[k] = {stage:0, brokenRemaining:0}); return health;
  }

  function freshCpuState(level) {
    return {
      level, health:makeHealth(), score:0, correct:0, mistakes:0, crashes:0, lives:MAX_LIVES,
      elapsed:0, finished:false, finishTime:0, resultReason:'', finalIntegrity:100,
      words:[], rerolls:1, rerollRound:-1, plan:null, decisionDelay:.45, status:'考え中'
    };
  }

  function hashString(value) {
    let h = 2166136261;
    for (let i=0;i<value.length;i++) { h ^= value.charCodeAt(i); h = Math.imul(h,16777619); }
    return h >>> 0;
  }
  function mulberry32(seed) {
    return function() { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function seededValue(key) { return mulberry32(hashString(`${state.battle.seed}|${key}`))(); }
  function chooseLevelForRound(round) {
    if (state.mode === 'time' || state.difficulty === 'oni') return state.difficulty;
    const target = LEVELS.indexOf(state.difficulty), start = Math.max(0,target-2);
    const progress = Math.min(1, round / Math.max(1, WORD_TARGET - 1));
    return LEVELS[Math.min(target,Math.round(start+(target-start)*Math.pow(progress,.8)))];
  }
  function getBattleWordSet(round, variant=0) {
    const key = `${round}:${variant}`;
    if (state.battle.cache.has(key)) return state.battle.cache.get(key);
    const level = chooseLevelForRound(round), source = window.KCK_WORDS[level] || [];
    const desiredRank = desiredRankFor(level, round);
    let pool = filterPoolByRank(source, source, level, desiredRank);
    const rand = mulberry32(hashString(`${state.battle.seed}|words|${key}|${level}`));
    const out = chooseBalancedWordSet(pool.length >= 3 ? pool : source, rand);
    state.battle.cache.set(key,out); return out;
  }

  function cpuDrawWords() {
    const cpu=state.battle.cpu; if(cpu.finished)return;
    const variant=cpu.rerollRound===cpu.correct?1:0;
    cpu.words=getBattleWordSet(cpu.correct,variant); cpu.plan=null; cpu.decisionDelay=.18+seededValue(`decision-${cpu.correct}-${cpu.mistakes}`)*.35; cpu.status='考え中';
  }
  function cpuIsBroken(cpu,key){return cpu.health[key]?.stage===3;}
  function cpuIntegrity(cpu){const vals=WEAR_KEYS.map(k=>[1,.72,.38,0][cpu.health[k].stage]);return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*100);}
  function cpuBrokenCount(cpu){return WEAR_KEYS.filter(k=>cpuIsBroken(cpu,k)).length;}
  function cpuRecover(dt){
    const cpu=state.battle.cpu;
    WEAR_KEYS.forEach(k=>{const h=cpu.health[k];if(h.stage===3){h.brokenRemaining=Math.max(0,h.brokenRemaining-dt);if(h.brokenRemaining<=0)Object.assign(h,{stage:0,brokenRemaining:0});}});
  }
  function cpuApplyWear(cpu,keys){
    keys.forEach(k=>{const h=cpu.health[k];if(!h||h.stage===3)return;h.stage++;if(h.stage>=3){h.stage=3;h.brokenRemaining=RECOVERY_SECONDS;cpu.crashes++;}});
  }
  function cpuRecoverUnused(cpu,used){WEAR_KEYS.forEach(k=>{const h=cpu.health[k];if(h.stage>0&&h.stage<3&&!used.has(k))h.stage--;});}
  function cpuKnows(word,reading,index){
    const cpu=state.battle.cpu,cfg=CPU_CONFIG[cpu.level],actual=LEVELS.indexOf(chooseLevelForRound(cpu.correct));
    const chance=Math.max(.05,Math.min(.999,cfg.knowledge-actual*cfg.difficultyPenalty-(Math.max(1,word.rank)-1)*cfg.rankPenalty));
    return seededValue(`know-${cpu.correct}-${index}-${reading}`)<chance;
  }
  function cpuCandidateScore(cpu,variant){
    const used=new Set([...variant].filter(c=>LETTERS.includes(c)));let risk=0,breaks=0;
    used.forEach(k=>{const stage=cpu.health[k].stage;risk+=stage*1.5+1;if(stage===2)breaks++;});
    const integrity=cpuIntegrity(cpu),mult=LEVEL_MULTIPLIERS[chooseLevelForRound(cpu.correct)];
    const gain=Math.round((100+variant.length*12+integrity*1.2+(cpuBrokenCount(cpu)===0?80:0))*mult);
    return {used,risk,breaks,gain};
  }
  function chooseCpuPlan(){
    const cpu=state.battle.cpu,cfg=CPU_CONFIG[cpu.level],candidates=[];
    cpu.words.forEach((word,wi)=>word.readings.forEach(reading=>{
      if(!cpuKnows(word,reading,wi))return;
      readingToRomajiVariants(reading).forEach(variant=>{
        if([...variant].some(c=>LETTERS.includes(c)&&cpuIsBroken(cpu,c)))return;
        const calc=cpuCandidateScore(cpu,variant);candidates.push({word,reading,variant,...calc});
      });
    }));
    if(!candidates.length){
      const waits=cpu.words.flatMap(w=>w.readings.flatMap(r=>readingToRomajiVariants(r).map(v=>Math.max(0,...[...v].map(c=>cpuIsBroken(cpu,c)?cpu.health[c].brokenRemaining:0)))));
      const wait=Math.min(...waits.filter(Number.isFinite),RECOVERY_SECONDS);
      if(cpu.rerolls>0&&wait>(6-cpu.level)) {cpu.rerolls--;cpu.rerollRound=cpu.correct;cpuDrawWords();cpu.status='再抽選';return;}
      if(seededValue(`guess-${cpu.correct}-${cpu.mistakes}`)<.55){
        const letters='aiueokstnmrhg';let fake='';const len=2+Math.floor(seededValue(`guesslen-${cpu.correct}-${cpu.mistakes}`)*5);
        for(let i=0;i<len;i++)fake+=letters[Math.floor(seededValue(`guesschar-${cpu.correct}-${cpu.mistakes}-${i}`)*letters.length)];
        const usable=[...fake].filter(c=>!cpuIsBroken(cpu,c));if(usable.length){scheduleCpuPlan({variant:usable.join(''),used:new Set(usable),correct:false});return;}
      }
      cpu.status=`復活待ち ${Math.max(1,Math.ceil(wait))}秒`;cpu.decisionDelay=.25;return;
    }
    let chosen;
    if(cfg.strategy===1) chosen=candidates[Math.floor(seededValue(`choose-${cpu.correct}-${cpu.mistakes}`)*candidates.length)];
    else if(cfg.strategy===2) chosen=candidates.sort((a,b)=>a.breaks-b.breaks||a.variant.length-b.variant.length)[0];
    else {
      const riskWeight=cfg.strategy===3?34:cfg.strategy===4?48:60;
      candidates.forEach(c=>c.utility=c.gain+c.variant.length*(cfg.strategy-2)*6-c.risk*riskWeight-c.breaks*180);
      candidates.sort((a,b)=>b.utility-a.utility);chosen=candidates[0];
    }
    const accurate=seededValue(`accuracy-${cpu.correct}-${cpu.mistakes}`)<cfg.accuracy;
    scheduleCpuPlan({...chosen,correct:accurate});
  }
  function scheduleCpuPlan(plan){
    const cpu=state.battle.cpu,cfg=CPU_CONFIG[cpu.level];
    const reaction=cfg.reaction[0]+seededValue(`react-${cpu.correct}-${cpu.mistakes}`)*(cfg.reaction[1]-cfg.reaction[0]);
    cpu.plan={...plan,remaining:reaction+Math.max(1,plan.variant.length)/cfg.cps};cpu.status=`入力中 ${plan.variant.length}字`;
  }
  function completeCpuPlan(){
    const cpu=state.battle.cpu,plan=cpu.plan;cpu.plan=null;if(!plan)return;
    cpuApplyWear(cpu,plan.used);
    if(plan.correct&&plan.word){
      cpuRecoverUnused(cpu,plan.used);
      const integrity=cpuIntegrity(cpu),mult=LEVEL_MULTIPLIERS[chooseLevelForRound(cpu.correct)];
      const gain=Math.round((100+plan.variant.length*12+integrity*1.2+(cpuBrokenCount(cpu)===0?80:0))*mult);
      cpu.score+=gain;cpu.correct++;cpu.status='正解';
      if(state.mode==='words'&&cpu.correct>=WORD_TARGET){finishCpuBattle('10語クリア');return;}
      cpuDrawWords();
    }else{
      cpu.mistakes++;cpu.score=Math.max(0,cpu.score-35);if(state.mode==='words')cpu.lives=Math.max(0,cpu.lives-1);cpu.status='ミス';
      if(state.mode==='words'&&cpu.lives<=0){finishCpuBattle('GAME OVER');return;}
      cpu.decisionDelay=.25+seededValue(`retry-${cpu.correct}-${cpu.mistakes}`)*.45;
    }
  }
  function updateCpu(dt){
    const cpu=state.battle.cpu;if(!cpu||cpu.finished)return;cpu.elapsed+=dt;cpuRecover(dt);
    if(cpu.plan){cpu.plan.remaining-=dt;if(cpu.plan.remaining<=0)completeCpuPlan();return;}
    cpu.decisionDelay-=dt;if(cpu.decisionDelay<=0)chooseCpuPlan();
  }
  function applyFinishBonus(participant){
    if(state.mode==='words'&&participant.correct>=WORD_TARGET){const timeBonus=Math.max(0,Math.round(12000-participant.finishTime*120));const noCrash=participant.crashes===0?3500:0;participant.score+=timeBonus+noCrash;}
  }
  function finishPlayerBattle(reason){
    if(state.playerFinished)return;state.playerFinished=true;state.playerFinishTime=state.elapsed;state.playerResultReason=reason;state.resultReason=reason;state.finalIntegrity=getIntegrity();applyFinishBonus({
      get score(){return state.score},set score(v){state.score=v},correct:state.correct,finishTime:state.playerFinishTime,crashes:state.crashes
    });
    document.body.classList.add('player-finished');state.input='';renderInput();els.feedback.className='feedback ok';els.feedback.textContent=reason==='10語クリア'?'完走！ CPUの終了を待っています。':'ゲームオーバー。CPUの終了を待っています。';checkBattleComplete();
  }
  function finishCpuBattle(reason){
    const cpu=state.battle.cpu;if(cpu.finished)return;cpu.finished=true;cpu.finishTime=cpu.elapsed;cpu.resultReason=reason;cpu.finalIntegrity=cpuIntegrity(cpu);applyFinishBonus(cpu);cpu.status=reason;checkBattleComplete();
  }
  function endTimedBattle(){
    if(!state.playerFinished){state.playerFinished=true;state.playerFinishTime=30;state.playerResultReason='TIME UP';state.resultReason='TIME UP';state.finalIntegrity=getIntegrity();}
    const cpu=state.battle.cpu;if(!cpu.finished){cpu.finished=true;cpu.finishTime=30;cpu.resultReason='TIME UP';cpu.finalIntegrity=cpuIntegrity(cpu);}
    endBattle();
  }
  function checkBattleComplete(){if(state.playerFinished&&state.battle.cpu.finished)endBattle();}
  function compareBattle(){
    const cpu=state.battle.cpu;if(state.score!==cpu.score)return state.score>cpu.score?1:-1;if(state.correct!==cpu.correct)return state.correct>cpu.correct?1:-1;if(state.crashes!==cpu.crashes)return state.crashes<cpu.crashes?1:-1;const pt=state.playerFinishTime||state.elapsed,ct=cpu.finishTime||cpu.elapsed;if(pt!==ct)return pt<ct?1:-1;return 0;
  }
  function endBattle(){
    if(!state.active)return;state.active=false;state.paused=false;stopGameLoop();closeModals();state.battle.outcome=compareBattle();
    state.resultReason=state.battle.outcome>0?'CPU戦 勝利':state.battle.outcome<0?'CPU戦 敗北':'CPU戦 引き分け';renderResult();showScreen('result');beep('finish');
  }
  function battleOutcomeLabel(){return state.battle?.outcome>0?'WIN':state.battle?.outcome<0?'LOSE':'DRAW';}
  function battleRankText(){return state.battle?.outcome>0?'1st':state.battle?.outcome<0?'2nd':'DRAW';}
  function battleComment(){
    const out=state.battle?.outcome||0;if(out>0)return`CPU Lv${state.cpuLevel}に勝利。同じ問題でも、入力経路とキー管理で差がつきました。`;if(out<0)return`CPU Lv${state.cpuLevel}の勝利。長い入力の得点と、破損リスクの配分を見直せそうです。`;return'完全な引き分け。同じ条件で、もう一度決着を。';
  }
  function renderBattleResult(){
    const battle=state.playKind==='cpu'&&state.battle;els.battleResult.hidden=!battle;if(!battle)return;const cpu=state.battle.cpu;
    els.battleResultHeading.textContent=`${battleOutcomeLabel()}｜CPU Lv${state.cpuLevel}`;
    els.battlePlayerScore.textContent=state.score.toLocaleString('ja-JP');els.battleCpuLabel.textContent=`CPU Lv${state.cpuLevel}`;els.battleCpuScore.textContent=cpu.score.toLocaleString('ja-JP');
    els.battlePlayerDetail.textContent=battleDetail(state.correct,state.mistakes,state.crashes,state.playerFinishTime,state.playerResultReason);
    els.battleCpuDetail.textContent=battleDetail(cpu.correct,cpu.mistakes,cpu.crashes,cpu.finishTime,cpu.resultReason);
  }
  function battleDetail(correct,mistakes,crashes,time,reason){const t=state.mode==='words'?`・${Number(time||0).toFixed(2)}秒`:'';return`${correct}語・ミス${mistakes}・破損${crashes}${t}・${reason}`;}
  function updateDuelPanel(){
    const battle=state.playKind==='cpu'&&state.battle;els.duelPanel.hidden=!battle;if(!battle)return;const cpu=state.battle.cpu;
    els.duelPlayerScore.textContent=state.score.toLocaleString('ja-JP');els.duelPlayerStatus.textContent=state.playerFinished?state.resultReason:`${state.correct}${state.mode==='words'?`/${WORD_TARGET}`:''}語`;
    els.duelCpuName.textContent=`CPU Lv${state.cpuLevel}`;els.duelCpuScore.textContent=cpu.score.toLocaleString('ja-JP');els.duelCpuStatus.textContent=cpu.status;
    els.duelCpuProgress.textContent=`${cpu.correct}${state.mode==='words'?`/${WORD_TARGET}`:''}語`;els.duelCpuLives.textContent=state.mode==='words'?'♥'.repeat(cpu.lives)+'♡'.repeat(MAX_LIVES-cpu.lives):'';els.duelCpuCrashes.textContent=`破損 ${cpu.crashes}`;
    LETTERS.forEach(k=>{const el=els.cpuMiniKeyboard.querySelector(`[data-cpu-key="${k}"]`);if(!el)return;el.className='mini-key';const stage=cpu.health[k].stage;if(stage===1)el.classList.add('warm');if(stage===2)el.classList.add('danger');if(stage===3)el.classList.add('broken');});
  }

  function endGame(reason) {
    if (!state.active) return;
    state.active = false; state.paused = false; stopGameLoop(); closeModals();
    state.resultReason = reason; state.finalIntegrity = getIntegrity();
    if (state.mode === 'words' && state.correct >= WORD_TARGET) {
      const timeBonus = Math.max(0, Math.round(12000 - state.elapsed * 120));
      const noCrash = state.crashes === 0 ? 3500 : 0;
      state.score += timeBonus + noCrash;
    }
    if (state.playKind === 'solo') saveScore();
    renderResult(); showScreen('result'); beep('finish');
  }

  function renderResult() {
    const cleared = state.mode === 'words' && state.correct >= WORD_TARGET;
    const battle = state.playKind === 'cpu';
    els.resultRank.classList.toggle('battle-rank', battle);
    els.resultTitle.textContent = state.resultReason;
    els.resultMainLabel.textContent = 'SCORE';
    els.resultMainValue.textContent = state.score.toLocaleString('ja-JP');
    els.resultCorrect.textContent = state.correct;
    els.resultMistakes.textContent = state.mistakes;
    els.resultCrashes.textContent = state.crashes;
    els.resultIntegrity.textContent = `${state.finalIntegrity}%`;
    const rank = calculateRank(); els.resultRank.textContent = battle ? battleRankText() : rank;
    const resultElapsed = battle ? state.playerFinishTime : state.elapsed;
    const timeText = state.mode === 'words' ? `経過 ${resultElapsed.toFixed(2)}秒。` : '';
    let comment = state.crashes === 0 ? 'ノークラッシュ。キーボード管理が完璧です。' : state.crashes <= 2 ? '危険なキーを逃がしながら、さらに伸ばせそうです。' : '派手に壊れました。次は同じ母音の連続使用に注意。';
    if (!cleared && state.mode === 'words') comment = '5回の誤入力でゲームオーバー。読める語と、正確に打てる語の見極めが重要です。';
    if (battle) comment = battleComment();
    els.resultComment.textContent = timeText + comment;
    const playerReason = battle ? state.playerResultReason : state.resultReason;
    const showAnswers = (!cleared && (playerReason.includes('TIME UP') || playerReason.includes('GAME OVER'))) || (battle && state.mode === 'time');
    renderResultAnswers(showAnswers);
    renderBattleResult();
    els.resultHighscoreButton.hidden = battle;
    els.backButton.textContent = battle ? 'CPU戦設定へ戻る' : '設定へ戻る';
  }

  function renderResultAnswers(show) {
    els.resultAnswers.hidden = !show;
    els.resultAnswerList.innerHTML = '';
    if (!show) return;
    state.words.forEach(word => {
      const item = document.createElement('article'); item.className = 'result-answer-item';
      const readings = word.readings.map(reading => `<li><span>${escapeHtml(reading)}</span><code>${escapeHtml(kanaToRomaji(reading))}</code></li>`).join('');
      item.innerHTML = `<strong>${escapeHtml(word.word)}</strong><ul>${readings}</ul>`;
      els.resultAnswerList.appendChild(item);
    });
  }

  function calculateRank() {
    const base = state.mode === 'time' ? state.score : state.score + (state.correct >= WORD_TARGET ? 3000 : 0);
    const target = state.mode === 'time' ? [1200,2200,3300,4600] : [3500,6500,9500,13000];
    const m = LEVEL_MULTIPLIERS[state.difficulty];
    const normalized = base / Math.max(1,m);
    return normalized >= target[3] ? 'S' : normalized >= target[2] ? 'A' : normalized >= target[1] ? 'B' : normalized >= target[0] ? 'C' : 'D';
  }

  function scoresKey(mode,difficulty) { return mode === 'words' ? `kck-scores-v3-10words-${difficulty}` : `kck-scores-v2-${mode}-${difficulty}`; }
  function oldBestKey(mode,difficulty) { return `kck-best-v1-${mode}-${difficulty}`; }
  function loadScores(mode,difficulty) {
    let list = [];
    try { list = JSON.parse(storageGet(scoresKey(mode,difficulty))) || []; } catch { list = []; }
    if (!Array.isArray(list)) list = [];
    if (!list.length && mode === 'time') {
      try {
        const old = JSON.parse(storageGet(oldBestKey(mode,difficulty)));
        if (old && Number.isFinite(old.score)) list = [{...old, mistakes:0, cleared:true, reason:'旧記録'}];
      } catch {}
    }
    return list.sort(compareScores).slice(0,SCORE_LIMIT);
  }
  function compareScores(a,b) {
    if (b.score !== a.score) return b.score - a.score;
    if ((b.correct || 0) !== (a.correct || 0)) return (b.correct || 0) - (a.correct || 0);
    return (a.time || Infinity) - (b.time || Infinity);
  }
  function saveScore() {
    const data = {
      score:state.score, time:Number(state.elapsed.toFixed(3)), correct:state.correct, crashes:state.crashes,
      mistakes:state.mistakes, cleared:state.mode === 'time' || state.correct >= WORD_TARGET, reason:state.resultReason,
      date:new Date().toISOString()
    };
    const list = [...loadScores(state.mode,state.difficulty), data].sort(compareScores).slice(0,SCORE_LIMIT);
    storageSet(scoresKey(state.mode,state.difficulty), JSON.stringify(list));
  }

  function syncScoreFiltersFromSetup() {
    const mode = selected('mode');
    const difficulty = selected('difficulty');
    const modeInput = document.querySelector(`input[name="scoreMode"][value="${mode}"]`);
    const difficultyInput = document.querySelector(`input[name="scoreDifficulty"][value="${difficulty}"]`);
    if (modeInput) modeInput.checked = true;
    if (difficultyInput) difficultyInput.checked = true;
  }

  function openHighscores(returnScreen) {
    highscoreReturnScreen = returnScreen;
    if (returnScreen === 'result') {
      const modeInput = document.querySelector(`input[name="scoreMode"][value="${state.mode}"]`);
      const difficultyInput = document.querySelector(`input[name="scoreDifficulty"][value="${state.difficulty}"]`);
      if (modeInput) modeInput.checked = true;
      if (difficultyInput) difficultyInput.checked = true;
    } else syncScoreFiltersFromSetup();
    renderHighscores(); showScreen('highscore');
  }

  function renderHighscores() {
    const mode = selected('scoreMode');
    const difficulty = selected('scoreDifficulty');
    const list = loadScores(mode,difficulty);
    els.highscoreModeLabel.textContent = mode === 'time' ? '30秒モード' : '10語モード';
    els.highscoreDifficultyLabel.textContent = LEVEL_LABELS[difficulty];
    els.highscoreCount.textContent = `${list.length} / ${SCORE_LIMIT}`;
    els.highscoreList.innerHTML = '';
    els.highscoreEmpty.hidden = list.length > 0;
    list.forEach((record,index) => {
      const li = document.createElement('li');
      const date = record.date ? new Date(record.date).toLocaleDateString('ja-JP') : '-';
      const sub = mode === 'time'
        ? `正解 ${record.correct || 0}語・破損 ${record.crashes || 0}回・${date}`
        : `${record.correct || 0}/${WORD_TARGET}語・${Number(record.time || 0).toFixed(2)}秒・誤入力 ${record.mistakes || 0}回・${date}`;
      li.innerHTML = `<span class="score-rank">${index + 1}</span><div><strong>${Number(record.score || 0).toLocaleString('ja-JP')}</strong><small>${escapeHtml(sub)}</small></div>`;
      els.highscoreList.appendChild(li);
    });
  }

  async function shareResult() {
    const mode = state.mode === 'time' ? '30秒モード' : '10語モード';
    const versus = state.playKind === 'cpu' && state.battle
      ? `\nCPU Lv${state.cpuLevel}戦 ${battleOutcomeLabel()}｜YOU ${state.score.toLocaleString('ja-JP')} - CPU ${state.battle.cpu.score.toLocaleString('ja-JP')}`
      : '';
    const text = `漢字 de クラッシュキーボード\n${mode}・${LEVEL_LABELS[state.difficulty]}${versus}\nSCORE ${state.score.toLocaleString('ja-JP')}｜正解 ${state.correct}｜破損 ${state.crashes}\n読める。でも、そのキーはもう限界。`;
    await shareTextOrCopy(text, els.shareButton, '結果を共有');
  }

  async function shareHighscores() {
    const mode = selected('scoreMode');
    const difficulty = selected('scoreDifficulty');
    const list = loadScores(mode,difficulty);
    const modeLabel = mode === 'time' ? '30秒モード' : '10語モード';
    const text = `漢字 de クラッシュキーボード\nLOCAL TOP 5｜${modeLabel}・${LEVEL_LABELS[difficulty]}\n${list.map((r,i)=>`${i+1}. ${r.score.toLocaleString('ja-JP')}`).join(' / ') || 'まだ記録なし'}`;
    try {
      const blob = await createHighscoreImage(list, mode, difficulty);
      const file = new File([blob], 'kanji-de-crash-keyboard-top5.png', {type:'image/png'});
      if (navigator.share && navigator.canShare?.({files:[file]})) {
        await navigator.share({title:'漢字 de クラッシュキーボード TOP 5', text, url:location.href, files:[file]});
        return;
      }
      downloadBlob(blob, 'kanji-de-crash-keyboard-top5.png');
      await copyText(`${text}\n${location.href}`);
      temporaryButtonLabel(els.shareHighscoresButton, '画像保存＋文面コピー', 'ランキング画像を共有');
    } catch (e) {
      if (e.name !== 'AbortError') await shareTextOrCopy(text, els.shareHighscoresButton, 'ランキング画像を共有');
    }
  }

  function createHighscoreImage(list, mode, difficulty) {
    return new Promise((resolve,reject) => {
      const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      const bg = ctx.createLinearGradient(0,0,1200,1200); bg.addColorStop(0,'#11131b'); bg.addColorStop(1,'#252a38');
      ctx.fillStyle = bg; ctx.fillRect(0,0,1200,1200);
      ctx.fillStyle = '#51e5b4'; ctx.font = '900 42px system-ui, sans-serif'; ctx.fillText('KANJI × KEYBOARD SURVIVAL', 80, 95);
      ctx.fillStyle = '#f6f3ea'; ctx.font = '900 76px system-ui, sans-serif'; ctx.fillText('漢字 de クラッシュキーボード', 80, 195);
      ctx.fillStyle = '#aab0c0'; ctx.font = '700 38px system-ui, sans-serif';
      ctx.fillText(`LOCAL TOP 5｜${mode === 'time' ? '30秒モード' : '10語モード'}・${LEVEL_LABELS[difficulty]}`, 80, 260);
      for (let i=0;i<SCORE_LIMIT;i++) {
        const y = 350 + i*135;
        ctx.fillStyle = i === 0 ? '#173f36' : '#1c202c'; roundRect(ctx,80,y-66,1040,105,22); ctx.fill();
        ctx.fillStyle = i === 0 ? '#51e5b4' : '#f6f3ea'; ctx.font = '900 46px system-ui, sans-serif'; ctx.fillText(`${i+1}`, 115, y);
        const r = list[i];
        if (r) {
          ctx.fillStyle = '#f6f3ea'; ctx.font = '900 48px system-ui, sans-serif'; ctx.fillText(Number(r.score).toLocaleString('ja-JP'), 210, y);
          ctx.fillStyle = '#aab0c0'; ctx.font = '600 26px system-ui, sans-serif';
          const detail = mode === 'time' ? `正解 ${r.correct || 0}語　破損 ${r.crashes || 0}回` : `${r.correct || 0}/${WORD_TARGET}語　${Number(r.time || 0).toFixed(2)}秒　誤入力 ${r.mistakes || 0}回`;
          ctx.fillText(detail, 560, y);
        } else {
          ctx.fillStyle = '#697083'; ctx.font = '700 34px system-ui, sans-serif'; ctx.fillText('NO RECORD', 210, y);
        }
      }
      ctx.fillStyle = '#aab0c0'; ctx.font = '600 30px system-ui, sans-serif'; ctx.fillText('読める。でも、そのキーはもう限界。', 80, 1080);
      ctx.fillStyle = '#51e5b4'; ctx.font = '800 28px system-ui, sans-serif'; ctx.fillText('#漢字deクラッシュキーボード', 80, 1135);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('画像生成に失敗しました')), 'image/png');
    });
  }

  function roundRect(ctx,x,y,w,h,r) {
    const rr = Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath();
  }

  async function shareTextOrCopy(text, button, defaultLabel) {
    try {
      if (navigator.share) await navigator.share({title:'漢字 de クラッシュキーボード',text,url:location.href});
      else { await copyText(`${text}\n${location.href}`); temporaryButtonLabel(button,'コピーしました',defaultLabel); }
    } catch (e) { if (e.name !== 'AbortError') alert(text); }
  }
  async function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const area=document.createElement('textarea'); area.value=text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
  }
  function temporaryButtonLabel(button,label,defaultLabel) { button.textContent=label; setTimeout(()=>button.textContent=defaultLabel,1600); }
  function downloadBlob(blob,name) { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }

  function showScreen(name) {
    [els.titleScreen,els.battleScreen,els.cpuSetupScreen,els.gameScreen,els.resultScreen,els.highscoreScreen].forEach(s=>s.classList.remove('active'));
    ({title:els.titleScreen,battle:els.battleScreen,cpu:els.cpuSetupScreen,game:els.gameScreen,result:els.resultScreen,highscore:els.highscoreScreen}[name]).classList.add('active');
    document.body.classList.toggle('game-view', name === 'game');
    window.scrollTo({top:0,behavior:name === 'game' ? 'auto' : 'smooth'});
  }
  function openModal(modal) {
    els.modalBackdrop.hidden=false; els.helpModal.hidden=true; modal.hidden=false;
    if (state.active) state.paused=true;
  }
  function closeModals() {
    els.modalBackdrop.hidden=true; els.helpModal.hidden=true;
    if (state.active) { state.paused=false; lastFrame=performance.now(); }
  }

  function romajiToHiragana(input) {
    const s = input.toLowerCase().replace(/[^a-z']/g,'');
    let out='',i=0;
    while(i<s.length){
      const c=s[i], next=s[i+1]||'';
      if (c===next && /[bcdfghjklmpqrstvwxyz]/.test(c) && c!=='n') { out+='っ'; i++; continue; }
      if (c==='n') {
        if (!next) { out+='ん'; i++; continue; }
        if (next==="'") { out+='ん'; i+=2; continue; }
        if (next==='n') { out+='ん'; i++; continue; }
        if (!/[aiueoy]/.test(next)) { out+='ん'; i++; continue; }
      }
      let found=false;
      for (const len of [3,2,1]) {
        const part=s.slice(i,i+len);
        if (ROMAJI[part]) { out+=ROMAJI[part]; i+=len; found=true; break; }
      }
      if (!found) return '';
    }
    return out;
  }

  function readingToRomajiVariants(kana) {
    const units = [];
    for (let i = 0; i < kana.length; i++) {
      const ch = kana[i];
      if (ch === 'っ' || ch === 'ん') { units.push({ marker: ch }); continue; }
      const pair = kana.slice(i, i + 2);
      if (KANA_ROMAJI[pair]) { units.push({ options: ROMAJI_ALTERNATIVES[pair] || [KANA_ROMAJI[pair]] }); i++; }
      else units.push({ options: ROMAJI_ALTERNATIVES[ch] || [KANA_ROMAJI[ch] || ''] });
    }
    const normalized = [];
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      if (unit.marker === 'っ') {
        const next = units[i + 1];
        if (next?.options) { normalized.push({ options: next.options.map(x => (/^[bcdfghjklmpqrstvwxyz]/.test(x) ? x[0] : '') + x) }); i++; }
        continue;
      }
      if (unit.marker === 'ん') {
        const nextOptions = units[i + 1]?.options || [];
        const ambiguous = nextOptions.some(x => /^[aiueoy]/.test(x));
        const beforeN = nextOptions.some(x => /^n/.test(x));
        normalized.push({ options: beforeN ? ['n'] : ambiguous ? ['nn','n'] : ['n','nn'] });
        continue;
      }
      normalized.push(unit);
    }
    let variants = [''];
    normalized.forEach(unit => {
      const next = [];
      variants.forEach(prefix => unit.options.forEach(option => { if (next.length < 128) next.push(prefix + option); }));
      variants = next;
    });
    return [...new Set(variants.map(v => v.toLowerCase()))];
  }

  function readingMatches(input, kana) {
    const normalized = input.toLowerCase().replace(/[^a-z]/g, '');
    return readingToRomajiVariants(kana).includes(normalized);
  }
  function kanaToRomaji(kana) { return readingToRomajiVariants(kana)[0] || ''; }

  function beep(type) {
    if (!soundOn) return;
    try {
      audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
      const o=audioContext.createOscillator(), g=audioContext.createGain();
      const cfg={key:[460,.025,.025],back:[260,.025,.02],correct:[760,.10,.055],error:[145,.12,.07],crash:[80,.22,.09],block:[110,.07,.04],start:[520,.12,.05],finish:[660,.22,.06],reroll:[360,.08,.04],tap:[500,.04,.02]}[type]||[400,.04,.02];
      o.frequency.value=cfg[0]; o.type=type==='crash'?'sawtooth':'square'; g.gain.value=cfg[2];
      o.connect(g);g.connect(audioContext.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+cfg[1]);o.stop(audioContext.currentTime+cfg[1]);
    } catch {}
  }

  function storageGet(key) { try { return window.localStorage.getItem(key); } catch { return null; } }
  function storageSet(key, value) { try { window.localStorage.setItem(key, value); } catch {} }
  function escapeHtml(s) { return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  window.KCK_DEBUG = Object.freeze({ readingToRomajiVariants, readingMatches, kanaToRomaji, romajiToHiragana, loadScores, hashString, mulberry32, wordTypingProfile, wordSetBalanceScore, chooseBalancedWordSet, getState:()=>state });
  init();
})();
