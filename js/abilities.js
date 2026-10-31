/* =====================================================
   abilities.js — HABILIDADES E MELHORIAS
   Cada habilidade é um objeto com:
     id       -> nome interno
     nome     -> texto mostrado na carta
     descricao-> o que ela faz (texto)
     carta    -> imagem PNG da carta (pasta assets/cards)
     classes  -> quais personagens podem receber ["guerreiro", "arqueiro"]
     maximo   -> quantas vezes pode ser escolhida (undefined = sem limite)
     aplicar  -> FUNÇÃO que de fato altera os atributos do jogador
   ===================================================== */

const HABILIDADES = [
  /* ---------- PARA TODOS ---------- */
  {
    id: "dano", nome: "Dano +25%", carta: "dano_duplo",
    descricao: "Seus ataques causam 25% a mais de dano.",
    classes: ["guerreiro", "arqueiro"],
    aplicar: (p) => { p.dano = Math.round(p.dano * 1.25); },
  },
  {
    id: "velocidade", nome: "Velocidade", carta: "velocidade",
    descricao: "Você anda 15% mais rápido.",
    classes: ["guerreiro", "arqueiro"], maximo: 5,
    aplicar: (p) => { p.velocidade *= 1.15; },
  },
  {
    id: "mais_vida", nome: "Mais Vida", carta: "mais_vida",
    descricao: "+25 de vida máxima e recupera 25 de vida.",
    classes: ["guerreiro", "arqueiro"],
    aplicar: (p) => { p.vidaMax += 25; p.vida = Math.min(p.vidaMax, p.vida + 25); },
  },
  {
    id: "pocao", nome: "Poção de Cura", carta: "pocao_de_cura",
    descricao: "Recupera 50% da sua vida máxima agora.",
    classes: ["guerreiro", "arqueiro"],
    aplicar: (p) => { p.vida = Math.min(p.vidaMax, p.vida + p.vidaMax * 0.5); },
  },
  {
    id: "escudo", nome: "Escudo", carta: "escudo",
    descricao: "Recebe 15% a menos de dano (permanente).",
    classes: ["guerreiro", "arqueiro"], maximo: 4,
    aplicar: (p) => { p.reducaoDano = 1 - (1 - p.reducaoDano) * 0.85; },
  },
  {
    id: "ima", nome: "Imã de Itens", carta: "ima_de_itens",
    descricao: "Cristais e poções são atraídos de mais longe.",
    classes: ["guerreiro", "arqueiro"], maximo: 3,
    aplicar: (p) => { p.raioColeta += 60; },
  },

  /* ---------- SÓ GUERREIRO ---------- */
  {
    id: "espada_rapida", nome: "Ataque Mais Rápido", carta: "ataque_mais_rapido",
    descricao: "Sua espada ataca 20% mais rápido.",
    classes: ["guerreiro"], maximo: 6,
    aplicar: (p) => { p.intervaloAtaque *= 0.8; },
  },
  {
    id: "segunda_espada", nome: "Segunda Espada", carta: "segunda_espada",
    descricao: "Cada golpe acerta +1 monstro próximo.",
    classes: ["guerreiro"], maximo: 4,
    aplicar: (p) => { p.alvosPorGolpe += 1; },
  },
  {
    id: "espada_vento", nome: "Espada de Vento", carta: "espada_de_vento",
    descricao: "Alcance do corte aumenta em 30%.",
    classes: ["guerreiro"], maximo: 4,
    aplicar: (p) => { p.alcance *= 1.3; },
  },
  {
    id: "onda_choque", nome: "Onda de Choque", carta: "explosao",
    descricao: "Seus golpes empurram os monstros para trás.",
    classes: ["guerreiro"], maximo: 1,
    aplicar: (p) => { p.empurrao = true; },
  },

  /* ---------- SÓ ARQUEIRO ---------- */
  {
    id: "rajada", nome: "Rajada", carta: "rajada",
    descricao: "Dispara flechas 20% mais rápido.",
    classes: ["arqueiro"], maximo: 6,
    aplicar: (p) => { p.intervaloAtaque *= 0.8; },
  },
  {
    id: "duas_flechas", nome: "Duas Flechas", carta: "duas_flechas",
    descricao: "+1 flecha por disparo (cada uma mira um monstro).",
    classes: ["arqueiro"], maximo: 4,
    aplicar: (p) => { p.flechasPorDisparo += 1; },
  },
  {
    id: "arco", nome: "Arco Longo", carta: "arco",
    descricao: "Alcance das flechas aumenta em 25%.",
    classes: ["arqueiro"], maximo: 3,
    aplicar: (p) => { p.alcance *= 1.25; },
  },
  {
    id: "fogo", nome: "Flecha de Fogo", carta: "flecha_de_fogo",
    descricao: "Flechas incendeiam: 3 de dano por segundo durante 3s.",
    classes: ["arqueiro"], maximo: 1,
    aplicar: (p) => { p.flechaFogo = true; },
  },
  {
    id: "gelo", nome: "Flecha de Gelo", carta: "flecha_de_gelo",
    descricao: "Flechas deixam o monstro 50% mais lento por 2s.",
    classes: ["arqueiro"], maximo: 1,
    aplicar: (p) => { p.flechaGelo = true; },
  },
  {
    id: "chuva", nome: "Chuva de Flechas", carta: "chuva_de_flechas",
    descricao: "A cada 6s, 8 flechas são disparadas em todas as direções.",
    classes: ["arqueiro"], maximo: 1,
    aplicar: (p) => { p.chuvaFlechas = true; },
  },
];

/**
 * Sorteia 3 habilidades válidas para o personagem.
 * - só as da classe dele
 * - só as que ainda não bateram no "maximo"
 */
function sortearHabilidades(jogador, quantidade = 3) {
  const validas = HABILIDADES.filter((h) => {
    if (!h.classes.includes(jogador.classe)) return false;
    const vezes = jogador.habilidadesPegas[h.id] || 0;
    if (h.maximo !== undefined && vezes >= h.maximo) return false;
    return true;
  });

  // Embaralha (algoritmo simples: ordena por número aleatório) e pega as primeiras
  return validas.sort(() => Math.random() - 0.5).slice(0, quantidade);
}
