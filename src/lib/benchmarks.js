// ─────────────────────────────────────────────
// BENCHMARKS por nicho — mercado brasileiro
// CPLs típicos em campanhas Meta + Google Ads para negócios locais
// Valores aproximados baseados em médias observadas (2024-2026)
// ─────────────────────────────────────────────

export const SEGMENTOS = {
  clinica: {
    nome: "Clínica médica / Saúde",
    emoji: "🏥",
    cplExcepcional: 15,
    cplBom: 30,
    cplOk: 70,
    cplRuim: 140,
    conversaoBom: 0.12,
    ticketTipico: 800,
    nota: "Audiência local. Procedimentos eletivos têm CPL mais alto.",
  },
  odonto: {
    nome: "Odontologia",
    emoji: "🦷",
    cplExcepcional: 20,
    cplBom: 35,
    cplOk: 80,
    cplRuim: 150,
    conversaoBom: 0.15,
    ticketTipico: 1500,
    nota: "Implantes e aparelhos têm CPL maior. Limpeza é entrada barata.",
  },
  automotivo: {
    nome: "Automotivo / Concessionária",
    emoji: "🚗",
    cplExcepcional: 25,
    cplBom: 50,
    cplOk: 120,
    cplRuim: 250,
    conversaoBom: 0.08,
    ticketTipico: 5000,
    nota: "Venda direta de veículo tem CPL alto; serviços e revisão são mais baratos.",
  },
  ecommerce: {
    nome: "E-commerce",
    emoji: "🛒",
    cplExcepcional: 8,
    cplBom: 20,
    cplOk: 45,
    cplRuim: 90,
    conversaoBom: 0.03,
    ticketTipico: 250,
    nota: "Mede CPA (compras), não lead. Foque em ROAS direto.",
  },
  educacao: {
    nome: "Educação / Cursos",
    emoji: "📚",
    cplExcepcional: 12,
    cplBom: 25,
    cplOk: 60,
    cplRuim: 120,
    conversaoBom: 0.10,
    ticketTipico: 1200,
    nota: "Lançamentos têm CPL menor; perpétuo é mais alto.",
  },
  imobiliario: {
    nome: "Imobiliário",
    emoji: "🏠",
    cplExcepcional: 30,
    cplBom: 60,
    cplOk: 140,
    cplRuim: 280,
    conversaoBom: 0.05,
    ticketTipico: 8000,
    nota: "Lead qualificado (interesse em comprar) custa caro mas vale muito.",
  },
  beleza: {
    nome: "Beleza / Estética",
    emoji: "💄",
    cplExcepcional: 8,
    cplBom: 18,
    cplOk: 40,
    cplRuim: 80,
    conversaoBom: 0.18,
    ticketTipico: 350,
    nota: "Procedimentos estéticos (botox, harmonização) têm CPL maior.",
  },
  b2b: {
    nome: "Serviços B2B",
    emoji: "💼",
    cplExcepcional: 50,
    cplBom: 100,
    cplOk: 220,
    cplRuim: 450,
    conversaoBom: 0.05,
    ticketTipico: 3000,
    nota: "Decisão coletiva e longa. LTV alto compensa CPL elevado.",
  },
  restaurante: {
    nome: "Restaurante / Food / Delivery",
    emoji: "🍔",
    cplExcepcional: 4,
    cplBom: 10,
    cplOk: 25,
    cplRuim: 50,
    conversaoBom: 0.25,
    ticketTipico: 80,
    nota: "Conversão alta, ticket baixo. Foco em frequência.",
  },
  fitness: {
    nome: "Academia / Fitness",
    emoji: "💪",
    cplExcepcional: 7,
    cplBom: 15,
    cplOk: 35,
    cplRuim: 70,
    conversaoBom: 0.20,
    ticketTipico: 180,
    nota: "Anuidade vale mais que mensalidade — pense em LTV.",
  },
  advocacia: {
    nome: "Advocacia",
    emoji: "⚖️",
    cplExcepcional: 20,
    cplBom: 45,
    cplOk: 100,
    cplRuim: 200,
    conversaoBom: 0.08,
    ticketTipico: 2500,
    nota: "Direito de família, trabalhista e previdenciário têm dinâmicas diferentes.",
  },
  construcao: {
    nome: "Construção / Reforma",
    emoji: "🔨",
    cplExcepcional: 25,
    cplBom: 55,
    cplOk: 120,
    cplRuim: 240,
    conversaoBom: 0.10,
    ticketTipico: 4000,
    nota: "Orçamento qualificado custa mais. Pre-qualificação é chave.",
  },
  servicos_locais: {
    nome: "Serviços locais (geral)",
    emoji: "🛠️",
    cplExcepcional: 10,
    cplBom: 25,
    cplOk: 55,
    cplRuim: 110,
    conversaoBom: 0.12,
    ticketTipico: 500,
    nota: "Categoria genérica. Refine para mais precisão.",
  },
  pet: {
    nome: "Pet shop / Veterinária",
    emoji: "🐾",
    cplExcepcional: 8,
    cplBom: 20,
    cplOk: 45,
    cplRuim: 90,
    conversaoBom: 0.15,
    ticketTipico: 200,
    nota: "Recorrência alta — clientes voltam todo mês.",
  },
  saas: {
    nome: "SaaS / Tecnologia",
    emoji: "💻",
    cplExcepcional: 40,
    cplBom: 90,
    cplOk: 200,
    cplRuim: 400,
    conversaoBom: 0.04,
    ticketTipico: 2400,
    nota: "Trial é métrica chave. LTV anual compensa CPL alto.",
  },
};

/**
 * Classifica um CPL contra os benchmarks do segmento.
 * Retorna { tier, label, color, percentilLocal }
 * - tier: 0=excepcional, 1=bom, 2=ok, 3=ruim, 4=acimaDoRuim
 */
export function classifyCpl(cpl, segmento) {
  if (!cpl || !segmento) return null;
  const s = SEGMENTOS[segmento];
  if (!s) return null;

  if (cpl <= s.cplExcepcional) {
    return { tier: 0, label: "Excepcional", color: "#10B981", desc: "Top 10% do mercado", segmento: s };
  }
  if (cpl <= s.cplBom) {
    return { tier: 1, label: "Bom", color: "#C9F80D", desc: "Acima da média", segmento: s };
  }
  if (cpl <= s.cplOk) {
    return { tier: 2, label: "Médio", color: "#F59E0B", desc: "Na média do mercado", segmento: s };
  }
  if (cpl <= s.cplRuim) {
    return { tier: 3, label: "Caro", color: "#EF4444", desc: "Acima da média — otimização urgente", segmento: s };
  }
  return { tier: 4, label: "Crítico", color: "#991B1B", desc: "Muito acima do mercado — revisar estratégia", segmento: s };
}
