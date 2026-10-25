# Jogo do Unicórnio

Jogo feito pelo Rafael e pela Sofia. Um cavalo ganha da fada o poder de voar e uma bolsinha,
desvia de doces gigantes, guarda pedacinhos de nuvens de algodão-doce e, a cada pedacinho que
come, fica mais forte e mais colorido, até virar arco-íris.

## Como jogar

Abra o `index.html` no Chrome (dois cliques no arquivo já funciona; nada para instalar).

| Controle DS4 | Teclado | O que faz |
|---|---|---|
| OPTIONS | Enter | START: começa, passa a história e pausa |
| ▲ ▼ (direcional ou analógico) | setas | sobe e desce para desviar dos doces |
| X | Espaço ou X | perto de uma nuvem de algodão-doce, pega um pedacinho; passa os diálogos |
| ○ | C ou O | come um pedacinho da bolsinha: mais forte, mais colorido e +1 coração |
| | F | tela cheia |
| | M | liga e desliga o som |

O controle aparece para o navegador depois que você aperta qualquer botão dele.
O som só liga depois de um clique na tela ou de uma tecla do teclado (regra do navegador).

## Regras

- 5 corações. Cada trombada num doce tira um; sem nenhum, volta a ser cavalo e recomeça.
- Cavalo → rosa → lilás → azul → verde → dourado → arco-íris. Só o começo é perto do chão;
  no lilás e no azul ele voa alto; no verde é só céu; no dourado, estrelas; no arco-íris, o final.

## Código

JavaScript puro desenhando num canvas de 192×108 ampliado: `src/desenho.js` (pixel art),
`src/fundos.js` (cenários), `src/jogo.js` (controle, história e corrida).
Para testar uma parte direto: `index.html#nivel3`, `#historia2`, `#final`.

O roteiro e os desenhos aprovados estão em https://claude.ai/artifact/1ZDj8eN984oAyigMcZNiJ6
