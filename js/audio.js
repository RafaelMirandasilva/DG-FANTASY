/* =====================================================
   audio.js — EFEITOS SONOROS E MÚSICA
   Tudo é gerado por código (Web Audio): não há arquivos de som.
   Como usar no resto do jogo:
     Som.tocar("espada")     → toca um efeito
     Som.musica("jogo")      → troca a música ("menu", "jogo" ou "fim")
   A música é um loop "lofi medieval": alaúde (cordas beliscadas),
   flauta suave, pad quente, baixo e uma bateria leve só durante a partida.
   ===================================================== */

const Som = {
  /* ---------- AJUSTES (0 a 1) — mexa aqui para mudar o volume ---------- */
  VOLUME: { geral: 0.9, musica: 0.38, efeitos: 0.75 },
  BPM: 74,

  ctx: null,
  pronto: false,
  mudo: false,
  modo: "menu",       // "menu" | "jogo" | "fim"
  abafado: false,     // true enquanto a tela de level up está aberta
  ultimo: {},         // quando cada efeito tocou pela última vez (evita "metralhadora")
  MIN_MS: { impacto: 45, flecha: 45, espada: 70, morte: 60, cristal: 30, dano_jogador: 120, clique: 40 },

  /* ================== NOTAS DA MÚSICA (Ré dórico) ================== */
  // Cada acorde: baixo + 5 notas (MIDI) para o alaúde e o pad.
  ACORDES: [
    { baixo: 38, tons: [50, 53, 57, 60, 62] },   // Dm7
    { baixo: 36, tons: [48, 52, 55, 59, 60] },   // Cmaj7
    { baixo: 43, tons: [55, 59, 62, 57, 67] },   // G(add9)
    { baixo: 38, tons: [50, 53, 57, 60, 62] },   // Dm7
    { baixo: 41, tons: [53, 57, 60, 64, 65] },   // Fmaj7
    { baixo: 36, tons: [48, 52, 55, 59, 60] },   // Cmaj7
    { baixo: 43, tons: [55, 59, 62, 57, 67] },   // G(add9)
    { baixo: 45, tons: [57, 60, 64, 67, 69] },   // Am7
  ],
  // Em que nota do acorde o alaúde toca em cada colcheia (8 por compasso)
  PADROES: [
    [0, 2, 3, 1, 2, 3, 4, 3],
    [0, 3, 2, 3, 1, 3, 2, 4],
    [0, 2, 4, 2, 1, 2, 3, 2],
  ],
  ESCALA: [62, 64, 65, 67, 69, 71, 72, 74, 76],  // D4 ... E5
  // Frases da flauta: [nota da escala, passo (0-15), duração em passos]
  MOTIVOS: [
    [[4, 0, 4], [3, 4, 2], [2, 6, 2], [4, 8, 6]],
    [[2, 0, 2], [4, 2, 2], [5, 4, 4], [4, 8, 2], [3, 10, 2], [2, 12, 4]],
    [[7, 0, 3], [5, 4, 2], [4, 6, 2], [5, 8, 8]],
    [[0, 0, 4], [2, 4, 4], [3, 8, 4], [4, 12, 4]],
  ],

  /* ================== INICIALIZAÇÃO ================== */
  iniciar() {
    try { this.mudo = localStorage.getItem("dg_fantasy_mudo") === "1"; } catch (e) {}
    this._atualizarBotao();

    // Navegadores só liberam áudio depois de um clique/tecla do jogador
    const liberar = () => this.desbloquear();
    ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
      window.addEventListener(ev, liberar, { once: true, capture: true })
    );

    // Som de clique em botões e cartões (as cartas de habilidade têm som próprio)
    document.addEventListener("click", (e) => {
      if (e.target.closest("#btn-som")) return;
      if (e.target.closest("button, .cartao-personagem, .aba")) this.tocar("clique");
    });

    document.getElementById("btn-som").addEventListener("click", () => this.alternarMudo());
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "m" && !e.repeat) this.alternarMudo();
    });

    // Aba em segundo plano: pausa o áudio para não atrasar nem engasgar
    document.addEventListener("visibilitychange", () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend(); else this.ctx.resume();
    });
  },

  desbloquear() {
    if (this.ctx) { this.ctx.resume(); return; }
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return;                       // navegador sem áudio: o jogo segue mudo
    this.ctx = new Contexto();
    this._montarGrafo();
    this.ctx.resume();
    this.pronto = true;
    this._iniciarAgenda();
  },

  /* Cria os "canos" de som: efeitos e música passam pelo mestre + compressor */
  _montarGrafo() {
    const c = this.ctx, sr = c.sampleRate;

    this.mestre = c.createGain();
    this.mestre.gain.value = this.mudo ? 0 : this.VOLUME.geral;
    this.comp = c.createDynamicsCompressor();      // evita estourar quando muita coisa toca junto
    this.comp.threshold.value = -14; this.comp.knee.value = 20; this.comp.ratio.value = 4;
    this.comp.attack.value = 0.004; this.comp.release.value = 0.15;
    this.mestre.connect(this.comp); this.comp.connect(c.destination);

    this.barraSfx = c.createGain();
    this.barraSfx.gain.value = this.VOLUME.efeitos;
    this.barraSfx.connect(this.mestre);

    // Música: tudo passa por um filtro "abafado" (o clima lofi)
    this.barraMusica = c.createGain();
    this.lofi = c.createBiquadFilter();
    this.lofi.type = "lowpass"; this.lofi.frequency.value = 4800; this.lofi.Q.value = 0.5;
    this.barraMusica.connect(this.lofi); this.lofi.connect(this.mestre);
    this._aplicarVolumeMusica(true);

    this.barraBateria = c.createGain();
    this.barraBateria.gain.value = 0.8;
    this.barraBateria.connect(this.barraMusica);

    // Reverb (sala de pedra) — resposta ao impulso feita de ruído que some devagar
    const N = Math.floor(sr * 2.4), ir = c.createBuffer(2, N, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch); let y = 0;
      for (let i = 0; i < N; i++) {
        y = y * 0.6 + (Math.random() * 2 - 1) * Math.pow(1 - i / N, 3.2) * 0.4;
        d[i] = y;
      }
    }
    this.reverb = c.createConvolver(); this.reverb.buffer = ir;
    this.envioReverb = c.createGain();
    const saidaReverb = c.createGain(); saidaReverb.gain.value = 0.3;
    this.envioReverb.connect(this.reverb); this.reverb.connect(saidaReverb); saidaReverb.connect(this.barraMusica);

    // Eco da flauta
    this.atraso = c.createDelay(1); this.atraso.delayTime.value = 0.608;
    const retorno = c.createGain(); retorno.gain.value = 0.3;
    const filtroEco = c.createBiquadFilter(); filtroEco.type = "lowpass"; filtroEco.frequency.value = 1800;
    const saidaEco = c.createGain(); saidaEco.gain.value = 0.28;
    this.atraso.connect(filtroEco); filtroEco.connect(retorno); retorno.connect(this.atraso);
    filtroEco.connect(saidaEco); saidaEco.connect(this.barraMusica);

    // Filtro do alaúde
    this.luteFiltro = c.createBiquadFilter();
    this.luteFiltro.type = "lowpass"; this.luteFiltro.frequency.value = 2600;
    this.luteFiltro.connect(this.barraMusica);
    const lute2 = c.createGain(); lute2.gain.value = 0.35;
    this.luteFiltro.connect(lute2); lute2.connect(this.envioReverb);

    // "Fita velha": a afinação balança de leve (±7 centésimos de semitom)
    const lfo = c.createOscillator(); lfo.frequency.value = 0.35;
    this.balanco = c.createGain(); this.balanco.gain.value = 7;
    lfo.connect(this.balanco); lfo.start();

    // Chiado de disco antigo (estalinhos bem baixos)
    const cb = c.createBuffer(1, sr * 4, sr), cd = cb.getChannelData(0);
    for (let i = 0; i < cd.length; i++) {
      cd[i] = (Math.random() * 2 - 1) * 0.004;
      if (Math.random() < 7 / sr) cd[i] += (Math.random() < 0.5 ? -1 : 1) * (0.15 + Math.random() * 0.5);
    }
    const chiado = c.createBufferSource(); chiado.buffer = cb; chiado.loop = true;
    const altoChiado = c.createBiquadFilter(); altoChiado.type = "highpass"; altoChiado.frequency.value = 700;
    const gChiado = c.createGain(); gChiado.gain.value = 0.16;
    chiado.connect(altoChiado); altoChiado.connect(gChiado); gChiado.connect(this.barraMusica); chiado.start();

    // Ruído branco reaproveitado nos efeitos e na bateria
    this.bufRuido = c.createBuffer(1, sr * 2, sr);
    const rd = this.bufRuido.getChannelData(0);
    for (let i = 0; i < rd.length; i++) rd[i] = Math.random() * 2 - 1;

    this.cachePluck = new Map();
  },

  _aplicarVolumeMusica(imediato) {
    if (!this.barraMusica) return;
    let v = this.VOLUME.musica;
    if (this.abafado) v *= 0.35;
    if (this.modo === "fim") v *= 0.5;
    const g = this.barraMusica.gain;
    if (imediato) g.value = v; else g.setTargetAtTime(v, this.ctx.currentTime, 0.25);
  },

  /* ================== CONTROLES ================== */
  musica(modo) {
    this.modo = modo;
    this._aplicarVolumeMusica();
  },

  abafar(sim) {            // tela de level up aberta: música mais baixinha
    this.abafado = sim;
    this._aplicarVolumeMusica();
  },

  alternarMudo() {
    this.mudo = !this.mudo;
    try { localStorage.setItem("dg_fantasy_mudo", this.mudo ? "1" : "0"); } catch (e) {}
    if (this.mestre) this.mestre.gain.setTargetAtTime(this.mudo ? 0 : this.VOLUME.geral, this.ctx.currentTime, 0.05);
    this._atualizarBotao();
  },

  _atualizarBotao() {
    const b = document.getElementById("btn-som");
    if (!b) return;
    b.textContent = this.mudo ? "🔇" : "🔊";
    b.setAttribute("aria-label", this.mudo ? "Ligar som" : "Desligar som");
    b.classList.toggle("mudo", this.mudo);
  },

  /* ================== EFEITOS ================== */
  tocar(nome, arg) {
    if (!this.pronto || this.mudo || this.ctx.state !== "running") return;
    const agora = performance.now();
    const min = this.MIN_MS[nome] || 0;
    if (agora - (this.ultimo[nome] ?? -1e9) < min) return;
    this.ultimo[nome] = agora;
    const fn = this.SFX[nome];
    if (fn) { try { fn.call(this, this.ctx.currentTime + 0.005, arg); } catch (e) { console.warn("Som:", e); } }
  },

  /* ---------- peças de montar som ---------- */
  _env(g, t, ataque, pico, dur) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ataque + dur);
  },

  _osc(tipo, f0, f1, t, dur, pico, destino, ataque = 0.003) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this._env(g, t, ataque, pico, dur);
    o.connect(g); g.connect(destino || this.barraSfx);
    o.start(t); o.stop(t + ataque + dur + 0.05);
    return o;
  },

  _ruido(tipo, f0, f1, Q, t, dur, pico, destino, ataque = 0.003) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.bufRuido; s.loop = true;
    f.type = tipo; f.Q.value = Q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this._env(g, t, ataque, pico, dur);
    s.connect(f); f.connect(g); g.connect(destino || this.barraSfx);
    s.start(t, Math.random() * 1.5); s.stop(t + ataque + dur + 0.05);
  },

  /* Corda beliscada (Karplus-Strong): é o som do alaúde e do arco do arqueiro */
  _bufferCorda(P, decaimento, seg) {
    const chave = P + "_" + decaimento;
    if (this.cachePluck.has(chave)) return this.cachePluck.get(chave);
    const c = this.ctx, sr = c.sampleRate, N = Math.floor(sr * seg);
    const buf = c.createBuffer(1, N, sr), d = buf.getChannelData(0), anel = new Float32Array(P);
    let ant = 0;
    for (let i = 0; i < P; i++) { ant = ant * 0.5 + (Math.random() * 2 - 1) * 0.5; anel[i] = ant; }
    let idx = 0;
    for (let n = 0; n < N; n++) {
      const prox = (idx + 1) % P;
      d[n] = anel[idx];
      anel[idx] = (anel[idx] + anel[prox]) * 0.5 * decaimento;
      idx = prox;
    }
    this.cachePluck.set(chave, buf);
    return buf;
  },

  _corda(midiOuHz, t, vel, destino, opcoes = {}) {
    const c = this.ctx;
    const f = opcoes.hz ? midiOuHz : 440 * Math.pow(2, (midiOuHz - 69) / 12);
    const P = Math.max(2, Math.round(c.sampleRate / f));
    const dec = opcoes.decaimento || 0.997, dur = opcoes.dur || 2;
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = this._bufferCorda(P, dec, dur + 0.3);
    src.playbackRate.value = (f * P) / c.sampleRate;       // corrige a afinação (P é inteiro)
    if (opcoes.balanco !== false) this.balanco.connect(src.detune);
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(g); g.connect(destino);
    src.start(t); src.stop(t + dur + 0.1);
  },

  /* ================== OS SONS ================== */
  SFX: {
    // Corte de espada: vento + brilho do metal + pancada grave
    espada(t) {
      const r = 0.95 + Math.random() * 0.12;
      this._ruido("bandpass", 500 * r, 3200 * r, 1.1, t, 0.15, 0.55, null, 0.02);
      this._ruido("highpass", 5200, 7800, 0.7, t + 0.03, 0.09, 0.1);
      this._osc("sine", 1760 * r, 1700 * r, t + 0.04, 0.22, 0.07);
      this._osc("sine", 2637 * r, 2600 * r, t + 0.04, 0.18, 0.04);
      this._osc("sine", 210 * r, 70, t, 0.11, 0.38);
    },
    // Disparo de flecha: corda do arco vibrando + chiado da flecha cortando o ar
    flecha(t) {
      const r = 0.94 + Math.random() * 0.14;
      this._corda(190 * r, t, 0.5, this.barraSfx, { hz: true, decaimento: 0.985, dur: 0.35, balanco: false });
      this._ruido("bandpass", 2800, 700, 1.4, t + 0.01, 0.12, 0.22);
      this._osc("triangle", 560 * r, 220, t, 0.08, 0.14);
    },
    // Chuva de flechas (habilidade): rajada longa
    chuva(t) {
      this._ruido("bandpass", 350, 2600, 0.9, t, 0.4, 0.45, null, 0.05);
      this._corda(150, t, 0.55, this.barraSfx, { hz: true, decaimento: 0.985, dur: 0.4, balanco: false });
    },
    // Golpe que acerta um monstro: "thud" encorpado com um estalinho
    impacto(t) {
      const r = 0.9 + Math.random() * 0.2;
      this._osc("sine", 175 * r, 55, t, 0.11, 0.5);
      this._ruido("lowpass", 1100, 300, 0.7, t, 0.07, 0.32);
      this._ruido("highpass", 3200, 3200, 0.7, t, 0.018, 0.14);
    },
    // Monstro derrotado (arg = true para chefe)
    morte(t, chefe) {
      if (chefe) {
        this._osc("sine", 130, 36, t, 0.7, 0.8);
        this._ruido("lowpass", 1400, 120, 0.8, t, 0.7, 0.55);
        this._osc("sawtooth", 98, 49, t, 0.6, 0.18);
        this._osc("triangle", 660, 990, t + 0.12, 0.5, 0.08);
        return;
      }
      const r = 0.92 + Math.random() * 0.16;
      this._osc("sine", 320 * r, 85, t, 0.18, 0.42);
      this._ruido("bandpass", 1300, 280, 0.9, t, 0.22, 0.3);
      this._osc("triangle", 700 * r, 1050 * r, t + 0.05, 0.12, 0.06);
    },
    // Cristal de XP: sino que sobe de tom quando você pega vários seguidos
    cristal(t) {
      const agora = performance.now();
      this.combo = (agora - (this.ultimoCristal || 0) < 700) ? Math.min((this.combo || 0) + 1, 9) : 0;
      this.ultimoCristal = agora;
      const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
      const f = 880 * Math.pow(2, PENTA[this.combo] / 12);
      this._osc("sine", f, f, t, 0.4, 0.3);
      this._osc("sine", f * 2, f * 2, t, 0.25, 0.1);
      this._osc("triangle", f * 3, f * 3, t, 0.12, 0.05);
    },
    // Poção: borbulhar subindo
    pocao(t) {
      this._osc("sine", 380, 880, t, 0.13, 0.3);
      this._osc("sine", 560, 1250, t + 0.09, 0.13, 0.26);
      this._osc("sine", 1568, 1568, t + 0.2, 0.3, 0.12);
      this._ruido("highpass", 5000, 5000, 0.7, t + 0.2, 0.15, 0.04);
    },
    // Jogador machucado: pancada grave + zumbido
    dano_jogador(t) {
      this._osc("sine", 150, 48, t, 0.22, 0.7);
      this._osc("sawtooth", 230, 90, t, 0.2, 0.18);
      this._ruido("lowpass", 900, 200, 0.7, t, 0.12, 0.35);
    },
    // Subiu de nível: arpejo brilhante
    levelup(t) {
      [587.33, 739.99, 880, 1174.66, 1480, 1760].forEach((f, i) => {
        const ti = t + i * 0.085;
        this._osc("triangle", f, f, ti, 0.55, 0.22);
        this._osc("sine", f * 2, f * 2, ti, 0.4, 0.07);
      });
      this._osc("sine", 293.66, 293.66, t, 0.9, 0.2);
      this._ruido("highpass", 6000, 6000, 0.7, t + 0.3, 0.5, 0.03, null, 0.1);
    },
    // Escolheu uma carta
    escolha(t) {
      this._osc("triangle", 880, 880, t, 0.3, 0.25);
      this._osc("triangle", 1318.5, 1318.5, t + 0.08, 0.45, 0.25);
      this._osc("sine", 2637, 2637, t + 0.08, 0.3, 0.06);
    },
    // Derrota: frase descendente e grave
    derrota(t) {
      [293.66, 261.63, 220, 146.83].forEach((f, i) => {
        const ti = t + i * 0.42;
        this._osc("triangle", f, f * 0.99, ti, 0.9, 0.3, null, 0.02);
        this._osc("sine", f / 2, f / 2, ti, 0.9, 0.25, null, 0.02);
      });
    },
    // Chefe chegando: trompa grave
    chefe(t) {
      const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter();
      f.type = "lowpass"; f.frequency.setValueAtTime(260, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.7);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.3);
      g.gain.setValueAtTime(0.4, t + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      [98, 98.6, 147, 196].forEach((fr, i) => {
        const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = fr;
        const gi = c.createGain(); gi.gain.value = i > 1 ? 0.35 : 1;
        o.connect(gi); gi.connect(f); o.start(t); o.stop(t + 1.6);
      });
      f.connect(g); g.connect(this.barraSfx);
      this._osc("sine", 120, 40, t + 0.05, 0.5, 0.7);
      this._osc("sine", 120, 40, t + 0.45, 0.5, 0.6);
    },
    // Clique de menu: toquinho de madeira
    clique(t) {
      this._osc("sine", 720, 380, t, 0.05, 0.22);
      this._ruido("bandpass", 2200, 1500, 1, t, 0.025, 0.12);
    },
  },

  /* ================== MÚSICA ================== */
  _iniciarAgenda() {
    this.passo = 0;
    this.tProx = this.ctx.currentTime + 0.15;
    this.motivo = null;
    this.padrao = this.PADROES[0];
    setInterval(() => this._tick(), 90);
  },

  // Agenda os próximos passos de música (16 passos por compasso) um pouco antes de tocarem
  _tick() {
    if (!this.ctx || this.ctx.state !== "running") return;
    const durPasso = 60 / this.BPM / 4;
    while (this.tProx < this.ctx.currentTime + 0.35) {
      if (!this.mudo) this._agendarPasso(this.passo, this.tProx);
      this.tProx += durPasso;
      this.passo = (this.passo + 1) % 128;      // 8 compassos x 16 passos
    }
  },

  _agendarPasso(s, t) {
    const durPasso = 60 / this.BPM / 4;
    const comp = Math.floor(s / 16) % 8, st = s % 16;
    const acorde = this.ACORDES[comp];
    const sorteia = (l) => l[Math.floor(Math.random() * l.length)];
    const humano = () => (Math.random() - 0.5) * 0.014;
    const tt = t + (st % 4 === 2 ? durPasso * 0.28 : 0);     // swing nas colcheias de contratempo

    if (st === 0) {
      this._pad(acorde.tons, t, durPasso * 16);
      this.padrao = sorteia(this.PADROES);
      this.motivo = (comp % 2 === 0 && Math.random() < 0.75) ? sorteia(this.MOTIVOS) : null;
    }

    // Alaúde: arpejo em colcheias, com algumas notas "esquecidas" para soar humano
    if (st % 2 === 0) {
      const k = st / 2;
      if (k === 0 || Math.random() < 0.88) {
        const vel = (k % 2 === 0 ? 0.55 : 0.4) * (0.85 + Math.random() * 0.3);
        this._corda(acorde.tons[this.padrao[k]], tt + humano(), vel, this.luteFiltro);
      }
    }

    // Flauta
    if (this.motivo) {
      for (const [grau, ini, len] of this.motivo) {
        if (ini === st) this._flauta(this.ESCALA[grau], tt + humano(), len * durPasso * 0.95, 0.5);
      }
    }

    // Baixo
    if (st === 0) this._baixo(acorde.baixo, tt, durPasso * 7, 0.7);
    else if (st === 8 && Math.random() < 0.65) this._baixo(acorde.baixo + (Math.random() < 0.5 ? 0 : 7), tt, durPasso * 5, 0.5);
    else if (st === 11 && Math.random() < 0.3) this._baixo(acorde.baixo + 12, tt, durPasso * 3, 0.32);

    // Bateria leve (só durante a partida): bumbo, tambor abafado e pratinho
    if (this.modo === "jogo") {
      if (st === 0 || st === 8) this._bumbo(tt, 1);
      else if (st === 10 && Math.random() < 0.35) this._bumbo(tt, 0.5);
      if (st === 4 || st === 12) this._tambor(tt, 0.6);
      if (st % 4 === 2) this._pratinho(tt, 0.5);
      else if ((st === 7 || st === 15) && Math.random() < 0.3) this._pratinho(tt, 0.22);
    }
  },

  _pad(tons, t, dur) {
    const c = this.ctx;
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.04, t + 0.7);
    g.gain.setValueAtTime(0.04, t + dur - 0.9);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
    f.connect(g); g.connect(this.barraMusica);
    const r = c.createGain(); r.gain.value = 0.5; g.connect(r); r.connect(this.envioReverb);
    for (const m of tons.slice(0, 3)) {
      for (const desafina of [-5, 5]) {
        const o = c.createOscillator(); o.type = "triangle";
        o.frequency.value = 440 * Math.pow(2, (m - 69) / 12); o.detune.value = desafina;
        this.balanco.connect(o.detune);
        o.connect(f); o.start(t); o.stop(t + dur + 0.7);
      }
    }
  },

  _baixo(midi, t, dur, vel) {
    const c = this.ctx, f = 440 * Math.pow(2, (midi - 69) / 12);
    const filtro = c.createBiquadFilter(); filtro.type = "lowpass"; filtro.frequency.value = 520;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel * 0.55, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    filtro.connect(g); g.connect(this.barraMusica);
    [["sine", f, 1], ["triangle", f * 2, 0.55], ["sine", f * 3, 0.12]].forEach(([tipo, fr, ganho]) => {
      const o = c.createOscillator(); o.type = tipo; o.frequency.value = fr;
      const gi = c.createGain(); gi.gain.value = ganho;
      this.balanco.connect(o.detune);
      o.connect(gi); gi.connect(filtro); o.start(t); o.stop(t + dur + 0.05);
    });
  },

  _flauta(midi, t, dur, vel) {
    const c = this.ctx, f = 440 * Math.pow(2, (midi - 69) / 12);
    const filtro = c.createBiquadFilter(); filtro.type = "lowpass"; filtro.frequency.value = 3000;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel * 0.2, t + 0.06);
    g.gain.setValueAtTime(vel * 0.2, t + Math.max(0.07, dur - 0.1));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
    filtro.connect(g); g.connect(this.barraMusica);
    const eco = c.createGain(); eco.gain.value = 0.5; g.connect(eco); eco.connect(this.atraso);
    const rv = c.createGain(); rv.gain.value = 0.4; g.connect(rv); rv.connect(this.envioReverb);

    // vibrato que vai aparecendo aos poucos
    const vib = c.createOscillator(); vib.frequency.value = 5.2;
    const vibG = c.createGain(); vibG.gain.setValueAtTime(0, t); vibG.gain.linearRampToValueAtTime(8, t + 0.3);
    vib.connect(vibG); vib.start(t); vib.stop(t + dur + 0.4);
    [["sine", f, 1], ["triangle", f * 2, 0.16]].forEach(([tipo, fr, ganho]) => {
      const o = c.createOscillator(); o.type = tipo; o.frequency.value = fr;
      const gi = c.createGain(); gi.gain.value = ganho;
      vibG.connect(o.detune); this.balanco.connect(o.detune);
      o.connect(gi); gi.connect(filtro); o.start(t); o.stop(t + dur + 0.4);
    });
    // sopro
    const sopro = c.createBufferSource(); sopro.buffer = this.bufRuido; sopro.loop = true;
    const fs = c.createBiquadFilter(); fs.type = "bandpass"; fs.frequency.value = 3500; fs.Q.value = 1.5;
    const gs = c.createGain(); gs.gain.value = 0.05;
    sopro.connect(fs); fs.connect(gs); gs.connect(filtro); sopro.start(t, Math.random()); sopro.stop(t + dur + 0.4);
  },

  _bumbo(t, v) {
    this._osc("sine", 130, 46, t, 0.22, 0.9 * v, this.barraBateria);
    this._ruido("lowpass", 400, 400, 0.7, t, 0.03, 0.2 * v, this.barraBateria);
  },
  _tambor(t, v) {
    this._ruido("bandpass", 1800, 1200, 0.8, t, 0.1, 0.3 * v, this.barraBateria);
    this._osc("triangle", 200, 150, t, 0.08, 0.28 * v, this.barraBateria);
  },
  _pratinho(t, v) {
    this._ruido("highpass", 7500, 7500, 0.7, t, 0.035, 0.16 * v, this.barraBateria);
  },
};
