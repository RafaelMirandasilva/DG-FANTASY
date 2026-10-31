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
    Som.abafar(true);
  },

  fecharLevelUp() {
    this.el["tela-levelup"].classList.add("escondido");
    Som.abafar(false);
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
