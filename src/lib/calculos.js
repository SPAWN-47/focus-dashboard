// ─────────────────────────────────────────────
// Calculadora de ROI — lógica de cálculo
// Port de focus-calculadora-midia/lib/calculos.ts
// ─────────────────────────────────────────────

export function calcularPlano(p) {
  const percTopo = p.percTopo ?? 20;
  const percMeio = p.percMeio ?? 30;
  const percFundo = p.percFundo ?? 50;

  // ─── MULTI-CANAL ──────────────────────────────────────────────────────────
  // Se há canais definidos com soma de % > 0, calcula CPL ponderado e breakdown.
  // Caso contrário, usa o cplEstimado único como antes.
  const canais = Array.isArray(p.canais) ? p.canais : [];
  const somaPercCanais = canais.reduce((s, c) => s + (Number(c.percVerba) || 0), 0);
  const multiCanalAtivo = canais.length > 0 && somaPercCanais > 0;

  let cplEfetivo = p.cplEstimado;
  let canaisBreakdown = [];

  if (multiCanalAtivo) {
    let totalLeadsCanais = 0;
    canaisBreakdown = canais.map((c) => {
      const perc = Number(c.percVerba) || 0;
      const cplCanal = Number(c.cpl) || 0;
      const verbaCanal = (p.verbaMensal * perc) / 100;
      const leadsCanal = cplCanal > 0 ? verbaCanal / cplCanal : 0;
      totalLeadsCanais += leadsCanal;
      return {
        id: c.id,
        nome: c.nome,
        emoji: c.emoji,
        color: c.color,
        percVerba: perc,
        cpl: cplCanal,
        verbaCanal,
        leadsCanal,
      };
    });
    cplEfetivo = totalLeadsCanais > 0 ? p.verbaMensal / totalLeadsCanais : p.cplEstimado;
    // Adiciona % do volume total de leads em cada canal
    canaisBreakdown = canaisBreakdown.map((c) => ({
      ...c,
      percLeads: totalLeadsCanais > 0 ? (c.leadsCanal / totalLeadsCanais) * 100 : 0,
    }));
  }

  const verbaDia = p.verbaMensal / p.diasCampanha;
  const leadsPossiveis = cplEfetivo > 0 ? p.verbaMensal / cplEfetivo : 0;
  const leadsDia = leadsPossiveis / p.diasCampanha;
  const leadsSemana = leadsDia * 7;
  const vendasProjetadas = Math.floor(leadsPossiveis * p.taxaConversao);
  const faturamentoProjetado = vendasProjetadas * p.ticketMedio;
  const roasProjetado = p.verbaMensal > 0 ? faturamentoProjetado / p.verbaMensal : 0;

  // ─── ANÁLISE FINANCEIRA AVANÇADA ──────────────────────────────────────────
  const margemPct = (p.margemContribuicao ?? 0) / 100; // 0–1
  const comprasPorCliente = p.comprasPorCliente ?? 1;
  const retencaoMeses = p.retencaoMeses ?? 1;

  // CAC (Custo de Aquisição de Cliente) = verba / vendas
  const cac = vendasProjetadas > 0 ? p.verbaMensal / vendasProjetadas : 0;

  // Lucro bruto e margem absoluta
  const margemValor = faturamentoProjetado * margemPct;       // R$ de margem
  const lucroLiquido = margemValor - p.verbaMensal;           // após pagar tráfego
  const roiLiquido = p.verbaMensal > 0 ? lucroLiquido / p.verbaMensal : 0; // % de retorno real

  // LTV (Lifetime Value) = ticket × compras-por-cliente × margem
  // Se margem = 0 (não informada), usa ticket cheio
  const ltvBruto = p.ticketMedio * comprasPorCliente;
  const ltv = margemPct > 0 ? ltvBruto * margemPct : ltvBruto;

  // LTV:CAC ratio — saúde do unit economics
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;

  // Payback em meses: CAC / (margem mensal por cliente)
  // Margem mensal = (ticket × margem × compras_por_cliente) / retenção_meses
  const margemMensalPorCliente = retencaoMeses > 0
    ? (p.ticketMedio * (margemPct || 1) * comprasPorCliente) / retencaoMeses
    : 0;
  const paybackMeses = margemMensalPorCliente > 0 ? cac / margemMensalPorCliente : 0;

  const verbaTopo = p.verbaMensal * (percTopo / 100);
  const verbaMeio = p.verbaMensal * (percMeio / 100);
  const verbaFundo = p.verbaMensal * (percFundo / 100);

  const cenarioOtimista  = cplEfetivo > 0 ? p.verbaMensal / (cplEfetivo * 0.8) : 0;
  const cenarioRealista  = cplEfetivo > 0 ? p.verbaMensal / cplEfetivo : 0;
  const cenarioPessimista = cplEfetivo > 0 ? p.verbaMensal / (cplEfetivo * 1.3) : 0;

  const fases = [
    { fator: 0.7, fase: "aprendizado",  foco: "Testar criativos e públicos, validar pixel" },
    { fator: 1.0, fase: "otimizacao",   foco: "Escalar o que funciona, pausar o que não performa" },
    { fator: 1.1, fase: "escala",       foco: "Aumentar budget nos melhores conjuntos de anúncios" },
    { fator: 1.2, fase: "sprint_final", foco: "Maximizar volume e retargeting agressivo" },
  ];

  const cronograma = fases.map((f, i) => ({
    semana: i + 1,
    fase: f.fase,
    verba: verbaDia * 7 * f.fator,
    metaLeads: Math.round(leadsDia * 7 * f.fator),
    foco: f.foco,
  }));

  return {
    verbaDia,
    leadsPossiveis,
    leadsDia,
    leadsSemana,
    vendasProjetadas,
    faturamentoProjetado,
    roasProjetado,
    verbaTopo,
    verbaMeio,
    verbaFundo,
    cenarioOtimista,
    cenarioRealista,
    cenarioPessimista,
    cronograma,
    // Análise financeira avançada
    cac,
    margemValor,
    lucroLiquido,
    roiLiquido,
    ltv,
    ltvCacRatio,
    paybackMeses,
    // Multi-canal
    multiCanalAtivo,
    cplEfetivo,
    canaisBreakdown,
  };
}

// ─── CANAIS PADRÃO ───────────────────────────────────────────────────────────
export const CANAIS_TEMPLATE = {
  meta:     { id: "meta",     nome: "Meta Ads",        emoji: "📘", color: "#1877F2" },
  google:   { id: "google",   nome: "Google Ads",      emoji: "🔵", color: "#4285F4" },
  organico: { id: "organico", nome: "Orgânico / SEO",  emoji: "🌱", color: "#10B981" },
  tiktok:   { id: "tiktok",   nome: "TikTok Ads",      emoji: "🎵", color: "#000000" },
  outro:    { id: "outro",    nome: "Outro",           emoji: "⚪", color: "#6B7280" },
};

export const GATILHOS = [
  {
    id: "cpl_alto",
    titulo: "CPL acima do limite nos primeiros 7 dias",
    condicao: "CPL real > CPL estimado × 1,2 nos primeiros 7 dias de campanha",
    acao: "Realocar 20% da verba para novos criativos e testar novos ângulos de copy",
    severidade: "aviso",
  },
  {
    id: "ctr_baixo",
    titulo: "CTR abaixo de 1% após 3 dias",
    condicao: "CTR médio < 1% com pelo menos 1.000 impressões acumuladas",
    acao: "Renovar criativos — testar novos hooks, formatos e proporções de imagem",
    severidade: "aviso",
  },
  {
    id: "gasto_excessivo",
    titulo: "Gasto diário acima de 120% do planejado",
    condicao: "Gasto real do dia > verba/dia × 1,2 em 2 dias consecutivos",
    acao: "Revisar teto de gasto diário e pausar conjuntos com menor ROAS",
    severidade: "alerta",
  },
  {
    id: "meta_antecipada",
    titulo: "Meta de leads atingida antes do previsto",
    condicao: "Leads acumulados ≥ meta total com mais de 5 dias restantes",
    acao: "Aumentar meta em 20% ou redirecionar verba para qualificação de leads",
    severidade: "info",
  },
];

export const PARAMETROS_PADRAO = {
  verbaMensal: 5000,
  metaLeads: 100,
  cplEstimado: 50,
  taxaConversao: 0.1,
  ticketMedio: 1200,
  diasCampanha: 30,
  percTopo: 20,
  percMeio: 30,
  percFundo: 50,
  // Análise financeira (opcional — 0/1 = não considera margem nem LTV)
  margemContribuicao: 0,    // % de margem sobre faturamento (0–100)
  comprasPorCliente: 1,     // quantas compras um cliente faz no período
  retencaoMeses: 1,         // por quantos meses o cliente fica ativo
  // Multi-canal (opcional — array vazio = mono-canal usando cplEstimado único)
  canais: [],               // [{ id, nome, emoji, color, percVerba, cpl }]
  // Benchmark (opcional — chave de SEGMENTOS em benchmarks.js)
  segmento: "",
};

export const FASE_LABEL = {
  aprendizado: "Aprendizado",
  otimizacao: "Otimização",
  escala: "Escala",
  sprint_final: "Sprint final",
};

export const FASE_COLOR = {
  aprendizado: "#8B5CF6",
  otimizacao: "#3B82F6",
  escala: "#06B6D4",
  sprint_final: "#C9F80D",
};
