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
