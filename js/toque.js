/* =====================================================
   toque.js — CONTROLES PARA CELULAR
   Joystick virtual: encoste o dedo em qualquer lugar da
   partida e arraste para andar. Também ajusta o tamanho
   da "janela" do jogo para ocupar a tela do celular.
   ===================================================== */

const Toque = {
  ehCelular: window.matchMedia("(pointer: coarse)").matches,
  dx: 0,                // direção do joystick (-1 a 1), lida pelo player.js
  dy: 0,
  idDedo: null,         // qual dedo está controlando o joystick
  origem: { x: 0, y: 0 },
  raioMax: 55,          // quanto o dedo pode se afastar do centro (em pixels da tela)

  iniciar() {
    if (this.ehCelular) document.body.classList.add("celular");

    const area = document.getElementById("tela-jogo");
    this.base = document.getElementById("joystick");
    this.pino = document.getElementById("joystick-pino");

    area.addEventListener("pointerdown", (e) => {
      // Só o toque no próprio jogo vale (não nas cartas de level up nem nos botões)
      if (e.pointerType === "mouse" || this.idDedo !== null) return;
      if (e.target.closest(".sobreposicao, button")) return;
      e.preventDefault();
      this.idDedo = e.pointerId;
      this.origem = { x: e.clientX, y: e.clientY };
      this.base.style.left = `${e.clientX}px`;
      this.base.style.top = `${e.clientY}px`;
      this.base.classList.add("visivel");
      this.mover(e);
    });
    area.addEventListener("pointermove", (e) => { if (e.pointerId === this.idDedo) this.mover(e); });
    ["pointerup", "pointercancel"].forEach((ev) =>
      area.addEventListener(ev, (e) => { if (e.pointerId === this.idDedo) this.soltar(); })
    );

    window.addEventListener("resize", () => this.ajustarTela());
    this.ajustarTela();
  },

  mover(e) {
    let x = e.clientX - this.origem.x, y = e.clientY - this.origem.y;
    const d = Math.hypot(x, y);
    if (d > this.raioMax) { x *= this.raioMax / d; y *= this.raioMax / d; }
    this.pino.style.transform = `translate(${x}px, ${y}px)`;
    // Uma "zona morta" pequena evita que o personagem ande com um toque parado
    const forca = d < 8 ? 0 : 1;
    this.dx = (x / this.raioMax) * forca;
    this.dy = (y / this.raioMax) * forca;
  },

  soltar() {
    this.idDedo = null;
    this.dx = this.dy = 0;
    this.pino.style.transform = "";
    this.base.classList.remove("visivel");
  },

  /* No celular o canvas ocupa a tela inteira: a área visível da arena
     acompanha o formato da tela (em pé ou deitada). */
  ajustarTela() {
    if (!this.ehCelular) return;
    const proporcao = window.innerWidth / window.innerHeight;
    const ladoMenor = 560;   // menor = personagens maiores na tela
    if (proporcao >= 1) {
      CONFIG.alturaTela = ladoMenor;
      CONFIG.larguraTela = Math.round(Math.min(CONFIG.larguraArena, ladoMenor * proporcao));
    } else {
      CONFIG.larguraTela = ladoMenor;
      CONFIG.alturaTela = Math.round(Math.min(CONFIG.alturaArena, ladoMenor / proporcao));
    }
    const canvas = document.getElementById("canvas");
    canvas.width = CONFIG.larguraTela;
    canvas.height = CONFIG.alturaTela;
  },
};
