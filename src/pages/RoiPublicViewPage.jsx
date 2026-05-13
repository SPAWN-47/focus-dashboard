import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calculator, DollarSign, Users, Target, TrendingUp, Calendar,
  AlertTriangle, Info, FileDown, Loader2, Layers, Briefcase,
  Clock, Heart, Gauge,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import RoiPdfTemplate from "../components/RoiPdfTemplate";
import { FASE_LABEL, FASE_COLOR, calcularPlano, GATILHOS } from "../lib/calculos";
import { SEGMENTOS } from "../lib/benchmarks";

const fBRL = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fNum = (v) => Math.round(Number(v) || 0).toLocaleString("pt-BR");
const fPct = (v) => ((Number(v) || 0) * 100).toFixed(1) + "%";

const Logo = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 3v-3.5A2.5 2.5 0 0 1 5 12.5z" />
    <path d="M9 8.75h6" />
    <path d="M9 11.75h4.5" />
    <circle cx="17.5" cy="17.5" r="2.5" fill="#C9F80D" stroke="none" />
  </svg>
);

const KpiCard = ({ label, value, sub, icon: Icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 130, damping: 18, delay }}
    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-2"
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="p-1.5 rounded-lg" style={{ background: color + "20" }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </span>
    </div>
    <div className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight tabular-nums">{value}</div>
    {sub && <div className="text-[11px] text-zinc-500">{sub}</div>}
  </motion.div>
);

export default function RoiPublicViewPage() {
  const token = window.location.pathname.replace(/^\/r\//, "");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/roi/share/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Falha ao carregar plano");
        if (!cancelled) setPlan(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  // Recalcula (caso resultado salvo esteja desatualizado com nova lib)
  const resultado = useMemo(() => {
    if (!plan?.parametros) return null;
    return calcularPlano(plan.parametros);
  }, [plan]);

  const handlePdf = async () => {
    if (gerandoPdf || !plan) return;
    setGerandoPdf(true);
    try {
      const blob = await pdf(<RoiPdfTemplate plano={{ ...plan, resultado }} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plano-midia-${(plan.nome || "rascunho").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setGerandoPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando plano...</span>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h1 className="text-lg font-bold mb-2">Plano indisponível</h1>
          <p className="text-sm text-zinc-400 mb-4">
            {error || "Este link pode ter sido revogado ou nunca existiu."}
          </p>
          <a href="/" className="text-xs text-[#C9F80D] hover:underline">← Voltar</a>
        </div>
      </div>
    );
  }

  const p = plan.parametros;
  const r = resultado;
  const segmento = p.segmento && SEGMENTOS[p.segmento] ? SEGMENTOS[p.segmento] : null;
  const usaMargem = (p.margemContribuicao || 0) > 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* HEADER limpo */}
      <header className="border-b border-zinc-800/80 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 p-1.5 rounded-md border border-zinc-800">
              <Logo className="w-4 h-4 text-[#C9F80D]" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              Focus<span className="text-[#C9F80D]">Dashboard</span>
            </span>
            <span className="text-zinc-600 hidden sm:block">·</span>
            <span className="text-xs text-zinc-400 hidden sm:block">Plano de mídia</span>
          </div>

          <div className="ml-auto">
            <button
              onClick={handlePdf}
              disabled={gerandoPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C9F80D] hover:bg-[#b8e308] disabled:opacity-60 text-zinc-950 text-xs font-bold transition-colors"
            >
              <FileDown className={`w-3.5 h-3.5 ${gerandoPdf ? "animate-pulse" : ""}`} />
              {gerandoPdf ? "Gerando..." : "Baixar PDF"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 space-y-5">
        {/* HERO */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold text-[#C9F80D] tracking-widest uppercase mb-1">
              Plano de mídia paga
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
              {plan.nome}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {plan.clienteNome && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#C9F80D]/10 border border-[#C9F80D]/30">
                  {plan.clienteEmoji && <span>{plan.clienteEmoji}</span>}
                  <span className="text-[11px] font-semibold text-[#C9F80D]">{plan.clienteNome}</span>
                </div>
              )}
              {segmento && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
                  <span>{segmento.emoji}</span>
                  <span className="text-[11px] text-zinc-300">{segmento.nome}</span>
                </div>
              )}
              <span className="text-[11px] text-zinc-500">
                {new Date(plan.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div>
          <h2 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#C9F80D]" />
            KPIs projetados
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiCard label="Verba mensal" value={fBRL(p.verbaMensal)}    icon={DollarSign} color="#C9F80D" />
            <KpiCard label="Verba/dia"    value={fBRL(r.verbaDia)}        icon={DollarSign} color="#06B6D4" delay={0.05} />
            <KpiCard label="Leads/semana" value={fNum(r.leadsSemana)}     icon={Users}      color="#3B82F6" delay={0.10} />
            <KpiCard
              label="Vendas"
              value={fNum(r.vendasProjetadas)}
              sub={fPct(p.taxaConversao) + " de conversão"}
              icon={Target}
              color="#10B981"
              delay={0.15}
            />
            <KpiCard
              label="Faturamento"
              value={fBRL(r.faturamentoProjetado)}
              icon={TrendingUp}
              color="#8B5CF6"
              delay={0.20}
            />
            <KpiCard
              label="ROAS"
              value={(r.roasProjetado || 0).toFixed(2) + "x"}
              sub={r.roasProjetado >= 1 ? "Acima do break-even" : "Abaixo do break-even"}
              icon={TrendingUp}
              color={r.roasProjetado >= 1 ? "#C9F80D" : "#EF4444"}
              delay={0.25}
            />
          </div>
        </div>

        {/* Análise financeira */}
        {(r.cac > 0 || r.ltv > 0) && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
            <h2 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#C9F80D]" />
              Análise financeira
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Users className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-semibold text-zinc-300 uppercase">CAC</span>
                </div>
                <div className="text-lg font-bold tabular-nums text-blue-400">
                  {r.cac > 0 ? fBRL(r.cac) : "—"}
                </div>
                <div className="text-[10px] text-zinc-500">Custo por cliente</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Heart className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] font-semibold text-zinc-300 uppercase">LTV</span>
                </div>
                <div className="text-lg font-bold tabular-nums text-purple-400">
                  {r.ltv > 0 ? fBRL(r.ltv) : "—"}
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-semibold text-zinc-300 uppercase">LTV:CAC</span>
                </div>
                <div className="text-lg font-bold tabular-nums" style={{
                  color: r.ltvCacRatio >= 3 ? "#10B981" : r.ltvCacRatio >= 1 ? "#F59E0B" : "#EF4444"
                }}>
                  {r.ltvCacRatio > 0 ? r.ltvCacRatio.toFixed(2) + ":1" : "—"}
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-semibold text-zinc-300 uppercase">Payback</span>
                </div>
                <div className="text-lg font-bold tabular-nums text-amber-400">
                  {r.paybackMeses > 0 ? `${r.paybackMeses.toFixed(1)}m` : "—"}
                </div>
              </div>
            </div>
            {usaMargem && (
              <div className="mt-3 text-[11px] text-zinc-400 bg-zinc-950/50 rounded-lg p-2.5 border border-zinc-800">
                Análise considerando <b className="text-zinc-300">{p.margemContribuicao}%</b> de margem de contribuição
                · Lucro líquido projetado: <b style={{ color: r.lucroLiquido >= 0 ? "#C9F80D" : "#EF4444" }}>{fBRL(r.lucroLiquido)}</b>
              </div>
            )}
          </div>
        )}

        {/* Cenários */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#C9F80D]" />
            3 cenários
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pessimista", leads: r.cenarioPessimista, color: "#F59E0B", sub: "CPL +30%" },
              { label: "Realista",   leads: r.cenarioRealista,   color: "#C9F80D", sub: "CPL base" },
              { label: "Otimista",   leads: r.cenarioOtimista,   color: "#10B981", sub: "CPL -20%" },
            ].map((c) => {
              const vendas = Math.floor(c.leads * p.taxaConversao);
              return (
                <div key={c.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                    <span className="text-[11px] font-semibold text-zinc-300">{c.label}</span>
                  </div>
                  <div className="text-lg font-bold tabular-nums" style={{ color: c.color }}>
                    {fNum(c.leads)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mb-2">leads · {c.sub}</div>
                  <div className="border-t border-zinc-800 pt-2 text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Vendas</span>
                      <span className="text-zinc-300">{fNum(vendas)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Fat.</span>
                      <span className="text-zinc-300">{fBRL(vendas * p.ticketMedio)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cronograma */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C9F80D]" />
            Cronograma semanal
          </h2>
          <div className="space-y-3">
            {(r.cronograma || []).map((s) => {
              const maxVerba = Math.max(...r.cronograma.map((x) => x.verba));
              const w = (s.verba / maxVerba) * 100;
              const color = FASE_COLOR[s.fase];
              return (
                <div key={s.semana} className="flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <div className="text-[11px] font-semibold text-zinc-300">Semana {s.semana}</div>
                    <div className="text-[10px] text-zinc-500">{FASE_LABEL[s.fase]}</div>
                  </div>
                  <div className="flex-1">
                    <div className="relative h-7 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg"
                        style={{
                          width: `${w}%`,
                          background: `linear-gradient(90deg, ${color}30, ${color}80)`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-2.5">
                        <span className="text-[10px] text-zinc-400 truncate pr-2">{s.foco}</span>
                        <span className="text-[11px] font-semibold text-zinc-100 tabular-nums">
                          {fBRL(s.verba)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right shrink-0">
                    <div className="text-[11px] font-bold text-zinc-200 tabular-nums">{fNum(s.metaLeads)}</div>
                    <div className="text-[10px] text-zinc-500">leads</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gatilhos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C9F80D]" />
            Gatilhos de ajuste
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {GATILHOS.map((g) => {
              const sevCfg = g.severidade === "alerta"
                ? { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" }
                : g.severidade === "aviso"
                  ? { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" }
                  : { bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400" };
              return (
                <div key={g.id} className={`rounded-xl border ${sevCfg.border} ${sevCfg.bg} p-3`}>
                  <div className={`text-[11px] font-bold mb-1.5 ${sevCfg.text}`}>{g.titulo}</div>
                  <div className="text-[10px] text-zinc-400 mb-1">
                    <span className="text-zinc-500">SE: </span>{g.condicao}
                  </div>
                  <div className="text-[10px] text-zinc-300">
                    <span className="text-zinc-500">ENTÃO: </span>{g.acao}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center pt-4 pb-2">
          <p className="text-[11px] text-zinc-600">
            Documento gerado por <b className="text-zinc-400">Focus Mídia | Marketing e Performance</b>
          </p>
        </div>
      </main>
    </div>
  );
}
