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
      if (Math.abs(vx) > Math.abs(vy)) {
        // Os PNG laterais da aranha estão invertidos (aranha_lado olha para a ESQUERDA), então trocamos só para ela
        const direita = this.tipo === "aranha" ? vx < 0 : vx > 0;
        this.direcao = direita ? "lado" : "lado_esq";
      }
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
    if (!silencioso) { this.tempoDano = 0.12; Som.tocar("impacto"); }
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
    Som.tocar("chefe");
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
