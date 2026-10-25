// Jogo do Unicórnio: laço principal, controle DS4 (Gamepad API) e teclado, história, corrida e final.
const tela = document.getElementById('tela');
const out = tela.getContext('2d');
const baixa = document.createElement('canvas');
baixa.width = 192; baixa.height = H;
const c = baixa.getContext('2d');
let S = 4; // quantas vezes a pixel art é ampliada

function ajustar() {
  S = Math.max(1, Math.floor(Math.min(innerWidth / 192, innerHeight / H)));
  tela.width = 192 * S; tela.height = H * S;
}
addEventListener('resize', ajustar);

// ---------- controle e teclado
// Mapa padrão do Chrome para o DS4: 0 = X, 1 = ○, 9 = OPTIONS, 12/13 = direcional ▲ ▼.
const teclas = {};
addEventListener('keydown', e => {
  teclas[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyF') telaCheia();
  if (e.code === 'KeyM') mudo = !mudo;
  destravarSom();
});
addEventListener('keyup', e => { teclas[e.code] = false; });
addEventListener('pointerdown', () => { destravarSom(); });
let antes = {}, controle = null, mapaPadrao = true, ultimoBotao = null, ultimoBotaoT = 0;
function lerEntrada() {
  const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(g => g && g.connected);
  controle = gp ? gp.id : null;
  mapaPadrao = !gp || gp.mapping === 'standard';
  const b = i => !!(gp && gp.buttons[i] && gp.buttons[i].pressed);
  const ay = gp ? gp.axes[1] || 0 : 0;
  const agora = {
    start: b(9) || !!teclas.Enter,
    x: b(0) || !!teclas.Space || !!teclas.KeyX,
    o: b(1) || !!teclas.KeyC || !!teclas.KeyO,
    cima: b(12) || ay < -0.4 || !!teclas.ArrowUp,
    baixo: b(13) || ay > 0.4 || !!teclas.ArrowDown,
  };
  const apertou = {};
  for (const k in agora) apertou[k] = agora[k] && !antes[k];
  antes = agora;
  const nomes = { start: 'OPTIONS (START)', x: 'X', o: '○', cima: '▲', baixo: '▼' };
  for (const k in apertou) if (apertou[k]) { ultimoBotao = nomes[k]; ultimoBotaoT = 0; }
  return { agora, apertou };
}
function telaCheia() {
  try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) { /* sem tela cheia */ }
}

// ---------- sons simples
let ac = null, mudo = false;
function destravarSom() { try { ac = ac || new AudioContext(); if (ac.state === 'suspended') ac.resume(); } catch (e) { /* sem som */ } }
const SONS = {
  pega: [[880, 0.08], [1175, 0.08], [1568, 0.14]],
  come: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.2]],
  ai: [[220, 0.15], [165, 0.25]],
  fala: [[660, 0.05]],
  max: [[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.12], [1319, 0.4]],
  vazio: [[300, 0.1]],
  start: [[784, 0.08], [1047, 0.16]],
};
function som(nome) {
  if (mudo) return;
  destravarSom();
  if (!ac || ac.state !== 'running') return;
  let t = ac.currentTime;
  SONS[nome].forEach(([f, d]) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square'; o.frequency.value = f;
    g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d); t += d * 0.8;
  });
}

// ---------- história
const HISTORIA = [
  { cena: 'dia', quem: 'Menina', txt: 'Bom dia, cavalinho! Vamos passear?' },
  { cena: 'tarde', quem: 'Fada', txt: 'Que cavalinho corajoso! Vou te dar um presente mágico.', fada: 'desce' },
  { cena: 'tarde', quem: 'Fada', txt: 'Agora você voa! Leve esta bolsinha para guardar algodão-doce.', fada: 'parada', poder: 'agora' },
  { cena: 'tarde', quem: 'Fada', txt: 'Use ▲ e ▼ para desviar dos doces. Perto de uma nuvem de algodão-doce, aperte X para pegar um pedacinho. Para comer, aperte ○.', fada: 'parada', poder: 'tem' },
];
const FINAL = { quem: 'Fada', txt: 'Você conseguiu! Agora é o unicórnio mais forte do arco-íris.' };

let modo = 'titulo', passo = 0, tempo = 0, letras = 0;

// ---------- estado da corrida
const G = {};
function novaCorrida() {
  Object.assign(G, {
    L: 0, x: 46, y: 56, vida: 5, bolsa: 0, dist: 0, rolagem: 0, invul: 0, tremor: 0,
    objs: [], parts: [], avisos: [], doce: 2.5, nuvem: 3, pega: null, comendo: 0,
    fundo: 0, fundoAntes: null, troca: 0, maxT: 0, perto: null,
  });
}
novaCorrida();

const DOCES = ['pirulito', 'cupcake', 'brigadeiro', 'chocolate'];
const FAIXA = { pirulito: [14, H - 38], cupcake: [16, H - 26], brigadeiro: [12, H - 14], chocolate: [10, H - 20], algodao: [22, H - 26] };
function criar(t) {
  const [a, b] = FAIXA[t];
  let y = 0;
  for (let k = 0; k < 6; k++) { // não nasce em cima de outro
    y = a + Math.random() * (b - a);
    if (!G.objs.some(o => o.x > 150 && Math.abs(o.y - y) < 28)) break;
  }
  G.objs.push({ t, x: 192 + 34, y, peq: false, fase: Math.random() * 6 });
}
function formas(o) {
  switch (o.t) {
    case 'pirulito': return [{ c: [o.x, o.y, 9] }, { r: [o.x - 1, o.y + 10, 3, 22] }];
    case 'cupcake': return [{ r: [o.x - 9, o.y - 6, 18, 27] }];
    case 'brigadeiro': return [{ c: [o.x, o.y, 8] }];
    case 'chocolate': return [{ r: [o.x, o.y, 31, 17] }];
  }
  return [];
}
function bate(r, f) {
  if (f.c) {
    const [cx, cy, raio] = f.c;
    const nx = Math.max(r[0], Math.min(cx, r[0] + r[2])), ny = Math.max(r[1], Math.min(cy, r[1] + r[3]));
    return (cx - nx) ** 2 + (cy - ny) ** 2 < raio * raio;
  }
  const [x, y, w, h] = f.r;
  return r[0] < x + w && r[0] + r[2] > x && r[1] < y + h && r[1] + r[3] > y;
}
function aviso(txt, x, y, cor = '#ffffff', tam = 6) { G.avisos.push({ txt, x, y, cor, tam, t: 0 }); }
function brilhos(x, y, n, cores) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 10 + Math.random() * 30;
    G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, dur: 0.6 + Math.random() * 0.5, cor: cores[i % cores.length] });
  }
}
function trocarFundo(novo) { G.fundoAntes = G.fundo; G.fundo = novo; G.troca = 0; }

function atualizarCorrida(dt, e) {
  const vel = 24 + G.L * 3;
  G.rolagem += vel * dt;
  G.dist += vel * dt / 4;
  G.invul = Math.max(0, G.invul - dt);
  G.tremor = Math.max(0, G.tremor - dt);
  G.comendo = Math.max(0, G.comendo - dt);
  if (G.fundoAntes != null) { G.troca += dt / 1.5; if (G.troca >= 1) G.fundoAntes = null; }

  // nascem doces e nuvens de algodão-doce; com a força máxima, só céu
  if (G.L < 6) {
    G.doce -= dt;
    if (G.doce <= 0) { criar(DOCES[Math.floor(Math.random() * DOCES.length)]); G.doce = Math.max(1.4, 2.6 - G.L * 0.18); }
    G.nuvem -= dt;
    if (G.nuvem <= 0) { criar('algodao'); G.nuvem = 4.5; }
  } else {
    G.maxT += dt;
    if (Math.random() < dt * 8) G.parts.push({ x: Math.random() * 192, y: Math.random() * 90, vx: 0, vy: -4, t: 0, dur: 1, cor: '#ffffff' });
    if (G.maxT > 10) { modo = 'final'; tempo = 0; letras = 0; return; }
  }
  for (const o of G.objs) { o.x -= vel * dt; o.fase += dt; }
  G.objs = G.objs.filter(o => o.x > -50);

  // movimento: ▲ ▼ desviam; durante a pegada ele vai sozinho até a nuvem
  if (G.pega) {
    const p = G.pega, o = p.o;
    p.t += dt;
    if (p.t < 0.45) {
      G.x += (o.x - 26 - G.x) * Math.min(1, dt * 8);
      G.y += (o.y - 7 - G.y) * Math.min(1, dt * 8);
    } else {
      if (!p.pegou) { p.pegou = true; o.peq = true; p.peca = { x: o.x - 7, y: o.y }; som('pega'); brilhos(o.x - 6, o.y, 8, ['#ffc4e1', '#bfe6ff', '#ffffff']); }
      G.x += (46 - G.x) * Math.min(1, dt * 5);
      const alvoX = G.x + 9, alvoY = G.y + 10;
      p.peca.x += (alvoX - p.peca.x) * Math.min(1, dt * 10);
      p.peca.y += (alvoY - p.peca.y) * Math.min(1, dt * 10);
    }
    if (p.t > 0.9) { G.pega = null; G.bolsa++; aviso('+1 na bolsinha', G.x + 12, G.y - 6, '#ffc4e1'); }
  } else {
    G.x += (46 - G.x) * Math.min(1, dt * 5);
    if (e.agora.cima) G.y -= 60 * dt;
    if (e.agora.baixo) G.y += 60 * dt;
  }
  G.y = Math.max(12, Math.min(H - 16, G.y));

  // nuvem de algodão-doce perto: X pega um pedacinho
  G.perto = null;
  if (!G.pega) {
    let melhor = 1e9;
    for (const o of G.objs) {
      if (o.t !== 'algodao' || o.peq) continue;
      const dx = o.x - (G.x + 12), dy = o.y - (G.y + 7);
      if (dx > -12 && dx < 64 && Math.abs(dy) < 36 && Math.abs(dx) + Math.abs(dy) < melhor) { melhor = Math.abs(dx) + Math.abs(dy); G.perto = o; }
    }
    if (G.perto && e.apertou.x) G.pega = { o: G.perto, t: 0 };
  }

  // ○ come um pedacinho da bolsinha: mais forte, mais colorido e +1 coração
  if (e.apertou.o) {
    if (G.L >= 6) aviso('Já está com a força máxima!', G.x + 12, G.y - 6);
    else if (G.bolsa === 0) { aviso('A bolsinha está vazia', G.x + 12, G.y - 6, '#ffe0ef'); som('vazio'); }
    else {
      G.bolsa--; G.L++; G.comendo = 0.7;
      const ganhou = G.vida < 5; G.vida = Math.min(5, G.vida + 1);
      trocarFundo(G.L);
      brilhos(G.x + 12, G.y + 6, 24, ['#ffffff', '#fff36b', ...LV[G.L - 1].m]);
      if (G.L === 6) { som('max'); aviso('FORÇA MÁXIMA!', 96, 40, '#ffffff', 12); }
      else { som('come'); aviso(`Mais forte! ${LV[G.L - 1].n}`, G.x + 12, G.y - 8, '#ffffff', 7); }
      if (ganhou) aviso('+1 ♥', G.x + 30, G.y + 4, '#ff6b8a', 7);
    }
  }

  // trombou num doce: perde um coração
  if (G.invul <= 0 && !G.pega) {
    const r = [G.x + 4, G.y + 2, 16, 10];
    for (const o of G.objs) {
      if (o.t === 'algodao') continue;
      if (formas(o).some(f => bate(r, f))) {
        G.vida--; G.invul = 1.6; G.tremor = 0.3; som('ai');
        aviso('Ai! −1 ♥', G.x + 12, G.y - 6, '#ff6b8a', 8);
        brilhos(G.x + 18, G.y + 4, 10, ['#ff6fae', '#ffc4e1', '#ffe14d']);
        if (G.vida <= 0) { modo = 'semvida'; tempo = 0; }
        break;
      }
    }
  }

  // rastro de brilhos depois que vira unicórnio
  if (G.L >= 1 && G.L < 6 && Math.random() < dt * 10) {
    const m = LV[G.L - 1].m;
    G.parts.push({ x: G.x + 1, y: G.y + 9 + Math.random() * 4, vx: -20, vy: 0, t: 0, dur: 0.6, cor: m[Math.floor(Math.random() * m.length)] });
  }
  for (const p of G.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  G.parts = G.parts.filter(p => p.t < p.dur);
  for (const a of G.avisos) a.t += dt;
  G.avisos = G.avisos.filter(a => a.t < 1.4);
}

// ---------- atualizar
function atualizar(dt, e) {
  tempo += dt;
  ultimoBotaoT += dt;
  if (modo === 'titulo') {
    if (e.apertou.start) { som('start'); modo = 'historia'; passo = 0; tempo = 0; letras = 0; }
  } else if (modo === 'historia' || modo === 'final') {
    const txt = modo === 'final' ? FINAL.txt : HISTORIA[passo].txt;
    const antesL = Math.floor(letras);
    letras = Math.min(txt.length, letras + dt * 34);
    if (Math.floor(letras) !== antesL && Math.floor(letras) % 4 === 0) som('fala');
    if (e.apertou.x || e.apertou.start) {
      if (letras < txt.length) letras = txt.length;
      else if (modo === 'final') { modo = 'titulo'; tempo = 0; }
      else if (passo < HISTORIA.length - 1) { passo++; tempo = 0; letras = 0; }
      else { novaCorrida(); modo = 'jogo'; tempo = 0; }
    }
  } else if (modo === 'jogo') {
    if (e.apertou.start) { modo = 'pausa'; return; }
    atualizarCorrida(dt, e);
  } else if (modo === 'pausa') {
    if (e.apertou.start) modo = 'jogo';
  } else if (modo === 'semvida') {
    if (tempo > 1.5 && (e.apertou.x || e.apertou.start)) { novaCorrida(); modo = 'jogo'; tempo = 0; }
  }
}

// ---------- desenhar
function desenharObj(o) {
  switch (o.t) {
    case 'pirulito': bigLollipop(c, o.x, o.y); break;
    case 'cupcake': bigCupcake(c, o.x, o.y); break;
    case 'brigadeiro': brigadeiro(c, o.x, o.y); break;
    case 'chocolate': chocolate(c, o.x, o.y); break;
    case 'algodao': cotton(c, o.x, o.y + Math.sin(o.fase * 2) * 1.5, o.peq ? 0.6 : 1, o === G.perto ? 1 : 0); break;
  }
}
function desenharCorrida() {
  if (G.fundoAntes != null) { desenharFundo(c, G.fundoAntes, G.rolagem); desenharFundo(c, G.fundo, G.rolagem, G.troca); }
  else desenharFundo(c, G.fundo, G.rolagem);
  noShadow = G.L >= 2; // lá no alto não há chão perto
  const lista = [...G.objs].sort((a, b) => a.y - b.y);
  for (const o of lista) desenharObj(o);
  if (G.L === 6) trail(c, 0, Math.round(G.x) + 2, Math.round(G.y) + 7, 2, tempo * 8);
  const bob = Math.round(Math.sin(tempo * 6) * 1);
  if (!noShadow) shadow(c, G.x + 12, G.y + 22, 7);
  if (!(G.invul > 0 && Math.floor(G.invul * 10) % 2)) {
    horse(c, G.x, G.y + bob, G.L === 0 ? null : G.L - 1, true, true, Math.floor(tempo * 8));
  }
  if (G.pega && G.pega.peca) piece(c, G.pega.peca.x, G.pega.peca.y);
  if (G.comendo > 0) piece(c, G.x + 24, G.y + 4 + bob);
  noShadow = false;
  for (const p of G.parts) { c.globalAlpha = 1 - p.t / p.dur; sparkle(c, p.x, p.y, p.cor); }
  c.globalAlpha = 1;
}
function desenharHistoria() {
  const h = HISTORIA[passo];
  c.drawImage(CENAS[h.cena], 0, 0);
  shadow(c, 88, 71, 4); girl(c, 84, 57);
  if (h.poder) {
    if (h.poder === 'agora' && tempo < 1.2) burst(c, 108, 56, Math.min(1, tempo * 1.5));
    const sobe = h.poder === 'agora' ? Math.min(1, tempo / 0.8) : 1;
    shadow(c, 108, 70, 9);
    horse(c, 96, 56 - sobe * 8 + Math.round(Math.sin(tempo * 6) * sobe), null, true, sobe >= 1);
  } else {
    shadow(c, 108, 70, 10); horse(c, 96, 56, null, false, false);
  }
  if (h.fada) {
    const fy = h.fada === 'desce' ? Math.min(24, -14 + tempo * 30) : 24 + Math.round(Math.sin(tempo * 3));
    fairy(c, 116, fy);
    if (h.cena === 'tarde') for (let i = 0; i < 6; i++) sparkle(c, 104 + ((i * 37 + tempo * 20) % 26), 32 + ((i * 13 + tempo * 15) % 24), i % 2 ? '#fff36b' : '#ffffff');
  }
}
function desenharFinal() {
  c.drawImage(CENAS.final, 0, 0);
  for (let i = 0; i < 18; i++) if (Math.sin(tempo * 4 + i) > 0) sparkle(c, (i * 47) % 192, (i * 29) % 70, ['#ffffff', '#fff36b', '#ffb3d9', '#bde0ff'][i % 4]);
  shadow(c, 110, 70, 10); horse(c, 98, 56, 5, false, true, Math.floor(tempo * 8));
  shadow(c, 88, 71, 4); girl(c, 84, 57);
  fairy(c, 126, 32 + Math.round(Math.sin(tempo * 3)));
}
function desenharTitulo() {
  c.drawImage(CENAS.titulo, 0, 0);
  const x = ((tempo * 20) % 230) - 30;
  horse(c, x, 84 + (Math.floor(tempo * 6) % 2), 0, Math.floor(tempo * 6) % 2 === 0, false);
}

// texto em alta resolução, por cima da pixel art (coordenadas da tela pequena)
function texto(t, x, y, tam, cor = '#ffffff', alinh = 'left', sombra = '#000000aa') {
  t = t.replace(/f([il])/g, 'f\u200C$1'); // a fonte junta "fi" numa letra só
  out.font = `${Math.round(tam * S)}px "Pixelify Sans", "Courier New", monospace`;
  out.textAlign = alinh; out.textBaseline = 'top';
  if (sombra) { out.fillStyle = sombra; out.fillText(t, x * S + S * 0.5, y * S + S * 0.5); }
  out.fillStyle = cor; out.fillText(t, x * S, y * S);
}
function quebrar(t, largura, tam) {
  out.font = `${Math.round(tam * S)}px "Pixelify Sans", "Courier New", monospace`;
  const linhas = []; let linha = '';
  for (const p of t.split(' ')) {
    const tenta = linha ? linha + ' ' + p : p;
    if (out.measureText(tenta).width > largura * S && linha) { linhas.push(linha); linha = p; } else linha = tenta;
  }
  if (linha) linhas.push(linha);
  return linhas;
}
function caixa(x, y, w, h, fundo, borda) {
  out.fillStyle = borda; out.fillRect(x * S, y * S, w * S, h * S);
  out.fillStyle = fundo; out.fillRect((x + 1.2) * S, (y + 1.2) * S, (w - 2.4) * S, (h - 2.4) * S);
}
function dialogo(quem, txt, n) {
  const linhas = quebrar(txt.slice(0, Math.floor(n)), 168, 5.2);
  const h = 12 + Math.max(2, quebrar(txt, 168, 5.2).length) * 6.4;
  const y = H - h - 4;
  caixa(8, y, 176, h, '#f8dfae', '#8a4b22');
  texto(quem + ':', 13, y + 4, 5.2, '#a03a6c', 'left', null);
  linhas.forEach((l, i) => texto(l, 13, y + 10.5 + i * 6.4, 5.2, '#3b2412', 'left', null));
  if (n >= txt.length && Math.floor(tempo * 2) % 2) texto('▼ X', 178, y + h - 7.5, 4.4, '#8a4b22', 'right', null);
}
function hud() {
  // força: 6 cores
  caixa(3, 3, 52, 17, '#00000066', '#00000000');
  texto('Força', 5, 4.5, 4.4);
  for (let i = 0; i < 6; i++) {
    const x = 22 + i * 5.2;
    out.fillStyle = '#ffffff'; out.fillRect(x * S, 4.6 * S, 4.4 * S, 4 * S);
    const m = LV[i].m;
    if (i < G.L) m.forEach((cor, k) => { out.fillStyle = cor; out.fillRect((x + 0.5 + k * 3.4 / m.length) * S, 5.1 * S, (3.4 / m.length) * S + 1, 3 * S); });
    else { out.fillStyle = '#ffffff33'; out.fillRect((x + 0.5) * S, 5.1 * S, 3.4 * S, 3 * S); }
  }
  texto('Vida', 5, 11, 4.4);
  for (let i = 0; i < 5; i++) texto('♥', 22 + i * 5.6, 10.6, 5, i < G.vida ? '#ff4d6d' : '#ffffff40', 'left', null);
  // distância e bolsinha
  caixa(150, 3, 39, 17, '#00000066', '#00000000');
  texto(`${Math.floor(G.dist)} m`, 186, 4.5, 4.4, '#ffffff', 'right');
  out.fillStyle = '#a03a6c'; out.beginPath(); out.arc(155 * S, 13.5 * S, 2.6 * S, 0, Math.PI * 2); out.fill();
  out.fillStyle = '#ff8fc4'; out.beginPath(); out.arc(155 * S, 13.5 * S, 1.9 * S, 0, Math.PI * 2); out.fill();
  texto(`× ${G.bolsa}`, 159, 11, 4.4);
  if (G.bolsa > 0 && G.L < 6) texto('○ come', 186, 11, 4.4, Math.floor(tempo * 2) % 2 ? '#fff36b' : '#ffffff', 'right');
  // nuvem perto: mostra o X
  if (G.perto && !G.pega) {
    const o = G.perto, x = o.x, y = o.y - 19;
    out.fillStyle = '#ffffff'; out.beginPath(); out.arc(x * S, y * S, 5 * S, 0, Math.PI * 2); out.fill();
    out.fillStyle = '#2d2240'; out.beginPath(); out.arc(x * S, y * S, 4.2 * S, 0, Math.PI * 2); out.fill();
    texto('X', x, y - 2.8, 5.4, '#ffffff', 'center', null);
  }
  for (const a of G.avisos) {
    out.globalAlpha = Math.max(0, 1 - a.t / 1.4);
    texto(a.txt, a.x, a.y - a.t * 8, a.tam, a.cor, 'center');
    out.globalAlpha = 1;
  }
}
function desenhar() {
  if (modo === 'titulo') desenharTitulo();
  else if (modo === 'historia') desenharHistoria();
  else if (modo === 'final') desenharFinal();
  else desenharCorrida();

  out.imageSmoothingEnabled = false;
  const dx = G.tremor > 0 && modo === 'jogo' ? Math.round((Math.random() - 0.5) * 2) * S : 0;
  out.fillStyle = '#000'; out.fillRect(0, 0, tela.width, tela.height);
  out.drawImage(baixa, dx, 0, 192 * S, H * S);

  if (modo === 'titulo') {
    texto('Jogo do Unicórnio', 96, 26, 15, '#ffffff', 'center', '#b0367a');
    texto('Jogo criado por Sofia', 96, 42, 6, '#ffffff', 'center', '#a03a6c');
    if (Math.floor(tempo * 2) % 2 === 0) texto('Aperte START', 96, 52, 7, '#5b2a7a', 'center', '#ffffffaa');
    texto(controle ? (mapaPadrao ? 'Controle conectado ✓ · aperte X, ○, ▲ ou ▼ para testar' : 'Controle conectado, mas com botões fora do padrão') : 'Ligue o controle e aperte um botão · ou use o teclado', 96, 64, 4.2, '#3b2a5a', 'center', null);
    if (ultimoBotao && ultimoBotaoT < 2) texto(`Botão: ${ultimoBotao}`, 96, 71, 4.2, '#a03a6c', 'center', null);
  } else if (modo === 'historia') {
    const h = HISTORIA[passo]; dialogo(h.quem, h.txt, letras);
  } else if (modo === 'final') {
    dialogo(FINAL.quem, FINAL.txt, letras);
    if (letras >= FINAL.txt.length) { texto('FIM', 96, 8, 12, '#ffffff', 'center', '#7a2e8c'); texto('aperte START para jogar de novo', 96, 24, 4.6, '#ffffff', 'center'); }
  } else {
    hud();
    if (modo === 'pausa') {
      out.fillStyle = '#00000088'; out.fillRect(0, 0, tela.width, tela.height);
      texto('Pausado', 96, 40, 12, '#ffffff', 'center'); texto('START continua', 96, 58, 5, '#ffffff', 'center');
    } else if (modo === 'semvida') {
      out.fillStyle = '#00000077'; out.fillRect(0, 0, tela.width, tela.height);
      texto('A vida acabou!', 96, 34, 11, '#ffc4e1', 'center', '#7a2e8c');
      texto('Ele volta a ser cavalo e começa de novo.', 96, 52, 5, '#ffffff', 'center');
      if (tempo > 1.5) texto('aperte X para tentar de novo', 96, 62, 5, '#fff36b', 'center');
    }
  }
}

// ---------- começo
let ultimo = performance.now();
function quadro(agora) {
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;
  atualizar(dt, lerEntrada());
  desenhar();
  requestAnimationFrame(quadro);
}
prepararFundos();
prepararCenas();
ajustar();
// atalhos para testar: #nivel3 começa a corrida no nível 3; #final vai direto ao final
const atalho = location.hash.slice(1);
if (/^nivel\d$/.test(atalho)) {
  novaCorrida(); modo = 'jogo'; G.L = +atalho[5]; G.fundo = G.L; G.bolsa = 2;
  for (let i = 0; i < 4; i++) { criar(i % 2 ? 'algodao' : DOCES[i]); G.objs[i].x = 70 + i * 34; }
} else if (atalho === 'final') { modo = 'final'; }
else if (/^historia\d$/.test(atalho)) { modo = 'historia'; passo = +atalho[8]; tempo = 2; letras = 999; }
requestAnimationFrame(quadro);
