# DG FANTASY

Jogo 2D de sobrevivência (estilo Vampire Survivors / Brotato) feito apenas com **HTML, CSS e JavaScript puro**.

## Como jogar

1. Extraia o ZIP inteiro.
2. Dê duplo clique em `index.html`.
3. Mova com **W A S D** (ou setas). O ataque é automático. Escolha uma carta ao subir de nível.

## Documentação

Toda a explicação do código (arquivo por arquivo, em linguagem simples) está em **`docs/EXPLICACAO.md`**,
junto com o passo a passo de execução, o checklist de testes, a lista de sistemas e as melhorias futuras.

## Estrutura

```
index.html      estrutura das telas
css/            style.css (geral), menu.css (menu/personagens/wiki), game.css (partida)
js/             assets, dados, abilities, player, enemies, weapons, items, cenario, ui, game, menu, main
assets/         todos os sprites em PNG (personagens, monstros, itens, cartas, cenário, ui)
docs/           EXPLICACAO.md
```

## Visual do kit medieval

- `assets/ui/menus/menu_principal.png`: menu principal em PNG (botões são áreas clicáveis invisíveis).
- `assets/ui/menus/moldura.png` + `css/tema.css`: moldura, faixas, botões e cartões do kit nas telas Personagens e Wiki.
  Essas telas continuam dinâmicas: os dados vêm de `js/dados.js` e `js/abilities.js`.

## Som (js/audio.js)

Efeitos e música são gerados por código (Web Audio), sem arquivos de som. O áudio só começa depois do primeiro clique (regra dos navegadores).
- `Som.tocar("espada" | "flecha" | "chuva" | "impacto" | "morte" | "cristal" | "pocao" | "dano_jogador" | "levelup" | "escolha" | "derrota" | "chefe" | "clique")`
- `Som.musica("menu" | "jogo" | "fim")` — a bateria só toca em "jogo".
- Botão 🔊 no canto da tela ou tecla **M** liga/desliga. Volumes ficam em `Som.VOLUME` e o andamento em `Som.BPM`, no topo do arquivo.
