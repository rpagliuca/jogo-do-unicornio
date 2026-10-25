// Fundos desenhados uma vez só, no começo. Cada nível tem o seu:
// 0 cavalo e 1 rosa: perto do chão · 2 lilás e 3 azul: lá do alto, a fazenda pequena
// 4 verde: só céu · 5 dourado: estrelas · 6 arco-íris: o arco-íris mais lindo do mundo.
// "rolo" é uma faixa mais larga que a tela que vai passando; "est" fica parado atrás dela.
const BGW = 384;
const PER = (2 * Math.PI * 2) / BGW; // ondas que fecham a volta da faixa sem emenda

function novaTela(w = 192, h = H) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }
function naFaixa(fn) { // desenha com W = largura da faixa
  const cv = novaTela(BGW), c = cv.getContext('2d'); W = BGW; fn(c); W = 192; return cv;
}
function repete(x, fn) { fn(x); if (x > BGW - 50) fn(x - BGW); if (x < 50) fn(x + BGW); }
function parado(fn) { const cv = novaTela(), c = cv.getContext('2d'); fn(c); return cv; }

function chao(c, st) {
  field(c, 20 + st); path(c, 64, 22, 4, PER);
  flowers(c, 30 + st, st ? 70 : 14, st ? ['#ffffff', '#fff36b', '#ff8fc4', '#b48cff', '#7fd0ff'] : ['#ffffff', '#fff36b']);
  const arv = [[30, 26], [120, 102], [250, 24], [330, 104], [190, 30]];
  if (st) arv.push([80, 22], [300, 30]);
  arv.forEach(([x, y]) => repete(x, xx => treeTop(c, xx, y)));
  if (st) { seed = 50; for (let i = 0; i < 10; i++) { const x = rnd() * BGW, y = rnd() * 40; px(c, x, y, 1, 1, '#ffb3d9'); px(c, x + 2, y, 1, 1, '#ffb3d9'); px(c, x + 1, y + 1, 1, 1, '#5a3418'); } }
}
function doAlto(c, s, nuvens, nevoa) {
  field(c, s); path(c, 82, 6, 3, PER);
  seed = s; for (let i = 0; i < 34; i++) { const x = rnd() * BGW, y = rnd() * H; disc(c, x, y, 2, '#3d8b3a'); px(c, x - 1, y - 1, 1, 1, '#56a64a'); }
  [[60, 14], [260, 40]].forEach(([x, y]) => { px(c, x, y, 8, 5, '#c98b5a'); px(c, x - 1, y - 3, 10, 3, '#b0413e'); px(c, x - 10, y + 8, 30, 1, '#a8703a'); });
  [[150, 30], [330, 70]].forEach(([x, y]) => { disc(c, x, y, 5, '#3f8fc8'); disc(c, x, y, 3, '#5fb3e8'); });
  tint(c, '#ffffff', nevoa);
  seed = s + 1; for (let k = 0; k < nuvens; k++) { const x = rnd() * BGW, y = rnd() * 90; repete(x, xx => mapCloud(c, xx, y)); }
}

const FUNDOS = [];
function prepararFundos() {
  FUNDOS[0] = { vel: 1, rolo: naFaixa(c => chao(c, 0)) };
  FUNDOS[1] = { vel: 1, rolo: naFaixa(c => chao(c, 1)) };
  FUNDOS[2] = { vel: 0.5, rolo: naFaixa(c => doAlto(c, 22, 8, 0.2)) };
  FUNDOS[3] = { vel: 0.45, rolo: naFaixa(c => doAlto(c, 23, 14, 0.32)) };
  FUNDOS[4] = {
    vel: 0.6,
    est: parado(c => sky(c, ['#8fd0ff', '#a5d9ff', '#bce3ff', '#d3ecff', '#ffe3f1', '#ffd6ea'])),
    rolo: naFaixa(c => {
      seed = 61; for (let i = 0; i < 12; i++) { const x = rnd() * BGW, y = rnd() * 100; repete(x, xx => cloud(c, xx, y)); }
      [[60, 24, '#ff8fc4', '#ffe14d'], [200, 70, '#7fd0ff', '#ffffff'], [320, 40, '#b48cff', '#fff36b']].forEach(([x, y, a, b]) => repete(x, xx => balloon(c, xx, y, a, b)));
      seed = 62; for (let i = 0; i < 10; i++) bird(c, rnd() * BGW, rnd() * 60);
    }),
  };
  FUNDOS[5] = {
    vel: 0.2,
    est: parado(c => {
      sky(c, ['#1b1440', '#251a55', '#30206a', '#3c2878', '#4a3088', '#5a3a96']);
      disc(c, 160, 20, 8, '#fff6c8'); disc(c, 164, 17, 7, '#251a55');
    }),
    rolo: naFaixa(c => {
      seed = 81; for (let i = 0; i < 170; i++) px(c, rnd() * BGW, rnd() * H, 1, 1, i % 5 ? '#fff6d6' : '#bfe6ff');
      for (let i = 0; i < 16; i++) sparkle(c, rnd() * BGW, rnd() * H, '#fff6d6');
      c.globalAlpha = 0.5; [[20, 98], [140, 100], [260, 96]].forEach(([x, y]) => repete(x, xx => cloud(c, xx, y, '#b48cff'))); c.globalAlpha = 1;
    }),
  };
  FUNDOS[6] = {
    vel: 0.5,
    est: parado(c => {
      sky(c, ['#6a50c0', '#8a62c8', '#b47ccc', '#e298c8', '#ffbcc0', '#ffdcb4']);
      seed = 91; for (let i = 0; i < 30; i++) px(c, rnd() * W, rnd() * 36, 1, 1, '#fff6d6');
      c.globalAlpha = 0.5; rainbowArc(c, 96, 124, 118, 4); c.globalAlpha = 1; rainbowArc(c, 96, 124, 96, 7);
    }),
    rolo: naFaixa(c => {
      for (let x = 0; x < BGW; x += 24) cloud(c, x, 100);
      seed = 92; for (let i = 0; i < 24; i++) sparkle(c, rnd() * BGW, rnd() * 90, ['#ffffff', '#fff36b', '#ffb3d9'][i % 3]);
    }),
  };
}

function desenharFundo(c, i, rolagem, a = 1) {
  const b = FUNDOS[i];
  c.globalAlpha = a;
  if (b.est) c.drawImage(b.est, 0, 0);
  const off = Math.floor((rolagem * b.vel) % BGW);
  c.drawImage(b.rolo, -off, 0); c.drawImage(b.rolo, BGW - off, 0);
  c.globalAlpha = 1;
}

// Telas paradas da história
const CENAS = {};
function prepararCenas() {
  CENAS.titulo = parado(c => {
    sky(c, ['#9ad8ff', '#a8ddff', '#b8e3ff', '#c8e9ff', '#d8efff', '#e8f5ff']); rainbowArc(c, 96, 112, 104, 7);
    cloud(c, 6, 96); cloud(c, 22, 100); cloud(c, 160, 96); cloud(c, 174, 101);
    for (let x = 0; x < W; x++) { const y = 96 - 3 * Math.sin(x * 0.05 + 1); px(c, x, y, 1, H - y, '#7fd060'); }
    px(c, 0, 100, W, 8, '#6cc04a');
    [[20, 20], [170, 26], [40, 50], [150, 58], [96, 10]].forEach(([x, y]) => sparkle(c, x, y, '#ffffff'));
  });
  CENAS.dia = parado(c => farm(c));
  CENAS.tarde = parado(c => { farm(c); tint(c, '#6a2f8a', 0.28); tint(c, '#ff8a4a', 0.15); });
  CENAS.final = parado(c => {
    farm(c); c.globalAlpha = 0.55; rainbowArc(c, 104, 78, 104, 4); c.globalAlpha = 0.95; rainbowArc(c, 104, 70, 82, 6); c.globalAlpha = 1;
    mapCloud(c, 0, 58); mapCloud(c, 170, 56);
  });
}
