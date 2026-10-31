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

    // Sem teclado? Usa o joystick do celular (toque.js)
    if (dx === 0 && dy === 0) { dx = Toque.dx; dy = Toque.dy; }

    this.andando = dx !== 0 || dy !== 0;

    if (this.andando) {
      // Na diagonal, dx e dy valem 1 ao mesmo tempo e o personagem andaria
      // mais rápido (√2 vezes). Dividimos pelo comprimento para corrigir isso.
      // (o joystick pode ficar abaixo de 1: assim dá para andar devagar)
      const comprimento = Math.max(1, Math.hypot(dx, dy));
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
    Som.tocar("dano_jogador");
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
