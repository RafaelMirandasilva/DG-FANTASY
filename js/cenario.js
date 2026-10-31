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
