/* =====================================================
   dados.js — FICHAS DE PERSONAGENS, MONSTROS E CHEFES
   Aqui ficam só NÚMEROS e TEXTOS (vida, dano, velocidade...).
   Quer deixar o goblin mais forte? É aqui que você mexe.
   ===================================================== */

/* ---------- PERSONAGENS JOGÁVEIS ---------- */
const PERSONAGENS = {
  guerreiro: {
    id: "guerreiro",
    nome: "Guerreiro",
    descricao: "Cavaleiro de armadura que golpeia com a espada tudo que chega perto. Resistente e rápido no ataque.",
    tipoAtaque: "Corte de espada (curto alcance)",
    vidaMax: 120,
    velocidade: 190,        // pixels por segundo
    dano: 14,
    alcance: 95,            // distância máxima do golpe (pixels)
    intervaloAtaque: 0.55,  // segundos entre um ataque e outro (menor = mais rápido)
    alvosPorGolpe: 1,       // quantos monstros cada golpe acerta
  },
  arqueiro: {
    id: "arqueiro",
    nome: "Arqueiro",
    descricao: "Caçador encapuzado que dispara flechas de longe. Ataca mais devagar, mas de muito mais longe.",
    tipoAtaque: "Flechas (longo alcance)",
    vidaMax: 90,
    velocidade: 205,
    dano: 18,
    alcance: 340,
    intervaloAtaque: 0.9,
    flechasPorDisparo: 1,   // quantas flechas saem por disparo
  },
};

/* ---------- MONSTROS ----------
   waveMinima: a partir de qual wave esse monstro começa a aparecer.
   comportamento: "perseguir" (vai direto), "lobo" (rápido, dá investidas),
   "aranha" (anda em rajadas e para), "atirador" (mantém distância e atira). */
const MONSTROS = {
  goblin: {
    id: "goblin", nome: "Goblin",
    descricao: "Fraco, lento e aparece em grupo nas primeiras waves.",
    vida: 44, dano: 12, velocidade: 70, xp: 3, raio: 20,
    waveMinima: 1, comportamento: "perseguir", chancePocao: 0.06,
  },
  zumbi: {
    id: "zumbi", nome: "Zumbi",
    descricao: "Mais rápido que o goblin e aguenta mais pancada.",
    vida: 90, dano: 18, velocidade: 100, xp: 5, raio: 22,
    waveMinima: 3, comportamento: "perseguir", chancePocao: 0.08,
  },
  lobo: {
    id: "lobo", nome: "Lobo",
    descricao: "Muito rápido e dá investidas quando chega perto. Pouca vida.",
    vida: 70, dano: 33, velocidade: 170, xp: 6, raio: 22,
    waveMinima: 5, comportamento: "lobo", chancePocao: 0.08,
  },
  aranha: {
    id: "aranha", nome: "Aranha",
    descricao: "Anda em rajadas rápidas, depois para. Sua mordida é forte.",
    vida: 120, dano: 30, velocidade: 200, xp: 8, raio: 24,
    waveMinima: 7, comportamento: "aranha", chancePocao: 0.1,
  },
  esqueleto_arqueiro: {
    id: "esqueleto_arqueiro", nome: "Esqueleto Arqueiro",
    descricao: "Mantém distância e atira flechas de osso no herói.",
    vida: 80, dano: 25, velocidade: 85, xp: 8, raio: 20,
    waveMinima: 8, comportamento: "atirador", distanciaTiro: 260, intervaloTiro: 2.2, chancePocao: 0.1,
  },
  esqueleto: {
    id: "esqueleto", nome: "Esqueleto Guerreiro",
    descricao: "Carrega escudo e espada: muita vida e dano alto.",
    vida: 220, dano: 32, velocidade: 100, xp: 12, raio: 22,
    waveMinima: 10, comportamento: "perseguir", chancePocao: 0.12,
  },
};

/* ---------- CHEFES (um a cada 5 waves) ----------
   Usam o sprite de um monstro em tamanho maior, com contorno vermelho.
   A lista se repete e fica mais forte a cada ciclo (ver enemies.js). */
const CHEFES = [
  { nome: "Rei Goblin",      base: "goblin",            vida: 840,  dano: 32, velocidade: 100,  escala: 2.4, xp: 60, habilidade: "investida" },
  { nome: "Lobo Alfa",       base: "lobo",              vida: 1300,  dano: 44, velocidade: 150, escala: 2.3, xp: 90, habilidade: "investida" },
  { nome: "Aranha Rainha",   base: "aranha",            vida: 1800,  dano: 52, velocidade: 130, escala: 2.6, xp: 120, habilidade: "investida" },
  { nome: "Lorde Esqueleto", base: "esqueleto_arqueiro",vida: 1400, dano: 48, velocidade: 100,  escala: 2.5, xp: 160, habilidade: "rajada" },
];

/* ---------- ITENS ---------- */
const ITENS = {
  cristal_xp: { nome: "Cristal de XP",  descricao: "Cai de todo monstro derrotado. Concede experiência ao ser coletado." },
  pocao_cura: { nome: "Poção de Cura",  descricao: "Tem uma chance de cair dos monstros. Recupera 35% da vida máxima." },
};

/* ---------- CONFIGURAÇÕES GERAIS DA PARTIDA ---------- */
const CONFIG = {
  larguraArena: 1600,           // tamanho do mundo (a arena) em pixels
  alturaArena: 1600,
  margemParede: 78,             // espessura da muralha de pedra (o jogador não entra nela)
  larguraTela: 1100,            // tamanho do canvas (a "janela" que mostra parte da arena)
  alturaTela: 680,
  raioColeta: 60,               // distância para pegar um item
  xpBase: 10,                   // XP para passar do nível 1 para o 2
  xpPorNivel: 7,                // quanto a mais é exigido a cada nível
  monstrosBase: 6,              // monstros na wave 1
  monstrosPorWave: 3,           // quantos a mais por wave
  pausaEntreWaves: 3,           // segundos de descanso entre waves
};
