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
    Som.musica("jogo");
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
        Som.tocar("morte", ini.chefe);
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
    Som.tocar("levelup");

    UI.abrirLevelUp(j.nivel, opcoes, (habilidade) => {
      habilidade.aplicar(j);   // AQUI a melhoria realmente altera os atributos
      j.habilidadesPegas[habilidade.id] = (j.habilidadesPegas[habilidade.id] || 0) + 1;
      UI.fecharLevelUp();
      Som.tocar("escolha");
      UI.mostrarAviso(`${habilidade.nome}!`, 1.2);
      this.rodando = true;
      this.ultimoQuadro = performance.now(); // evita um "pulo" de tempo após a pausa
    });
  },

  /* ---------- FIM DE JOGO ---------- */
  fimDeJogo() {
    this.rodando = false;
    Som.tocar("derrota");
    Som.musica("fim");
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
    const menor = Math.min(CONFIG.larguraTela, CONFIG.alturaTela);
    const maior = Math.max(CONFIG.larguraTela, CONFIG.alturaTela);
    const g = ctx.createRadialGradient(CONFIG.larguraTela / 2, CONFIG.alturaTela / 2, menor * 0.37,
                                       CONFIG.larguraTela / 2, CONFIG.alturaTela / 2, maior * 0.68);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CONFIG.larguraTela, CONFIG.alturaTela);
  },
};
