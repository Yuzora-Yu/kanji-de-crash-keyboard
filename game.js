(() => {
  'use strict';

  const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert', 'oni'];
  const LEVEL_LABELS = {
    beginner: '初級', intermediate: '中級', advanced: '上級', expert: '超級', oni: '鬼'
  };
  const LEVEL_MULTIPLIERS = { beginner: 1, intermediate: 1.35, advanced: 1.7, expert: 2.2, oni: 3 };
  const KEY_PAIRS = [
    ['a','l'], ['s','k'], ['d','j'], ['f','h'], ['g','y'],
    ['q','p'], ['w','o'], ['e','i'], ['r','u'], ['t','m'],
    ['z','n'], ['x','b'], ['c','v']
  ];
  const ALT_MAP = {};
  KEY_PAIRS.forEach(([a,b]) => { ALT_MAP[a] = b; ALT_MAP[b] = a; });
  const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const WEAR_KEYS = [...LETTERS, 'SHIFT', 'BACKSPACE'];
  const KEY_ROWS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m'],
    ['SHIFT','BACKSPACE','ENTER']
  ];

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
    titleScreen:$('titleScreen'), gameScreen:$('gameScreen'), resultScreen:$('resultScreen'),
    startButton:$('startButton'), tutorialButton:$('tutorialButton'), modalStartButton:$('modalStartButton'),
    helpButton:$('helpButton'), homeButton:$('homeButton'), soundButton:$('soundButton'), aboutButton:$('aboutButton'),
    wordCount:$('wordCount'), wordCards:$('wordCards'), inputDisplay:$('inputDisplay'), feedback:$('feedback'),
    keyboard:$('keyboard'), shiftStatus:$('shiftStatus'), rerollButton:$('rerollButton'),
    hudMode:$('hudMode'), hudLabel:$('hudLabel'), hudValue:$('hudValue'), hudScore:$('hudScore'), hudCrashes:$('hudCrashes'), hudBest:$('hudBest'),
    currentDifficulty:$('currentDifficulty'),
    modalBackdrop:$('modalBackdrop'), helpModal:$('helpModal'), deadlockModal:$('deadlockModal'), deadlockReroll:$('deadlockReroll'),
    resultTitle:$('resultTitle'), resultRank:$('resultRank'), resultMainLabel:$('resultMainLabel'), resultMainValue:$('resultMainValue'),
    resultCorrect:$('resultCorrect'), resultMistakes:$('resultMistakes'), resultCrashes:$('resultCrashes'), resultIntegrity:$('resultIntegrity'), resultComment:$('resultComment'),
    retryButton:$('retryButton'), shareButton:$('shareButton'), backButton:$('backButton')
  };

  let state = freshState();
  let keyEls = {};
  let rafId = null;
  let lastFrame = 0;
  let audioContext = null;
  let soundOn = storageGet('kck-sound') !== 'off';

  function freshState() {
    const health = {};
    WEAR_KEYS.forEach(k => health[k] = { stage:0, brokenRemaining:0, brokenWords:0 });
    return {
      active:false, paused:false, mode:'time', difficulty:'beginner', health,
      input:'', pendingUsed:new Set(), wordUsed:new Set(), words:[], recent:[],
      score:0, correct:0, mistakes:0, crashes:0, rerolls:1,
      elapsed:0, remaining:30, finalIntegrity:100, resultReason:'', lastActualLevel:'beginner'
    };
  }

  function init() {
    renderKeyboard();
    const total = Object.values(window.KCK_WORDS || {}).reduce((n,a) => n + a.length, 0);
    els.wordCount.textContent = total.toLocaleString('ja-JP');
    els.soundButton.textContent = soundOn ? '🔊' : '🔇';
    bindEvents();
    updateKeyboard();
  }

  function bindEvents() {
    els.startButton.addEventListener('click', startGame);
    els.retryButton.addEventListener('click', startGame);
    els.backButton.addEventListener('click', () => showScreen('title'));
    els.homeButton.addEventListener('click', () => {
      if (state.active && !confirm('現在のゲームを終了してタイトルへ戻りますか？')) return;
      stopGameLoop(); state.active = false; closeModals(); showScreen('title');
    });
    els.helpButton.addEventListener('click', () => openModal(els.helpModal));
    els.tutorialButton.addEventListener('click', () => openModal(els.helpModal));
    els.modalStartButton.addEventListener('click', closeModals);
    document.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', closeModals));
    els.modalBackdrop.addEventListener('click', e => { if (e.target === els.modalBackdrop && !state.paused) closeModals(); });
    els.rerollButton.addEventListener('click', useReroll);
    els.deadlockReroll.addEventListener('click', useReroll);
    els.shareButton.addEventListener('click', shareResult);
    els.soundButton.addEventListener('click', () => {
      soundOn = !soundOn; storageSet('kck-sound', soundOn ? 'on' : 'off');
      els.soundButton.textContent = soundOn ? '🔊' : '🔇'; if (soundOn) beep('tap');
    });
    els.aboutButton.addEventListener('click', () => window.open('about.html', '_blank', 'noopener'));
    window.addEventListener('keydown', handleKeyDown, { passive:false });
    window.addEventListener('keyup', handleKeyUp, { passive:false });
    window.addEventListener('blur', () => setShiftVisual(false));
  }

  function renderKeyboard() {
    els.keyboard.innerHTML = '';
    keyEls = {};
    KEY_ROWS.forEach(row => {
      const rowEl = document.createElement('div'); rowEl.className = 'key-row';
      row.forEach(key => {
        const el = document.createElement('div');
        el.className = 'key' + (['SHIFT','BACKSPACE','ENTER'].includes(key) ? ' wide' : '');
        el.dataset.key = key;
        const label = key === 'BACKSPACE' ? '⌫' : key === 'ENTER' ? 'ENTER' : key;
        el.innerHTML = `<span class="main">${label}</span>${LETTERS.includes(key) ? `<span class="alt">${ALT_MAP[key].toUpperCase()}</span>` : ''}`;
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
    state.mode = selected('mode');
    state.difficulty = selected('difficulty');
    state.remaining = 30;
    state.active = true;
    showScreen('game');
    drawWords();
    updateAll();
    lastFrame = performance.now();
    rafId = requestAnimationFrame(gameLoop);
    beep('start');
  }

  function gameLoop(now) {
    if (!state.active) return;
    const dt = Math.min(.1, (now - lastFrame) / 1000 || 0); lastFrame = now;
    if (!state.paused) {
      state.elapsed += dt;
      if (state.mode === 'time') {
        state.remaining = Math.max(0, state.remaining - dt);
        recoverTimedKeys(dt);
        if (state.remaining <= 0) { endGame('TIME UP'); return; }
      }
      updateHud(); updateKeyboardRecoveryLabels();
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
    if (changed) { updateKeyboard(); checkDeadlock(); }
  }

  function handleKeyDown(e) {
    if (e.key === 'Shift') { if (state.active) { e.preventDefault(); setShiftVisual(true); } return; }
    if (e.repeat) return;
    if (!state.active) {
      if (e.key === 'Enter' && !els.helpModal.hidden) { closeModals(); return; }
      if (e.key === 'Enter' && els.titleScreen.classList.contains('active')) startGame();
      else if (e.key === 'Enter' && els.resultScreen.classList.contains('active')) startGame();
      return;
    }
    if (state.paused) return;

    if (/^Key[A-Z]$/.test(e.code)) {
      e.preventDefault();
      const physical = e.code.slice(3).toLowerCase();
      const usingShift = e.shiftKey;
      const target = usingShift ? ALT_MAP[physical] : physical;
      const required = usingShift ? ['SHIFT', physical] : [physical];
      if (!target || required.some(isBroken)) {
        blockedKey(required.find(isBroken) || physical); return;
      }
      state.input += target;
      required.forEach(markUsed);
      animateKey(physical); if (usingShift) animateKey('SHIFT');
      renderInput(); beep('key');
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

  function handleKeyUp(e) { if (e.key === 'Shift') setShiftVisual(false); }
  function setShiftVisual(on) {
    els.keyboard.classList.toggle('shift-on', on);
    els.shiftStatus.classList.toggle('on', on);
    els.shiftStatus.textContent = on ? '反対側入力 ON' : 'Shiftで反対側入力';
  }

  function markUsed(k) { state.pendingUsed.add(k); state.wordUsed.add(k); }
  function isBroken(k) { return state.health[k] && state.health[k].stage === 3; }
  function blockedKey(k) {
    els.feedback.className = 'feedback ng';
    els.feedback.textContent = `${displayKey(k)} は破損中！ Shift＋反対側キーを検討してください`;
    if (keyEls[k]) { keyEls[k].classList.add('just-hit'); setTimeout(() => keyEls[k]?.classList.remove('just-hit'), 160); }
    beep('block');
  }
  function displayKey(k) { return k === 'BACKSPACE' ? 'Backspace' : k === 'SHIFT' ? 'Shift' : k.toUpperCase(); }

  function submitInput() {
    if (!state.input) { flashInput('error'); beep('error'); return; }
    const matched = state.words.find(w => w.readings.some(r => readingMatches(state.input, r)));
    if (matched) correctAnswer(matched); else wrongAnswer();
  }

  function correctAnswer(word) {
    const newlyBroken = applyWear(state.pendingUsed);
    recoverUnusedKeys(state.wordUsed);
    if (state.mode === 'words') progressBrokenWordRecovery(newlyBroken);

    const integrity = getIntegrity();
    const actualLevel = state.lastActualLevel;
    const romanLen = readingToRomajiVariants(word.readings[0])[0].length;
    const mult = LEVEL_MULTIPLIERS[actualLevel];
    const gain = Math.round((100 + romanLen * 8 + integrity * 1.2 + (countBroken() === 0 ? 80 : 0)) * mult);
    state.score += gain;
    state.correct++;
    state.recent.push(word.word); if (state.recent.length > 24) state.recent.shift();
    state.input = ''; state.pendingUsed.clear(); state.wordUsed.clear();
    els.feedback.className = 'feedback ok';
    els.feedback.textContent = `正解：${word.word}（${word.readings.join('／')}） +${gain}`;
    flashInput('success'); beep('correct');
    if (state.mode === 'words' && state.correct >= 20) { endGame('20語クリア'); return; }
    drawWords(); updateAll();
  }

  function wrongAnswer() {
    applyWear(state.pendingUsed);
    state.pendingUsed.clear();
    state.mistakes++;
    state.score = Math.max(0, state.score - 35);
    els.feedback.className = 'feedback ng';
    els.feedback.textContent = `読みが違います（入力：${state.input}）`;
    flashInput('error'); beep('error'); updateAll();
    if (!state.input) checkDeadlock();
  }

  function applyWear(keys) {
    const newlyBroken = new Set();
    keys.forEach(k => {
      const h = state.health[k]; if (!h || h.stage === 3) return;
      h.stage++;
      if (h.stage >= 3) {
        h.stage = 3; state.crashes++; newlyBroken.add(k);
        if (state.mode === 'time') h.brokenRemaining = 10;
        else h.brokenWords = 3;
        crashEffect(k);
      }
    });
    return newlyBroken;
  }

  function recoverUnusedKeys(usedAcrossWord) {
    WEAR_KEYS.forEach(k => {
      const h = state.health[k];
      if (h.stage > 0 && h.stage < 3 && !usedAcrossWord.has(k)) h.stage--;
    });
  }

  function progressBrokenWordRecovery(newlyBroken) {
    WEAR_KEYS.forEach(k => {
      const h = state.health[k];
      if (h.stage === 3 && !newlyBroken.has(k)) {
        h.brokenWords = Math.max(0, h.brokenWords - 1);
        if (h.brokenWords <= 0) restoreKey(k);
      }
    });
  }

  function restoreKey(k) {
    Object.assign(state.health[k], {stage:0, brokenRemaining:0, brokenWords:0});
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
    const source = window.KCK_WORDS[level] || [];
    const desiredRank = state.mode === 'words' ? Math.min(5, 1 + Math.floor((state.correct / 20) * 5)) : 3;
    let pool = source.filter(w => !state.recent.includes(w.word));
    const rankPool = pool.filter(w => Math.abs(w.rank - desiredRank) <= 2);
    if (rankPool.length >= 3) pool = rankPool;
    state.words = sampleUnique(pool.length >= 3 ? pool : source, 3);
    els.currentDifficulty.textContent = LEVEL_LABELS[level];
    renderWords();
    setTimeout(checkDeadlock, 20);
  }

  function chooseActualLevel() {
    if (state.mode === 'time') return state.difficulty;
    const target = LEVELS.indexOf(state.difficulty);
    const start = Math.max(0, target - 2);
    const progress = Math.min(1, state.correct / 19);
    const idx = Math.min(target, Math.round(start + (target - start) * Math.pow(progress, .8)));
    return LEVELS[idx];
  }

  function sampleUnique(arr, count) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i],copy[j]]=[copy[j],copy[i]]; }
    const out=[]; const seen=new Set();
    for (const item of copy) { if (!seen.has(item.word)) { seen.add(item.word); out.push(item); if (out.length===count) break; } }
    return out;
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
    state.rerolls--; state.paused = false; closeModals();
    drawWords(); updateAll(); beep('reroll');
  }

  function checkDeadlock() {
    if (!state.active || state.paused) return;
    const possible = state.words.some(isWordTypeable);
    if (possible) return;
    if (state.rerolls > 0) {
      state.paused = true; openModal(els.deadlockModal, true);
    } else endGame('入力不能');
  }

  function isWordTypeable(word) {
    return word.readings.some(reading => readingToRomajiVariants(reading).some(romaji =>
      [...romaji].every(char => {
        if (!LETTERS.includes(char)) return true;
        if (!isBroken(char)) return true;
        const altPhysical = ALT_MAP[char];
        return !isBroken('SHIFT') && altPhysical && !isBroken(altPhysical);
      })
    ));
  }

  function countBroken() { return WEAR_KEYS.filter(isBroken).length; }
  function getIntegrity() {
    const values = WEAR_KEYS.map(k => [1, .72, .38, 0][state.health[k].stage]);
    return Math.round(values.reduce((a,b)=>a+b,0) / values.length * 100);
  }

  function updateAll() { updateHud(); updateKeyboard(); renderInput(); updateReroll(); }
  function updateHud() {
    if (state.mode === 'time') {
      els.hudMode.textContent = '30秒'; els.hudLabel.textContent = '残り時間'; els.hudValue.textContent = state.remaining.toFixed(1);
    } else {
      els.hudMode.textContent = `${state.elapsed.toFixed(1)}秒`; els.hudLabel.textContent = 'クリア数'; els.hudValue.textContent = `${state.correct} / 20`;
    }
    els.hudScore.textContent = state.score.toLocaleString('ja-JP');
    els.hudCrashes.textContent = state.crashes;
    const best = loadBest(state.mode, state.difficulty); els.hudBest.textContent = best ? best.score.toLocaleString('ja-JP') : '-';
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
      r.textContent = state.mode === 'time' ? `${Math.ceil(h.brokenRemaining)}s` : `あと${h.brokenWords}語`;
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

  function endGame(reason) {
    if (!state.active) return;
    state.active = false; state.paused = false; stopGameLoop(); closeModals();
    state.resultReason = reason; state.finalIntegrity = getIntegrity();
    if (state.mode === 'words' && state.correct >= 20) {
      const timeBonus = Math.max(0, Math.round(12000 - state.elapsed * 120));
      const noCrash = state.crashes === 0 ? 3500 : 0;
      state.score += timeBonus + noCrash;
    }
    saveBest(); renderResult(); showScreen('result'); beep('finish');
  }

  function renderResult() {
    const cleared = state.mode === 'words' && state.correct >= 20;
    els.resultTitle.textContent = state.resultReason;
    els.resultMainLabel.textContent = 'SCORE';
    els.resultMainValue.textContent = state.score.toLocaleString('ja-JP');
    els.resultCorrect.textContent = state.correct;
    els.resultMistakes.textContent = state.mistakes;
    els.resultCrashes.textContent = state.crashes;
    els.resultIntegrity.textContent = `${state.finalIntegrity}%`;
    const rank = calculateRank(); els.resultRank.textContent = rank;
    const timeText = state.mode === 'words' ? `経過 ${state.elapsed.toFixed(2)}秒。` : '';
    let comment = state.crashes === 0 ? 'ノークラッシュ。キーボード管理が完璧です。' : state.crashes <= 2 ? '危険なキーを逃がしながら、さらに伸ばせそうです。' : '派手に壊れました。次は同じ母音の連続使用に注意。';
    if (!cleared && state.mode === 'words') comment = '20語完走には、読める語より「今打てる語」を選ぶ判断も重要です。';
    els.resultComment.textContent = timeText + comment;
  }

  function calculateRank() {
    const base = state.mode === 'time' ? state.score : state.score + (state.correct >= 20 ? 3000 : 0);
    const target = state.mode === 'time' ? [1200,2200,3300,4600] : [3500,6500,9500,13000];
    const m = LEVEL_MULTIPLIERS[state.difficulty];
    const normalized = base / Math.max(1,m);
    return normalized >= target[3] ? 'S' : normalized >= target[2] ? 'A' : normalized >= target[1] ? 'B' : normalized >= target[0] ? 'C' : 'D';
  }

  function bestKey(mode,difficulty) { return `kck-best-v1-${mode}-${difficulty}`; }
  function loadBest(mode,difficulty) { try { return JSON.parse(storageGet(bestKey(mode,difficulty))) || null; } catch { return null; } }
  function saveBest() {
    const old = loadBest(state.mode,state.difficulty);
    const data = {score:state.score,time:state.elapsed,correct:state.correct,crashes:state.crashes,date:new Date().toISOString()};
    const isBetter = !old || state.score > old.score || (state.score === old.score && state.elapsed < old.time);
    if (isBetter) storageSet(bestKey(state.mode,state.difficulty), JSON.stringify(data));
  }

  async function shareResult() {
    const mode = state.mode === 'time' ? '30秒モード' : '20語モード';
    const text = `漢字 de クラッシュキーボード\n${mode}・${LEVEL_LABELS[state.difficulty]}\nSCORE ${state.score.toLocaleString('ja-JP')}｜正解 ${state.correct}｜破損 ${state.crashes}\n読める。でも、そのキーはもう限界。`;
    try {
      if (navigator.share) await navigator.share({title:'漢字 de クラッシュキーボード',text,url:location.href});
      else { await navigator.clipboard.writeText(`${text}\n${location.href}`); els.shareButton.textContent='コピーしました'; setTimeout(()=>els.shareButton.textContent='結果を共有',1300); }
    } catch (e) { if (e.name !== 'AbortError') alert(text); }
  }

  function showScreen(name) {
    [els.titleScreen,els.gameScreen,els.resultScreen].forEach(s=>s.classList.remove('active'));
    ({title:els.titleScreen,game:els.gameScreen,result:els.resultScreen}[name]).classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function openModal(modal, forced=false) {
    els.modalBackdrop.hidden=false; [els.helpModal,els.deadlockModal].forEach(m=>m.hidden=true); modal.hidden=false;
    if (!forced && state.active) state.paused=true;
  }
  function closeModals() {
    els.modalBackdrop.hidden=true; [els.helpModal,els.deadlockModal].forEach(m=>m.hidden=true);
    if (state.active) state.paused=false;
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
      if (KANA_ROMAJI[pair]) {
        units.push({ options: ROMAJI_ALTERNATIVES[pair] || [KANA_ROMAJI[pair]] }); i++;
      } else {
        units.push({ options: ROMAJI_ALTERNATIVES[ch] || [KANA_ROMAJI[ch] || ''] });
      }
    }
    const normalized = [];
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      if (unit.marker === 'っ') {
        const next = units[i + 1];
        if (next?.options) {
          normalized.push({ options: next.options.map(x => (/^[bcdfghjklmpqrstvwxyz]/.test(x) ? x[0] : '') + x) });
          i++;
        }
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
      variants.forEach(prefix => unit.options.forEach(option => {
        if (next.length < 128) next.push(prefix + option);
      }));
      variants = next;
    });
    return [...new Set(variants.map(v => v.toLowerCase()))];
  }

  function readingMatches(input, kana) {
    const normalized = input.toLowerCase().replace(/[^a-z]/g, '');
    return readingToRomajiVariants(kana).includes(normalized);
  }

  function kanaToRomaji(kana) {
    return readingToRomajiVariants(kana)[0] || '';
  }


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

  window.KCK_DEBUG = Object.freeze({ readingToRomajiVariants, readingMatches, kanaToRomaji, romajiToHiragana });
  init();
})();
