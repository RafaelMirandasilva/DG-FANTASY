

> **Atualização (visual do kit medieval):** o menu principal agora é uma imagem PNG (`assets/ui/menus/menu_principal.png`)
> com 4 áreas clicáveis invisíveis (`.hit`) por cima. Por isso **não existem mais** `logo.png`, `icone_*.png`, `.logo`, `.btn-menu`
> e `.menu-botoes`. As telas Personagens e Wiki continuam montadas pelo `menu.js`, e o visual delas fica em `css/tema.css`.
> As partes abaixo que descrevem o menu antigo (botões coloridos com ícone) estão desatualizadas; o restante vale igual.

# DG FANTASY — Explicação completa do projeto

Este documento explica **todo o código** do jogo, arquivo por arquivo, em linguagem simples.
A ideia é que você consiga entender, mexer e continuar o projeto mesmo sem muita experiência.

## Antes de começar: 6 conceitos que aparecem o tempo todo

| Termo | O que significa |
|---|---|
| **Variável** | Uma "caixinha" com nome que guarda um valor. `let vida = 100;` cria a caixinha `vida` com 100 dentro. |
| **Função** | Um bloco de código com nome que executa uma tarefa quando é "chamado". `function curar(x) {...}` define; `curar(10)` executa. |
| **Objeto** | Um agrupamento de variáveis e funções com nome. `jogador.vida`, `jogador.x`, `jogador.curar()`. As chaves `{ }` criam um objeto. |
| **Classe** | Um "molde" para criar vários objetos iguais. `class Inimigo {...}` é o molde; `new Inimigo(...)` cria um monstro de verdade. |
| **Array (lista)** | Vários valores dentro de `[ ]`. `Jogo.inimigos` é a lista de todos os monstros vivos. |
| **dt (delta time)** | Quantos *segundos* se passaram desde o último quadro (normalmente 0,016 s). Tudo que se move é multiplicado por `dt`, assim o jogo anda na mesma velocidade em qualquer computador. |

**Como o jogo "roda":** o navegador chama a função `Jogo.loop()` cerca de 60 vezes por segundo.
A cada chamada o jogo faz duas coisas: **atualizar** (mover tudo, calcular dano, etc.) e **desenhar** (apagar o canvas e desenhar tudo de novo na nova posição).
É como um desenho animado: muitos quadros parecidos, um atrás do outro.

## Estrutura de pastas (e o que mudou em relação ao pedido)

```
DG-FANTASY/
├── index.html              ← estrutura de todas as telas
├── css/
│   ├── style.css           ← estilos gerais (fontes, cores, sistema de telas, botões)
│   ├── menu.css            ← menu, seleção de personagens e wiki
│   └── game.css            ← HUD, tela de level up e tela de fim
├── js/
│   ├── assets.js           ← (NOVO) carrega todas as imagens PNG antes do jogo começar
│   ├── dados.js            ← (NOVO) fichas: personagens, monstros, chefes, itens e configurações
│   ├── abilities.js        ← lista de habilidades e o sorteio delas
│   ├── player.js           ← jogador: WASD, vida, XP, nível, animação
│   ├── enemies.js          ← monstros, chefes e o sistema de waves
│   ├── weapons.js          ← ataque automático, flechas, efeito do corte
│   ├── items.js            ← (NOVO) cristal de XP e poção de cura
│   ├── cenario.js          ← (NOVO) árvores, pedras e arbustos da arena (com colisão)
│   ├── ui.js               ← barras, avisos, telas de level up e fim
│   ├── game.js             ← loop principal, câmera, colisões, morte
│   ├── menu.js             ← botões do menu, seleção e wiki
│   └── main.js             ← ponto de partida
├── assets/
│   ├── characters/         ← guerreiro e arqueiro (frente, costas, lado, lado_esq)
│   ├── enemies/            ← 6 monstros x 4 direções
│   ├── weapons/            ← flecha
│   ├── items/              ← cristal_xp, pocao_cura
│   ├── effects/            ← corte_espada, impacto_flecha
│   ├── cards/              ← ícones das 20 cartas de habilidade
│   ├── backgrounds/        ← arena, floresta do menu, árvores, pedras, arbustos, flores
│   └── ui/menus/           ← menu_principal.png (menu em PNG) e moldura.png (moldura das telas)
└── docs/
    └── EXPLICACAO.md       ← este arquivo
```

**Por que 4 arquivos a mais que o pedido?**

- `assets.js` — o jogo usa ~60 PNGs. Se o canvas tentar desenhar uma imagem que ainda não terminou de baixar, ela simplesmente não aparece. Esse arquivo espera todas carregarem antes de ligar o menu.
- `dados.js` — todos os números (vida do goblin, dano do arqueiro, XP por nível...) ficam em um lugar só. Para balancear o jogo você edita **um** arquivo em vez de caçar números dentro da lógica.
- `items.js` — os drops têm regras próprias (flutuar, imã, sumir após 45 s). Misturar isso em `weapons.js` deixaria o arquivo confuso.
- `cenario.js` — o pedido dizia "caso utilize objetos com colisão, explique". As árvores e pedras colidem; o código ficou separado para a explicação ser clara.

**Todos os modelos são PNG**, como pedido: os sprites foram recortados diretamente das imagens de referência (com fundo transparente), e as decorações da arena (árvore, pedra, arbusto, flores) foram geradas em pixel art como PNG. O CSS só cuida de botões, painéis e barras.

---

## index.html

### A) Nome do arquivo
`index.html`

### B) Objetivo do arquivo
A estrutura de todas as telas do jogo.

### C) Código completo
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DG Fantasy</title>

  <!-- Folhas de estilo: cada uma cuida de uma parte visual do jogo -->
  <link rel="stylesheet" href="css/style.css">  <!-- estilos gerais (fontes, cores, botões) -->
  <link rel="stylesheet" href="css/menu.css">   <!-- menu principal, personagens e wiki -->
  <link rel="stylesheet" href="css/game.css">   <!-- interface da partida, level up e fim de jogo -->
</head>
<body>

  <!-- ===================================================== -->
  <!-- TELA 1: MENU PRINCIPAL                                -->
  <!-- A classe "tela" é usada por todas as telas. Apenas a  -->
  <!-- tela com a classe "ativa" fica visível.               -->
  <!-- ===================================================== -->
  <section id="tela-menu" class="tela ativa">
    <div class="floresta"></div>

    <!-- O personagem escolhido aparece aqui, no meio da floresta -->
    <div id="menu-personagem" class="menu-personagem">
      <img id="menu-personagem-img" src="assets/characters/guerreiro_frente.png" alt="Personagem escolhido">
      <span id="menu-personagem-nome">Guerreiro</span>
    </div>

    <div class="menu-painel">
      <img class="logo" src="assets/ui/logo.png" alt="DG Fantasy">

      <nav class="menu-botoes">
        <button class="btn-menu btn-jogar" id="btn-jogar">
          <img src="assets/ui/icone_jogar.png" alt=""><span>JOGAR</span>
        </button>
        <button class="btn-menu btn-personagens" id="btn-personagens">
          <img src="assets/ui/icone_personagens.png" alt=""><span>PERSONAGENS</span>
        </button>
        <button class="btn-menu btn-wiki" id="btn-wiki">
          <img src="assets/ui/icone_wiki.png" alt=""><span>WIKI</span>
        </button>
        <button class="btn-menu btn-sair" id="btn-sair">
          <img src="assets/ui/icone_sair.png" alt=""><span>SAIR</span>
        </button>
      </nav>

      <p class="menu-dica">Mova com <b>W A S D</b> — o ataque é automático</p>
    </div>
  </section>

  <!-- ===================================================== -->
  <!-- TELA 2: SELEÇÃO DE PERSONAGENS                        -->
  <!-- Os cartões dos personagens são criados pelo menu.js   -->
  <!-- ===================================================== -->
  <section id="tela-personagens" class="tela">
    <div class="floresta escura"></div>
    <div class="painel-central">
      <h2 class="titulo-tela">ESCOLHA SEU HERÓI</h2>
      <div id="lista-personagens" class="lista-personagens"></div>
      <button class="btn-voltar" data-voltar>← Voltar ao menu</button>
    </div>
  </section>

  <!-- ===================================================== -->
  <!-- TELA 3: WIKI                                          -->
  <!-- ===================================================== -->
  <section id="tela-wiki" class="tela">
    <div class="floresta escura"></div>
    <div class="painel-central painel-wiki">
      <h2 class="titulo-tela">WIKI DE DG FANTASY</h2>

      <div class="wiki-abas">
        <button class="aba ativa" data-aba="personagens">Personagens</button>
        <button class="aba" data-aba="monstros">Monstros</button>
        <button class="aba" data-aba="itens">Itens</button>
        <button class="aba" data-aba="habilidades">Habilidades</button>
      </div>

      <div id="wiki-conteudo" class="wiki-conteudo"></div>
      <button class="btn-voltar" data-voltar>← Voltar ao menu</button>
    </div>
  </section>

  <!-- ===================================================== -->
  <!-- TELA 4: PARTIDA                                       -->
  <!-- O <canvas> é a "folha de desenho" onde o jogo é       -->
  <!-- desenhado quadro a quadro pelo JavaScript.            -->
  <!-- ===================================================== -->
  <section id="tela-jogo" class="tela">
    <canvas id="canvas" width="1100" height="680"></canvas>

    <!-- HUD = Heads-Up Display: as informações que ficam por cima do jogo -->
    <div class="hud">
      <div class="hud-esquerda">
        <div class="hud-linha">
          <span class="hud-rotulo">VIDA</span>
          <div class="barra barra-vida"><div id="barra-vida-fill" class="barra-fill"></div>
            <span id="barra-vida-texto" class="barra-texto">100 / 100</span></div>
        </div>
        <div class="hud-linha">
          <span class="hud-rotulo">XP</span>
          <div class="barra barra-xp"><div id="barra-xp-fill" class="barra-fill"></div>
            <span id="barra-xp-texto" class="barra-texto">0 / 10</span></div>
        </div>
        <div class="hud-nivel">NÍVEL <span id="hud-nivel">1</span></div>
      </div>

      <div class="hud-centro">
        <div id="hud-wave" class="hud-wave">WAVE 1</div>
        <div id="hud-aviso" class="hud-aviso"></div>
      </div>

      <div class="hud-direita">
        <div>⏱ <span id="hud-tempo">00:00</span></div>
        <div>💀 <span id="hud-mortes">0</span></div>
      </div>

      <!-- Barra de vida do chefe: só aparece quando existe um chefe vivo -->
      <div id="hud-chefe" class="hud-chefe escondido">
        <span id="hud-chefe-nome">CHEFE</span>
        <div class="barra barra-chefe"><div id="barra-chefe-fill" class="barra-fill"></div></div>
      </div>
    </div>

    <!-- Tela de escolha de habilidade (aparece ao subir de nível) -->
    <div id="tela-levelup" class="sobreposicao escondido">
      <div class="caixa-levelup">
        <h2>NÍVEL <span id="levelup-nivel">2</span>!</h2>
        <p>Escolha uma melhoria</p>
        <div id="levelup-opcoes" class="levelup-opcoes"></div>
      </div>
    </div>

    <!-- Tela de fim de partida -->
    <div id="tela-fim" class="sobreposicao escondido">
      <div class="caixa-fim">
        <h2>VOCÊ FOI DERROTADO</h2>
        <ul class="fim-estatisticas">
          <li>Wave alcançada: <b id="fim-wave">1</b></li>
          <li>Nível alcançado: <b id="fim-nivel">1</b></li>
          <li>Monstros derrotados: <b id="fim-mortes">0</b></li>
          <li>Tempo de sobrevivência: <b id="fim-tempo">00:00</b></li>
        </ul>
        <div class="fim-botoes">
          <button id="btn-jogar-novamente" class="btn-acao">Jogar novamente</button>
          <button id="btn-voltar-menu" class="btn-acao secundario">Voltar ao menu</button>
        </div>
      </div>
    </div>
  </section>

  <!-- ===================================================== -->
  <!-- SCRIPTS                                               -->
  <!-- A ORDEM IMPORTA: um arquivo só pode usar o que foi    -->
  <!-- definido nos arquivos carregados antes dele.          -->
  <!-- ===================================================== -->
  <script src="js/assets.js"></script>     <!-- carrega as imagens PNG -->
  <script src="js/dados.js"></script>      <!-- fichas de personagens e monstros -->
  <script src="js/abilities.js"></script>  <!-- lista de habilidades -->
  <script src="js/player.js"></script>     <!-- jogador -->
  <script src="js/enemies.js"></script>    <!-- monstros e chefes -->
  <script src="js/weapons.js"></script>    <!-- ataques, flechas, efeitos -->
  <script src="js/items.js"></script>      <!-- cristais de XP e poções -->
  <script src="js/cenario.js"></script>    <!-- decorações da arena -->
  <script src="js/ui.js"></script>         <!-- barras, HUD, telas -->
  <script src="js/game.js"></script>       <!-- loop principal da partida -->
  <script src="js/menu.js"></script>       <!-- menu, personagens, wiki -->
  <script src="js/main.js"></script>       <!-- inicialização -->
</body>
</html>
```

### D) Explicação do código
O HTML é o "esqueleto": ele cria as 4 telas (menu, personagens, wiki e jogo) e todos os elementos
que o JavaScript vai preencher ou mostrar/esconder. Nada aqui tem lógica; a lógica fica nos `.js`.

**Sistema de telas.** Cada `<section class="tela">` é uma tela inteira. Só a que tem a classe `ativa`
aparece (regra em `style.css`). Para trocar de tela, o JavaScript tira `ativa` de uma e põe em outra
(`UI.mostrarTela`). Se você remover a classe `ativa` do menu, o jogo abriria com a tela toda preta.

**`id`s.** Cada elemento que o JavaScript precisa achar tem um `id` único (`btn-jogar`, `barra-vida-fill`...).
`document.getElementById("btn-jogar")` devolve exatamente aquele botão. Se você renomear um id no HTML,
tem que renomear também no JS, senão aparece o erro "Cannot read properties of null".

**`<canvas>`.** É a "folha de desenho" da partida. Tem tamanho fixo de 1100x680 pixels internos (a *resolução*),
e o CSS estica isso para caber na janela. O jogo inteiro (arena, herói, monstros) é desenhado nele pelo `game.js`.

**HUD.** As barras de vida/XP, wave, tempo e mortes são HTML normal posicionado por cima do canvas.
Por isso é fácil estilizar com CSS. A `.hud` tem `pointer-events: none` para os cliques "atravessarem".

**Sobreposições.** `#tela-levelup` e `#tela-fim` começam com a classe `escondido` e só aparecem quando o JS tira essa classe.

**Ordem dos `<script>`.** É a parte mais importante do arquivo. O JavaScript é lido de cima para baixo.
`player.js` usa `PERSONAGENS` (definido em `dados.js`), então `dados.js` precisa vir antes. Se você trocar a ordem,
aparece "X is not defined". A regra: dados primeiro, depois as classes, depois quem usa as classes (`game.js`, `menu.js`), e `main.js` por último.

### E) Como utilizar
Coloque na **raiz** do projeto. Ele é o arquivo que você abre no navegador (duplo clique).
Teste: ao abrir, deve aparecer o menu com floresta, logo e 4 botões. Abra o console (F12 → Console):
não deve haver linhas vermelhas e deve aparecer "DG Fantasy pronto!".

### F) Resultado esperado
Menu visível, botões funcionando e nenhuma mensagem de erro no console.

---

## css/style.css

### A) Nome do arquivo
`css/style.css`

### B) Objetivo do arquivo
Estilos que valem para o jogo inteiro.

### C) Código completo
```css
/* =====================================================
   style.css — ESTILOS GERAIS
   Regras que valem para o jogo inteiro: fonte, cores,
   sistema de telas e botões reutilizáveis.
   ===================================================== */

/* Fonte com cara de "pixel" (fica embutida no navegador via fallback) */
:root {
  --fonte: "Segoe UI", "Trebuchet MS", Arial, sans-serif;
  --roxo: #a64dff;
  --roxo-escuro: #3b0f66;
  --azul: #3b8cff;
  --vermelho: #ff3b5c;
  --verde: #4caf50;
  --amarelo: #ffd54d;
  --painel: rgba(10, 8, 20, 0.82);
  --borda: rgba(255, 255, 255, 0.12);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;              /* a página não rola, o jogo ocupa tudo */
  background: #0b0a14;
  font-family: var(--fonte);
  color: #f4f1ff;
  letter-spacing: 0.5px;
  user-select: none;             /* evita selecionar texto sem querer ao clicar */
}

/* ---------- SISTEMA DE TELAS ----------
   Cada <section class="tela"> é uma tela do jogo.
   Todas começam escondidas; só a que tiver "ativa" aparece. */
.tela {
  position: absolute;
  inset: 0;                      /* ocupa a tela inteira */
  display: none;
}
.tela.ativa { display: block; }

/* Classe utilitária para esconder qualquer elemento */
.escondido { display: none !important; }

/* ---------- FUNDO DE FLORESTA (menu, personagens e wiki) ---------- */
.floresta {
  position: absolute;
  inset: 0;
  background: url("../assets/backgrounds/floresta_menu.jpg") center / cover no-repeat;
  image-rendering: pixelated;    /* mantém o visual de pixel art ao ampliar */
}
.floresta.escura::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(5, 3, 12, 0.72);  /* escurece a floresta para o painel ficar legível */
}

/* ---------- BOTÕES DE AÇÃO (usados no fim de jogo) ---------- */
.btn-acao {
  padding: 14px 28px;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(180deg, #c33a55, #8a1f36);
  border: 3px solid #ff4d6d;
  border-radius: 10px;
  cursor: pointer;
  text-transform: uppercase;
  box-shadow: 0 4px 0 #4d0f1f, 0 0 16px rgba(255, 77, 109, 0.35);
  transition: transform 0.08s, filter 0.15s;
}
.btn-acao:hover { filter: brightness(1.15); }
.btn-acao:active { transform: translateY(3px); box-shadow: 0 1px 0 #4d0f1f; }
.btn-acao.secundario {
  background: linear-gradient(180deg, #5a3a9a, #2d1d55);
  border-color: var(--roxo);
  box-shadow: 0 4px 0 #1a0d33, 0 0 16px rgba(166, 77, 255, 0.35);
}

.btn-voltar {
  margin-top: 18px;
  padding: 10px 22px;
  background: transparent;
  color: #cfc7ff;
  border: 2px solid var(--borda);
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
}
.btn-voltar:hover { background: rgba(255,255,255,0.08); color: #fff; }

/* ---------- PAINEL CENTRAL (personagens / wiki) ---------- */
.painel-central {
  position: relative;
  width: min(1000px, 92vw);
  max-height: 92vh;
  margin: 4vh auto 0;
  padding: 28px 32px;
  background: var(--painel);
  border: 3px solid var(--roxo);
  border-radius: 16px;
  box-shadow: 0 0 30px rgba(166, 77, 255, 0.35), inset 0 0 40px rgba(0,0,0,0.5);
  overflow-y: auto;
  text-align: center;
}
.titulo-tela {
  font-size: 34px;
  letter-spacing: 3px;
  color: #e9d9ff;
  text-shadow: 0 0 12px var(--roxo), 2px 2px 0 #000;
  margin-bottom: 20px;
}

/* Barra de rolagem discreta */
::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-thumb { background: var(--roxo-escuro); border-radius: 6px; }
```

### D) Explicação do código
**`:root { --roxo: ... }`** são *variáveis de CSS*. Em vez de repetir `#a64dff` em 20 lugares, escrevemos `var(--roxo)`.
Para mudar a cor do jogo inteiro, mude aqui.

**`.tela { display: none }` + `.tela.ativa { display: block }`** é o sistema de telas descrito no HTML.
`display: none` faz o elemento sumir completamente.

**`.escondido { display: none !important }`** é uma classe "utilitária": o JS adiciona/remove ela para mostrar e esconder
coisas (tela de level up, barra do chefe). O `!important` garante que ela vença qualquer outra regra.

**`.floresta`** usa a imagem `floresta_menu.jpg` como fundo com `background-size: cover` (cobre a tela toda sem distorcer).
`image-rendering: pixelated` mantém o visual de pixel art quando a imagem é ampliada. A variação `.floresta.escura::after`
coloca uma camada preta semi-transparente por cima, para o texto da wiki e dos personagens ficar legível.

**`.btn-acao`** e **`.btn-voltar`** são os botões das telas de fim e dos "Voltar". `box-shadow: 0 4px 0 ...` cria a
"base" 3D do botão; no `:active` (enquanto clica) o botão desce 3px, dando sensação de pressionar.

**`.painel-central`** é a caixa roxa centralizada usada pela seleção de personagens e pela wiki.
`overflow-y: auto` cria barra de rolagem se o conteúdo for maior que a tela.

### E) Como utilizar
Fica em `css/`. É carregado primeiro no `<head>` porque os outros CSS usam as variáveis definidas aqui.

### F) Resultado esperado
Cores consistentes em todo o jogo e apenas uma tela visível de cada vez.

---

## css/menu.css

### A) Nome do arquivo
`css/menu.css`

### B) Objetivo do arquivo
Aparência do menu principal, da seleção de personagens e da wiki.

### C) Código completo
```css
/* =====================================================
   menu.css — MENU PRINCIPAL, SELEÇÃO DE PERSONAGENS E WIKI
   ===================================================== */

/* ---------- MENU PRINCIPAL ---------- */
.menu-painel {
  position: absolute;
  left: 5vw;
  top: 50%;
  transform: translateY(-50%);
  width: min(460px, 42vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.logo {
  width: 100%;
  max-width: 440px;
  image-rendering: pixelated;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.8));
  animation: flutuar 4s ease-in-out infinite;    /* leve "respirar" do logo */
}
@keyframes flutuar {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}

.menu-botoes {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Botão base do menu (formato inspirado na referência: barra escura com borda colorida) */
.btn-menu {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 10px 16px;
  background: rgba(14, 8, 26, 0.88);
  border: 3px solid #fff;
  border-radius: 12px;
  color: #fff;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 3px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.1s, box-shadow 0.15s, filter 0.15s;
}
.btn-menu img {
  width: 46px;
  height: 46px;
  object-fit: contain;
  image-rendering: pixelated;
  border-radius: 8px;
}
.btn-menu span { flex: 1; text-align: center; padding-right: 46px; }
.btn-menu:hover { transform: translateX(6px) scale(1.02); filter: brightness(1.2); }
.btn-menu:active { transform: translateX(6px) scale(0.98); }

/* Cada botão tem sua cor (igual à imagem de referência) */
.btn-jogar       { border-color: #ff2e4d; box-shadow: 0 0 18px rgba(255, 46, 77, 0.45); }
.btn-personagens { border-color: #2f7bff; box-shadow: 0 0 18px rgba(47, 123, 255, 0.45); }
.btn-wiki        { border-color: #a64dff; box-shadow: 0 0 18px rgba(166, 77, 255, 0.45); }
.btn-sair        { border-color: #d8d8d8; box-shadow: 0 0 18px rgba(216, 216, 216, 0.3); }

.menu-dica {
  color: #cfc7ff;
  font-size: 14px;
  text-shadow: 1px 1px 0 #000;
  opacity: 0.85;
}

/* Personagem escolhido aparecendo no meio da floresta */
.menu-personagem {
  position: absolute;
  left: 64%;
  top: 52%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
}
.menu-personagem img {
  height: 190px;
  image-rendering: pixelated;
  filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.6));
  animation: respirar 1.8s ease-in-out infinite;  /* animação de "parado" */
}
@keyframes respirar {
  0%, 100% { transform: scaleY(1); }
  50%      { transform: scaleY(1.03) translateY(-2px); }
}
.menu-personagem span {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 3px;
  color: #fff;
  background: rgba(10, 8, 20, 0.75);
  padding: 4px 14px;
  border-radius: 8px;
  border: 2px solid var(--roxo);
}

/* ---------- SELEÇÃO DE PERSONAGENS ---------- */
.lista-personagens {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 24px;
}

.cartao-personagem {
  width: 300px;
  padding: 18px;
  background: rgba(20, 14, 40, 0.9);
  border: 3px solid var(--borda);
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.12s, border-color 0.15s, box-shadow 0.15s;
  text-align: left;
}
.cartao-personagem:hover { transform: translateY(-4px); border-color: #7d5cff; }
.cartao-personagem.selecionado {
  border-color: var(--amarelo);
  box-shadow: 0 0 22px rgba(255, 213, 77, 0.5);
}
.cartao-personagem .topo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}
.cartao-personagem img {
  height: 96px;
  image-rendering: pixelated;
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.6));
}
.cartao-personagem h3 {
  font-size: 24px;
  letter-spacing: 2px;
  color: #ffe9a8;
}
.cartao-personagem .descricao { font-size: 14px; color: #d5cff5; margin-bottom: 10px; line-height: 1.35; }
.cartao-personagem .atributos { list-style: none; font-size: 13px; color: #bdb5e0; }
.cartao-personagem .atributos li { padding: 3px 0; border-top: 1px dashed rgba(255,255,255,0.1); }
.cartao-personagem .atributos b { color: #fff; }
.cartao-personagem .selo {
  margin-top: 10px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--amarelo);
  letter-spacing: 2px;
  opacity: 0;
}
.cartao-personagem.selecionado .selo { opacity: 1; }

/* ---------- WIKI ---------- */
.painel-wiki { width: min(1100px, 94vw); }

.wiki-abas {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 18px;
}
.aba {
  padding: 8px 18px;
  background: rgba(255,255,255,0.05);
  border: 2px solid var(--borda);
  border-radius: 8px;
  color: #cfc7ff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}
.aba.ativa { background: var(--roxo-escuro); border-color: var(--roxo); color: #fff; }

.wiki-conteudo {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 16px;
  text-align: left;
}
.wiki-item {
  background: rgba(20, 14, 40, 0.9);
  border: 2px solid var(--borda);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.wiki-item img { height: 84px; image-rendering: pixelated; object-fit: contain; }
.wiki-item.carta img { height: 100px; width: 100%; background: rgba(0,0,0,0.35); border-radius: 8px; padding: 6px; }
.wiki-item h4 { font-size: 16px; letter-spacing: 1px; color: #ffe9a8; text-align: center; }
.wiki-item p { font-size: 13px; color: #d5cff5; text-align: center; line-height: 1.35; }
.wiki-item .tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(166, 77, 255, 0.25);
  border: 1px solid var(--roxo);
  color: #e9d9ff;
}
.wiki-item.chefe { border-color: var(--vermelho); box-shadow: 0 0 14px rgba(255,59,92,0.35); }
```

### D) Explicação do código
**Menu.** `.menu-painel` fica fixo à esquerda (`left: 5vw`) e centralizado verticalmente
(`top: 50%` + `transform: translateY(-50%)`), igual à imagem de referência. O logo tem a animação `flutuar`
(um `@keyframes` que sobe 8px e volta a cada 4 s).

**Botões do menu** (`.btn-menu`): barra escura com borda colorida e ícone à esquerda, como na referência. Cada botão
recebe a sua cor pela classe extra (`.btn-jogar` vermelha, `.btn-personagens` azul, `.btn-wiki` roxa, `.btn-sair` cinza).
No `:hover` o botão desliza 6px para a direita e fica mais claro (`filter: brightness`).

**Personagem no meio da floresta** (`.menu-personagem`): posicionado em `left: 64%` (no centro da clareira),
com a animação `respirar` (escala vertical de 3%, parece que ele respira). `pointer-events: none` evita que ele
bloqueie cliques.

**Seleção** (`.cartao-personagem`): cartões em `flex` lado a lado. A classe `.selecionado` (colocada pelo JS)
pinta a borda de amarelo e mostra o selo "✔ SELECIONADO" (que normalmente tem `opacity: 0`).

**Wiki**: `.wiki-conteudo` é um `grid` com colunas automáticas (`repeat(auto-fill, minmax(230px, 1fr))`):
o navegador cria quantas colunas couberem. `.wiki-item.chefe` tem borda vermelha.

### E) Como utilizar
Fica em `css/`, carregado depois de `style.css`.

### F) Resultado esperado
Menu idêntico em espírito à referência (logo + 4 botões coloridos à esquerda, herói na clareira), cartões e wiki organizados.

---

## css/game.css

### A) Nome do arquivo
`css/game.css`

### B) Objetivo do arquivo
Aparência da partida: canvas, HUD, level up e fim.

### C) Código completo
```css
/* =====================================================
   game.css — INTERFACE DA PARTIDA
   Canvas, HUD (barras), tela de level up e tela de fim.
   ===================================================== */

#tela-jogo {
  background: #07120a;
  display: none;
  align-items: center;
  justify-content: center;
}
#tela-jogo.ativa { display: flex; }

/* O canvas é redimensionado para caber na janela mantendo a proporção.
   A "pixelated" mantém os sprites nítidos ao ampliar. */
#canvas {
  width: min(100vw, calc(100vh * 1100 / 680));
  height: auto;
  aspect-ratio: 1100 / 680;
  image-rendering: pixelated;
  background: #1c4a1a;
  box-shadow: 0 0 40px #000;
}

/* ---------- HUD ---------- */
.hud {
  position: absolute;
  inset: 0;
  pointer-events: none;    /* os cliques "atravessam" o HUD e não atrapalham */
  font-weight: 700;
  text-shadow: 1px 1px 0 #000, 0 0 6px #000;
}

.hud-esquerda { position: absolute; left: 18px; top: 14px; width: 300px; }
.hud-linha { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.hud-rotulo { width: 42px; font-size: 13px; color: #e9d9ff; letter-spacing: 1px; }

.barra {
  position: relative;
  flex: 1;
  height: 20px;
  background: rgba(0, 0, 0, 0.65);
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-radius: 6px;
  overflow: hidden;
}
.barra-fill {
  height: 100%;
  width: 100%;
  transition: width 0.15s;   /* a barra "desliza" em vez de pular */
}
.barra-vida .barra-fill { background: linear-gradient(180deg, #ff6b6b, #c4121f); }
.barra-xp   .barra-fill { background: linear-gradient(180deg, #7fc3ff, #1f5fd1); width: 0; }
.barra-texto {
  position: absolute;
  inset: 0;
  text-align: center;
  font-size: 12px;
  line-height: 16px;
  color: #fff;
}
.hud-nivel { font-size: 15px; color: #ffe9a8; letter-spacing: 2px; }

.hud-centro { position: absolute; left: 50%; top: 14px; transform: translateX(-50%); text-align: center; }
.hud-wave {
  font-size: 28px;
  letter-spacing: 4px;
  color: #fff;
  text-shadow: 0 0 12px var(--roxo), 2px 2px 0 #000;
}
.hud-aviso {
  margin-top: 6px;
  font-size: 18px;
  color: var(--amarelo);
  min-height: 24px;
  animation: pulsar 0.8s ease-in-out infinite;
}
@keyframes pulsar { 50% { opacity: 0.5; } }

.hud-direita { position: absolute; right: 18px; top: 14px; font-size: 18px; text-align: right; line-height: 1.6; }

/* Barra do chefe: fica na parte de baixo, bem grande */
.hud-chefe {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  width: min(600px, 70vw);
  text-align: center;
}
.hud-chefe span { font-size: 16px; letter-spacing: 3px; color: #ff6b7d; }
.barra-chefe { height: 22px; margin-top: 4px; border-color: #ff3b5c; box-shadow: 0 0 14px rgba(255,59,92,0.6); }
.barra-chefe .barra-fill { background: linear-gradient(180deg, #ff5c7a, #9c0d27); }

/* ---------- SOBREPOSIÇÕES (level up e fim) ---------- */
.sobreposicao {
  position: absolute;
  inset: 0;
  background: rgba(3, 2, 10, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.caixa-levelup, .caixa-fim {
  background: var(--painel);
  border: 3px solid var(--roxo);
  border-radius: 16px;
  padding: 26px 32px;
  text-align: center;
  box-shadow: 0 0 30px rgba(166, 77, 255, 0.4);
  animation: aparecer 0.25s ease-out;
}
@keyframes aparecer { from { transform: scale(0.85); opacity: 0; } }

.caixa-levelup h2 { font-size: 34px; letter-spacing: 3px; color: var(--amarelo); text-shadow: 0 0 12px rgba(255,213,77,0.6); }
.caixa-levelup p  { color: #d5cff5; margin: 6px 0 18px; }

.levelup-opcoes { display: flex; gap: 18px; justify-content: center; }

/* Carta de habilidade: usa a imagem PNG da carta (referência) */
.carta-habilidade {
  width: 200px;
  background: rgba(20, 14, 40, 0.95);
  border: 3px solid var(--borda);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  transition: transform 0.12s, border-color 0.12s, box-shadow 0.12s;
}
.carta-habilidade:hover {
  transform: translateY(-8px) scale(1.04);
  border-color: var(--amarelo);
  box-shadow: 0 0 22px rgba(255, 213, 77, 0.5);
}
.carta-habilidade img { width: 100%; height: 120px; object-fit: contain; image-rendering: pixelated; border-radius: 8px; background: rgba(0,0,0,0.35); padding: 6px; }
.carta-habilidade h4 { margin-top: 8px; font-size: 15px; letter-spacing: 1px; color: #ffe9a8; }
.carta-habilidade p  { font-size: 12px; color: #d5cff5; margin-top: 4px; line-height: 1.3; }

.caixa-fim h2 { font-size: 36px; letter-spacing: 3px; color: var(--vermelho); text-shadow: 0 0 14px rgba(255,59,92,0.6); margin-bottom: 14px; }
.fim-estatisticas { list-style: none; font-size: 17px; color: #d5cff5; line-height: 1.9; margin-bottom: 20px; }
.fim-estatisticas b { color: #fff; }
.fim-botoes { display: flex; gap: 14px; justify-content: center; }
```

### D) Explicação do código
**`#canvas`**: `width: min(100vw, calc(100vh * 1100 / 680))` significa "o maior possível sem passar da largura
nem da altura da janela, mantendo a proporção 1100:680". `aspect-ratio` cuida da altura automaticamente.

**Barras** (`.barra` + `.barra-fill`): a `.barra` é a moldura escura; a `.barra-fill` é a parte colorida por dentro.
O JavaScript só muda a `width` da `.barra-fill` (ex.: `width: 45%`). O `transition: width 0.15s` faz a barra
"deslizar" em vez de pular. A barra de vida é vermelha, a de XP azul, a do chefe vermelha e maior, embaixo da tela.

**`.sobreposicao`**: camada preta semi-transparente que cobre a tela toda (`inset: 0`) e centraliza a caixa
com `display: flex`. Usada pelo level up e pela tela de fim. O `z-index: 10` garante que fique por cima do HUD.

**`.carta-habilidade`**: cartão com o ícone PNG da carta (recortado da sua referência), nome e descrição.
No `:hover` sobe 8px e ganha brilho amarelo. O clique é tratado no `ui.js`.

**`@keyframes aparecer`**: as caixas "crescem" de 85% para 100% ao abrir (efeito de pop).

### E) Como utilizar
Fica em `css/`.

### F) Resultado esperado
HUD legível por cima do jogo, barras animadas, cartas de habilidade clicáveis e tela de derrota centralizada.

---

## js/assets.js

### A) Nome do arquivo
`js/assets.js`

### B) Objetivo do arquivo
Carregar todos os PNG antes de o jogo começar.

### C) Código completo
```javascript
/* =====================================================
   assets.js — CARREGADOR DE IMAGENS (PNG)
   Carrega todos os PNGs antes do jogo começar, para que
   nenhum sprite apareça "em branco" durante a partida.
   ===================================================== */

const Assets = {
  // Aqui ficam as imagens já carregadas. Exemplo: Assets.img.guerreiro_frente
  img: {},

  // Lista de tudo que precisa ser carregado: "nome": "caminho do arquivo"
  lista: {
    // Personagens (frente, costas, lado direito, lado esquerdo)
    guerreiro_frente:   "assets/characters/guerreiro_frente.png",
    guerreiro_costas:   "assets/characters/guerreiro_costas.png",
    guerreiro_lado:     "assets/characters/guerreiro_lado.png",
    guerreiro_lado_esq: "assets/characters/guerreiro_lado_esq.png",
    arqueiro_frente:    "assets/characters/arqueiro_frente.png",
    arqueiro_costas:    "assets/characters/arqueiro_costas.png",
    arqueiro_lado:      "assets/characters/arqueiro_lado.png",
    arqueiro_lado_esq:  "assets/characters/arqueiro_lado_esq.png",

    // Monstros
    goblin_frente: "assets/enemies/goblin_frente.png",
    goblin_costas: "assets/enemies/goblin_costas.png",
    goblin_lado:   "assets/enemies/goblin_lado.png",
    goblin_lado_esq: "assets/enemies/goblin_lado_esq.png",
    zumbi_frente: "assets/enemies/zumbi_frente.png",
    zumbi_costas: "assets/enemies/zumbi_costas.png",
    zumbi_lado:   "assets/enemies/zumbi_lado.png",
    zumbi_lado_esq: "assets/enemies/zumbi_lado_esq.png",
    lobo_frente: "assets/enemies/lobo_frente.png",
    lobo_costas: "assets/enemies/lobo_costas.png",
    lobo_lado:   "assets/enemies/lobo_lado.png",
    lobo_lado_esq: "assets/enemies/lobo_lado_esq.png",
    aranha_frente: "assets/enemies/aranha_frente.png",
    aranha_costas: "assets/enemies/aranha_costas.png",
    aranha_lado:   "assets/enemies/aranha_lado.png",
    aranha_lado_esq: "assets/enemies/aranha_lado_esq.png",
    esqueleto_frente: "assets/enemies/esqueleto_frente.png",
    esqueleto_costas: "assets/enemies/esqueleto_costas.png",
    esqueleto_lado:   "assets/enemies/esqueleto_lado.png",
    esqueleto_lado_esq: "assets/enemies/esqueleto_lado_esq.png",
    esqueleto_arqueiro_frente: "assets/enemies/esqueleto_arqueiro_frente.png",
    esqueleto_arqueiro_costas: "assets/enemies/esqueleto_arqueiro_costas.png",
    esqueleto_arqueiro_lado:   "assets/enemies/esqueleto_arqueiro_lado.png",
    esqueleto_arqueiro_lado_esq: "assets/enemies/esqueleto_arqueiro_lado_esq.png",

    // Itens, armas e efeitos
    cristal_xp:     "assets/items/cristal_xp.png",
    pocao_cura:     "assets/items/pocao_cura.png",
    flecha:         "assets/weapons/flecha.png",
    corte_espada:   "assets/effects/corte_espada.png",
    impacto_flecha: "assets/effects/impacto_flecha.png",

    // Cenário da arena e decorações
    arena:   "assets/backgrounds/arena.jpg",
    arvore:  "assets/backgrounds/arvore.png",
    arvore2: "assets/backgrounds/arvore2.png",
    arbusto: "assets/backgrounds/arbusto.png",
    pedra:   "assets/backgrounds/pedra.png",
    flores:  "assets/backgrounds/flores.png",
  },

  /**
   * Carrega todas as imagens da lista.
   * @param {function} aoTerminar - função chamada quando TUDO estiver pronto
   */
  carregar(aoTerminar) {
    const nomes = Object.keys(this.lista);
    let carregadas = 0;

    nomes.forEach((nome) => {
      const imagem = new Image();         // cria um objeto de imagem vazio
      imagem.src = this.lista[nome];      // manda o navegador buscar o arquivo

      // Quando a imagem terminar de carregar (ou falhar), contamos +1.
      // Quando o contador chegar ao total, chamamos "aoTerminar".
      const contar = () => {
        carregadas++;
        if (carregadas === nomes.length) aoTerminar();
      };
      imagem.onload = contar;
      imagem.onerror = () => {
        console.warn("Não foi possível carregar a imagem:", this.lista[nome]);
        contar();
      };

      this.img[nome] = imagem;
    });
  },
};
```

### D) Explicação do código
**`Assets.lista`** é um objeto "nome → caminho do arquivo". O nome é o que o resto do código usa:
`Assets.img.goblin_frente` é a imagem `assets/enemies/goblin_frente.png`.

**Padrão de nomes dos sprites:** `tipo_direcao`, onde direção é `frente`, `costas`, `lado` (olhando para a direita)
ou `lado_esq` (espelhado, olhando para a esquerda). `player.js` e `enemies.js` montam o nome com
`` `${this.classe}_${this.direcao}` `` — por isso o nome do arquivo PRECISA seguir esse padrão. Para adicionar um
monstro novo, basta criar os 4 PNGs com esse padrão e colocar os 4 nomes aqui.

**`carregar(aoTerminar)`**: para cada entrada cria um `new Image()`, define `src` (o navegador começa a baixar)
e guarda em `Assets.img`. O `onload` dispara quando a imagem termina; `onerror` se falhar (ex.: nome errado).
Em ambos os casos o contador sobe. Quando o contador chega ao total, chama `aoTerminar()` — que no `main.js` é a
função que liga o menu.

Isso se chama *callback*: você entrega uma função para ser executada "quando terminar". Sem isso o menu ligaria
na hora e o botão JOGAR poderia abrir a partida com sprites invisíveis.

Se o nome de um arquivo estiver errado, aparece no console: "Não foi possível carregar a imagem: ..." — e o jogo
continua, só sem aquele sprite.

### E) Como utilizar
Primeiro script do `index.html`. Teste: no console, digite `Assets.img.guerreiro_frente.complete` → deve ser `true`.

### F) Resultado esperado
Todas as imagens ficam disponíveis em `Assets.img` antes de qualquer tela usar.

---

## js/dados.js

### A) Nome do arquivo
`js/dados.js`

### B) Objetivo do arquivo
Fichas (números e textos) de personagens, monstros, chefes, itens e configurações.

### C) Código completo
```javascript
/* =====================================================
   dados.js — FICHAS DE PERSONAGENS, MONSTROS E CHEFES
   Aqui ficam só NÚMEROS e TEXTOS (vida, dano, velocidade...).
   Quer deixar o goblin mais forte? É aqui que você mexe.
   ===================================================== */

/* ---------- PERSONAGENS JOGÁVEIS ---------- */
const PERSONAGENS = {
  guerreiro: {
    id: "guerreiro",
    nome: "Guerreiro",
    descricao: "Cavaleiro de armadura que golpeia com a espada tudo que chega perto. Resistente e rápido no ataque.",
    tipoAtaque: "Corte de espada (curto alcance)",
    vidaMax: 120,
    velocidade: 190,        // pixels por segundo
    dano: 14,
    alcance: 95,            // distância máxima do golpe (pixels)
    intervaloAtaque: 0.55,  // segundos entre um ataque e outro (menor = mais rápido)
    alvosPorGolpe: 1,       // quantos monstros cada golpe acerta
  },
  arqueiro: {
    id: "arqueiro",
    nome: "Arqueiro",
    descricao: "Caçador encapuzado que dispara flechas de longe. Ataca mais devagar, mas de muito mais longe.",
    tipoAtaque: "Flechas (longo alcance)",
    vidaMax: 90,
    velocidade: 205,
    dano: 18,
    alcance: 340,
    intervaloAtaque: 0.9,
    flechasPorDisparo: 1,   // quantas flechas saem por disparo
  },
};

/* ---------- MONSTROS ----------
   waveMinima: a partir de qual wave esse monstro começa a aparecer.
   comportamento: "perseguir" (vai direto), "lobo" (rápido, dá investidas),
   "aranha" (anda em rajadas e para), "atirador" (mantém distância e atira). */
const MONSTROS = {
  goblin: {
    id: "goblin", nome: "Goblin",
    descricao: "Fraco, lento e aparece em grupo nas primeiras waves.",
    vida: 22, dano: 6, velocidade: 65, xp: 3, raio: 20,
    waveMinima: 1, comportamento: "perseguir", chancePocao: 0.06,
  },
  zumbi: {
    id: "zumbi", nome: "Zumbi",
    descricao: "Mais rápido que o goblin e aguenta mais pancada.",
    vida: 45, dano: 9, velocidade: 85, xp: 5, raio: 22,
    waveMinima: 3, comportamento: "perseguir", chancePocao: 0.08,
  },
  lobo: {
    id: "lobo", nome: "Lobo",
    descricao: "Muito rápido e dá investidas quando chega perto. Pouca vida.",
    vida: 35, dano: 11, velocidade: 150, xp: 6, raio: 22,
    waveMinima: 5, comportamento: "lobo", chancePocao: 0.08,
  },
  aranha: {
    id: "aranha", nome: "Aranha",
    descricao: "Anda em rajadas rápidas, depois para. Sua mordida é forte.",
    vida: 60, dano: 14, velocidade: 170, xp: 8, raio: 24,
    waveMinima: 7, comportamento: "aranha", chancePocao: 0.1,
  },
  esqueleto_arqueiro: {
    id: "esqueleto_arqueiro", nome: "Esqueleto Arqueiro",
    descricao: "Mantém distância e atira flechas de osso no herói.",
    vida: 40, dano: 10, velocidade: 70, xp: 8, raio: 20,
    waveMinima: 8, comportamento: "atirador", distanciaTiro: 260, intervaloTiro: 2.2, chancePocao: 0.1,
  },
  esqueleto: {
    id: "esqueleto", nome: "Esqueleto Guerreiro",
    descricao: "Carrega escudo e espada: muita vida e dano alto.",
    vida: 110, dano: 16, velocidade: 75, xp: 12, raio: 22,
    waveMinima: 10, comportamento: "perseguir", chancePocao: 0.12,
  },
};

/* ---------- CHEFES (um a cada 5 waves) ----------
   Usam o sprite de um monstro em tamanho maior, com contorno vermelho.
   A lista se repete e fica mais forte a cada ciclo (ver enemies.js). */
const CHEFES = [
  { nome: "Rei Goblin",      base: "goblin",            vida: 420,  dano: 18, velocidade: 80,  escala: 2.4, xp: 60, habilidade: "investida" },
  { nome: "Lobo Alfa",       base: "lobo",              vida: 650,  dano: 22, velocidade: 130, escala: 2.3, xp: 90, habilidade: "investida" },
  { nome: "Aranha Rainha",   base: "aranha",            vida: 900,  dano: 26, velocidade: 120, escala: 2.6, xp: 120, habilidade: "investida" },
  { nome: "Lorde Esqueleto", base: "esqueleto_arqueiro",vida: 1200, dano: 24, velocidade: 70,  escala: 2.5, xp: 160, habilidade: "rajada" },
];

/* ---------- ITENS ---------- */
const ITENS = {
  cristal_xp: { nome: "Cristal de XP",  descricao: "Cai de todo monstro derrotado. Concede experiência ao ser coletado." },
  pocao_cura: { nome: "Poção de Cura",  descricao: "Tem uma chance de cair dos monstros. Recupera 35% da vida máxima." },
};

/* ---------- CONFIGURAÇÕES GERAIS DA PARTIDA ---------- */
const CONFIG = {
  larguraArena: 1600,           // tamanho do mundo (a arena) em pixels
  alturaArena: 1600,
  margemParede: 78,             // espessura da muralha de pedra (o jogador não entra nela)
  larguraTela: 1100,            // tamanho do canvas (a "janela" que mostra parte da arena)
  alturaTela: 680,
  raioColeta: 60,               // distância para pegar um item
  xpBase: 10,                   // XP para passar do nível 1 para o 2
  xpPorNivel: 7,                // quanto a mais é exigido a cada nível
  monstrosBase: 6,              // monstros na wave 1
  monstrosPorWave: 3,           // quantos a mais por wave
  pausaEntreWaves: 3,           // segundos de descanso entre waves
};
```

### D) Explicação do código
Este arquivo não tem lógica: só *dados*. É o lugar para balancear o jogo.

**`PERSONAGENS`**: `vidaMax`, `velocidade` (pixels por segundo), `dano`, `alcance` (pixels),
`intervaloAtaque` (segundos entre ataques: 0,55 para o guerreiro = quase 2 golpes/s; 0,9 para o arqueiro),
`alvosPorGolpe` (guerreiro) e `flechasPorDisparo` (arqueiro). O guerreiro tem alcance 95 e o arqueiro 340 —
exatamente a diferença pedida: pouco alcance e rápido vs. muito alcance e lento.

**`MONSTROS`**: cada um tem `waveMinima` (quando começa a aparecer) e `comportamento`:
- `perseguir` — vai direto ao herói (goblin, zumbi, esqueleto);
- `lobo` — rápido, dá investidas;
- `aranha` — anda em rajadas e para;
- `atirador` — mantém distância e atira flechas (esqueleto arqueiro).
`chancePocao` é a chance (0 a 1) de dropar poção. `raio` é o tamanho da área de colisão.

Assim nenhum monstro é "cópia com outra cor": goblin (fraco/lento), zumbi (mais vida e rápido), lobo (muito rápido,
pouca vida, investida), aranha (rajadas, mordida forte), esqueleto arqueiro (atira), esqueleto guerreiro (tanque).

**`CHEFES`**: lista usada a cada 5 waves em ordem (Rei Goblin, Lobo Alfa, Aranha Rainha, Lorde Esqueleto). Depois
do 4º a lista recomeça mais forte. `escala` é o tamanho (2,4 = 240%), `habilidade` é `investida` ou `rajada`.

**`CONFIG`**: tamanho da arena (1600x1600, maior que o modelo), espessura da muralha, tamanho do canvas, raio de coleta,
XP por nível (`xpBase + (nivel-1) * xpPorNivel` → 10, 17, 24, 31...), monstros por wave (`6 + 3 por wave`) e pausa
entre waves.

### E) Como utilizar
Segundo script. Teste: mude `MONSTROS.goblin.vida` para 1 e veja os goblins morrerem com 1 golpe.

### F) Resultado esperado
Os números daqui controlam o balanceamento inteiro.

---

## js/abilities.js

### A) Nome do arquivo
`js/abilities.js`

### B) Objetivo do arquivo
Lista de habilidades e o sorteio das 3 opções.

### C) Código completo
```javascript
/* =====================================================
   abilities.js — HABILIDADES E MELHORIAS
   Cada habilidade é um objeto com:
     id       -> nome interno
     nome     -> texto mostrado na carta
     descricao-> o que ela faz (texto)
     carta    -> imagem PNG da carta (pasta assets/cards)
     classes  -> quais personagens podem receber ["guerreiro", "arqueiro"]
     maximo   -> quantas vezes pode ser escolhida (undefined = sem limite)
     aplicar  -> FUNÇÃO que de fato altera os atributos do jogador
   ===================================================== */

const HABILIDADES = [
  /* ---------- PARA TODOS ---------- */
  {
    id: "dano", nome: "Dano +25%", carta: "dano_duplo",
    descricao: "Seus ataques causam 25% a mais de dano.",
    classes: ["guerreiro", "arqueiro"],
    aplicar: (p) => { p.dano = Math.round(p.dano * 1.25); },
  },
  {
    id: "velocidade", nome: "Velocidade", carta: "velocidade",
    descricao: "Você anda 15% mais rápido.",
    classes: ["guerreiro", "arqueiro"], maximo: 5,
    aplicar: (p) => { p.velocidade *= 1.15; },
  },
  {
    id: "mais_vida", nome: "Mais Vida", carta: "mais_vida",
    descricao: "+25 de vida máxima e recupera 25 de vida.",
    classes: ["guerreiro", "arqueiro"],
    aplicar: (p) => { p.vidaMax += 25; p.vida = Math.min(p.vidaMax, p.vida + 25); },
  },
  {
    id: "pocao", nome: "Poção de Cura", carta: "pocao_de_cura",
    descricao: "Recupera 50% da sua vida máxima agora.",
    classes: ["guerreiro", "arqueiro"],
    aplicar: (p) => { p.vida = Math.min(p.vidaMax, p.vida + p.vidaMax * 0.5); },
  },
  {
    id: "escudo", nome: "Escudo", carta: "escudo",
    descricao: "Recebe 15% a menos de dano (permanente).",
    classes: ["guerreiro", "arqueiro"], maximo: 4,
    aplicar: (p) => { p.reducaoDano = 1 - (1 - p.reducaoDano) * 0.85; },
  },
  {
    id: "ima", nome: "Imã de Itens", carta: "ima_de_itens",
    descricao: "Cristais e poções são atraídos de mais longe.",
    classes: ["guerreiro", "arqueiro"], maximo: 3,
    aplicar: (p) => { p.raioColeta += 60; },
  },

  /* ---------- SÓ GUERREIRO ---------- */
  {
    id: "espada_rapida", nome: "Ataque Mais Rápido", carta: "ataque_mais_rapido",
    descricao: "Sua espada ataca 20% mais rápido.",
    classes: ["guerreiro"], maximo: 6,
    aplicar: (p) => { p.intervaloAtaque *= 0.8; },
  },
  {
    id: "segunda_espada", nome: "Segunda Espada", carta: "segunda_espada",
    descricao: "Cada golpe acerta +1 monstro próximo.",
    classes: ["guerreiro"], maximo: 4,
    aplicar: (p) => { p.alvosPorGolpe += 1; },
  },
  {
    id: "espada_vento", nome: "Espada de Vento", carta: "espada_de_vento",
    descricao: "Alcance do corte aumenta em 30%.",
    classes: ["guerreiro"], maximo: 4,
    aplicar: (p) => { p.alcance *= 1.3; },
  },
  {
    id: "onda_choque", nome: "Onda de Choque", carta: "explosao",
    descricao: "Seus golpes empurram os monstros para trás.",
    classes: ["guerreiro"], maximo: 1,
    aplicar: (p) => { p.empurrao = true; },
  },

  /* ---------- SÓ ARQUEIRO ---------- */
  {
    id: "rajada", nome: "Rajada", carta: "rajada",
    descricao: "Dispara flechas 20% mais rápido.",
    classes: ["arqueiro"], maximo: 6,
    aplicar: (p) => { p.intervaloAtaque *= 0.8; },
  },
  {
    id: "duas_flechas", nome: "Duas Flechas", carta: "duas_flechas",
    descricao: "+1 flecha por disparo (cada uma mira um monstro).",
    classes: ["arqueiro"], maximo: 4,
    aplicar: (p) => { p.flechasPorDisparo += 1; },
  },
  {
    id: "arco", nome: "Arco Longo", carta: "arco",
    descricao: "Alcance das flechas aumenta em 25%.",
    classes: ["arqueiro"], maximo: 3,
    aplicar: (p) => { p.alcance *= 1.25; },
  },
  {
    id: "fogo", nome: "Flecha de Fogo", carta: "flecha_de_fogo",
    descricao: "Flechas incendeiam: 3 de dano por segundo durante 3s.",
    classes: ["arqueiro"], maximo: 1,
    aplicar: (p) => { p.flechaFogo = true; },
  },
  {
    id: "gelo", nome: "Flecha de Gelo", carta: "flecha_de_gelo",
    descricao: "Flechas deixam o monstro 50% mais lento por 2s.",
    classes: ["arqueiro"], maximo: 1,
    aplicar: (p) => { p.flechaGelo = true; },
  },
  {
    id: "chuva", nome: "Chuva de Flechas", carta: "chuva_de_flechas",
    descricao: "A cada 6s, 8 flechas são disparadas em todas as direções.",
    classes: ["arqueiro"], maximo: 1,
    aplicar: (p) => { p.chuvaFlechas = true; },
  },
];

/**
 * Sorteia 3 habilidades válidas para o personagem.
 * - só as da classe dele
 * - só as que ainda não bateram no "maximo"
 */
function sortearHabilidades(jogador, quantidade = 3) {
  const validas = HABILIDADES.filter((h) => {
    if (!h.classes.includes(jogador.classe)) return false;
    const vezes = jogador.habilidadesPegas[h.id] || 0;
    if (h.maximo !== undefined && vezes >= h.maximo) return false;
    return true;
  });

  // Embaralha (algoritmo simples: ordena por número aleatório) e pega as primeiras
  return validas.sort(() => Math.random() - 0.5).slice(0, quantidade);
}
```

### D) Explicação do código
Cada habilidade é um objeto com `id`, `nome`, `descricao`, `carta` (nome do PNG em `assets/cards/`), `classes`
(quem pode receber), `maximo` (quantas vezes pode ser escolhida) e **`aplicar`**, uma função que recebe o jogador
(`p`) e altera os atributos dele de verdade.

Exemplos de como as melhorias funcionam:
- `p.dano = Math.round(p.dano * 1.25)` → o `weapons.js` usa `jogador.dano` ao causar dano, então o próximo golpe já é mais forte.
- `p.intervaloAtaque *= 0.8` → o cronômetro de ataque é recarregado com esse valor; menor = ataca mais rápido.
- `p.alcance *= 1.3` → `Armas.alvosNoAlcance` procura monstros até essa distância.
- `p.reducaoDano = 1 - (1 - p.reducaoDano) * 0.85` → `receberDano` multiplica o dano por `(1 - reducaoDano)`. A fórmula
  faz cada escudo reduzir 15% *do que sobrou* (nunca chega a 100%).
- Flags `p.flechaFogo = true`, `p.empurrao = true` etc.: o `weapons.js` verifica essas flags na hora do ataque.

**Compatibilidade com o personagem**: `classes: ["guerreiro"]` ou `["arqueiro"]`. A função `sortearHabilidades`
filtra pela classe e pelo `maximo`, embaralha e devolve 3. O guerreiro nunca vê "Duas Flechas" e o arqueiro nunca vê
"Segunda Espada". Nenhuma habilidade da lista é só visual: todas alteram algo usado pelo jogo.

**Por que não há "Teleporte", "Bomba", "Invisibilidade"?** Elas estavam nas cartas de referência, mas teriam efeito
duvidoso ou complexo nesse estilo de jogo (teleporte aleatório pode jogar você no meio dos monstros). O pedido dizia
para dispensar o que fosse complicado demais — ficam como melhoria futura. Os PNGs dessas cartas continuam em `assets/cards/`.

**Para criar uma habilidade nova**: copie um bloco, mude `id`/`nome`/`carta`/`classes` e escreva o `aplicar`.
Se ela precisar de um comportamento novo (ex.: flecha que ricocheteia), ligue uma flag aqui e trate-a em `weapons.js`.

### E) Como utilizar
Terceiro script. Teste: no console durante a partida, `Jogo.jogador.ganharXp(999) && Jogo.subirDeNivel()` abre a tela; escolha e compare `Jogo.jogador.dano` antes e depois.

### F) Resultado esperado
Ao subir de nível aparecem 3 cartas compatíveis com o personagem e a escolhida muda os atributos imediatamente.

---

## js/player.js

### A) Nome do arquivo
`js/player.js`

### B) Objetivo do arquivo
O jogador: movimentação, vida, XP, nível, animação e desenho.

### C) Código completo
```javascript
/* =====================================================
   player.js — O JOGADOR
   Movimentação (WASD), vida, XP, nível, animação de
   caminhada e desenho do personagem.
   ===================================================== */

/* Teclas pressionadas neste momento. Exemplo: Teclas.w === true enquanto W estiver apertado */
const Teclas = {};
window.addEventListener("keydown", (e) => { Teclas[e.key.toLowerCase()] = true; });
window.addEventListener("keyup",   (e) => { Teclas[e.key.toLowerCase()] = false; });

class Jogador {
  /**
   * @param {string} classe - "guerreiro" ou "arqueiro" (chave de PERSONAGENS)
   */
  constructor(classe) {
    const ficha = PERSONAGENS[classe];
    this.classe = classe;
    this.nome = ficha.nome;

    // Posição no MUNDO (arena), começa no centro
    this.x = CONFIG.larguraArena / 2;
    this.y = CONFIG.alturaArena / 2;
    this.raio = 20;               // tamanho da "área de colisão" (um círculo)

    // Atributos copiados da ficha (copiar é importante: assim as habilidades
    // alteram só ESTE jogador e a ficha original continua intacta para a próxima partida)
    this.vidaMax = ficha.vidaMax;
    this.vida = ficha.vidaMax;
    this.velocidade = ficha.velocidade;
    this.dano = ficha.dano;
    this.alcance = ficha.alcance;
    this.intervaloAtaque = ficha.intervaloAtaque;
    this.alvosPorGolpe = ficha.alvosPorGolpe || 1;
    this.flechasPorDisparo = ficha.flechasPorDisparo || 1;
    this.reducaoDano = 0;          // 0 = recebe dano cheio; 0.3 = recebe 30% a menos
    this.raioColeta = CONFIG.raioColeta;

    // Flags de habilidades especiais (começam desligadas)
    this.empurrao = false;
    this.flechaFogo = false;
    this.flechaGelo = false;
    this.chuvaFlechas = false;
    this.habilidadesPegas = {};    // conta quantas vezes cada habilidade foi escolhida

    // Experiência e nível
    this.nivel = 1;
    this.xp = 0;
    this.xpProximo = CONFIG.xpBase;

    // Controle de tempo
    this.tempoAtaque = 0;          // quando chegar a 0 pode atacar de novo
    this.tempoChuva = 0;           // cronômetro da Chuva de Flechas
    this.invulneravel = 0;         // segundos sem levar dano após ser atingido
    this.morto = false;

    // Animação
    this.direcao = "frente";       // "frente", "costas", "lado", "lado_esq"
    this.andando = false;
    this.tempoAnim = 0;            // acumula tempo para a animação de caminhada
  }

  /* ---------- MOVIMENTAÇÃO ---------- */
  atualizar(dt) {
    // dt = "delta time": quantos SEGUNDOS se passaram desde o último quadro.
    // Multiplicar a velocidade por dt faz o jogo andar igual em qualquer computador.
    let dx = 0, dy = 0;
    if (Teclas["w"] || Teclas["arrowup"])    dy -= 1;
    if (Teclas["s"] || Teclas["arrowdown"])  dy += 1;
    if (Teclas["a"] || Teclas["arrowleft"])  dx -= 1;
    if (Teclas["d"] || Teclas["arrowright"]) dx += 1;

    this.andando = dx !== 0 || dy !== 0;

    if (this.andando) {
      // Na diagonal, dx e dy valem 1 ao mesmo tempo e o personagem andaria
      // mais rápido (√2 vezes). Dividimos pelo comprimento para corrigir isso.
      const comprimento = Math.hypot(dx, dy);
      dx /= comprimento;
      dy /= comprimento;

      this.x += dx * this.velocidade * dt;
      this.y += dy * this.velocidade * dt;

      // Escolhe qual imagem usar de acordo com a direção dominante
      if (Math.abs(dx) > Math.abs(dy)) this.direcao = dx > 0 ? "lado" : "lado_esq";
      else this.direcao = dy > 0 ? "frente" : "costas";

      this.tempoAnim += dt;
    }

    // Não deixa sair da arena (fica dentro da muralha)
    const m = CONFIG.margemParede + this.raio;
    this.x = Math.max(m, Math.min(CONFIG.larguraArena - m, this.x));
    this.y = Math.max(m, Math.min(CONFIG.alturaArena - m, this.y));

    // Cronômetros
    if (this.tempoAtaque > 0) this.tempoAtaque -= dt;
    if (this.invulneravel > 0) this.invulneravel -= dt;
    if (this.chuvaFlechas) this.tempoChuva += dt;
  }

  /* ---------- RECEBER DANO ---------- */
  receberDano(quantidade) {
    if (this.invulneravel > 0 || this.morto) return;
    const danoFinal = quantidade * (1 - this.reducaoDano);
    this.vida -= danoFinal;
    this.invulneravel = 0.35;      // pequeno "escudo" para não tomar 10 hits no mesmo segundo
    if (this.vida <= 0) {
      this.vida = 0;
      this.morto = true;
    }
  }

  curar(quantidade) {
    this.vida = Math.min(this.vidaMax, this.vida + quantidade);
  }

  /* ---------- EXPERIÊNCIA ----------
     Retorna true se subiu de nível (o game.js usa isso para abrir a tela de habilidades) */
  ganharXp(quantidade) {
    this.xp += quantidade;
    if (this.xp >= this.xpProximo) {
      this.xp -= this.xpProximo;
      this.nivel++;
      this.xpProximo = CONFIG.xpBase + (this.nivel - 1) * CONFIG.xpPorNivel;
      return true;
    }
    return false;
  }

  /* ---------- DESENHO ---------- */
  desenhar(ctx) {
    const img = Assets.img[`${this.classe}_${this.direcao}`];
    if (!img) return;

    // Animação de caminhada: o corpo "balança" para cima e para baixo
    // e inclina levemente, usando funções seno (vai e volta suavemente).
    const balanco = this.andando ? Math.sin(this.tempoAnim * 14) * 3 : Math.sin(performance.now() / 500) * 1;
    const inclinacao = this.andando ? Math.sin(this.tempoAnim * 14) * 0.06 : 0;

    const altura = 72;                               // altura desenhada
    const largura = img.width * (altura / img.height); // mantém proporção

    ctx.save();
    // Sombra no chão
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + altura / 2 - 4, largura / 2.4, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pisca quando está invulnerável (acabou de levar dano)
    if (this.invulneravel > 0 && Math.floor(this.invulneravel * 20) % 2 === 0) ctx.globalAlpha = 0.45;

    ctx.translate(this.x, this.y + balanco);
    ctx.rotate(inclinacao);
    ctx.drawImage(img, -largura / 2, -altura / 2, largura, altura);
    ctx.restore();
  }
}
```

### D) Explicação do código
**`Teclas`** é um objeto que guarda quais teclas estão pressionadas AGORA. Os eventos `keydown`/`keyup` do navegador
ligam/desligam `Teclas["w"]`, `Teclas["a"]`... Por que não mover direto no `keydown`? Porque o `keydown` dispara em
"rajadas" irregulares; lendo o estado a cada quadro o movimento fica suave e permite diagonais (W+D ao mesmo tempo).

**`constructor(classe)`** copia os valores da ficha para `this`. Copiar é essencial: as habilidades alteram
`this.dano`, não `PERSONAGENS.guerreiro.dano`. Assim "Jogar novamente" cria um jogador novo com os valores originais
(requisito: não manter atributos da partida anterior).

**`atualizar(dt)`**:
1. Lê as teclas e monta a direção `(dx, dy)`.
2. **Normaliza a diagonal**: com W+D, `dx=1` e `dy=1`, o deslocamento seria √2 ≈ 1,41 vezes maior. Dividir pelo
   comprimento (`Math.hypot`) corrige. Remova isso e o herói corre mais rápido na diagonal.
3. Move: `x += dx * velocidade * dt`.
4. Escolhe a imagem pela direção dominante (`lado`, `lado_esq`, `frente`, `costas`).
5. **Limita à arena**: `Math.max(m, Math.min(limite, x))` "prende" o valor entre a muralha de um lado e do outro.
6. Decrementa os cronômetros (`tempoAtaque`, `invulneravel`, `tempoChuva`).

**`receberDano`**: ignora se invulnerável; aplica `reducaoDano` (escudo); dá 0,35 s de invulnerabilidade
(evita que 5 goblins encostados tirem toda a vida em 1 segundo); marca `morto` quando chega a 0.

**`ganharXp`**: soma; se passou de `xpProximo`, sobe o nível, calcula o próximo valor e devolve `true` — o `items.js`
usa esse `true` para chamar `Jogo.subirDeNivel()`.

**`desenhar(ctx)`**: escolhe o PNG pelo nome `classe_direcao`. A **animação de caminhada** é feita por código:
`Math.sin(tempoAnim * 14)` oscila entre -1 e 1 → o corpo sobe/desce 3px e inclina ±0,06 rad enquanto anda; parado,
oscila bem devagar (respirando). `ctx.save()/restore()` isolam `translate` e `rotate` para não afetar o resto.
O piscar quando invulnerável usa `globalAlpha` (transparência) alternando a cada 1/20 s.

### E) Como utilizar
Fica em `js/`, depois de `dados.js`. Teste: aperte W/A/S/D; o herói anda, troca de sprite e não passa da muralha.

### F) Resultado esperado
Movimento fluido em 8 direções, sprite virando para onde anda, barra de vida caindo ao ser tocado e nível subindo ao coletar XP.

---

## js/enemies.js

### A) Nome do arquivo
`js/enemies.js`

### B) Objetivo do arquivo
Monstros, chefes (contorno vermelho) e o sistema de waves.

### C) Código completo
```javascript
/* =====================================================
   enemies.js — MONSTROS, CHEFES E WAVES
   - classe Inimigo: vida, movimento, comportamentos, dano,
     efeitos (fogo/gelo), contorno vermelho do chefe, desenho
   - objeto Ondas: decide quantos e quais monstros aparecem
   ===================================================== */

/* Guarda versões "pintadas de vermelho" dos sprites (para o contorno do chefe).
   Criamos uma vez e reaproveitamos, pois tingir imagem toda hora seria lento. */
const silhuetasVermelhas = {};
function silhuetaVermelha(nomeImg) {
  if (silhuetasVermelhas[nomeImg]) return silhuetasVermelhas[nomeImg];
  const img = Assets.img[nomeImg];
  const c = document.createElement("canvas");   // canvas invisível, só para processar
  c.width = img.width; c.height = img.height;
  const cx = c.getContext("2d");
  cx.drawImage(img, 0, 0);
  cx.globalCompositeOperation = "source-in";     // pinta só onde já existe desenho
  cx.fillStyle = "#ff1f3d";
  cx.fillRect(0, 0, c.width, c.height);
  silhuetasVermelhas[nomeImg] = c;
  return c;
}

class Inimigo {
  /**
   * @param {object} ficha  - uma entrada de MONSTROS (ou gerada para chefe)
   * @param {number} x,y    - posição inicial
   * @param {number} fator  - multiplicador de força conforme a wave (1 = normal)
   */
  constructor(ficha, x, y, fator = 1) {
    this.tipo = ficha.id;                 // qual sprite usar ("goblin", "lobo"...)
    this.nome = ficha.nome;
    this.x = x; this.y = y;
    this.raio = ficha.raio || 22;
    this.escala = ficha.escala || 1;      // chefes são maiores
    this.chefe = !!ficha.chefe;

    this.vidaMax = Math.round(ficha.vida * fator);
    this.vida = this.vidaMax;
    this.dano = Math.round(ficha.dano * (1 + (fator - 1) * 0.5)); // o dano cresce mais devagar que a vida
    this.velocidade = ficha.velocidade;
    this.xp = ficha.xp;
    this.chancePocao = ficha.chancePocao || 0.1;
    this.comportamento = ficha.comportamento || "perseguir";
    this.habilidadeChefe = ficha.habilidade;        // "investida" ou "rajada"
    this.distanciaTiro = ficha.distanciaTiro || 260;
    this.intervaloTiro = ficha.intervaloTiro || 2;

    // Controle interno
    this.morto = false;
    this.tempoContato = 0;     // evita dar dano todo quadro: só a cada 0.8s de contato
    this.tempoAcao = Math.random() * 2;   // cronômetro genérico para investidas/tiros
    this.investindo = 0;       // segundos restantes de uma investida
    this.direcaoInvest = { x: 0, y: 0 };
    this.tempoDano = 0;        // pisca branco ao levar dano
    this.empurraoX = 0; this.empurraoY = 0; // força de "knockback"

    // Efeitos de status
    this.fogo = 0;             // segundos restantes queimando
    this.gelo = 0;             // segundos restantes congelado (lento)

    // Animação
    this.direcao = "frente";
    this.tempoAnim = Math.random() * 10;
  }

  /* ---------- MOVIMENTO E COMPORTAMENTO ---------- */
  atualizar(dt, jogador) {
    const dx = jogador.x - this.x;
    const dy = jogador.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist, ny = dy / dist;      // direção até o jogador (comprimento 1)

    // Efeitos de status
    if (this.fogo > 0) { this.fogo -= dt; this.receberDano(3 * dt, true); }
    if (this.gelo > 0) this.gelo -= dt;
    const fatorGelo = this.gelo > 0 ? 0.5 : 1;

    let vx = 0, vy = 0;
    this.tempoAcao -= dt;

    switch (this.comportamento) {
      case "lobo":
        // Anda rápido; quando chega perto, dá uma investida ainda mais rápida.
        if (this.investindo > 0) {
          this.investindo -= dt;
          vx = this.direcaoInvest.x * this.velocidade * 2.2;
          vy = this.direcaoInvest.y * this.velocidade * 2.2;
        } else {
          vx = nx * this.velocidade; vy = ny * this.velocidade;
          if (dist < 180 && this.tempoAcao <= 0) {
            this.investindo = 0.35;
            this.direcaoInvest = { x: nx, y: ny };
            this.tempoAcao = 2.0;
          }
        }
        break;

      case "aranha":
        // Rajadas: anda 0.6s, para 0.7s, anda de novo...
        if (this.tempoAcao <= 0) {
          this.parada = !this.parada;
          this.tempoAcao = this.parada ? 0.7 : 0.6;
        }
        if (!this.parada) { vx = nx * this.velocidade; vy = ny * this.velocidade; }
        break;

      case "atirador":
        // Mantém distância: aproxima se longe, recua se perto, atira quando pode.
        if (dist > this.distanciaTiro) { vx = nx * this.velocidade; vy = ny * this.velocidade; }
        else if (dist < this.distanciaTiro * 0.6) { vx = -nx * this.velocidade; vy = -ny * this.velocidade; }
        if (this.tempoAcao <= 0 && dist < this.distanciaTiro + 40) {
          this.atirar(nx, ny);
          this.tempoAcao = this.intervaloTiro;
        }
        break;

      default: // "perseguir"
        vx = nx * this.velocidade; vy = ny * this.velocidade;
    }

    // Habilidades extras dos chefes (além do comportamento base)
    if (this.chefe && this.habilidadeChefe === "investida" && this.investindo <= 0 && this.tempoAcao <= 0 && dist < 420) {
      this.investindo = 0.5;
      this.direcaoInvest = { x: nx, y: ny };
      this.tempoAcao = 3.5;
    }
    if (this.chefe && this.investindo > 0 && this.comportamento !== "lobo") {
      this.investindo -= dt;
      vx = this.direcaoInvest.x * this.velocidade * 3;
      vy = this.direcaoInvest.y * this.velocidade * 3;
    }
    if (this.chefe && this.habilidadeChefe === "rajada" && this.tempoAcao <= 0) {
      // Dispara 8 flechas em círculo
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        this.atirar(Math.cos(a), Math.sin(a));
      }
      this.tempoAcao = 2.5;
    }

    // Aplica movimento + empurrão (knockback vai diminuindo)
    this.x += vx * fatorGelo * dt + this.empurraoX * dt;
    this.y += vy * fatorGelo * dt + this.empurraoY * dt;
    this.empurraoX *= 0.85; this.empurraoY *= 0.85;

    // Mantém dentro da arena
    const m = CONFIG.margemParede + this.raio;
    this.x = Math.max(m, Math.min(CONFIG.larguraArena - m, this.x));
    this.y = Math.max(m, Math.min(CONFIG.alturaArena - m, this.y));

    // Direção da imagem
    if (vx !== 0 || vy !== 0) {
      if (Math.abs(vx) > Math.abs(vy)) this.direcao = vx > 0 ? "lado" : "lado_esq";
      else this.direcao = vy > 0 ? "frente" : "costas";
      this.tempoAnim += dt;
    }

    // Contato com o jogador = dano
    this.tempoContato -= dt;
    if (dist < this.raio * this.escala + jogador.raio && this.tempoContato <= 0) {
      jogador.receberDano(this.dano);
      this.tempoContato = 0.8;
    }

    if (this.tempoDano > 0) this.tempoDano -= dt;
  }

  atirar(nx, ny) {
    // Cria um projétil inimigo (classe no weapons.js) e coloca na lista do jogo
    Jogo.projeteis.push(new Projetil(this.x, this.y, nx, ny, {
      dono: "inimigo", dano: this.dano, velocidade: 260, alcance: 520, imagem: "flecha",
    }));
  }

  /* ---------- DANO ---------- */
  receberDano(quantidade, silencioso = false) {
    if (this.morto) return;
    this.vida -= quantidade;
    if (!silencioso) this.tempoDano = 0.12;
    if (this.vida <= 0) { this.vida = 0; this.morto = true; }
  }

  /* ---------- DESENHO ---------- */
  desenhar(ctx) {
    const nomeImg = `${this.tipo}_${this.direcao}`;
    const img = Assets.img[nomeImg];
    if (!img) return;

    const altura = 64 * this.escala;
    const largura = img.width * (altura / img.height);
    const balanco = Math.sin(this.tempoAnim * 12) * 2.5 * this.escala;

    ctx.save();
    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + altura / 2 - 3, largura / 2.4, 6 * this.escala, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(this.x, this.y + balanco);

    // Contorno vermelho do chefe: desenha a silhueta vermelha deslocada
    // em 8 direções atrás do sprite, formando uma borda.
    if (this.chefe) {
      const sil = silhuetaVermelha(nomeImg);
      const b = 3;
      ctx.shadowColor = "#ff1f3d"; ctx.shadowBlur = 18;
      for (const [ox, oy] of [[-b,0],[b,0],[0,-b],[0,b],[-b,-b],[b,b],[-b,b],[b,-b]]) {
        ctx.drawImage(sil, -largura / 2 + ox, -altura / 2 + oy, largura, altura);
      }
      ctx.shadowBlur = 0;
    }

    ctx.drawImage(img, -largura / 2, -altura / 2, largura, altura);

    // Pisca branco quando leva dano / azul se congelado / laranja se queimando
    if (this.tempoDano > 0 || this.gelo > 0 || this.fogo > 0) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = this.tempoDano > 0 ? "rgba(255,255,255,0.6)"
                    : this.gelo > 0 ? "rgba(90,180,255,0.45)" : "rgba(255,120,30,0.4)";
      ctx.fillRect(-largura / 2, -altura / 2, largura, altura);
    }
    ctx.restore();

    // Barrinha de vida dos monstros normais (só aparece quando feridos)
    if (!this.chefe && this.vida < this.vidaMax) {
      const w = 36, h = 5;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(this.x - w / 2, this.y - altura / 2 - 10, w, h);
      ctx.fillStyle = "#ff4d4d";
      ctx.fillRect(this.x - w / 2, this.y - altura / 2 - 10, w * (this.vida / this.vidaMax), h);
    }
  }
}

/* =====================================================
   ONDAS (WAVES)
   Cada wave tem uma quantidade de monstros que vai nascendo
   aos poucos. Quando todos nascerem E morrerem, a wave acaba.
   ===================================================== */
const Ondas = {
  numero: 1,
  faltamNascer: 0,
  tempoNascer: 0,
  entreWaves: 0,         // contagem regressiva de descanso
  chefeVivo: null,

  iniciar() {
    this.numero = 0;
    this.chefeVivo = null;
    this.proximaWave();
  },

  proximaWave() {
    this.numero++;
    this.faltamNascer = CONFIG.monstrosBase + (this.numero - 1) * CONFIG.monstrosPorWave;
    this.tempoNascer = 0;
    this.entreWaves = 0;
    UI.mostrarAviso(`WAVE ${this.numero}`, 2);

    // A cada 5 waves nasce um chefe (além dos monstros normais, que vêm em menor número)
    if (this.numero % 5 === 0) {
      this.faltamNascer = Math.floor(this.faltamNascer * 0.5);
      this.nascerChefe();
    }
  },

  /* Escolhe um tipo de monstro permitido nesta wave (quanto maior a wave, mais variedade) */
  sortearTipo() {
    const disponiveis = Object.values(MONSTROS).filter((m) => m.waveMinima <= this.numero);
    // Monstros mais novos (de waves altas) têm mais peso para aparecer
    const pesos = disponiveis.map((m) => 1 + m.waveMinima * 0.4);
    let r = Math.random() * pesos.reduce((a, b) => a + b, 0);
    for (let i = 0; i < disponiveis.length; i++) {
      r -= pesos[i];
      if (r <= 0) return disponiveis[i];
    }
    return disponiveis[0];
  },

  /* Posição de nascimento: na beirada da arena, longe do jogador */
  posicaoNascimento(jogador) {
    for (let tentativa = 0; tentativa < 20; tentativa++) {
      const m = CONFIG.margemParede + 40;
      const lado = Math.floor(Math.random() * 4);
      let x, y;
      if (lado === 0) { x = m; y = m + Math.random() * (CONFIG.alturaArena - 2 * m); }
      else if (lado === 1) { x = CONFIG.larguraArena - m; y = m + Math.random() * (CONFIG.alturaArena - 2 * m); }
      else if (lado === 2) { y = m; x = m + Math.random() * (CONFIG.larguraArena - 2 * m); }
      else { y = CONFIG.alturaArena - m; x = m + Math.random() * (CONFIG.larguraArena - 2 * m); }
      if (Math.hypot(x - jogador.x, y - jogador.y) > 380) return { x, y };
    }
    return { x: CONFIG.margemParede + 40, y: CONFIG.margemParede + 40 };
  },

  /* Fator de força: a cada wave os monstros ficam ~9% mais fortes */
  fator() { return 1 + (this.numero - 1) * 0.09; },

  nascerMonstro(jogador) {
    const ficha = this.sortearTipo();
    const pos = this.posicaoNascimento(jogador);
    Jogo.inimigos.push(new Inimigo(ficha, pos.x, pos.y, this.fator()));
  },

  nascerChefe() {
    const ciclo = Math.floor((this.numero / 5 - 1) / CHEFES.length); // 0 na 1ª passada, 1 na 2ª...
    const modelo = CHEFES[(this.numero / 5 - 1) % CHEFES.length];
    const base = MONSTROS[modelo.base];
    const ficha = {
      id: modelo.base, nome: modelo.nome, chefe: true,
      vida: modelo.vida * (1 + ciclo * 1.5), dano: modelo.dano * (1 + ciclo * 0.5),
      velocidade: modelo.velocidade, escala: modelo.escala, xp: modelo.xp,
      raio: base.raio, comportamento: base.comportamento === "atirador" ? "atirador" : "perseguir",
      habilidade: modelo.habilidade, distanciaTiro: 320, intervaloTiro: 2.5, chancePocao: 1,
    };
    const pos = this.posicaoNascimento(Jogo.jogador);
    const chefe = new Inimigo(ficha, pos.x, pos.y, 1);
    Jogo.inimigos.push(chefe);
    this.chefeVivo = chefe;
    UI.mostrarAviso(`⚠ ${modelo.nome.toUpperCase()} APARECEU!`, 3);
  },

  atualizar(dt, jogador) {
    // Descanso entre waves
    if (this.entreWaves > 0) {
      this.entreWaves -= dt;
      if (this.entreWaves <= 0) this.proximaWave();
      return;
    }

    // Vai criando monstros aos poucos (não todos de uma vez)
    if (this.faltamNascer > 0) {
      this.tempoNascer -= dt;
      if (this.tempoNascer <= 0) {
        this.nascerMonstro(jogador);
        this.faltamNascer--;
        // Intervalo entre nascimentos diminui com as waves (mínimo 0.35s)
        this.tempoNascer = Math.max(0.35, 1.3 - this.numero * 0.06);
      }
    }

    if (this.chefeVivo && this.chefeVivo.morto) this.chefeVivo = null;

    // Wave terminou? (ninguém mais para nascer e ninguém vivo)
    if (this.faltamNascer === 0 && Jogo.inimigos.length === 0) {
      this.entreWaves = CONFIG.pausaEntreWaves;
      UI.mostrarAviso("Wave concluída! Prepare-se...", CONFIG.pausaEntreWaves);
    }
  },
};
```

### D) Explicação do código
**`silhuetaVermelha(nome)`** cria, uma única vez, uma cópia vermelha do sprite (canvas invisível + `source-in`,
que pinta só onde o sprite tem pixels). Usada para o contorno do chefe.

**`class Inimigo`** — `constructor(ficha, x, y, fator)`: copia a ficha e multiplica a vida pelo `fator` da wave
(9% a mais por wave) e o dano por metade disso (para a dificuldade subir devagar, como pedido).

**`atualizar(dt, jogador)`**:
1. Calcula o vetor até o herói (`nx, ny` = direção de comprimento 1). Isso é a "perseguição": somar `nx * velocidade * dt` à posição leva o monstro em linha reta ao herói.
2. Aplica fogo (3 de dano/s) e gelo (velocidade ×0,5).
3. O `switch (comportamento)` escolhe o movimento: `lobo` persegue e, perto, dá investida (2,2× a velocidade por 0,35 s); `aranha` alterna andar 0,6 s / parar 0,7 s; `atirador` aproxima se longe, recua se perto e chama `atirar()`; padrão = perseguir.
4. Chefes: a cada 3,5 s dão uma investida (3× velocidade por 0,5 s); o Lorde Esqueleto dispara 8 flechas em círculo a cada 2,5 s.
5. Soma `empurrao` (knockback da habilidade Onda de Choque), que decai 15% por quadro.
6. Prende na arena, escolhe a direção do sprite, e **dá dano por contato**: se a distância for menor que a soma dos raios e `tempoContato` já zerou, chama `jogador.receberDano(dano)` e espera 0,8 s para o próximo.

**`atirar(nx, ny)`** cria um `Projetil` com `dono: "inimigo"` na lista `Jogo.projeteis`. O projétil de verdade viaja, acerta o herói e some (ver `weapons.js`).

**`desenhar(ctx)`**: para o chefe, desenha a silhueta vermelha deslocada em 8 direções (3px) com brilho (`shadowBlur`)
→ contorno vermelho. Depois o sprite normal. Monstros feridos mostram uma barrinha de vida. Tinta branca ao levar dano,
azul congelado, laranja queimando (`source-atop` pinta só por cima dos pixels do sprite).

**`Ondas`** (waves):
- `proximaWave()` incrementa o número, calcula quantos monstros nascem (`6 + 3*(wave-1)`) e mostra o aviso "WAVE N".
  Se `numero % 5 === 0` (5, 10, 15...), reduz os normais à metade e chama `nascerChefe()`.
- `sortearTipo()` sorteia entre os monstros com `waveMinima <= wave atual`; monstros de waves altas têm peso maior.
- `posicaoNascimento()` escolhe uma borda aleatória da arena a pelo menos 380px do herói (nunca nasce em cima dele).
- `nascerChefe()` monta a ficha do chefe a partir de `CHEFES` (ciclo = quantas vezes a lista já deu a volta → vida ×2,5 a cada volta) e guarda em `chefeVivo` (o `ui.js` lê isso para a barra).
- `atualizar()` cria monstros aos poucos (intervalo diminui com as waves, mínimo 0,35 s); quando `faltamNascer === 0` e a lista está vazia, começa a pausa de 3 s e depois a próxima wave.

### E) Como utilizar
Fica em `js/` depois de `player.js`. Teste rápido no console: `Ondas.numero=4; Jogo.inimigos=[]; Ondas.faltamNascer=0; Ondas.entreWaves=0.01` → wave 5 com o Rei Goblin e barra vermelha embaixo.

### F) Resultado esperado
Monstros variados perseguindo, atirando ou investindo; dano por contato; waves com contador; chefe grande com contorno vermelho e barra própria a cada 5 waves.

---

## js/weapons.js

### A) Nome do arquivo
`js/weapons.js`

### B) Objetivo do arquivo
Ataque automático, flechas e efeitos visuais.

### C) Código completo
```javascript
/* =====================================================
   weapons.js — ATAQUES AUTOMÁTICOS, PROJÉTEIS E EFEITOS
   - Armas.atualizar(): decide quando e em quem o herói ataca
   - classe Projetil: flechas (do jogador e dos monstros)
   - classe Efeito: imagens rápidas (corte da espada, impacto)
   ===================================================== */

/* ---------- PROJÉTIL (flecha) ---------- */
class Projetil {
  /**
   * @param {number} x,y     - de onde sai
   * @param {number} nx,ny   - direção (vetor de comprimento 1)
   * @param {object} op      - dono ("jogador"/"inimigo"), dano, velocidade, alcance, imagem, fogo, gelo
   */
  constructor(x, y, nx, ny, op) {
    this.x = x; this.y = y;
    this.nx = nx; this.ny = ny;
    this.dono = op.dono;
    this.dano = op.dano;
    this.velocidade = op.velocidade || 520;
    this.distanciaMax = op.alcance || 500;
    this.percorrido = 0;
    this.imagem = op.imagem || "flecha";
    this.fogo = !!op.fogo;
    this.gelo = !!op.gelo;
    this.morto = false;
    // A flecha PNG aponta para cima; calculamos quanto girar para apontar na direção certa
    this.angulo = Math.atan2(ny, nx) + Math.PI / 2;
  }

  atualizar(dt, jogador) {
    const passo = this.velocidade * dt;
    this.x += this.nx * passo;
    this.y += this.ny * passo;
    this.percorrido += passo;
    if (this.percorrido > this.distanciaMax) this.morto = true;

    // Saiu da arena? some.
    if (this.x < 0 || this.y < 0 || this.x > CONFIG.larguraArena || this.y > CONFIG.alturaArena) this.morto = true;

    if (this.dono === "jogador") {
      // Procura o primeiro monstro que a flecha encosta
      for (const ini of Jogo.inimigos) {
        if (Math.hypot(ini.x - this.x, ini.y - this.y) < ini.raio * ini.escala + 6) {
          ini.receberDano(this.dano);
          if (this.fogo) ini.fogo = 3;
          if (this.gelo) ini.gelo = 2;
          Jogo.efeitos.push(new Efeito("impacto_flecha", this.x, this.y, 0.25, 40));
          this.morto = true;
          break;
        }
      }
    } else {
      // Flecha dos monstros: acerta o jogador
      if (Math.hypot(jogador.x - this.x, jogador.y - this.y) < jogador.raio + 6) {
        jogador.receberDano(this.dano);
        Jogo.efeitos.push(new Efeito("impacto_flecha", this.x, this.y, 0.25, 40));
        this.morto = true;
      }
    }
  }

  desenhar(ctx) {
    const img = Assets.img[this.imagem];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angulo);
    if (this.fogo) { ctx.shadowColor = "#ff8a1f"; ctx.shadowBlur = 12; }
    if (this.gelo) { ctx.shadowColor = "#6ec6ff"; ctx.shadowBlur = 12; }
    if (this.dono === "inimigo") ctx.filter = "sepia(1) hue-rotate(-30deg) brightness(0.8)"; // flecha de osso, mais escura
    ctx.drawImage(img, -7, -22, 14, 44);
    ctx.restore();
  }
}

/* ---------- EFEITO VISUAL (corte da espada, impacto) ---------- */
class Efeito {
  constructor(imagem, x, y, duracao, tamanho, angulo = 0) {
    this.imagem = imagem;
    this.x = x; this.y = y;
    this.duracao = duracao;   // quantos segundos fica na tela
    this.vida = duracao;
    this.tamanho = tamanho;
    this.angulo = angulo;
    this.morto = false;
  }
  atualizar(dt) {
    this.vida -= dt;
    if (this.vida <= 0) this.morto = true;
  }
  desenhar(ctx) {
    const img = Assets.img[this.imagem];
    const progresso = 1 - this.vida / this.duracao;   // 0 no início, 1 no fim
    ctx.save();
    ctx.globalAlpha = 1 - progresso;                   // vai sumindo
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angulo);
    const w = this.tamanho * (0.8 + progresso * 0.5);  // cresce um pouco
    const h = w * (img.height / img.width);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
}

/* ---------- SISTEMA DE ATAQUE AUTOMÁTICO ---------- */
const Armas = {
  /* Devolve os monstros vivos ordenados do mais perto ao mais longe, dentro do alcance */
  alvosNoAlcance(jogador, alcance) {
    return Jogo.inimigos
      .map((ini) => ({ ini, d: Math.hypot(ini.x - jogador.x, ini.y - jogador.y) }))
      .filter((o) => o.d <= alcance + o.ini.raio * o.ini.escala)
      .sort((a, b) => a.d - b.d);
  },

  atualizar(dt, jogador) {
    // Ainda não pode atacar? espera.
    if (jogador.tempoAtaque > 0) return;

    const alvos = this.alvosNoAlcance(jogador, jogador.alcance);
    if (alvos.length === 0) return;   // ninguém perto: não ataca

    if (jogador.classe === "guerreiro") this.golpeEspada(jogador, alvos);
    else this.dispararFlechas(jogador, alvos);

    jogador.tempoAtaque = jogador.intervaloAtaque;  // reinicia o cronômetro
  },

  /* GUERREIRO: corte que acerta os N monstros mais próximos */
  golpeEspada(jogador, alvos) {
    const atingidos = alvos.slice(0, jogador.alvosPorGolpe);
    for (const { ini } of atingidos) {
      ini.receberDano(jogador.dano);
      if (jogador.empurrao) {
        const dx = ini.x - jogador.x, dy = ini.y - jogador.y, d = Math.hypot(dx, dy) || 1;
        ini.empurraoX += (dx / d) * 900;
        ini.empurraoY += (dy / d) * 900;
      }
    }
    // Efeito do corte voltado para o monstro mais perto
    const alvo = alvos[0].ini;
    const angulo = Math.atan2(alvo.y - jogador.y, alvo.x - jogador.x);
    const dist = Math.min(jogador.alcance * 0.6, 60);
    Jogo.efeitos.push(new Efeito(
      "corte_espada",
      jogador.x + Math.cos(angulo) * dist, jogador.y + Math.sin(angulo) * dist,
      0.18, jogador.alcance * 1.2, angulo
    ));
  },

  /* ARQUEIRO: uma flecha para cada um dos N monstros mais próximos */
  dispararFlechas(jogador, alvos) {
    const quantidade = Math.min(jogador.flechasPorDisparo, alvos.length);
    for (let i = 0; i < quantidade; i++) {
      const alvo = alvos[i].ini;
      this.criarFlecha(jogador, alvo.x - jogador.x, alvo.y - jogador.y);
    }
    // Se tem mais flechas que alvos, as extras vão todas no primeiro alvo (com leve desvio)
    for (let i = quantidade; i < jogador.flechasPorDisparo; i++) {
      const alvo = alvos[0].ini;
      const a = Math.atan2(alvo.y - jogador.y, alvo.x - jogador.x) + (Math.random() - 0.5) * 0.3;
      this.criarFlecha(jogador, Math.cos(a), Math.sin(a));
    }
  },

  criarFlecha(jogador, dx, dy) {
    const d = Math.hypot(dx, dy) || 1;
    Jogo.projeteis.push(new Projetil(jogador.x, jogador.y - 10, dx / d, dy / d, {
      dono: "jogador", dano: jogador.dano, velocidade: 560,
      alcance: jogador.alcance + 60, fogo: jogador.flechaFogo, gelo: jogador.flechaGelo,
    }));
  },

  /* CHUVA DE FLECHAS (habilidade): 8 flechas em círculo a cada 6s */
  chuvaDeFlechas(jogador) {
    if (!jogador.chuvaFlechas || jogador.tempoChuva < 6) return;
    jogador.tempoChuva = 0;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      this.criarFlecha(jogador, Math.cos(a), Math.sin(a));
    }
  },
};
```

### D) Explicação do código
**`class Projetil`** serve para as flechas do herói E dos monstros (`dono`). Guarda posição, direção (`nx, ny`),
velocidade, alcance e flags (`fogo`, `gelo`). `angulo = atan2(ny, nx) + 90°` porque o PNG da flecha aponta para cima.
`atualizar`: anda, soma `percorrido`, some ao passar do alcance ou sair da arena; se é do jogador, testa a distância
a cada monstro (círculo); ao acertar, aplica dano, fogo/gelo, cria o `Efeito` de impacto e se marca `morto`.
Se é do inimigo, testa só contra o herói.

**`class Efeito`**: imagem rápida (corte da espada ou impacto). `progresso` vai de 0 a 1 durante a `duracao`;
`globalAlpha = 1 - progresso` faz sumir e o tamanho cresce um pouco. É assim que o golpe do guerreiro "aparece sozinho",
sem animação de preparo, como pedido.

**`Armas.alvosNoAlcance`**: transforma cada monstro em `{ini, d}` (distância), filtra os que estão dentro do alcance
(somando o raio do monstro) e ordena do mais perto ao mais longe. Isso responde "qual monstro está mais próximo e se
está no alcance".

**`Armas.atualizar`**: se `tempoAtaque > 0`, ainda está recarregando → não faz nada. Se não há alvo → não ataca.
Senão chama `golpeEspada` (guerreiro) ou `dispararFlechas` (arqueiro) e recarrega `tempoAtaque = intervaloAtaque`.
Esse é o ataque automático completo: o jogador não aperta nada.

**`golpeEspada`**: dá `jogador.dano` nos `alvosPorGolpe` monstros mais perto (1 no início; "Segunda Espada" aumenta);
com `empurrao` ligado, adiciona força de knockback. Cria o efeito do corte virado para o alvo mais próximo.

**`dispararFlechas`**: uma flecha para cada um dos `flechasPorDisparo` monstros mais perto; se houver mais flechas que
alvos, as extras vão no primeiro com leve desvio. `criarFlecha` passa `dano`, `alcance` e as flags de fogo/gelo do jogador.

**`chuvaDeFlechas`**: a cada 6 s (cronômetro `tempoChuva` em `player.js`) dispara 8 flechas em círculo.

### E) Como utilizar
Fica em `js/` depois de `enemies.js`. Teste: fique parado perto de um goblin; o guerreiro mostra o corte azul e o goblin morre; o arqueiro atira flechas que viajam até o alvo.

### F) Resultado esperado
Ataques automáticos no alvo mais próximo dentro do alcance, com dano real, efeitos visíveis e monstros morrendo.

---

## js/items.js

### A) Nome do arquivo
`js/items.js`

### B) Objetivo do arquivo
Drops: cristal de XP (sempre) e poção de cura (chance).

### C) Código completo
```javascript
/* =====================================================
   items.js — DROPS (cristal de XP e poção de cura)
   Quando um monstro morre, o game.js chama criarDrops().
   O item fica no chão, flutuando, até o jogador chegar perto.
   ===================================================== */

class Item {
  /**
   * @param {string} tipo - "cristal_xp" ou "pocao_cura"
   * @param {number} valor - XP que dá (cristal) ou vida que cura (poção)
   */
  constructor(tipo, x, y, valor) {
    this.tipo = tipo;
    this.x = x; this.y = y;
    this.valor = valor;
    this.tempo = Math.random() * 6;   // para cada item flutuar num ritmo diferente
    this.coletado = false;            // garante que o mesmo item não é pego duas vezes
    this.tempoVida = 45;              // some depois de 45s (evita acúmulo infinito)
  }

  atualizar(dt, jogador) {
    this.tempo += dt;
    this.tempoVida -= dt;
    if (this.tempoVida <= 0) this.coletado = true;

    const dx = jogador.x - this.x, dy = jogador.y - this.y;
    const dist = Math.hypot(dx, dy);

    // "Imã": dentro do raio de coleta o item voa até o jogador
    if (dist < jogador.raioColeta) {
      this.x += (dx / dist) * 420 * dt;
      this.y += (dy / dist) * 420 * dt;
    }

    // Encostou: coleta
    if (dist < 18) {
      this.coletado = true;
      if (this.tipo === "cristal_xp") {
        const subiu = jogador.ganharXp(this.valor);
        if (subiu) Jogo.subirDeNivel();
      } else {
        jogador.curar(this.valor);
        UI.mostrarAviso("+ Vida!", 0.8);
      }
    }
  }

  desenhar(ctx) {
    const img = Assets.img[this.tipo];
    const flutua = Math.sin(this.tempo * 3) * 4;   // sobe e desce
    const tamanho = this.tipo === "cristal_xp" ? 26 : 30;
    ctx.save();
    ctx.shadowColor = this.tipo === "cristal_xp" ? "#3b8cff" : "#ff3b5c";
    ctx.shadowBlur = 14;
    // Pisca nos últimos 5 segundos antes de sumir
    if (this.tempoVida < 5 && Math.floor(this.tempoVida * 6) % 2 === 0) ctx.globalAlpha = 0.4;
    ctx.drawImage(img, this.x - tamanho / 2, this.y - tamanho / 2 + flutua, tamanho, tamanho * (img.height / img.width));
    ctx.restore();
  }
}

/**
 * Chamada quando um monstro morre.
 * - SEMPRE cria um cristal de XP
 * - cria uma poção com a chance configurada no monstro (chancePocao)
 */
function criarDrops(inimigo) {
  Jogo.itens.push(new Item("cristal_xp", inimigo.x, inimigo.y, inimigo.xp));

  if (Math.random() < inimigo.chancePocao) {
    // A poção cai um pouco ao lado, para não ficar em cima do cristal
    Jogo.itens.push(new Item("pocao_cura", inimigo.x + 24, inimigo.y + 10, Math.round(Jogo.jogador.vidaMax * 0.35)));
  }
}
```

### D) Explicação do código
**`class Item`**: tem `tipo` (`cristal_xp`/`pocao_cura`), `valor`, `coletado` (começa `false`) e `tempoVida` (45 s).

**`atualizar`**: se a distância ao herói é menor que `raioColeta` (60px; "Imã de Itens" aumenta), o item voa até ele
a 420px/s. Quando chega a menos de 18px, marca `coletado = true` e aplica o efeito: cristal → `jogador.ganharXp`
(e se devolver `true`, `Jogo.subirDeNivel()`); poção → `jogador.curar`.

**Por que `coletado` garante que a poção não é pega infinitamente?** Logo no fim do quadro o `game.js` faz
`this.itens = this.itens.filter(i => !i.coletado)`, ou seja, remove da lista. Um item fora da lista não é mais atualizado nem desenhado.

**`desenhar`**: `Math.sin(tempo*3)*4` faz flutuar; `shadowBlur` dá o brilho azul/vermelho; pisca nos últimos 5 s.

**`criarDrops(inimigo)`**: chamada pelo `game.js` para cada monstro morto. Sempre cria o cristal com `inimigo.xp`;
cria a poção com `Math.random() < inimigo.chancePocao` (configurável por monstro em `dados.js`; chefes = 100%).
A poção cura 35% da vida máxima.

### E) Como utilizar
Fica em `js/` depois de `weapons.js`. Teste: mate um goblin e ande até o cristal; a barra de XP sobe.

### F) Resultado esperado
Cristais caem de todo monstro, poções às vezes; ambos são atraídos e coletados uma única vez.

---

## js/cenario.js

### A) Nome do arquivo
`js/cenario.js`

### B) Objetivo do arquivo
Decorações da arena com e sem colisão.

### C) Código completo
```javascript
/* =====================================================
   cenario.js — DECORAÇÕES DA ARENA
   Árvores, pedras, arbustos e flores espalhados pela arena.
   - Árvores e pedras TÊM colisão (ninguém atravessa).
   - Arbustos e flores NÃO têm (são só enfeite).
   As posições são sorteadas uma vez por partida, sempre
   longe do centro (onde o herói nasce) e sem se sobrepor.
   ===================================================== */

const Cenario = {
  decoracoes: [],   // lista de { tipo, x, y, raio, colide, largura, altura }

  gerar() {
    this.decoracoes = [];
    const tipos = [
      // tipo, quantos, raio de colisão (0 = não colide), tamanho desenhado
      { tipo: "arvore",  quantos: 7, raio: 22, largura: 96,  altura: 120 },
      { tipo: "arvore2", quantos: 6, raio: 22, largura: 96,  altura: 120 },
      { tipo: "pedra",   quantos: 8, raio: 18, largura: 56,  altura: 40 },
      { tipo: "arbusto", quantos: 10, raio: 0, largura: 56,  altura: 40 },
      { tipo: "flores",  quantos: 14, raio: 0, largura: 40,  altura: 24 },
    ];

    for (const t of tipos) {
      for (let i = 0; i < t.quantos; i++) {
        const pos = this.sortearPosicao(t.raio || 20);
        if (pos) this.decoracoes.push({ ...t, x: pos.x, y: pos.y, colide: t.raio > 0 });
      }
    }
    // Ordena pelo Y para desenhar na ordem certa (quem está mais embaixo, na frente)
    this.decoracoes.sort((a, b) => a.y - b.y);
  },

  /* Tenta até 30 vezes achar um lugar livre: dentro da arena, fora do centro
     e sem encostar em outra decoração */
  sortearPosicao(raio) {
    const m = CONFIG.margemParede + 70;
    const cx = CONFIG.larguraArena / 2, cy = CONFIG.alturaArena / 2;
    for (let i = 0; i < 30; i++) {
      const x = m + Math.random() * (CONFIG.larguraArena - 2 * m);
      const y = m + Math.random() * (CONFIG.alturaArena - 2 * m);
      if (Math.hypot(x - cx, y - cy) < 260) continue;                   // longe do centro
      const livre = this.decoracoes.every((d) => Math.hypot(d.x - x, d.y - y) > d.raio + raio + 70);
      if (livre) return { x, y };
    }
    return null;
  },

  /* Empurra uma "entidade" (jogador ou monstro, que tem x, y e raio) para fora
     das decorações sólidas. Mesma ideia da colisão entre círculos do game.js. */
  colidir(ent, raioEnt) {
    for (const d of this.decoracoes) {
      if (!d.colide) continue;
      const dx = ent.x - d.x, dy = ent.y - (d.y + d.altura * 0.3); // a base da árvore é o ponto sólido
      const dist = Math.hypot(dx, dy) || 0.01;
      const minimo = d.raio + raioEnt;
      if (dist < minimo) {
        ent.x += (dx / dist) * (minimo - dist);
        ent.y += (dy / dist) * (minimo - dist);
      }
    }
  },

  /* Desenha só as decorações que estão "abaixo" (y menor) ou "acima" de certo ponto.
     O game.js chama duas vezes: antes dos personagens (as de trás) e depois (as da frente). */
  desenhar(ctx, filtro) {
    for (const d of this.decoracoes) {
      if (!filtro(d)) continue;
      const img = Assets.img[d.tipo];
      // Sombra da árvore
      if (d.colide) {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(d.x, d.y + d.altura * 0.3 + 4, d.raio + 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.drawImage(img, d.x - d.largura / 2, d.y - d.altura / 2, d.largura, d.altura);
    }
  },
};
```

### D) Explicação do código
**`gerar()`**: para cada tipo (árvore clara, árvore escura, pedra, arbusto, flores) sorteia N posições.
Árvores e pedras têm `raio > 0` → `colide = true`. Arbustos e flores têm `raio 0` → só enfeite.

**`sortearPosicao(raio)`**: até 30 tentativas; rejeita se estiver a menos de 260px do centro (onde o herói nasce) ou
encostando em outra decoração. Se não achar lugar, devolve `null` e aquela decoração simplesmente não é criada.

**Como funciona a colisão** (`colidir(ent, raioEnt)`): cada decoração sólida é um círculo (centro na base da árvore,
`y + altura*0.3`). Se a distância entre o centro da entidade e o da decoração for menor que a soma dos raios, a
entidade é empurrada para fora exatamente a diferença que faltava. É o mesmo princípio usado entre monstros e herói
no `game.js`. Monstros também colidem (por isso contornam as árvores).

**`desenhar(ctx, filtro)`**: recebe uma função `filtro` que diz quais decorações desenhar. O `game.js` usa isso para
desenhar flores/arbustos antes de tudo e cada árvore/pedra na ordem de profundidade (o herói passa **atrás** da copa
da árvore quando está acima dela e **na frente** quando está abaixo).

### E) Como utilizar
Fica em `js/` depois de `items.js`. Teste: ande contra uma árvore — o herói para; contra um arbusto — atravessa.

### F) Resultado esperado
Arena maior e mais bonita que o modelo, com árvores/pedras sólidas e sem atrapalhar o centro.

---

## js/ui.js

### A) Nome do arquivo
`js/ui.js`

### B) Objetivo do arquivo
Interface: barras, avisos, level up e fim.

### C) Código completo
```javascript
/* =====================================================
   ui.js — INTERFACE (HUD, avisos, level up, fim de jogo)
   Este arquivo só MEXE NO HTML: barras, textos e telas.
   Ele não sabe das regras do jogo, só mostra o que recebe.
   ===================================================== */

const UI = {
  // Atalhos para os elementos do HTML (pegamos uma vez só, no início)
  el: {},
  tempoAviso: 0,

  iniciar() {
    const ids = [
      "barra-vida-fill", "barra-vida-texto", "barra-xp-fill", "barra-xp-texto", "hud-nivel",
      "hud-wave", "hud-aviso", "hud-tempo", "hud-mortes",
      "hud-chefe", "hud-chefe-nome", "barra-chefe-fill",
      "tela-levelup", "levelup-nivel", "levelup-opcoes",
      "tela-fim", "fim-wave", "fim-nivel", "fim-mortes", "fim-tempo",
    ];
    ids.forEach((id) => { this.el[id] = document.getElementById(id); });
  },

  /* Troca a tela visível (menu, personagens, wiki, jogo) */
  mostrarTela(id) {
    document.querySelectorAll(".tela").forEach((t) => t.classList.remove("ativa"));
    document.getElementById(id).classList.add("ativa");
  },

  /* Converte segundos (ex: 83) em texto "01:23" */
  formatarTempo(segundos) {
    const m = Math.floor(segundos / 60), s = Math.floor(segundos % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  },

  /* Atualiza todas as barras e números do HUD. Chamado a cada quadro pelo game.js */
  atualizarHud(jogador, ondas, mortes, tempo, dt) {
    const e = this.el;
    e["barra-vida-fill"].style.width = `${(jogador.vida / jogador.vidaMax) * 100}%`;
    e["barra-vida-texto"].textContent = `${Math.ceil(jogador.vida)} / ${jogador.vidaMax}`;
    e["barra-xp-fill"].style.width = `${(jogador.xp / jogador.xpProximo) * 100}%`;
    e["barra-xp-texto"].textContent = `${jogador.xp} / ${jogador.xpProximo}`;
    e["hud-nivel"].textContent = jogador.nivel;
    e["hud-wave"].textContent = `WAVE ${ondas.numero}`;
    e["hud-tempo"].textContent = this.formatarTempo(tempo);
    e["hud-mortes"].textContent = mortes;

    // Barra do chefe
    if (ondas.chefeVivo) {
      e["hud-chefe"].classList.remove("escondido");
      e["hud-chefe-nome"].textContent = ondas.chefeVivo.nome.toUpperCase();
      e["barra-chefe-fill"].style.width = `${(ondas.chefeVivo.vida / ondas.chefeVivo.vidaMax) * 100}%`;
    } else {
      e["hud-chefe"].classList.add("escondido");
    }

    // Aviso temporário some sozinho
    if (this.tempoAviso > 0) {
      this.tempoAviso -= dt;
      if (this.tempoAviso <= 0) e["hud-aviso"].textContent = "";
    }
  },

  /* Mostra um texto grande no centro por alguns segundos ("WAVE 3", "Chefe apareceu!") */
  mostrarAviso(texto, segundos) {
    this.el["hud-aviso"].textContent = texto;
    this.tempoAviso = segundos;
  },

  /* ---------- TELA DE LEVEL UP ----------
     Recebe as habilidades sorteadas e uma função "aoEscolher" que o game.js
     executa quando o jogador clicar numa carta. */
  abrirLevelUp(nivel, habilidades, aoEscolher) {
    this.el["levelup-nivel"].textContent = nivel;
    const caixa = this.el["levelup-opcoes"];
    caixa.innerHTML = "";   // limpa cartas da vez anterior

    habilidades.forEach((h) => {
      const carta = document.createElement("div");
      carta.className = "carta-habilidade";
      carta.innerHTML = `
        <img src="assets/cards/${h.carta}.png" alt="${h.nome}">
        <h4>${h.nome}</h4>
        <p>${h.descricao}</p>`;
      carta.addEventListener("click", () => aoEscolher(h));
      caixa.appendChild(carta);
    });

    this.el["tela-levelup"].classList.remove("escondido");
  },

  fecharLevelUp() {
    this.el["tela-levelup"].classList.add("escondido");
  },

  /* ---------- TELA DE FIM ---------- */
  abrirFim(ondas, jogador, mortes, tempo) {
    this.el["fim-wave"].textContent = ondas.numero;
    this.el["fim-nivel"].textContent = jogador.nivel;
    this.el["fim-mortes"].textContent = mortes;
    this.el["fim-tempo"].textContent = this.formatarTempo(tempo);
    this.el["tela-fim"].classList.remove("escondido");
  },

  fecharFim() {
    this.el["tela-fim"].classList.add("escondido");
  },
};
```

### D) Explicação do código
Este arquivo é o único que mexe no HTML durante a partida. Ele não decide nada, só mostra.

**`iniciar()`** guarda em `UI.el` todos os elementos por id (buscar com `getElementById` a cada quadro, 60x/s, seria desperdício).

**`mostrarTela(id)`** remove `ativa` de todas as `.tela` e coloca na pedida.

**`atualizarHud(...)`**: escreve `width: X%` nas barras (vida e XP), os textos de nível, wave, tempo (`formatarTempo`
transforma 83 s em "01:23") e mortes. Se `ondas.chefeVivo` existe, tira `escondido` da barra do chefe e ajusta a largura;
senão esconde. O aviso central some sozinho quando `tempoAviso` zera.

**`abrirLevelUp(nivel, habilidades, aoEscolher)`**: limpa a caixa, cria um `<div class="carta-habilidade">` por
habilidade com o PNG, nome e descrição, e liga o clique a `aoEscolher(h)` — função que o `game.js` entrega
(ela aplica a habilidade e despausa). Depois mostra a sobreposição.

**`abrirFim`** preenche wave, nível, mortes e tempo e mostra a tela de derrota.

### E) Como utilizar
Fica em `js/` antes de `game.js`. Teste: `UI.mostrarAviso('Olá', 2)` no console durante a partida.

### F) Resultado esperado
Barras e números sempre sincronizados com o estado do jogo; cartas e tela de fim aparecendo na hora certa.

---

## js/game.js

### A) Nome do arquivo
`js/game.js`

### B) Objetivo do arquivo
O loop principal: atualizar, colidir, desenhar, pausar, morrer.

### C) Código completo
```javascript
/* =====================================================
   game.js — O CORAÇÃO DA PARTIDA
   Cria o jogador, roda o "loop" (atualiza e desenha ~60x por
   segundo), cuida da câmera, colisões, mortes, level up e fim.
   ===================================================== */

const Jogo = {
  canvas: null,
  ctx: null,              // "contexto" = a caneta que desenha no canvas
  jogador: null,
  inimigos: [],
  projeteis: [],
  itens: [],
  efeitos: [],
  mortes: 0,
  tempo: 0,               // segundos de partida
  rodando: false,         // false = o loop não atualiza nada (pausa / fim)
  ultimoQuadro: 0,
  camera: { x: 0, y: 0 },
  idQuadro: null,         // guarda o requestAnimationFrame para poder cancelar

  /* ---------- INICIAR / REINICIAR ----------
     Tudo é criado do zero: assim "jogar novamente" nunca mantém atributos antigos. */
  iniciar(classe) {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    // Os PNGs são maiores que o tamanho desenhado; a suavização padrão do canvas
    // faz a redução ficar bonita (sem "serrilhado").

    this.jogador = new Jogador(classe);
    this.inimigos = [];
    this.projeteis = [];
    this.itens = [];
    this.efeitos = [];
    this.mortes = 0;
    this.tempo = 0;
    this.rodando = true;
    Cenario.gerar();          // sorteia árvores, pedras e arbustos novos

    UI.fecharLevelUp();
    UI.fecharFim();
    UI.mostrarTela("tela-jogo");
    Ondas.iniciar();

    // Começa o loop (cancela um anterior se existir, para não rodar dois ao mesmo tempo)
    if (this.idQuadro) cancelAnimationFrame(this.idQuadro);
    this.ultimoQuadro = performance.now();
    this.idQuadro = requestAnimationFrame((t) => this.loop(t));
  },

  parar() {
    this.rodando = false;
    if (this.idQuadro) cancelAnimationFrame(this.idQuadro);
    this.idQuadro = null;
  },

  /* ---------- LOOP PRINCIPAL ----------
     O navegador chama esta função antes de cada quadro da tela (~60x por segundo). */
  loop(agora) {
    // dt em segundos; limitado a 0.05 para que, se a aba ficar em segundo plano,
    // o jogo não "pule" um monte de tempo de uma vez.
    const dt = Math.min(0.05, (agora - this.ultimoQuadro) / 1000);
    this.ultimoQuadro = agora;

    if (this.rodando) this.atualizar(dt);
    this.desenhar();

    this.idQuadro = requestAnimationFrame((t) => this.loop(t));
  },

  /* ---------- ATUALIZAR (regras do jogo) ---------- */
  atualizar(dt) {
    const j = this.jogador;
    this.tempo += dt;

    j.atualizar(dt);
    Ondas.atualizar(dt, j);
    Armas.atualizar(dt, j);
    Armas.chuvaDeFlechas(j);

    this.inimigos.forEach((i) => i.atualizar(dt, j));
    this.projeteis.forEach((p) => p.atualizar(dt, j));
    this.itens.forEach((i) => i.atualizar(dt, j));
    this.efeitos.forEach((e) => e.atualizar(dt));

    this.resolverColisoes();
    Cenario.colidir(j, j.raio);
    this.inimigos.forEach((i) => Cenario.colidir(i, i.raio * i.escala));

    // Monstros mortos: soltam drops e saem da lista
    for (const ini of this.inimigos) {
      if (ini.morto) {
        this.mortes++;
        criarDrops(ini);
      }
    }
    // filter() cria uma lista nova só com quem NÃO morreu
    this.inimigos = this.inimigos.filter((i) => !i.morto);
    this.projeteis = this.projeteis.filter((p) => !p.morto);
    this.itens = this.itens.filter((i) => !i.coletado);
    this.efeitos = this.efeitos.filter((e) => !e.morto);

    // Câmera segue o jogador, mas sem mostrar fora da arena
    this.camera.x = Math.max(0, Math.min(CONFIG.larguraArena - CONFIG.larguraTela, j.x - CONFIG.larguraTela / 2));
    this.camera.y = Math.max(0, Math.min(CONFIG.alturaArena - CONFIG.alturaTela, j.y - CONFIG.alturaTela / 2));

    UI.atualizarHud(j, Ondas, this.mortes, this.tempo, dt);

    if (j.morto) this.fimDeJogo();
  },

  /* ---------- COLISÕES ----------
     Círculos que se sobrepõem são empurrados para fora um do outro.
     Assim monstros não "entram" no jogador nem se amontoam num ponto só. */
  resolverColisoes() {
    const j = this.jogador;
    const lista = this.inimigos;

    // monstro x jogador
    for (const a of lista) {
      const ra = a.raio * a.escala;
      const dx = a.x - j.x, dy = a.y - j.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const minimo = ra + j.raio;
      if (d < minimo) {
        const sobra = (minimo - d) / d;
        a.x += dx * sobra * 0.9;  // o monstro é empurrado quase todo
        a.y += dy * sobra * 0.9;
        j.x -= dx * sobra * 0.1;  // o jogador só um pouquinho
        j.y -= dy * sobra * 0.1;
      }
    }

    // monstro x monstro (separação leve)
    for (let i = 0; i < lista.length; i++) {
      for (let k = i + 1; k < lista.length; k++) {
        const a = lista[i], b = lista[k];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const minimo = (a.raio * a.escala + b.raio * b.escala) * 0.8;
        if (d < minimo) {
          const sobra = ((minimo - d) / d) * 0.5;
          a.x -= dx * sobra; a.y -= dy * sobra;
          b.x += dx * sobra; b.y += dy * sobra;
        }
      }
    }
  },

  /* ---------- LEVEL UP ----------
     Pausa o jogo, mostra 3 cartas e volta a rodar quando uma é escolhida. */
  subirDeNivel() {
    const j = this.jogador;
    this.rodando = false;
    const opcoes = sortearHabilidades(j, 3);

    UI.abrirLevelUp(j.nivel, opcoes, (habilidade) => {
      habilidade.aplicar(j);   // AQUI a melhoria realmente altera os atributos
      j.habilidadesPegas[habilidade.id] = (j.habilidadesPegas[habilidade.id] || 0) + 1;
      UI.fecharLevelUp();
      UI.mostrarAviso(`${habilidade.nome}!`, 1.2);
      this.rodando = true;
      this.ultimoQuadro = performance.now(); // evita um "pulo" de tempo após a pausa
    });
  },

  /* ---------- FIM DE JOGO ---------- */
  fimDeJogo() {
    this.rodando = false;
    UI.abrirFim(Ondas, this.jogador, this.mortes, this.tempo);
  },

  /* ---------- DESENHAR ----------
     Tudo é desenhado em coordenadas do MUNDO; a câmera "desloca" o desenho
     (translate) para que a parte certa da arena apareça no canvas. */
  desenhar() {
    const ctx = this.ctx;
    if (!ctx || !this.jogador) return;
    ctx.clearRect(0, 0, CONFIG.larguraTela, CONFIG.alturaTela);

    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1) Arena (imagem de referência esticada para o tamanho do mundo)
    ctx.drawImage(Assets.img.arena, 0, 0, CONFIG.larguraArena, CONFIG.alturaArena);

    // 2) Decorações sem colisão (flores, arbustos) ficam no chão, atrás de tudo
    Cenario.desenhar(ctx, (d) => !d.colide);

    // 3) Itens no chão
    this.itens.forEach((i) => i.desenhar(ctx));

    // 4) Personagens E árvores/pedras, ordenados pelo Y: quem está mais "embaixo"
    //    é desenhado por cima, dando sensação de profundidade (o herói pode
    //    passar atrás de uma árvore).
    const camada = [
      ...this.inimigos, this.jogador,
      ...Cenario.decoracoes.filter((d) => d.colide).map((d) => ({ y: d.y + d.altura * 0.3, deco: d })),
    ].sort((a, b) => a.y - b.y);
    for (const obj of camada) {
      if (obj.deco) Cenario.desenhar(ctx, (d) => d === obj.deco);
      else obj.desenhar(ctx);
    }

    // 5) Projéteis e efeitos por cima de tudo
    this.projeteis.forEach((p) => p.desenhar(ctx));
    this.efeitos.forEach((e) => e.desenhar(ctx));

    ctx.restore();

    // 6) Vinheta escura nas bordas (só estética)
    const g = ctx.createRadialGradient(CONFIG.larguraTela / 2, CONFIG.alturaTela / 2, 250,
                                       CONFIG.larguraTela / 2, CONFIG.alturaTela / 2, 750);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CONFIG.larguraTela, CONFIG.alturaTela);
  },
};
```

### D) Explicação do código
**`iniciar(classe)`** cria TUDO do zero: novo `Jogador`, listas vazias, mortes 0, tempo 0, novo cenário, `Ondas.iniciar()`.
Cancela um `requestAnimationFrame` anterior (senão "Jogar novamente" rodaria dois loops e o jogo ficaria 2x mais rápido).

**`loop(agora)`**: `requestAnimationFrame` pede ao navegador "me chame antes do próximo quadro" e entrega o tempo atual
em milissegundos. `dt = (agora - ultimoQuadro)/1000`, limitado a 0,05 s: se você trocar de aba por 10 s, ao voltar o
jogo não "pula" 10 s de uma vez. Se `rodando` for `false` (level up ou fim) só desenha, não atualiza — é a pausa.

**`atualizar(dt)`** — a ordem importa:
1. jogador se move; 2. waves criam monstros; 3. armas atacam; 4. chuva de flechas;
5. monstros, projéteis, itens e efeitos se atualizam; 6. colisões (`resolverColisoes` + `Cenario.colidir`);
7. monstros mortos → `mortes++` e `criarDrops`; 8. `filter` remove mortos/coletados das listas;
9. câmera; 10. HUD; 11. se o herói morreu → `fimDeJogo()`.

**`resolverColisoes`**: colisão de círculos. Se dois círculos se sobrepõem, `sobra` é quanto falta para separá-los;
o monstro é empurrado 90% e o herói 10% (o herói "sente" o empurrão mas não é jogado longe). Entre monstros a separação
é leve (80% do raio) para eles cercarem o herói sem virar uma bolinha só.

**`subirDeNivel`**: `rodando = false` (pausa), sorteia 3 habilidades, abre a tela; ao escolher: `habilidade.aplicar(j)`
(a melhoria real), registra em `habilidadesPegas`, fecha, despausa e zera `ultimoQuadro` (senão o primeiro `dt` após a
pausa seria enorme).

**`desenhar`**: `ctx.translate(-camera.x, -camera.y)` desloca o "papel": tudo é desenhado em coordenadas do mundo
(0 a 1600) e a câmera decide qual pedaço de 1100x680 aparece. A câmera segue o herói, mas é presa aos limites da arena
(`Math.max/min`) para nunca mostrar fora dela. Camadas: arena → flores/arbustos → itens → (monstros + herói + árvores
ordenados por Y) → projéteis → efeitos → vinheta.

### E) Como utilizar
Fica em `js/` depois de `ui.js`. É a peça que junta todas as outras.

### F) Resultado esperado
Partida fluida a ~60 quadros/s, câmera seguindo o herói, pausa no level up e tela de derrota na morte.

---

## js/menu.js

### A) Nome do arquivo
`js/menu.js`

### B) Objetivo do arquivo
Menu principal, seleção de personagens e wiki.

### C) Código completo
```javascript
/* =====================================================
   menu.js — MENU PRINCIPAL, SELEÇÃO DE PERSONAGENS E WIKI
   ===================================================== */

const Menu = {
  personagemEscolhido: "guerreiro",   // começa com o guerreiro

  iniciar() {
    // ---------- Botões do menu principal ----------
    document.getElementById("btn-jogar").addEventListener("click", () => {
      Jogo.iniciar(this.personagemEscolhido);
    });
    document.getElementById("btn-personagens").addEventListener("click", () => {
      this.montarSelecao();
      UI.mostrarTela("tela-personagens");
    });
    document.getElementById("btn-wiki").addEventListener("click", () => {
      this.montarWiki("personagens");
      UI.mostrarTela("tela-wiki");
    });
    document.getElementById("btn-sair").addEventListener("click", () => this.sair());

    // Todos os botões "Voltar"
    document.querySelectorAll("[data-voltar]").forEach((b) =>
      b.addEventListener("click", () => UI.mostrarTela("tela-menu"))
    );

    // Abas da wiki
    document.querySelectorAll(".aba").forEach((aba) =>
      aba.addEventListener("click", () => {
        document.querySelectorAll(".aba").forEach((a) => a.classList.remove("ativa"));
        aba.classList.add("ativa");
        this.montarWiki(aba.dataset.aba);
      })
    );

    // ---------- Botões da tela de fim ----------
    document.getElementById("btn-jogar-novamente").addEventListener("click", () => {
      Jogo.iniciar(this.personagemEscolhido);
    });
    document.getElementById("btn-voltar-menu").addEventListener("click", () => {
      Jogo.parar();
      UI.fecharFim();
      UI.mostrarTela("tela-menu");
    });

    this.atualizarPersonagemDoMenu();
  },

  /* Mostra o personagem escolhido no meio da floresta do menu */
  atualizarPersonagemDoMenu() {
    const p = PERSONAGENS[this.personagemEscolhido];
    document.getElementById("menu-personagem-img").src = `assets/characters/${p.id}_frente.png`;
    document.getElementById("menu-personagem-nome").textContent = p.nome.toUpperCase();
  },

  /* ---------- SELEÇÃO DE PERSONAGENS ---------- */
  montarSelecao() {
    const lista = document.getElementById("lista-personagens");
    lista.innerHTML = "";

    Object.values(PERSONAGENS).forEach((p) => {
      const cartao = document.createElement("div");
      cartao.className = "cartao-personagem" + (p.id === this.personagemEscolhido ? " selecionado" : "");
      cartao.innerHTML = `
        <div class="topo">
          <img src="assets/characters/${p.id}_frente.png" alt="${p.nome}">
          <h3>${p.nome.toUpperCase()}</h3>
        </div>
        <p class="descricao">${p.descricao}</p>
        <ul class="atributos">
          <li>Ataque: <b>${p.tipoAtaque}</b></li>
          <li>Vida: <b>${p.vidaMax}</b></li>
          <li>Dano: <b>${p.dano}</b></li>
          <li>Alcance: <b>${p.alcance}px</b></li>
          <li>Velocidade de ataque: <b>1 a cada ${p.intervaloAtaque}s</b></li>
          <li>Velocidade de movimento: <b>${p.velocidade}</b></li>
        </ul>
        <div class="selo">✔ SELECIONADO</div>`;

      cartao.addEventListener("click", () => {
        this.personagemEscolhido = p.id;      // guarda a escolha (o Jogo.iniciar usa isso)
        this.atualizarPersonagemDoMenu();
        this.montarSelecao();                 // redesenha para mover o destaque
      });
      lista.appendChild(cartao);
    });
  },

  /* ---------- WIKI ---------- */
  montarWiki(aba) {
    const caixa = document.getElementById("wiki-conteudo");
    caixa.innerHTML = "";
    const add = (html, classe = "") => {
      const d = document.createElement("div");
      d.className = "wiki-item " + classe;
      d.innerHTML = html;
      caixa.appendChild(d);
    };

    if (aba === "personagens") {
      Object.values(PERSONAGENS).forEach((p) => add(`
        <img src="assets/characters/${p.id}_frente.png">
        <h4>${p.nome}</h4>
        <span class="tag">${p.tipoAtaque}</span>
        <p>${p.descricao}</p>
        <p>Vida ${p.vidaMax} · Dano ${p.dano} · Alcance ${p.alcance}</p>`));
    }

    if (aba === "monstros") {
      Object.values(MONSTROS).forEach((m) => add(`
        <img src="assets/enemies/${m.id}_frente.png">
        <h4>${m.nome}</h4>
        <span class="tag">A partir da wave ${m.waveMinima}</span>
        <p>${m.descricao}</p>
        <p>Vida ${m.vida} · Dano ${m.dano} · Velocidade ${m.velocidade} · XP ${m.xp}</p>`));
      CHEFES.forEach((c, i) => add(`
        <img src="assets/enemies/${c.base}_frente.png">
        <h4>👑 ${c.nome}</h4>
        <span class="tag">Chefe da wave ${(i + 1) * 5}</span>
        <p>Versão gigante com contorno vermelho. ${c.habilidade === "rajada" ? "Dispara rajadas de flechas em círculo." : "Dá investidas violentas contra o herói."}</p>
        <p>Vida ${c.vida} · Dano ${c.dano} · XP ${c.xp}</p>`, "chefe"));
    }

    if (aba === "itens") {
      Object.entries(ITENS).forEach(([id, it]) => add(`
        <img src="assets/items/${id}.png">
        <h4>${it.nome}</h4>
        <p>${it.descricao}</p>`));
    }

    if (aba === "habilidades") {
      HABILIDADES.forEach((h) => add(`
        <img src="assets/cards/${h.carta}.png">
        <h4>${h.nome}</h4>
        <span class="tag">${h.classes.length === 2 ? "Todos" : h.classes[0] === "guerreiro" ? "Só Guerreiro" : "Só Arqueiro"}</span>
        <p>${h.descricao}</p>`, "carta"));
    }
  },

  /* ---------- SAIR ----------
     Navegadores só deixam fechar abas que foram abertas por script.
     Tentamos fechar; se não der, avisamos o jogador. */
  sair() {
    window.close();
    setTimeout(() => {
      if (!window.closed) {
        alert("O navegador não permite fechar esta aba automaticamente.\nFeche a aba manualmente (Ctrl+W) para sair do jogo.");
      }
    }, 200);
  },
};
```

### D) Explicação do código
**`personagemEscolhido`** guarda `"guerreiro"` ou `"arqueiro"`. É a única fonte da escolha: o botão JOGAR e o botão
"Jogar novamente" chamam `Jogo.iniciar(this.personagemEscolhido)`. Por isso o personagem escolhido é sempre o que aparece
na partida.

**`iniciar()`** liga os cliques: JOGAR → partida; PERSONAGENS → monta os cartões e troca de tela; WIKI → monta a aba
"personagens" e troca; SAIR → `sair()`; todos os `[data-voltar]` → menu; abas da wiki → `montarWiki(aba)`;
botões da tela de fim → reiniciar ou voltar (parando o loop com `Jogo.parar()`).

**`atualizarPersonagemDoMenu()`** troca o `src` da imagem e o nome no meio da floresta.

**`montarSelecao()`**: cria um cartão por personagem com imagem, descrição, tipo de ataque, vida, dano, alcance,
velocidade de ataque e de movimento. O clique grava a escolha, atualiza o menu e remonta (para o destaque amarelo mudar).

**`montarWiki(aba)`**: gera os cards a partir dos dados reais (`PERSONAGENS`, `MONSTROS`, `CHEFES`, `ITENS`, `HABILIDADES`).
Como lê dos mesmos objetos que o jogo usa, a wiki nunca fica desatualizada.

**`sair()`** — limitação do navegador: por segurança, `window.close()` só funciona em abas abertas por script.
Tentamos; se 200 ms depois a aba continua aberta, mostramos um aviso explicando como fechar (Ctrl+W).

### E) Como utilizar
Fica em `js/` depois de `game.js`. Teste: escolha o Arqueiro, volte, clique JOGAR → o arqueiro aparece na partida.

### F) Resultado esperado
Todos os botões fazem o que dizem; a escolha é mantida; a wiki mostra tudo que existe no jogo.

---

## js/main.js

### A) Nome do arquivo
`js/main.js`

### B) Objetivo do arquivo
Ponto de partida.

### C) Código completo
```javascript
/* =====================================================
   main.js — PONTO DE PARTIDA
   É o primeiro código que "faz algo": carrega as imagens
   e, quando tudo estiver pronto, liga o menu.
   ===================================================== */

window.addEventListener("load", () => {
  UI.iniciar();                      // pega os elementos do HTML
  Assets.carregar(() => {            // carrega todos os PNG...
    Menu.iniciar();                  // ...e só então o menu começa a funcionar
    console.log("DG Fantasy pronto!");
  });
});
```

### D) Explicação do código
`window.addEventListener("load", ...)` espera o HTML inteiro estar pronto (senão `getElementById` devolveria `null`).
Então `UI.iniciar()` pega os elementos, `Assets.carregar(...)` baixa os PNGs e, **só quando terminar**, `Menu.iniciar()`
liga os botões. Enquanto carrega, o menu já aparece (é HTML/CSS), mas o JOGAR ainda não responde — leva menos de 1 s.

### E) Como utilizar
Último script do `index.html`.

### F) Resultado esperado
Ao abrir o `index.html`, o console mostra "DG Fantasy pronto!" e tudo responde.

---

---

# Como executar o jogo (passo a passo)

1. Extraia o arquivo `DG-FANTASY.zip` em uma pasta (clique com o botão direito → "Extrair tudo").
2. Entre na pasta `DG-FANTASY`.
3. Dê **duplo clique em `index.html`**. Ele abre no seu navegador padrão (Chrome, Edge ou Firefox).
4. Pronto. Não precisa instalar nada nem rodar servidor.

> Se o navegador abrir só a página em branco: confira se a pasta `assets` está ao lado do `index.html`
> (o ZIP precisa ser extraído inteiro, não só o `index.html`).

**Controles:** `W A S D` (ou setas) para andar. O ataque é automático. Clique nas cartas ao subir de nível.

# Como testar (checklist)

| Teste | Como fazer | Resultado esperado |
|---|---|---|
| Menu abre | Abrir `index.html` | Floresta, logo, 4 botões, guerreiro no meio |
| Botões | Clicar em cada um | Jogar inicia; Personagens/Wiki trocam de tela; Sair avisa se não puder fechar |
| Escolher personagem | Personagens → clicar Arqueiro → Voltar | Arqueiro aparece na floresta do menu |
| Personagem certo na partida | Jogar após escolher | O mesmo personagem aparece na arena |
| Movimentação | W A S D | Anda nas 8 direções, vira o sprite, balança ao andar, não sai da arena |
| Colisão com cenário | Andar contra árvore/pedra | Para; arbusto e flores atravessa |
| Monstros perseguem | Esperar | Vêm das bordas até você |
| Monstros dão dano | Deixar encostar | Barra de vida cai e o herói pisca |
| Guerreiro ataca sozinho | Ficar perto | Corte azul aparece, goblin leva dano |
| Arqueiro atira sozinho | Ficar a média distância | Flechas voam até o alvo e explodem no impacto |
| Monstros morrem e dropam | Matar | Somem; cristal azul cai; às vezes poção |
| Coleta e barra de XP | Aproximar do cristal | Ele voa até você; barra azul sobe |
| Level up e habilidades | Juntar 10 XP | Jogo pausa, 3 cartas; escolher muda atributos (teste: Dano +25% → monstros morrem mais rápido) |
| Waves | Matar todos | "Wave concluída", 3 s, WAVE 2 com mais monstros |
| Chefe | Chegar na wave 5 | Rei Goblin gigante com contorno vermelho e barra embaixo |
| Barra do chefe | Atacar o chefe | Barra vermelha diminui e some quando ele morre |
| Poção cura | Pegar a poção | Vida sobe, aviso "+ Vida!" |
| Morte | Deixar a vida zerar | Tela "VOCÊ FOI DERROTADO" com wave, nível, mortes e tempo |
| Jogar novamente | Clicar | Nova partida, vida cheia, nível 1, wave 1 |
| Voltar ao menu | Clicar | Menu principal |

Atalhos no console (F12) para testar rápido:
```js
Jogo.jogador.ganharXp(999) && Jogo.subirDeNivel()            // abre a tela de habilidades
Jogo.inimigos=[]; Ondas.numero=4; Ondas.faltamNascer=0; Ondas.entreWaves=0.01   // pula para a wave 5 (chefe)
Jogo.jogador.invulneravel=0; Jogo.jogador.receberDano(9999)  // morre na hora
```

# Sistemas implementados

- Menu com floresta, logo, 4 botões funcionais e herói escolhido na clareira
- Seleção de personagens (Guerreiro e Arqueiro) com ficha completa e escolha mantida na partida
- Wiki com 4 abas (personagens, monstros + chefes, itens, habilidades) gerada a partir dos dados reais
- Movimentação WASD/setas com diagonal corrigida, animação de caminhada por código, 4 direções de sprite, limites da arena
- Arena 1600x1600 (maior que o modelo), câmera que segue o herói, árvores e pedras com colisão, arbustos e flores
- Ataque automático: guerreiro (corte em área curta, rápido) e arqueiro (flechas de longo alcance, mais lento)
- 6 monstros com comportamentos diferentes (perseguir, lobo com investida, aranha em rajadas, atirador que mantém distância)
- Projéteis inimigos reais (flechas de osso que viajam, acertam e somem)
- Dano por contato com cooldown, invulnerabilidade curta, colisão herói/monstro e monstro/monstro
- Waves com contador, nascimento gradual, dificuldade progressiva (+9% vida/wave, mais monstros, novos tipos)
- Chefe a cada 5 waves: tamanho maior, contorno vermelho, barra própria, investidas / rajada de flechas, ciclo que fortalece
- Drops: cristal de XP sempre, poção com chance configurável, coleta por aproximação com imã, item coletado uma única vez
- XP, níveis (XP necessário crescente), tela de level up com 3 cartas compatíveis com a classe
- 16 habilidades com efeito real (dano, velocidade de ataque, alcance, movimento, vida, cura, escudo, imã, segunda espada, onda de choque, duas flechas, fogo, gelo, chuva de flechas...)
- HUD: vida, XP, nível, wave, mortes, tempo, barra do chefe, avisos
- Tela de fim com estatísticas, "Jogar novamente" (zera tudo) e "Voltar ao menu"
- Todos os modelos em PNG recortados das referências + decorações em pixel art PNG

# Melhorias futuras (ideias)

1. **Sons e música** (`new Audio("assets/sons/golpe.mp3").play()` no `weapons.js`).
2. **Mais personagens** (ex.: Mago com bola de fogo que explode em área) — basta nova ficha em `dados.js`, 4 PNGs e um novo caso em `Armas.atualizar`.
3. **Habilidades das cartas restantes**: Teleporte, Bomba, Invisibilidade, Vida Extra (ressuscitar uma vez).
4. **Recorde salvo** no navegador com `localStorage` (melhor wave/tempo na tela de fim).
5. **Pausa com ESC** (`rodando = false` + uma tela "PAUSADO").
6. **Sprites com mais quadros de animação** (hoje o balanço é feito por código; com 2–3 quadros por direção fica ainda melhor).
7. **Mapas diferentes** (caverna, cemitério) trocando a imagem da arena e as decorações.
8. **Tela de vitória** ao vencer a wave 20, por exemplo.
9. **Suporte a celular** com joystick virtual na tela.
