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
    // A flecha PNG tem a PONTA para BAIXO (penas em cima); calculamos quanto girar para apontar na direção certa
    this.angulo = Math.atan2(ny, nx) - Math.PI / 2;
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
    Som.tocar("espada");
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
    Som.tocar("flecha");
    Jogo.projeteis.push(new Projetil(jogador.x, jogador.y - 10, dx / d, dy / d, {
      dono: "jogador", dano: jogador.dano, velocidade: 560,
      alcance: jogador.alcance + 60, fogo: jogador.flechaFogo, gelo: jogador.flechaGelo,
    }));
  },

  /* CHUVA DE FLECHAS (habilidade): 8 flechas em círculo a cada 6s */
  chuvaDeFlechas(jogador) {
    if (!jogador.chuvaFlechas || jogador.tempoChuva < 6) return;
    jogador.tempoChuva = 0;
    Som.tocar("chuva");
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      this.criarFlecha(jogador, Math.cos(a), Math.sin(a));
    }
  },
};
