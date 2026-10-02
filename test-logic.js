/* Headless smoke test for the KILLER game logic.
   Stubs just enough DOM to run index.html's script block in node.
   Run:  node test-logic.js        (does not touch index.html) */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const js = html.match(/<script>([\s\S]*)<\/script>/)[1];

/* ---- minimal DOM ---- */
const mkEl = (id) => ({
  id, textContent: '', innerHTML: '', className: '',
  style: { _v: {}, setProperty(k, v) { this._v[k] = v; }, getProperty(k) { return this._v[k]; } },
  classList: {
    _s: new Set(),
    add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
    toggle(c, on) { on ? this._s.add(c) : this._s.delete(c); },
    contains(c) { return this._s.has(c); },
  },
  _handlers: {},
  addEventListener(t, fn) { (this._handlers[t] = this._handlers[t] || []).push(fn); },
  fire(t, ev = {}) { (this._handlers[t] || []).forEach(fn => fn({ preventDefault() {}, ...ev })); },
  setPointerCapture() {},
  setAttribute(k, v) { this['_' + k] = String(v); },
});

const els = {};
const getEl = (id) => (els[id] = els[id] || mkEl(id));
['hold', 'holdTxt', 'passName', 'passCount', 'nPlayers', 'nKillers', 'rRole', 'wLabel',
  'wWord', 'startName', 'blur'].forEach(getEl);

const screens = ['s-home', 's-settings', 's-credits', 's-pass', 's-reveal', 's-start'].map(getEl);

global.document = {
  getElementById: getEl,
  querySelectorAll: (sel) => (sel === '.screen' ? screens : []),
};
global.window = { addEventListener() {} };
global.navigator = {};
global.localStorage = {
  _d: {},
  getItem(k) { return k in this._d ? this._d[k] : null; },
  setItem(k, v) { this._d[k] = String(v); },
};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.Audio = function () { return { volume: 0, currentTime: 0, play() { return Promise.resolve(); } }; };

/* run the game script in this scope */
const ctx = {};
const runner = new Function(js + '\n;return {cfg:()=>cfg, chg, startGame, reveal, doneReveal, abortGame, words:()=>words, starter:()=>starter, BANK, MIN_PLAYERS, MAX_PLAYERS, maxKillers, loadCfg, ALL_KILLERS_CHANCE, ALL_INNOCENT_CHANCE, resetSeen:()=>{seen=new Set();lastWord=null;}, reloadSeen:()=>{seen=loadSeen();}};');
const G = runner.call(global);

/* ---- assertions ---- */
let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
};
const ok = (name, cond) => eq(name, !!cond, true);

/* startGame's first Math.random call decides the round type, so replacing
   only that one call pins the mode and leaves everything else random. */
const withRoll = (v, fn) => {
  const real = Math.random;
  let first = true;
  Math.random = () => { if (first) { first = false; return v; } return real(); };
  try { return fn(); } finally { Math.random = real; }
};
const NORMAL = 0.5;                    // any roll above the chaos thresholds

/* clamping: players */
for (let i = 0; i < 50; i++) G.chg('players', 1);
eq('players clamp high', G.cfg().players, G.MAX_PLAYERS);
for (let i = 0; i < 50; i++) G.chg('players', -1);
eq('players clamp low', G.cfg().players, G.MIN_PLAYERS);

/* clamping: killers never reaches players (would leave <2 innocents) */
for (let i = 0; i < 50; i++) G.chg('killers', 1);
eq('killers clamp at half table (4p)', G.cfg().killers, 2);
ok('killers < players', G.cfg().killers < G.cfg().players);
for (let i = 0; i < 50; i++) G.chg('killers', -1);
eq('killers clamp low', G.cfg().killers, 1);

/* killers gets pulled down when players shrinks */
for (let i = 0; i < 12; i++) G.chg('players', 1);   // -> 16
for (let i = 0; i < 12; i++) G.chg('killers', 1);   // -> 8
eq('killers max at 16p', G.cfg().killers, 8);
for (let i = 0; i < 12; i++) G.chg('players', -1);  // -> 4
ok('killers re-clamped after players drop', G.cfg().killers <= G.maxKillers(G.cfg().players));

/* settings persist */
ok('cfg persisted to localStorage', localStorage.getItem('killer.cfg') !== null);
eq('reload restores cfg', G.loadCfg(), G.cfg());

/* corrupt storage must not brick the game */
localStorage.setItem('killer.cfg', '{"players":9999,"killers":-5}');
eq('corrupt cfg is clamped', G.loadCfg(), { players: G.MAX_PLAYERS, killers: 1 });
localStorage.setItem('killer.cfg', 'not json at all');
eq('garbage cfg falls back', G.loadCfg(), { players: 4, killers: 1 });

/* dealing: exactly N killers, all innocents share one word, killers share the hint */
const configure = (players, killers) => {
  while (G.cfg().players > players) G.chg('players', -1);
  while (G.cfg().players < players) G.chg('players', 1);
  while (G.cfg().killers > killers) G.chg('killers', -1);
  while (G.cfg().killers < killers) G.chg('killers', 1);
};
const deal = (players, killers) => {
  configure(players, killers);
  withRoll(NORMAL, () => G.startGame());
  return G.words();
};
for (const [p, k] of [[4, 1], [4, 2], [7, 3], [16, 8], [10, 1]]) {
  const w = deal(p, k);
  eq(`deal ${p}p/${k}k length`, w.length, p);
  eq(`deal ${p}p/${k}k killer count`, w.filter(x => x.role === 'killer').length, k);
  const iw = new Set(w.filter(x => x.role === 'innocent').map(x => x.word));
  const kw = new Set(w.filter(x => x.role === 'killer').map(x => x.word));
  eq(`deal ${p}p/${k}k one shared word`, iw.size, 1);
  eq(`deal ${p}p/${k}k one shared hint`, kw.size, 1);
  ok(`deal ${p}p/${k}k hint !== word`, [...kw][0].toUpperCase() !== [...iw][0]);
  ok(`deal ${p}p/${k}k labels identical`, new Set(w.map(x => x.label)).size === 1);
  ok(`deal ${p}p/${k}k has >=2 innocents`, w.filter(x => x.role === 'innocent').length >= 2);
}

/* starter index is always a real player */
let starterBad = 0;
for (let i = 0; i < 500; i++) { withRoll(NORMAL, () => G.startGame()); const s = G.starter(); if (!(s >= 0 && s < G.cfg().players)) starterBad++; }
eq('starter always in range', starterBad, 0);

/* no back-to-back repeat of the secret word */
let repeats = 0, prev = null;
for (let i = 0; i < 3000; i++) {
  withRoll(NORMAL, () => G.startGame());
  const cur = G.words().find(x => x.role === 'innocent').word;
  if (cur === prev) repeats++;
  prev = cur;
}
eq('no consecutive duplicate words in 3000 deals', repeats, 0);

/* no word comes back until the whole bank has been dealt */
const secret = () => G.words().find(x => x.role === 'innocent').word;
G.resetSeen();
const cycle = [];
for (let i = 0; i < G.BANK.length; i++) { withRoll(NORMAL, () => G.startGame()); cycle.push(secret()); }
eq('a full cycle deals every word exactly once', new Set(cycle).size, G.BANK.length);
withRoll(NORMAL, () => G.startGame());
ok('the cycle restarts once the bank is used up', G.BANK.some(b => b[0] === secret()));
ok('the restart never repeats the last word back-to-back', secret() !== cycle[cycle.length - 1]);

/* the played words survive a reload, so closing the game never resets them */
G.resetSeen();
const before = [];
for (let i = 0; i < 50; i++) { withRoll(NORMAL, () => G.startGame()); before.push(secret()); }
eq('played words are saved to localStorage', JSON.parse(localStorage.getItem('killer.seen')).length, 50);
G.reloadSeen();
const after = [];
for (let i = 0; i < 500; i++) { withRoll(NORMAL, () => G.startGame()); after.push(secret()); }
eq('no saved word is dealt again after a reload', after.filter(x => before.includes(x)).length, 0);
localStorage.setItem('killer.seen', 'not json at all');
G.reloadSeen();
withRoll(NORMAL, () => G.startGame());
ok('corrupt saved words fall back to a fresh cycle', G.BANK.some(b => b[0] === secret()));

/* chaos rounds draw from the same cycle */
G.resetSeen();
configure(16, 8);
const played = new Set();
for (let i = 0; i < 40; i++) {
  withRoll(G.ALL_KILLERS_CHANCE, () => G.startGame());
  G.words().forEach(x => played.add(x.word));
}
eq('[all-innocent] 40 rounds at 16 players never repeat a word', played.size, 640);

/* full pass loop reaches the start screen after exactly N reveals */
deal(6, 2);
let revealed = 0;
for (let i = 0; i < 6; i++) { G.reveal(); revealed++; G.doneReveal(); }
eq('reveals needed for 6 players', revealed, 6);
ok('ends on start screen', getEl('s-start').classList.contains('on'));
eq('start screen names a real player', /^PLAYER (1|2|3|4|5|6)$/.test(getEl('startName').textContent), true);

/* reveal: role text is colour-coded, but the label must still match */
deal(4, 1);
const seen = [];
for (let i = 0; i < 4; i++) {
  G.reveal();
  seen.push({ role: getEl('rRole').className, word: getEl('wWord').className, label: getEl('wLabel').textContent });
  G.doneReveal();
}
const killerCls = seen.map(s => s.role);
ok('role element uses same base class for both', killerCls.every(c => c.startsWith('role ')));
eq('all reveals share one label', new Set(seen.map(s => s.label)).size, 1);

/* quit escapes the pass loop */
deal(12, 4);
G.abortGame();
ok('quit returns home', getEl('s-home').classList.contains('on'));
eq('quit clears the deal', G.words().length, 0);

/* background music: mute button toggles, and the choice is remembered */
ok('music is embedded', /^data:audio\/mpeg;base64,/.test(global.window.KMUSIC || ''));
eq('music starts unmuted', getEl('mute')['_aria-label'], 'Mute music');
global.window.toggleMusic();
eq('mute is saved', localStorage.getItem('killer.music'), 'off');
eq('mute button flips its label', getEl('mute')['_aria-label'], 'Unmute music');
global.window.toggleMusic();
eq('unmute is saved', localStorage.getItem('killer.music'), 'on');

/* ---- rare chaos rounds ---- */
eq('all-killers chance is 0.2%', G.ALL_KILLERS_CHANCE, 0.002);
eq('all-innocent chance is 0.1%', G.ALL_INNOCENT_CHANCE, 0.001);

/* everyone is a killer */
configure(6, 2);
let w = withRoll(0, () => { G.startGame(); return G.words(); });
eq('[all-killers] every player is a killer', w.filter(x => x.role === 'killer').length, 6);
eq('[all-killers] no innocents', w.filter(x => x.role === 'innocent').length, 0);
eq('[all-killers] everyone shares one hint', new Set(w.map(x => x.word)).size, 1);
eq('[all-killers] ignores the killers setting', w.length, 6);
ok('[all-killers] label unchanged', new Set(w.map(x => x.label)).size === 1);
/* and the round still plays through to the end */
for (let i = 0; i < 6; i++) { G.reveal(); G.doneReveal(); }
ok('[all-killers] pass loop completes', getEl('s-start').classList.contains('on'));

/* everyone innocent, but all words differ */
configure(8, 3);
w = withRoll(G.ALL_KILLERS_CHANCE, () => { G.startGame(); return G.words(); });
eq('[all-innocent] every player is innocent', w.filter(x => x.role === 'innocent').length, 8);
eq('[all-innocent] no killers', w.filter(x => x.role === 'killer').length, 0);
eq('[all-innocent] every word is different', new Set(w.map(x => x.word)).size, 8);
ok('[all-innocent] words are real bank words',
   w.every(x => G.BANK.some(b => b[0] === x.word)));
for (let i = 0; i < 8; i++) { G.reveal(); G.doneReveal(); }
ok('[all-innocent] pass loop completes', getEl('s-start').classList.contains('on'));

/* the largest table still finds enough distinct words */
configure(16, 8);
w = withRoll(G.ALL_KILLERS_CHANCE, () => { G.startGame(); return G.words(); });
eq('[all-innocent] 16 distinct words at a full table', new Set(w.map(x => x.word)).size, 16);

/* boundaries: the roll picks the mode it should, and normal rounds are normal */
const modeAt = (roll) => {
  configure(6, 2);
  const r = withRoll(roll, () => { G.startGame(); return G.words(); });
  const k = r.filter(x => x.role === 'killer').length;
  if (k === r.length) return 'all-killers';
  if (k === 0) return 'all-innocent';
  return 'normal';
};
eq('roll 0.0000 -> all killers', modeAt(0), 'all-killers');
eq('roll 0.0019 -> all killers', modeAt(0.0019), 'all-killers');
eq('roll 0.0020 -> all innocent', modeAt(0.002), 'all-innocent');
eq('roll 0.0029 -> all innocent', modeAt(0.0029), 'all-innocent');
eq('roll 0.0030 -> normal', modeAt(0.003), 'normal');
eq('roll 0.5000 -> normal', modeAt(0.5), 'normal');

/* unstubbed, chaos must stay rare: expect ~0.3% over 200k rounds */
configure(4, 1);
let chaos = 0;
for (let i = 0; i < 200000; i++) {
  G.startGame();
  const k = G.words().filter(x => x.role === 'killer').length;
  if (k === 0 || k === G.words().length) chaos++;
}
const rate = chaos / 200000;
ok(`chaos rate ${(rate * 100).toFixed(3)}% is near 0.3%`, rate > 0.0015 && rate < 0.0050);

/* word bank integrity */
const bank = G.BANK;
eq('bank size', bank.length, 1500);
eq('no duplicate words', bank.length - new Set(bank.map(b => b[0])).size, 0);
eq('no hint leaking its word', bank.filter(([w, h]) => w.includes(h.toUpperCase()) || h.toUpperCase().includes(w)).length, 0);
eq('every entry is [word,hint]', bank.filter(b => b.length !== 2 || !b[0] || !b[1]).length, 0);
eq('all words uppercase', bank.filter(b => b[0] !== b[0].toUpperCase()).length, 0);
eq('all hints lowercase', bank.filter(b => b[1] !== b[1].toLowerCase()).length, 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
