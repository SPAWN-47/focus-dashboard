import { Document, Page, Text, View, StyleSheet, Svg, Path, Circle, Rect } from "@react-pdf/renderer";
import { FASE_LABEL } from "../lib/calculos";
import { SEGMENTOS } from "../lib/benchmarks";

// ─────────────────────────────────────────────
// IDENTIDADE VISUAL FOCUS
// ─────────────────────────────────────────────
const FOCUS_GREEN = "#C9F80D";
const DARK = "#09090b";
const ZINC_800 = "#27272a";
const ZINC_600 = "#52525b";
const ZINC_400 = "#a1a1aa";
const ZINC_300 = "#d4d4d8";
const ZINC_100 = "#f4f4f5";
const WHITE = "#ffffff";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fBRL = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fBRLfull = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const fNum = (v) => Math.round(Number(v) || 0).toLocaleString("pt-BR");
const fPct = (v) => ((Number(v) || 0) * 100).toFixed(1) + "%";

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    backgroundColor: WHITE,
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: DARK,
  },
  // ── Cover page ──
  cover: {
    backgroundColor: DARK,
    color: WHITE,
    padding: 0,
    height: "100%",
  },
  coverInner: {
    padding: 50,
    flexGrow: 1,
    justifyContent: "space-between",
  },
  coverTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coverBrand: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 700,
  },
  coverBrandAccent: { color: FOCUS_GREEN },
  coverCenter: { marginVertical: 80 },
  coverTitle: {
    color: WHITE,
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: 12,
  },
  coverSub: {
    color: ZINC_400,
    fontSize: 14,
    marginBottom: 30,
  },
  coverClientBadge: {
    backgroundColor: "#1c1c1f",
    borderColor: FOCUS_GREEN,
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignSelf: "flex-start",
    alignItems: "center",
  },
  coverClientName: { color: FOCUS_GREEN, fontSize: 14, fontWeight: 700 },
  coverDate: { color: ZINC_400, fontSize: 9, marginTop: 6 },
  coverFooter: {
    color: ZINC_600,
    fontSize: 8,
    marginTop: 40,
  },

  // ── Internal pages ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 11, fontWeight: 700 },
  headerTitleAccent: { color: "#7a9000" },
  headerRight: { fontSize: 9, color: ZINC_600 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 12,
    color: DARK,
  },
  sectionSub: {
    fontSize: 9,
    color: ZINC_600,
    marginBottom: 16,
  },

  // ── KPI cards ──
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flexBasis: "31%",
    flexGrow: 1,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 6,
    padding: 10,
  },
  kpiLabel: {
    fontSize: 8,
    color: ZINC_600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValue: { fontSize: 16, fontWeight: 700, color: DARK },
  kpiSub: { fontSize: 8, color: ZINC_600, marginTop: 2 },

  // ── Params table ──
  paramsTable: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 6,
    padding: 12,
  },
  paramRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4e4e7",
  },
  paramLabel: { color: ZINC_600, fontSize: 10 },
  paramValue: { fontWeight: 700, fontSize: 10 },

  // ── Scenarios ──
  scenarioGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  scenarioCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
  },
  scenarioLabel: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  scenarioBig: { fontSize: 22, fontWeight: 700, marginBottom: 2 },
  scenarioSmall: { fontSize: 8, color: ZINC_600 },
  scenarioStat: { fontSize: 9, marginTop: 4 },

  // ── Schedule ──
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    backgroundColor: "#fafafa",
    borderRadius: 4,
    marginBottom: 4,
  },
  weekLabel: { width: 60, fontWeight: 700, fontSize: 9 },
  weekFase: { width: 70, fontSize: 8, color: ZINC_600 },
  weekFoco: { flex: 1, fontSize: 8, color: "#3f3f46" },
  weekBudget: { width: 70, fontSize: 9, fontWeight: 700, textAlign: "right" },
  weekLeads: { width: 50, fontSize: 9, textAlign: "right", color: ZINC_600 },

  // ── Triggers ──
  triggerCard: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  triggerTitle: { fontSize: 10, fontWeight: 700, marginBottom: 4 },
  triggerDesc: { fontSize: 8, color: "#3f3f46", lineHeight: 1.4 },

  // ── Footer ──
  pageFooter: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: ZINC_600,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#e4e4e7",
  },

  // Funnel
  funnelBar: {
    height: 24,
    borderRadius: 4,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
});

// ─────────────────────────────────────────────
// SVG LOGO (chat bubble + accent)
// ─────────────────────────────────────────────
const FocusLogo = ({ size = 18, color = FOCUS_GREEN }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 3v-3.5A2.5 2.5 0 0 1 5 12.5z"
      stroke={color}
      strokeWidth={2}
      fill="none"
    />
    <Path d="M9 8.75h6" stroke={color} strokeWidth={2} />
    <Path d="M9 11.75h4.5" stroke={color} strokeWidth={2} />
    <Circle cx="17.5" cy="17.5" r="2.5" fill={color} />
  </Svg>
);

// ─────────────────────────────────────────────
// HEADER / FOOTER components
// ─────────────────────────────────────────────
const Header = ({ section, clienteNome }) => (
  <View style={styles.header} fixed>
    <View style={styles.headerLeft}>
      <FocusLogo size={14} color="#7a9000" />
      <Text style={styles.headerTitle}>
        Focus<Text style={styles.headerTitleAccent}>Dashboard</Text>
      </Text>
      <Text style={{ color: ZINC_600, fontSize: 10 }}>·</Text>
      <Text style={{ fontSize: 10, color: ZINC_400 }}>{section}</Text>
    </View>
    <Text style={styles.headerRight}>{clienteNome || "Plano de mídia"}</Text>
  </View>
);

const Footer = ({ nomePlano }) => (
  <View style={styles.pageFooter} fixed>
    <Text>{nomePlano || "Plano de Mídia"} · Gerado por Focus Dashboard</Text>
    <Text
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
    />
  </View>
);

// ─────────────────────────────────────────────
// MAIN DOCUMENT
// ─────────────────────────────────────────────
export default function RoiPdfTemplate({ plano }) {
  const {
    nome,
    clienteNome,
    clienteEmoji,
    parametros: p,
    resultado: r,
    criadoEm,
  } = plano;

  const dataGeracao = new Date(criadoEm || Date.now()).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const segmento = p.segmento && SEGMENTOS[p.segmento] ? SEGMENTOS[p.segmento] : null;
  const usaMargem = (p.margemContribuicao || 0) > 0;

  return (
    <Document title={nome || "Plano de Mídia"} author="Focus Mídia">
      {/* ─── COVER ─── */}
      <Page size="A4" style={styles.cover}>
        <View style={styles.coverInner}>
          <View style={styles.coverTop}>
            <FocusLogo size={20} color={FOCUS_GREEN} />
            <Text style={styles.coverBrand}>
              Focus<Text style={styles.coverBrandAccent}>Dashboard</Text>
            </Text>
          </View>

          <View style={styles.coverCenter}>
            <Text style={{ color: FOCUS_GREEN, fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
              PLANO DE MÍDIA PAGA
            </Text>
            <Text style={styles.coverTitle}>{nome || "Plano sem nome"}</Text>
            <Text style={styles.coverSub}>
              Projeção estratégica · {fBRL(p.verbaMensal)} de verba · {p.diasCampanha} dias
            </Text>

            {clienteNome && (
              <View style={styles.coverClientBadge}>
                {clienteEmoji && <Text style={{ fontSize: 18 }}>{clienteEmoji}</Text>}
                <View>
                  <Text style={{ color: ZINC_400, fontSize: 8, textTransform: "uppercase", letterSpacing: 1 }}>Cliente</Text>
                  <Text style={styles.coverClientName}>{clienteNome}</Text>
                  {segmento && (
                    <Text style={{ color: ZINC_400, fontSize: 9, marginTop: 2 }}>
                      {segmento.emoji} {segmento.nome}
                    </Text>
                  )}
                </View>
              </View>
            )}
            <Text style={styles.coverDate}>Gerado em {dataGeracao}</Text>
          </View>

          <Text style={styles.coverFooter}>
            Focus Mídia · Marketing e Performance · Documento confidencial
          </Text>
        </View>
      </Page>

      {/* ─── PARÂMETROS + KPIs ─── */}
      <Page size="A4" style={styles.page}>
        <Header section="Parâmetros & KPIs" clienteNome={clienteNome} />
        <Text style={styles.sectionTitle}>Parâmetros da campanha</Text>
        <Text style={styles.sectionSub}>Inputs estratégicos da projeção</Text>

        <View style={styles.paramsTable}>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Verba mensal</Text>
            <Text style={styles.paramValue}>{fBRLfull(p.verbaMensal)}</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Meta de leads</Text>
            <Text style={styles.paramValue}>{fNum(p.metaLeads)} leads</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>CPL estimado</Text>
            <Text style={styles.paramValue}>{fBRLfull(p.cplEstimado)}</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Taxa de conversão</Text>
            <Text style={styles.paramValue}>{fPct(p.taxaConversao)}</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Ticket médio</Text>
            <Text style={styles.paramValue}>{fBRLfull(p.ticketMedio)}</Text>
          </View>
          <View style={[styles.paramRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.paramLabel}>Dias de campanha</Text>
            <Text style={styles.paramValue}>{p.diasCampanha} dias</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>KPIs projetados</Text>
        <Text style={styles.sectionSub}>Resultados esperados ao final da campanha</Text>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Verba/dia</Text>
            <Text style={styles.kpiValue}>{fBRL(r.verbaDia)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Leads/dia</Text>
            <Text style={styles.kpiValue}>{(r.leadsDia || 0).toFixed(1)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Leads/semana</Text>
            <Text style={styles.kpiValue}>{fNum(r.leadsSemana)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Vendas projetadas</Text>
            <Text style={styles.kpiValue}>{fNum(r.vendasProjetadas)}</Text>
            <Text style={styles.kpiSub}>{fPct(p.taxaConversao)} de conversão</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Faturamento projetado</Text>
            <Text style={[styles.kpiValue, { color: "#0a7f3a" }]}>{fBRL(r.faturamentoProjetado)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ROAS projetado</Text>
            <Text style={[styles.kpiValue, { color: r.roasProjetado >= 1 ? "#0a7f3a" : "#b91c1c" }]}>
              {(r.roasProjetado || 0).toFixed(2)}x
            </Text>
            <Text style={styles.kpiSub}>{r.roasProjetado >= 1 ? "Acima do break-even" : "Abaixo do break-even"}</Text>
          </View>
        </View>

        <Footer nomePlano={nome} />
      </Page>

      {/* ─── ANÁLISE FINANCEIRA + CENÁRIOS ─── */}
      <Page size="A4" style={styles.page}>
        <Header section="Análise financeira" clienteNome={clienteNome} />
        <Text style={styles.sectionTitle}>Unit economics</Text>
        <Text style={styles.sectionSub}>
          {usaMargem
            ? `Análise considerando ${p.margemContribuicao}% de margem de contribuição`
            : "Análise baseada em faturamento bruto · sem margem definida"}
        </Text>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>CAC</Text>
            <Text style={styles.kpiValue}>{r.cac > 0 ? fBRL(r.cac) : "—"}</Text>
            <Text style={styles.kpiSub}>Custo de aquisição por cliente</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>LTV</Text>
            <Text style={styles.kpiValue}>{r.ltv > 0 ? fBRL(r.ltv) : "—"}</Text>
            <Text style={styles.kpiSub}>
              {(p.comprasPorCliente || 1)}× compras{usaMargem && ` · ${p.margemContribuicao}% margem`}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>LTV : CAC</Text>
            <Text style={styles.kpiValue}>{r.ltvCacRatio > 0 ? r.ltvCacRatio.toFixed(2) + " : 1" : "—"}</Text>
            <Text style={styles.kpiSub}>
              {r.ltvCacRatio >= 3 ? "Saudável" : r.ltvCacRatio >= 1 ? "Atenção" : "Crítico"}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Payback</Text>
            <Text style={styles.kpiValue}>
              {r.paybackMeses > 0 ? `${r.paybackMeses.toFixed(1)} meses` : "—"}
            </Text>
          </View>
        </View>

        {usaMargem && (
          <View style={[styles.kpiGrid, { marginBottom: 24 }]}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Margem bruta</Text>
              <Text style={[styles.kpiValue, { color: "#0a7f3a" }]}>{fBRL(r.margemValor)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Lucro líquido</Text>
              <Text style={[styles.kpiValue, { color: r.lucroLiquido >= 0 ? "#0a7f3a" : "#b91c1c" }]}>
                {fBRL(r.lucroLiquido)}
              </Text>
              <Text style={styles.kpiSub}>Margem − verba</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ROI real</Text>
              <Text style={[styles.kpiValue, { color: r.roiLiquido >= 0 ? "#0a7f3a" : "#b91c1c" }]}>
                {((r.roiLiquido || 0) * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>3 cenários</Text>
        <Text style={styles.sectionSub}>Sensibilidade conforme variação no CPL</Text>

        <View style={styles.scenarioGrid}>
          <View style={[styles.scenarioCard, { borderColor: "#fcd34d", backgroundColor: "#fffbeb" }]}>
            <Text style={[styles.scenarioLabel, { color: "#92400e" }]}>Pessimista</Text>
            <Text style={[styles.scenarioBig, { color: "#92400e" }]}>{fNum(r.cenarioPessimista)}</Text>
            <Text style={styles.scenarioSmall}>leads · CPL +30%</Text>
            <Text style={styles.scenarioStat}>
              Vendas: {Math.floor(r.cenarioPessimista * p.taxaConversao)}
            </Text>
            <Text style={styles.scenarioStat}>
              Fat.: {fBRL(Math.floor(r.cenarioPessimista * p.taxaConversao) * p.ticketMedio)}
            </Text>
          </View>

          <View style={[styles.scenarioCard, { borderColor: FOCUS_GREEN, backgroundColor: "#fafff0" }]}>
            <Text style={[styles.scenarioLabel, { color: "#5c6f00" }]}>Realista</Text>
            <Text style={[styles.scenarioBig, { color: "#5c6f00" }]}>{fNum(r.cenarioRealista)}</Text>
            <Text style={styles.scenarioSmall}>leads · CPL base</Text>
            <Text style={styles.scenarioStat}>Vendas: {r.vendasProjetadas}</Text>
            <Text style={styles.scenarioStat}>Fat.: {fBRL(r.faturamentoProjetado)}</Text>
          </View>

          <View style={[styles.scenarioCard, { borderColor: "#86efac", backgroundColor: "#f0fdf4" }]}>
            <Text style={[styles.scenarioLabel, { color: "#166534" }]}>Otimista</Text>
            <Text style={[styles.scenarioBig, { color: "#166534" }]}>{fNum(r.cenarioOtimista)}</Text>
            <Text style={styles.scenarioSmall}>leads · CPL -20%</Text>
            <Text style={styles.scenarioStat}>
              Vendas: {Math.floor(r.cenarioOtimista * p.taxaConversao)}
            </Text>
            <Text style={styles.scenarioStat}>
              Fat.: {fBRL(Math.floor(r.cenarioOtimista * p.taxaConversao) * p.ticketMedio)}
            </Text>
          </View>
        </View>

        <Footer nomePlano={nome} />
      </Page>

      {/* ─── CRONOGRAMA + DISTRIBUIÇÃO + GATILHOS ─── */}
      <Page size="A4" style={styles.page}>
        <Header section="Cronograma & Execução" clienteNome={clienteNome} />

        <Text style={styles.sectionTitle}>Distribuição do funil</Text>
        <Text style={styles.sectionSub}>Alocação de verba por etapa</Text>

        <View style={{ marginBottom: 8 }}>
          <View style={[styles.funnelBar, { backgroundColor: "#ede9fe" }]}>
            <Text style={{ flex: 1, fontSize: 9, fontWeight: 700, color: "#5b21b6" }}>
              Topo · {p.percTopo}% · {fBRL(r.verbaTopo)}
            </Text>
          </View>
          <View style={[styles.funnelBar, { backgroundColor: "#dbeafe" }]}>
            <Text style={{ flex: 1, fontSize: 9, fontWeight: 700, color: "#1d4ed8" }}>
              Meio · {p.percMeio}% · {fBRL(r.verbaMeio)}
            </Text>
          </View>
          <View style={[styles.funnelBar, { backgroundColor: "#fafff0", borderWidth: 1, borderColor: FOCUS_GREEN }]}>
            <Text style={{ flex: 1, fontSize: 9, fontWeight: 700, color: "#5c6f00" }}>
              Fundo · {p.percFundo}% · {fBRL(r.verbaFundo)}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Cronograma semanal</Text>
        <Text style={styles.sectionSub}>Distribuição de verba e meta por semana</Text>

        {(r.cronograma || []).map((s) => (
          <View key={s.semana} style={styles.weekRow}>
            <Text style={styles.weekLabel}>Semana {s.semana}</Text>
            <Text style={styles.weekFase}>{FASE_LABEL[s.fase] || s.fase}</Text>
            <Text style={styles.weekFoco}>{s.foco}</Text>
            <Text style={styles.weekBudget}>{fBRL(s.verba)}</Text>
            <Text style={styles.weekLeads}>{fNum(s.metaLeads)} leads</Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Gatilhos de ajuste</Text>
        <Text style={styles.sectionSub}>Sinais para otimização durante a campanha</Text>

        {[
          { titulo: "CPL acima do limite nos primeiros 7 dias", acao: "Realocar 20% da verba para novos criativos", sev: "aviso" },
          { titulo: "CTR abaixo de 1% após 3 dias",             acao: "Renovar criativos — novos hooks e formatos", sev: "aviso" },
          { titulo: "Gasto diário acima de 120% do planejado",  acao: "Revisar teto de gasto, pausar conjuntos com menor ROAS", sev: "alerta" },
          { titulo: "Meta de leads atingida antes do previsto", acao: "Aumentar meta em 20% ou redirecionar para qualificação", sev: "info" },
        ].map((g, i) => {
          const sevColor = g.sev === "alerta" ? "#b91c1c" : g.sev === "aviso" ? "#92400e" : "#1e40af";
          const sevBg = g.sev === "alerta" ? "#fef2f2" : g.sev === "aviso" ? "#fffbeb" : "#eff6ff";
          return (
            <View key={i} style={[styles.triggerCard, { borderColor: sevColor + "40", backgroundColor: sevBg }]}>
              <Text style={[styles.triggerTitle, { color: sevColor }]}>{g.titulo}</Text>
              <Text style={styles.triggerDesc}>→ {g.acao}</Text>
            </View>
          );
        })}

        <Footer nomePlano={nome} />
      </Page>
    </Document>
  );
}
