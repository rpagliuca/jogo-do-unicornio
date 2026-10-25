// Desenho em pixel art: tudo é feito com retângulos de 1 ponto numa tela de 192×108.
// W muda de valor enquanto as faixas de fundo (mais largas que a tela) são desenhadas.
let W = 192;
const H = 108;

const RAIN = ['#ff5a5a', '#ff9f43', '#ffe14d', '#5fd068', '#4aa8ff', '#a46bff'];
// Cores do unicórnio: a crina e o rabo ganham mais uma cor do arco-íris a cada nível.
const LV = [
  { n: 'Rosa', b: '#f9a8cc', m: ['#e2589a'] },
  { n: 'Lilás', b: '#d9b5f7', m: ['#8a55d8', '#ff5a5a'] },
  { n: 'Azul', b: '#b0d8ff', m: ['#3a78dd', '#ff5a5a', '#ffe14d'] },
  { n: 'Verde', b: '#bdeeb5', m: ['#3a9f55', '#ff5a5a', '#ffe14d', '#4aa8ff'] },
  { n: 'Dourado', b: '#ffe9a8', m: ['#df961a', '#ff5a5a', '#5fd068', '#4aa8ff', '#a46bff'] },
  { n: 'Arco-íris', b: '#fff6fb', m: RAIN },
];

let seed = 7;
function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); }
function disc(c, cx, cy, r, col) {
  r = Math.round(r);
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.6));
    px(c, cx - w, cy + y, w * 2 + 1, 1, col);
  }
}
function sprite(c, rows, x, y, pal) {
  rows.forEach((r, j) => {
    for (let i = 0; i < r.length; i++) {
      const v = pal[r[i]];
      if (!v) continue;
      c.fillStyle = typeof v === 'function' ? v(i, j) : v;
      c.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1);
    }
  });
}
function sky(c, cols, h = H) {
  const bh = Math.ceil(h / cols.length);
  cols.forEach((col, i) => px(c, 0, i * bh, W, i === cols.length - 1 ? H : bh, col));
}
function tint(c, col, a) { c.globalAlpha = a; px(c, 0, 0, W, H, col); c.globalAlpha = 1; }
function sparkle(c, x, y, col = '#fffbd0') { px(c, x, y - 1, 1, 3, col); px(c, x - 1, y, 3, 1, col); }
function cloud(c, x, y, col = '#ffffff') { disc(c, x, y, 4, col); disc(c, x + 6, y - 2, 5, col); disc(c, x + 12, y, 4, col); px(c, x, y, 13, 4, col); }
function rainbowArc(c, cx, cy, ro, band) {
  for (let y = 0; y <= Math.min(cy, H - 1); y++) for (let x = 0; x < W; x++) {
    const i = Math.floor((ro - Math.hypot(x - cx, y - cy)) / band);
    if (i >= 0 && i < 6) px(c, x, y, 1, 1, RAIN[i]);
  }
}
function trail(c, x0, x1, y, amp, fase = 0) {
  for (let x = x0; x < x1; x++) {
    const o = Math.round(Math.sin(x * 0.18 + fase) * amp);
    for (let k = 0; k < 6; k++) px(c, x, y + k + o, 1, 1, RAIN[k]);
  }
}

// ---------- chão e fazenda (estilo Stardew Valley: chão em quadradinhos, coisas de lado com sombra)
let noShadow = false; // no céu não há chão, então não há sombra
function shadow(c, cx, cy, rx) {
  if (noShadow) return;
  c.globalAlpha = 0.28;
  for (let y = -2; y <= 2; y++) { const w = Math.round(rx * Math.sqrt(1 - (y * y) / 6.25)); px(c, cx - w, cy + y, 2 * w + 1, 1, '#1d3a12'); }
  c.globalAlpha = 1;
}
function field(c, s) {
  px(c, 0, 0, W, H, '#6cc04a');
  for (let ty = 0; ty < H; ty += 12) for (let tx = 0; tx < W; tx += 12) if (((tx + ty) / 12) % 2) px(c, tx, ty, 12, 12, '#68bb47');
  seed = s;
  for (let i = 0; i < W * 0.37; i++) { const x = rnd() * W, y = rnd() * H; px(c, x, y, 1, 2, '#4e9a38'); px(c, x + 2, y, 1, 2, '#4e9a38'); px(c, x + 1, y + 1, 1, 1, '#4e9a38'); }
}
function pathY(yc, x, amp, f) { return Math.round(yc + Math.sin(x * f) * amp); }
function path(c, yc, w, amp = 4, f = 0.04) {
  for (let x = 0; x < W; x++) { const y = pathY(yc, x, amp, f) - w / 2; px(c, x, y, 1, w, '#c99a62'); px(c, x, y, 1, 1, '#a87a48'); px(c, x, y + w - 1, 1, 1, '#a87a48'); }
  seed = 13;
  for (let i = 0; i < W * 0.18; i++) { const x = rnd() * W; px(c, x, pathY(yc, x, amp, f) - w / 2 + 2 + rnd() * (w - 4), 1, 1, '#a87a48'); }
}
function flowers(c, s, n, cores) {
  seed = s;
  for (let i = 0; i < n; i++) {
    const x = Math.round(rnd() * W), y = Math.round(rnd() * H), col = cores[i % cores.length];
    px(c, x - 1, y, 3, 1, col); px(c, x, y - 1, 1, 3, col); px(c, x, y, 1, 1, '#ffb02e');
  }
}
function treeTop(c, x, y) {
  shadow(c, x + 2, y, 9); px(c, x - 1, y - 6, 3, 6, '#7a4a26');
  disc(c, x, y - 13, 8, '#3d8b3a'); disc(c, x - 2, y - 15, 5, '#56a64a');
  px(c, x + 3, y - 11, 1, 1, '#ff6b6b'); px(c, x - 4, y - 9, 1, 1, '#ff6b6b');
}
function fence(c, x, gy, len) {
  px(c, x, gy - 7, len, 1, '#a8703a'); px(c, x, gy - 4, len, 1, '#a8703a');
  for (let i = 0; i <= len - 2; i += 6) { px(c, x + i, gy - 9, 2, 9, '#7d4f24'); px(c, x + i, gy - 9, 2, 1, '#c08848'); }
}
function house(c, x, gy) {
  px(c, x, gy - 22, 32, 22, '#c98b5a');
  for (let y = gy - 19; y < gy; y += 3) px(c, x, y, 32, 1, '#b0764a');
  for (let k = 0; k < 12; k++) px(c, x - 3 + k, gy - 22 - k, 38 - 2 * k, 1, k % 2 ? '#b8433f' : '#a0382f');
  px(c, x + 12, gy - 12, 7, 12, '#6b3a1f'); px(c, x + 17, gy - 6, 1, 1, '#ffd34d');
  px(c, x + 23, gy - 17, 6, 6, '#ffe9a8'); px(c, x + 25, gy - 17, 1, 6, '#b0764a');
  px(c, x + 3, gy - 17, 6, 6, '#ffe9a8'); px(c, x + 5, gy - 17, 1, 6, '#b0764a');
  px(c, x + 24, gy - 37, 4, 6, '#8a4b3a');
}
function pond(c, x, y) {
  for (let j = -7; j <= 7; j++) {
    const w = Math.round(16 * Math.sqrt(1 - (j * j) / 56)); px(c, x - w, y + j, 2 * w + 1, 1, '#3f8fc8');
    if (Math.abs(j) < 6) { const w2 = w - 2; px(c, x - w2, y + j, 2 * w2 + 1, 1, '#5fb3e8'); }
  }
  px(c, x - 6, y - 3, 4, 1, '#bfe6ff'); px(c, x + 3, y + 2, 3, 1, '#bfe6ff');
}
function mapCloud(c, x, y) {
  c.globalAlpha = noShadow ? 0 : 0.16; cloud(c, x + 6, y + 14, '#1d3a12');
  c.globalAlpha = 0.9; cloud(c, x, y, '#ffffff'); c.globalAlpha = 1;
}
function farm(c) {
  field(c, 2); path(c, 70, 14, 3, 0.04); house(c, 12, 46); px(c, 10, 46, 36, 2, '#00000030');
  fence(c, 120, 36, 66); pond(c, 164, 52); treeTop(c, 66, 40); treeTop(c, 186, 92); treeTop(c, 8, 96);
  flowers(c, 3, 18, ['#ff8fc4', '#fff36b', '#ffffff', '#b48cff']);
}

// ---------- céu
function balloon(c, x, y, a, b) {
  disc(c, x, y, 5, a); px(c, x - 1, y - 5, 2, 11, b); px(c, x - 4, y - 1, 2, 4, b); px(c, x + 3, y - 1, 2, 4, b);
  px(c, x, y + 5, 1, 3, '#7a4a26'); px(c, x - 1, y + 8, 3, 2, '#8a5a2c');
}
function bird(c, x, y) { px(c, x, y, 1, 1, '#5a5a7a'); px(c, x + 1, y + 1, 1, 1, '#5a5a7a'); px(c, x + 2, y, 1, 1, '#5a5a7a'); }

// ---------- personagens
const HORSE = [
  '..................d.d...',
  '.................dbbbb..',
  '................ddbkbbb.',
  '...............ddbbbbbbb',
  '..............ddbbbbbbnb',
  '.............ddbbb......',
  'dd..........ddbbbb......',
  'ddbbbbbbbbbbbbbbbb......',
  'd.bbbbbbbbbbbbbbbb......',
  'd.bbbbbbbbbbbbbbbb......',
  '..bbbbbbbbbbbbbbb.......',
  '..bb.bb......bb.bb......',
  '..bb.bb......bb.bb......',
  '..ff.ff......ff.ff......'];
const HORSE_JUMP = HORSE.slice(0, 11).concat([
  '.bb...bb...bb...bb......',
  'bb.....bb.bb.....bb.....',
  'ff......ffff......ff....']);
const BAG = ['.bbb.', 'bpppb', 'bpwpb', 'bpppb', '.bbb.'];
// lv: null = cavalo marrom; 0 a 5 = cores do unicórnio. comBolsa: a bolsinha que a fada dá.
function horse(c, x, y, lv, voando, comBolsa = voando, fase = 0) {
  let b = '#a8693c', d = '#5a3418', f = '#3f2614', k = '#2a1a12';
  if (lv != null) {
    const L = LV[lv], m = L.m;
    b = L.b; d = m.length > 1 ? (i, j) => m[(j + i + fase) % m.length] : m[0]; f = m[0]; k = '#3a1640';
  }
  sprite(c, voando ? HORSE_JUMP : HORSE, x, y, { b, d, f, k, n: k });
  if (comBolsa) bag(c, x, y);
  if (lv != null) [[20, -1], [21, -2], [22, -3]].forEach(([i, j], t) => px(c, x + i, y + j, 1, 1, t % 2 ? '#fff3b0' : '#ffc93a'));
}
function bag(c, x, y) { px(c, x + 9, y + 7, 7, 1, '#8a4b22'); sprite(c, BAG, x + 7, y + 8, { b: '#a03a6c', p: '#ff8fc4', w: '#ffffff' }); }
function piece(c, x, y) { disc(c, x, y, 2, '#ffc4e1'); px(c, x - 1, y - 1, 1, 1, '#ffffff'); }
// Menina feita a partir do retrato em pixel art da Sofia (sofia.png): cabelo castanho longo com franja,
// olhos castanhos, sorriso e blusa branca com flores coloridas.
const GIRL = [
  '...hhhh...',
  '..hhhhhh..',
  '.hhHhhHhh.',
  '.hhsHhshh.',
  '.hskssksh.',
  '.hssssssh.',
  '.hssrrssh.',
  'hhhyyyyhhh',
  'hhwpwwbwhh',
  'hswwvwywsh',
  'h.wgwwpw.h',
  '...jjjj...',
  '...s..s...',
  '..ff..ff..'];
function girl(c, x, y) {
  sprite(c, GIRL, x - 1, y, {
    h: '#9a5a2e', H: '#663924', s: '#f6c79c', k: '#292528', r: '#c8404a', y: '#ffd23a',
    w: '#fbfbf1', p: '#ff6fae', b: '#4ab0f0', v: '#9a2a7a', g: '#5fd068', j: '#5aa0e0', f: '#7a3a2a',
  });
}
const FAIRY = ['...ggg...', 'ww.gsg.ww', 'www.s.www', 'wwwpppwww', '.w.ppp.w.', '...ppp...', '...s.s...'];
function fairy(c, x, y) {
  c.globalAlpha = 0.15; disc(c, x + 4, y + 3, 12, '#fff6a8'); c.globalAlpha = 0.25; disc(c, x + 4, y + 3, 8, '#fff6a8');
  c.globalAlpha = 0.45; disc(c, x + 4, y + 3, 5, '#ffffff'); c.globalAlpha = 1;
  sprite(c, FAIRY, x, y, { g: '#ffd34d', s: '#f6cfae', w: '#bff0ff', p: '#c86bd8' });
  px(c, x + 9, y + 3, 5, 1, '#e8c06a'); sparkle(c, x + 15, y + 3, '#fff36b');
}
function burst(c, cx, cy, k = 1) {
  for (let a = 0; a < 16; a++) {
    const t = a / 16 * Math.PI * 2, r1 = (a % 2 ? 30 : 44) * k;
    for (let r = 10 * k; r < r1; r++) px(c, cx + Math.cos(t) * r, cy + Math.sin(t) * r * 0.8, 1, 1, a % 2 ? '#fff1b8' : '#ffc2e2');
  }
  c.globalAlpha = 0.5; disc(c, cx, cy, 12 * k, '#ffffff'); c.globalAlpha = 1;
}

// ---------- doces gigantes (obstáculos) e algodão-doce (comida)
function bigLollipop(c, x, y) {
  shadow(c, x, y + 34, 8); px(c, x - 1, y + 10, 3, 24, '#f5f0e6'); px(c, x + 1, y + 10, 1, 24, '#d8cfc0');
  for (let r = 11, k = 0; r > 0; r -= 2, k++) disc(c, x, y, r, k % 2 ? '#ffffff' : ['#ff6fae', '#a46bff', '#4aa8ff', '#ff6fae', '#ffe14d', '#ff6fae'][k >> 1]);
  px(c, x - 6, y - 6, 3, 2, '#ffffffcc');
}
function bigCupcake(c, x, y) {
  shadow(c, x, y + 22, 11);
  for (let j = 0; j < 10; j++) { const w = 9 - Math.floor(j / 4); px(c, x - w, y + 12 + j, 2 * w + 1, 1, '#8ad3e8'); }
  for (let i = -8; i <= 8; i += 3) px(c, x + i, y + 12, 1, 10, '#5fb3cf');
  disc(c, x, y + 8, 10, '#ffc4e1'); disc(c, x, y + 3, 7, '#ffb0d6'); disc(c, x, y - 1, 4, '#ffc4e1'); disc(c, x, y - 7, 3, '#e63946'); px(c, x - 1, y - 8, 1, 1, '#ffffff');
  const s = seed; seed = 99;
  for (let i = 0; i < 10; i++) px(c, x - 8 + rnd() * 16, y + rnd() * 12, 1, 1, ['#ffe14d', '#4aa8ff', '#5fd068'][i % 3]);
  seed = s;
}
function brigadeiro(c, x, y) {
  shadow(c, x, y + 10, 9);
  for (let j = 0; j < 5; j++) px(c, x - 9 + j, y + 4 + j, 19 - 2 * j, 1, j % 2 ? '#c68a4a' : '#a86a32');
  disc(c, x, y, 8, '#4a2614');
  const s = seed; seed = 41;
  for (let i = 0; i < 22; i++) px(c, x - 7 + rnd() * 14, y - 7 + rnd() * 11, 1, 1, i % 2 ? '#2a140a' : '#7a4a2a');
  seed = s; px(c, x - 4, y - 5, 2, 1, '#8a5a3a');
}
function chocolate(c, x, y) {
  shadow(c, x + 15, y + 18, 16); px(c, x, y, 30, 16, '#6b3a1f');
  for (let i = 0; i <= 30; i += 6) px(c, x + i, y, 1, 16, '#4a2614');
  for (let j = 0; j <= 16; j += 5) px(c, x, y + j, 30, 1, '#4a2614');
  for (let i = 1; i < 30; i += 6) for (let j = 1; j < 16; j += 5) px(c, x + i, y + j, 4, 1, '#8a5030');
  px(c, x + 18, y - 1, 13, 18, '#8a55d8');
  for (let j = 0; j < 18; j += 3) px(c, x + 18, y - 1 + j, 1, 2, '#b48cff');
  px(c, x + 21, y + 5, 8, 5, '#5fd068');
}
// k < 1 desenha a nuvem menor (depois que ele já pegou um pedacinho)
function cotton(c, x, y, k = 1, brilho = 0) {
  shadow(c, x, y + 22, 6 * k);
  c.globalAlpha = 0.1 + 0.3 * brilho; disc(c, x, y, 11 * k, '#fff6a8'); c.globalAlpha = 1;
  disc(c, x - 5 * k, y + 1, 5 * k, '#d9b5f7'); disc(c, x + 5 * k, y + 1, 5 * k, '#bfe6ff'); disc(c, x, y - 2 * k, 6 * k, '#ffc4e1');
  disc(c, x - 2 * k, y - 4 * k, 3 * k, '#ffe0ef'); px(c, x - 8 * k, y + 3 * k, Math.round(17 * k), Math.max(1, Math.round(3 * k)), '#ffc4e1');
  px(c, x - 3 * k, y - 6 * k, 2, 1, '#ffffff');
  if (k >= 1) { sparkle(c, x + 9, y - 6, '#ffffff'); sparkle(c, x - 10, y - 3, '#fff36b'); }
}
