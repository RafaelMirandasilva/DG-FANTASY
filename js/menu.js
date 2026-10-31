/* =====================================================
   menu.js — MENU PRINCIPAL, SELEÇÃO DE PERSONAGENS E WIKI
   ===================================================== */

const Menu = {
  personagemEscolhido: "guerreiro",   // começa com o guerreiro

  iniciar() {
    // ---------- Botões do menu principal ----------
    document.getElementById("btn-jogar").addEventListener("click", () => {
      Jogo.iniciar(this.personagemEscolhido);
    });
    document.getElementById("btn-personagens").addEventListener("click", () => {
      this.montarSelecao();
      UI.mostrarTela("tela-personagens");
    });
    document.getElementById("btn-wiki").addEventListener("click", () => {
      this.montarWiki("personagens");
      UI.mostrarTela("tela-wiki");
    });
    document.getElementById("btn-sair").addEventListener("click", () => this.sair());

    // Todos os botões "Voltar"
    document.querySelectorAll("[data-voltar]").forEach((b) =>
      b.addEventListener("click", () => UI.mostrarTela("tela-menu"))
    );

    // Abas da wiki
    document.querySelectorAll(".aba").forEach((aba) =>
      aba.addEventListener("click", () => {
        document.querySelectorAll(".aba").forEach((a) => a.classList.remove("ativa"));
        aba.classList.add("ativa");
        this.montarWiki(aba.dataset.aba);
      })
    );

    // ---------- Botões da tela de fim ----------
    document.getElementById("btn-jogar-novamente").addEventListener("click", () => {
      Jogo.iniciar(this.personagemEscolhido);
    });
    document.getElementById("btn-voltar-menu").addEventListener("click", () => {
      Jogo.parar();
      Som.musica("menu");
      UI.fecharFim();
      UI.mostrarTela("tela-menu");
    });

    this.atualizarPersonagemDoMenu();
  },

  /* Mostra o personagem escolhido no meio da floresta do menu */
  atualizarPersonagemDoMenu() {
    const p = PERSONAGENS[this.personagemEscolhido];
    document.getElementById("menu-personagem-img").src = `assets/characters/${p.id}_frente.png`;
    document.getElementById("menu-personagem-nome").textContent = p.nome.toUpperCase();
  },

  /* ---------- SELEÇÃO DE PERSONAGENS ---------- */
  montarSelecao() {
    const lista = document.getElementById("lista-personagens");
    lista.innerHTML = "";

    Object.values(PERSONAGENS).forEach((p) => {
      const cartao = document.createElement("div");
      cartao.className = "cartao-personagem" + (p.id === this.personagemEscolhido ? " selecionado" : "");
      cartao.innerHTML = `
        <div class="topo">
          <img src="assets/characters/${p.id}_frente.png" alt="${p.nome}">
          <h3>${p.nome.toUpperCase()}</h3>
        </div>
        <p class="descricao">${p.descricao}</p>
        <ul class="atributos">
          <li>Ataque: <b>${p.tipoAtaque}</b></li>
          <li>Vida: <b>${p.vidaMax}</b></li>
          <li>Dano: <b>${p.dano}</b></li>
          <li>Alcance: <b>${p.alcance}px</b></li>
          <li>Velocidade de ataque: <b>1 a cada ${p.intervaloAtaque}s</b></li>
          <li>Velocidade de movimento: <b>${p.velocidade}</b></li>
        </ul>
        <div class="selo">✔ SELECIONADO</div>`;

      cartao.addEventListener("click", () => {
        this.personagemEscolhido = p.id;      // guarda a escolha (o Jogo.iniciar usa isso)
        this.atualizarPersonagemDoMenu();
        this.montarSelecao();                 // redesenha para mover o destaque
      });
      lista.appendChild(cartao);
    });
  },

  /* ---------- WIKI ---------- */
  montarWiki(aba) {
    const caixa = document.getElementById("wiki-conteudo");
    caixa.innerHTML = "";
    const add = (html, classe = "") => {
      const d = document.createElement("div");
      d.className = "wiki-item " + classe;
      d.innerHTML = html;
      caixa.appendChild(d);
    };

    if (aba === "personagens") {
      Object.values(PERSONAGENS).forEach((p) => add(`
        <img src="assets/characters/${p.id}_frente.png">
        <h4>${p.nome}</h4>
        <span class="tag">${p.tipoAtaque}</span>
        <p>${p.descricao}</p>
        <p>Vida ${p.vidaMax} · Dano ${p.dano} · Alcance ${p.alcance}</p>`));
    }

    if (aba === "monstros") {
      Object.values(MONSTROS).forEach((m) => add(`
        <img src="assets/enemies/${m.id}_frente.png">
        <h4>${m.nome}</h4>
        <span class="tag">A partir da wave ${m.waveMinima}</span>
        <p>${m.descricao}</p>
        <p>Vida ${m.vida} · Dano ${m.dano} · Velocidade ${m.velocidade} · XP ${m.xp}</p>`));
      CHEFES.forEach((c, i) => add(`
        <img src="assets/enemies/${c.base}_frente.png">
        <h4>👑 ${c.nome}</h4>
        <span class="tag">Chefe da wave ${(i + 1) * 5}</span>
        <p>Versão gigante com contorno vermelho. ${c.habilidade === "rajada" ? "Dispara rajadas de flechas em círculo." : "Dá investidas violentas contra o herói."}</p>
        <p>Vida ${c.vida} · Dano ${c.dano} · XP ${c.xp}</p>`, "chefe"));
    }

    if (aba === "itens") {
      Object.entries(ITENS).forEach(([id, it]) => add(`
        <img src="assets/items/${id}.png">
        <h4>${it.nome}</h4>
        <p>${it.descricao}</p>`));
    }

    if (aba === "habilidades") {
      HABILIDADES.forEach((h) => add(`
        <img src="assets/cards/${h.carta}.png">
        <h4>${h.nome}</h4>
        <span class="tag">${h.classes.length === 2 ? "Todos" : h.classes[0] === "guerreiro" ? "Só Guerreiro" : "Só Arqueiro"}</span>
        <p>${h.descricao}</p>`, "carta"));
    }
  },

  /* ---------- SAIR ----------
     Navegadores só deixam fechar abas que foram abertas por script.
     Tentamos fechar; se não der, avisamos o jogador. */
  sair() {
    window.close();
    setTimeout(() => {
      if (!window.closed) {
        alert("O navegador não permite fechar esta aba automaticamente.\nFeche a aba manualmente (Ctrl+W) para sair do jogo.");
      }
    }, 200);
  },
};
