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
        Som.tocar("cristal");
        const subiu = jogador.ganharXp(this.valor);
        if (subiu) Jogo.subirDeNivel();
      } else {
        jogador.curar(this.valor);
        Som.tocar("pocao");
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
