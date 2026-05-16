import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  LogOut, Star, MapPin, Phone, Globe, TrendingUp,
  Eye, Navigation, Search, Settings, MessageCircle, ArrowLeft,
  Sparkles, CheckCircle2, AlertCircle, XCircle, Activity,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import PlatformNav from "../components/PlatformNav";

// ─────────────────────────────────────────────
// LOGO
// ─────────────────────────────────────────────

const Logo = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 3v-3.5A2.5 2.5 0 0 1 5 12.5z" />
    <path d="M9 8.75h6" />
    <path d="M9 11.75h4.5" />
    <circle cx="17.5" cy="17.5" r="2.5" fill="#C9F80D" stroke="none" />
  </svg>
);

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const GMB_GREEN = "#34A853";

const PERIODS = [
  { id: "daily",   label: "Diário",  sub: "Ontem" },
  { id: "weekly",  label: "Semanal", sub: "Últimos 7 dias" },
  { id: "monthly", label: "Mensal",  sub: "Últimos 30 dias" },
];

const STAR_LABELS = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const fNum = (v) => Math.round(v || 0).toLocaleString("pt-BR");

function StarRating({ rating, size = "sm" }) {
  const numeric = typeof rating === "string" ? (STAR_LABELS[rating] || 0) : rating;
  const starSize = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star
          key={n}
          className={`${starSize} ${n <= numeric ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"}`}
        />
      ))}
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7)  return `${days} dias atrás`;
  if (days < 30) return `${Math.floor(days / 7)} sem. atrás`;
  if (days < 365) return `${Math.floor(days / 30)} meses atrás`;
  return `${Math.floor(days / 365)} ano(s) atrás`;
}

// ─────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// HERO NARRATIVA — frase-resumo do período (GMB)
// ─────────────────────────────────────────────
const HeroNarrativaGmb = ({ metrics, periodLabel, clientName }) => {
  if (!metrics || (metrics.impressoes === 0 && metrics.ligacoes === 0)) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5"
    >
      <div className="text-sm sm:text-base text-zinc-200 leading-relaxed">
        {clientName && <span className="text-zinc-500">{clientName} · </span>}
        <span className="text-zinc-400">{periodLabel} seu negócio apareceu </span>
        <span className="font-bold text-[#C9F80D]">{fNum(metrics.impressoes)} {metrics.impressoes === 1 ? "vez" : "vezes"}</span>
        <span className="text-zinc-400"> no Google. </span>
        {metrics.ligacoes > 0 && (
          <>
            <span className="text-zinc-400">Resultou em </span>
            <span className="font-bold text-emerald-400">{fNum(metrics.ligacoes)} {metrics.ligacoes === 1 ? "ligação" : "ligações"}</span>
            <span className="text-zinc-400"> diretamente do perfil.</span>
          </>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// SCORE DE SAÚDE — GMB
// Combina volume de ligações + tendência + diversidade de conversões
// ─────────────────────────────────────────────
const computeGmbScore = ({ metrics, delta }) => {
  let score = 0;
  const signals = [];
  const ligacoes = metrics.ligacoes || 0;
  const totalConv = ligacoes + (metrics.cliquessite || 0) + (metrics.direcoes || 0);

  // 1. Volume de ligações (35 pts)
  if (ligacoes >= 30)      { score += 35; signals.push({ ok: true,  msg: "Boa frequência de ligações" }); }
  else if (ligacoes >= 10) { score += 22; signals.push({ ok: true,  msg: "Ligações regulares" }); }
  else if (ligacoes >= 3)  { score += 10; signals.push({ ok: false, msg: "Poucas ligações" }); }
  else                     { score += 0;  signals.push({ ok: false, msg: "Quase sem ligações" }); }

  // 2. Tendência de ligações (35 pts)
  if (delta?.ligacoes != null) {
    if (delta.ligacoes >= 15)      { score += 35; signals.push({ ok: true,  msg: "Ligações crescendo forte" }); }
    else if (delta.ligacoes >= 0)  { score += 25; signals.push({ ok: true,  msg: "Ligações estáveis" }); }
    else if (delta.ligacoes >= -15){ score += 10; signals.push({ ok: false, msg: "Ligações em queda" }); }
    else                           { score += 0;  signals.push({ ok: false, msg: "Ligações caíram muito" }); }
  } else if (ligacoes > 0) score += 22;

  // 3. Diversidade de conversões (30 pts) — ligações + site + direções
  const callRatio = totalConv > 0 ? ligacoes / totalConv : 0;
  if (totalConv >= 30 && callRatio >= 0.3 && callRatio <= 0.7)
    { score += 30; signals.push({ ok: true, msg: "Mix saudável de contatos" }); }
  else if (totalConv >= 10)
    { score += 20; signals.push({ ok: true, msg: "Múltiplos canais de contato" }); }
  else if (totalConv > 0)
    { score += 10; }

  return { score: Math.round(score), signals };
};

const ScoreSaudeGmb = ({ metrics, delta }) => {
  if (!metrics || (metrics.ligacoes === 0 && metrics.cliquessite === 0 && metrics.direcoes === 0)) return null;
  const { score, signals } = computeGmbScore({ metrics, delta });
  const status = score >= 80
    ? { label: "Saudável",  color: "#10B981", icon: CheckCircle2, desc: "Perfil performando bem" }
    : score >= 50
      ? { label: "Atenção",  color: "#F59E0B", icon: AlertCircle, desc: "Há sinais a observar" }
      : { label: "Crítico",  color: "#EF4444", icon: XCircle,     desc: "Perfil precisa de ajustes" };
  const SIcon = status.icon;
  const R = 42, C = 2 * Math.PI * R, offset = C * (1 - score / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="bg-zinc-900 border rounded-2xl p-4 sm:p-5 flex items-center gap-4"
      style={{ borderColor: status.color + "40" }}
    >
      <div className="relative shrink-0">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={R} stroke="#27272a" strokeWidth="8" fill="none" />
          <motion.circle cx="50" cy="50" r={R} stroke={status.color} strokeWidth="8" fill="none" strokeLinecap="round"
            strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-zinc-100">{score}</span>
          <span className="text-[8px] text-zinc-500 uppercase tracking-wider">/100</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1.5">
          <SIcon className="w-4 h-4" style={{ color: status.color }} />
          <span className="text-sm font-bold" style={{ color: status.color }}>{status.label}</span>
          <span className="text-[10px] text-zinc-500 hidden sm:inline">· {status.desc}</span>
        </div>
        <div className="space-y-0.5">
          {signals.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px]">
              <span className={`w-1 h-1 rounded-full ${s.ok ? "bg-emerald-400" : "bg-red-400"}`} />
              <span className="text-zinc-400">{s.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// INSIGHTS — GMB
// ─────────────────────────────────────────────
const generateGmbInsights = ({ metrics, delta, reviews }) => {
  const insights = [];
  const ligacoes = metrics.ligacoes || 0;
  const site = metrics.cliquessite || 0;
  const dir = metrics.direcoes || 0;
  const total = ligacoes + site + dir;

  if (delta?.ligacoes != null && delta.ligacoes >= 20)
    insights.push({ type: "win", icon: "📞", msg: `Ligações cresceram ${delta.ligacoes.toFixed(0)}% — aproveite o momento` });
  else if (delta?.ligacoes != null && delta.ligacoes <= -20)
    insights.push({ type: "alert", icon: "📉", msg: `Ligações caíram ${Math.abs(delta.ligacoes).toFixed(0)}% — verificar foto/horário/atributos` });

  if (delta?.impressoes != null && delta.impressoes >= 20)
    insights.push({ type: "win", icon: "👀", msg: `Visibilidade subiu ${delta.impressoes.toFixed(0)}% — perfil otimizado` });

  // Conversion ratio insight
  if (metrics.impressoes >= 1000 && total > 0) {
    const convRate = (total / metrics.impressoes) * 100;
    if (convRate >= 5)
      insights.push({ type: "win", icon: "🎯", msg: `Taxa de conversão de ${convRate.toFixed(1)}% — perfil convertendo bem` });
    else if (convRate < 1)
      insights.push({ type: "alert", icon: "💡", msg: `Só ${convRate.toFixed(1)}% dos que veem convertem — revisar fotos e descrição` });
  }

  // Dominant channel
  if (total >= 10) {
    const max = Math.max(ligacoes, site, dir);
    if (max === ligacoes && ligacoes > 0)
      insights.push({ type: "info", icon: "📞", msg: `Ligações dominam (${Math.round((ligacoes/total)*100)}%) — invista em atendimento rápido` });
    else if (max === site)
      insights.push({ type: "info", icon: "🌐", msg: `Site é o destino preferido (${Math.round((site/total)*100)}%) — garanta que está mobile-friendly` });
    else if (max === dir)
      insights.push({ type: "info", icon: "🧭", msg: `Maioria pede rota (${Math.round((dir/total)*100)}%) — fluxo presencial alto` });
  }

  // Reviews
  if (reviews?.configured && reviews.averageRating != null) {
    if (reviews.averageRating >= 4.5)
      insights.push({ type: "win", icon: "⭐", msg: `Nota ${reviews.averageRating.toFixed(1)} — reputação excelente` });
    else if (reviews.averageRating < 4.0 && reviews.totalReviewCount >= 5)
      insights.push({ type: "alert", icon: "⭐", msg: `Nota ${reviews.averageRating.toFixed(1)} — responder avaliações pra melhorar` });
  }

  return insights.slice(0, 4);
};

const InsightsBoxGmb = ({ metrics, delta, reviews }) => {
  const insights = generateGmbInsights({ metrics, delta, reviews });
  if (insights.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#C9F80D]" />
        <h3 className="text-sm font-bold text-zinc-100">Insights automáticos</h3>
        <span className="text-[10px] text-zinc-500">· análise do perfil</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {insights.map((insight, i) => {
          const colors = {
            win:   { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-300" },
            alert: { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-300" },
            info:  { bg: "bg-sky-500/10",     border: "border-sky-500/20",     text: "text-sky-300" },
          };
          const c = colors[insight.type];
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className={`flex items-start gap-2 px-3 py-2 rounded-xl border ${c.bg} ${c.border}`}
            >
              <span className="text-base shrink-0 leading-tight">{insight.icon}</span>
              <span className={`text-[12px] font-medium ${c.text} leading-snug`}>{insight.msg}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// CALLS TREND CHART — tendência de ligações ao longo do tempo
// ─────────────────────────────────────────────
const CallsTrendChart = ({ dailySeries }) => {
  if (!dailySeries || dailySeries.length < 3) return null;

  const data = dailySeries.slice(-21); // últimos 21 dias
  const maxLig = Math.max(...data.map(d => d.ligacoes), 1);
  const W = 600, H = 140, padL = 30, padR = 16, padT = 12, padB = 24;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const xStep = data.length > 1 ? plotW / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: padL + i * xStep,
    y: padT + plotH - (d.ligacoes / maxLig) * plotH,
    d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaD = pathD + ` L ${points[points.length-1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${padL.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  const totalLig = data.reduce((s, d) => s + d.ligacoes, 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#C9F80D]" />
          <h3 className="text-sm font-bold text-zinc-100">Ligações por dia</h3>
          <span className="text-[10px] text-zinc-500">· últimos {data.length} dias</span>
        </div>
        <span className="text-[10px] text-zinc-500">
          Total: <span className="font-mono font-bold text-zinc-200">{fNum(totalLig)}</span>
        </span>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 360 }}>
          <defs>
            <linearGradient id="gmb-trend-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FBBC04" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FBBC04" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid horizontal sutil */}
          {[0.25, 0.5, 0.75].map((r, i) => (
            <line key={i} x1={padL} x2={W - padR}
              y1={padT + plotH * r} y2={padT + plotH * r}
              stroke="#27272a" strokeDasharray="2,3" strokeWidth="1" />
          ))}
          <path d={areaD} fill="url(#gmb-trend-area)" />
          <path d={pathD} fill="none" stroke="#FBBC04" strokeWidth="2" strokeLinejoin="round" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3" fill="#FBBC04" stroke="#0a0a0a" strokeWidth="1.5">
                <title>{`${new Date(p.d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}: ${p.d.ligacoes} ${p.d.ligacoes === 1 ? "ligação" : "ligações"}`}</title>
              </circle>
            </g>
          ))}
          {/* X labels — first, middle, last */}
          {[0, Math.floor(data.length/2), data.length-1].map((i) => {
            const p = points[i];
            const d = data[i];
            return (
              <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize="9" fill="#71717a" fontFamily="system-ui">
                {new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              </text>
            );
          })}
          {/* Y labels */}
          <text x={padL - 6} y={padT + 4} textAnchor="end" fontSize="9" fill="#71717a">{maxLig}</text>
          <text x={padL - 6} y={padT + plotH + 4} textAnchor="end" fontSize="9" fill="#71717a">0</text>
        </svg>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// KPI DESTAQUE — card grande pra "Ligações"
// ─────────────────────────────────────────────
const KpiDestaque = ({ label, value, sub, icon: Icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 130, damping: 18, delay }}
    className="bg-zinc-900 border-2 rounded-2xl p-4 sm:p-5 flex items-center gap-4"
    style={{ borderColor: color + "60" }}
  >
    <div className="p-3 rounded-xl shrink-0" style={{ background: color + "20" }}>
      <Icon className="w-6 h-6" style={{ color }} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className="text-3xl font-bold text-zinc-100 tabular-nums leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  </motion.div>
);

const METRIC_HELP = {
  "Impressões": "Quantas vezes seu perfil apareceu no Google (busca + mapas).",
  "Buscas":     "Pessoas que te encontraram buscando direto seu nome ou categoria.",
  "Mapas":      "Pessoas que te encontraram navegando no Google Maps.",
  "Ligações":   "Pessoas que clicaram em 'Ligar' direto do perfil.",
  "Site":       "Pessoas que clicaram pra visitar seu site.",
  "Direções":   "Pessoas que pediram rota até seu negócio.",
};

const DeltaBadge = ({ delta }) => {
  if (delta === null || delta === undefined) return null;
  const isPositive = delta >= 0;
  const arrow = isPositive ? "↑" : "↓";
  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 ${
        isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
      }`}
      title={`${isPositive ? "Aumento" : "Redução"} de ${Math.abs(delta).toFixed(1)}% vs período anterior`}
    >
      <span className="text-[9px]">{arrow}</span>
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
};

const KpiCard = ({ label, value, icon: Icon, color, delay = 0, delta = null }) => {
  const helpText = METRIC_HELP[label];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-2 group"
      title={helpText}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider leading-tight flex items-center gap-1">
          {label}
          {helpText && <span className="text-[8px] text-zinc-700 group-hover:text-zinc-500 transition-colors normal-case tracking-normal">ⓘ</span>}
        </span>
        <span className="p-1.5 rounded-lg shrink-0" style={{ background: color + "20" }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </span>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">{value}</div>
      {delta !== null && delta !== undefined && (
        <div className="flex items-center justify-between min-h-[16px]">
          <span className="text-[10px] text-zinc-600">vs período anterior</span>
          <DeltaBadge delta={delta} />
        </div>
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// REVIEW CARD
// ─────────────────────────────────────────────

function ReviewCard({ review, delay = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const numeric = typeof review.rating === "string"
    ? (STAR_LABELS[review.rating] || 0)
    : (review.rating || 0);
  const comment = review.comment || "";
  const isLong = comment.length > 150;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-semibold text-zinc-200">{review.author}</p>
          <p className="text-[11px] text-zinc-500">{timeAgo(review.date)}</p>
        </div>
        <StarRating rating={numeric} size="sm" />
      </div>

      {comment && (
        <p className="text-sm text-zinc-300 leading-relaxed">
          {isLong && !expanded ? comment.slice(0, 150) + "…" : comment}
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-1 text-[#C9F80D] text-xs hover:underline"
            >
              {expanded ? "ver menos" : "ver mais"}
            </button>
          )}
        </p>
      )}

      {review.replyText && (
        <div className="mt-3 border-l-2 border-zinc-700 pl-3">
          <p className="text-[11px] text-zinc-500 mb-1">Resposta do proprietário</p>
          <p className="text-xs text-zinc-400">{review.replyText}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function GmbDashboardPage() {
  const { user, logout, authFetch } = useAuth();
  const [period, setPeriod]         = useState("monthly");
  const [insights, setInsights]     = useState(null);
  const [reviews, setReviews]       = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [loadingReviews,  setLoadingReviews]  = useState(true);
  const [error, setError]           = useState("");
  const [clientName, setClientName] = useState("");

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  // Derive client ID the same way Google Ads page does
  const params   = new URLSearchParams(window.location.search);
  const clientId = user.role === "client"
    ? user.clientId
    : (params.get("client") || user.clientId);

  const fetchInsights = useCallback(async () => {
    if (!clientId) {
      setLoadingInsights(false);
      return;
    }
    setLoadingInsights(true);
    setError("");
    try {
      const p = new URLSearchParams({ period });
      if (clientId) p.set("clientId", clientId);
      const data = await authFetch(`/api/gmb/insights?${p}`).then(r => r.json());
      setInsights(data);
    } catch {
      setError("Erro ao carregar métricas do Google Meu Negócio.");
    } finally {
      setLoadingInsights(false);
    }
  }, [period, clientId, authFetch]);

  const fetchReviews = useCallback(async () => {
    if (!clientId) {
      setLoadingReviews(false);
      return;
    }
    setLoadingReviews(true);
    try {
      const p = new URLSearchParams();
      if (clientId) p.set("clientId", clientId);
      const data = await authFetch(`/api/gmb/reviews?${p}`).then(r => r.json());
      setReviews(data);
    } catch (err) {
      console.error("[gmb/reviews fetch]", err);
      setReviews({ configured: false, reason: "api_error", error: err.message });
    } finally {
      setLoadingReviews(false);
    }
  }, [clientId, authFetch]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  useEffect(() => {
    authFetch("/api/clients").then(r => r.json()).then(list => {
      const match = list.find(c => c.id === clientId);
      if (match) setClientName(match.name);
    }).catch(() => {});
  }, [clientId, authFetch]);
  useEffect(() => { fetchReviews();  }, [fetchReviews]);

  const m               = insights?.metrics || {};
  // Differentiate between states
  const isNotConfigured = insights?.configured === false && !["api_error","quota_exceeded"].includes(insights?.reason);
  const isApiError      = insights?.configured === false && insights?.reason === "api_error";
  const isQuotaError    = insights?.configured === false && insights?.reason === "quota_exceeded";
  const hasInsights     = insights?.configured && insights?.metrics;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">

      {/* ── HEADER — mesmo padrão do Google Ads ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

          <a
            href="/dashboard"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Meta</span>
          </a>

          {/* Logo + título */}
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 p-1.5 rounded-md border border-zinc-800">
              <Logo className="w-4 h-4 text-[#C9F80D]" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">
              Focus<span className="text-[#C9F80D]">Dashboard</span>
            </span>
            <span className="text-zinc-600 hidden sm:block">|</span>
            <span className="text-sm font-semibold hidden sm:block" style={{ color: GMB_GREEN }}>
              Meu Negócio
            </span>
          </div>

          <div className="ml-2 sm:ml-4 overflow-hidden">
            <PlatformNav active="gmb" />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:block">{user.name}</span>
            {user?.role === "admin" && (
              <a
                href="/admin"
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Admin"
              >
                <Settings className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">

        {/* ── NO CLIENT SELECTED (admin sem ?client=) ── */}
        {!clientId && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-6"
          >
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <MapPin className="w-6 h-6" style={{ color: GMB_GREEN }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">Nenhum cliente selecionado</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Selecione um cliente no painel principal para visualizar os dados do Google Meu Negócio.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── FETCH ERROR ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            <span className="font-semibold">Erro:</span> {error}
          </div>
        )}

        {/* ── QUOTA / PENDING APPROVAL ── */}
        {!loadingInsights && isQuotaError && user?.role === "admin" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-5"
          >
            <div className="p-2.5 rounded-xl bg-zinc-800 shrink-0 mt-0.5">
              <Settings className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">Aguardando aprovação do Google</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                O acesso à API do Google Meu Negócio foi solicitado e está em análise (7–10 dias úteis). Os dados aparecerão automaticamente após a aprovação.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── API ERROR (credentials wrong / API down) ── */}
        {!loadingInsights && isApiError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-5"
          >
            <div className="p-2.5 rounded-xl bg-red-500/10 shrink-0 mt-0.5">
              <Settings className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-300">Erro na API do Google Meu Negócio</p>
              <p className="text-xs text-red-400/80 mt-0.5 break-words">
                {insights?.error || "Credenciais inválidas ou quota excedida. Verifique GMB_CLIENT_ID, GMB_CLIENT_SECRET e GMB_REFRESH_TOKEN no servidor."}
              </p>
              {user?.role === "admin" && (
                <p className="text-xs text-zinc-500 mt-2">
                  Acesse o painel do Coolify → Environment Variables para verificar as credenciais OAuth do Google.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {clientId && (
          <>
            {/* ── TITLE ROW + PERIOD SWITCHER ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="relative">
                {/* Glow verde GMB sutil */}
                <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full opacity-[0.06] blur-3xl pointer-events-none" style={{ background: GMB_GREEN }} />
                <h1 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2 relative">
                  <span>📍</span>
                  <span>
                    {clientName ? (
                      <>Olá, <span style={{ color: GMB_GREEN }}>{clientName}</span></>
                    ) : "Visão geral"}
                  </span>
                </h1>
                <div className="flex items-center gap-2 mt-1.5 relative">
                  <span className="text-xs text-zinc-500">Perfil no <span style={{ color: GMB_GREEN }}>Google Meu Negócio</span></span>
                  <span className="w-1 h-1 rounded-full" style={{ background: GMB_GREEN }} />
                  <span className="text-xs text-zinc-600">{PERIODS.find(p => p.id === period)?.sub}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 self-start">
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id)}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      period === p.id
                        ? "text-zinc-100 border border-zinc-700"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                    style={period === p.id ? { background: GMB_GREEN + "22" } : {}}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* ── NOT CONFIGURED ── */}
            {!loadingInsights && isNotConfigured && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-6"
              >
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Settings className="w-6 h-6" style={{ color: GMB_GREEN }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">Google Meu Negócio não configurado</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {insights?.reason === "no_credentials"
                      ? user?.role === "admin"
                        ? "Credenciais GMB não configuradas no servidor (GMB_CLIENT_ID / GMB_CLIENT_SECRET / GMB_REFRESH_TOKEN)."
                        : "Serviço Google Meu Negócio não está ativo. Entre em contato com a agência."
                      : user?.role === "admin"
                        ? "Adicione o Location ID numérico em Admin → editar cliente."
                        : "Entre em contato com a agência para configurar."
                    }
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── HERO NARRATIVA ── */}
            {hasInsights && !isApiError && !isQuotaError && !loadingInsights && (
              <HeroNarrativaGmb
                metrics={m}
                periodLabel={
                  period === "daily" ? "Ontem"
                  : period === "weekly" ? "Nos últimos 7 dias"
                  : "Nos últimos 30 dias"
                }
                clientName={clientName}
              />
            )}

            {/* ── SCORE SAÚDE ── */}
            {hasInsights && !isApiError && !isQuotaError && !loadingInsights && (
              <ScoreSaudeGmb metrics={m} delta={insights.delta} />
            )}

            {/* ── INSIGHTS AUTOMÁTICOS ── */}
            {hasInsights && !isApiError && !isQuotaError && !loadingInsights && (
              <InsightsBoxGmb metrics={m} delta={insights.delta} reviews={reviews} />
            )}

            {/* ── KPIs DE RESULTADO (destaque máximo) — Ligações + Site + Direções ── */}
            {(loadingInsights || hasInsights) && !isApiError && !isQuotaError && (
              <div>
                <p className="text-[11px] text-[#C9F80D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Conversões diretas
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {loadingInsights ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse h-24" />
                    ))
                  ) : (
                    <>
                      <KpiDestaque
                        label="Ligações"
                        value={fNum(m.ligacoes)}
                        sub={insights.delta?.ligacoes != null ? `${insights.delta.ligacoes >= 0 ? "↑" : "↓"} ${Math.abs(insights.delta.ligacoes).toFixed(0)}% vs período anterior` : "Clicaram em ligar"}
                        icon={Phone}
                        color="#FBBC04"
                        delay={0}
                      />
                      <KpiDestaque
                        label="Site"
                        value={fNum(m.cliquessite)}
                        sub={insights.delta?.cliquessite != null ? `${insights.delta.cliquessite >= 0 ? "↑" : "↓"} ${Math.abs(insights.delta.cliquessite).toFixed(0)}% vs período anterior` : "Visitaram o site"}
                        icon={Globe}
                        color="#34A853"
                        delay={0.05}
                      />
                      <KpiDestaque
                        label="Direções"
                        value={fNum(m.direcoes)}
                        sub={insights.delta?.direcoes != null ? `${insights.delta.direcoes >= 0 ? "↑" : "↓"} ${Math.abs(insights.delta.direcoes).toFixed(0)}% vs período anterior` : "Pediram rota"}
                        icon={Navigation}
                        color="#9C27B0"
                        delay={0.1}
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── TENDÊNCIA DE LIGAÇÕES (gráfico) ── */}
            {hasInsights && !isApiError && !isQuotaError && !loadingInsights && insights.dailySeries?.length > 2 && (
              <CallsTrendChart dailySeries={insights.dailySeries} />
            )}

            {/* ── KPIs DE DESCOBERTA — Impressões + Buscas + Mapas ── */}
            {(loadingInsights || hasInsights) && !isApiError && !isQuotaError && (
              <div>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Como te encontraram</p>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { label: "Impressões", key: "impressoes", icon: Eye,    color: GMB_GREEN },
                    { label: "Buscas",     key: "buscas",     icon: Search, color: "#4285F4" },
                    { label: "Mapas",      key: "mapas",      icon: MapPin, color: "#EA4335" },
                  ].map((card, i) => (
                    loadingInsights ? (
                      <div key={card.key} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse h-24" />
                    ) : (
                      <KpiCard
                        key={card.key}
                        label={card.label}
                        value={fNum(m[card.key])}
                        icon={card.icon}
                        color={card.color}
                        delay={i * 0.05}
                        delta={insights?.delta?.[card.key]}
                      />
                    )
                  ))}
                </div>
              </div>
            )}

            {/* ── REVIEWS ERROR BANNER — shown when API fails or is pending approval ── */}
            {!loadingReviews && reviews && !reviews.configured && !isApiError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm border ${
                  reviews.reason === "api_unavailable"
                    ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {reviews.reason === "api_unavailable" ? "⏳" : "⚠️"}
                </span>
                <div>
                  <p className="font-semibold">
                    {reviews.reason === "api_unavailable"
                      ? "API de Avaliações aguardando liberação"
                      : "Erro ao carregar avaliações"}
                  </p>
                  {reviews.error && (
                    <p className="text-xs mt-0.5 opacity-75 font-mono break-all">{reviews.error}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── REVIEWS SECTION ── */}
            {(loadingReviews || reviews?.configured) && !isApiError && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-4"
              >
                {/* Reviews header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      Avaliações
                    </h2>
                    {reviews?.configured && !loadingReviews && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {reviews.totalReviewCount} avaliações no total
                      </p>
                    )}
                  </div>

                  {reviews?.configured && !loadingReviews && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 flex items-center gap-3">
                      <span className="text-2xl font-bold text-white">
                        {Number(reviews.averageRating || 0).toFixed(1)}
                      </span>
                      <div>
                        <StarRating rating={Math.round(reviews.averageRating || 0)} size="lg" />
                        <p className="text-[11px] text-zinc-500 mt-0.5">{reviews.totalReviewCount} avaliações</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reviews grid */}
                {loadingReviews ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse h-28" />
                    ))}
                  </div>
                ) : reviews?.reviews?.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {reviews.reviews.map((r, i) => (
                      <ReviewCard key={r.name || i} review={r} delay={i * 0.06} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
                    <MessageCircle className="w-7 h-7 mx-auto mb-2 text-zinc-600" />
                    <p className="text-zinc-500 text-sm">Nenhuma avaliação encontrada ainda.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── ABOUT SECTION ── */}
            {!isNotConfigured && !isApiError && !isQuotaError && !loadingInsights && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: GMB_GREEN }} />
                  O que essas métricas significam?
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-xs text-zinc-400">
                  {[
                    { icon: "👁️", label: "Impressões",    desc: "Quantas vezes seu perfil apareceu no Google (buscas + Maps)." },
                    { icon: "🔍", label: "Buscas",         desc: "Visualizações via Google Search — usuários buscando seu negócio." },
                    { icon: "📍", label: "Mapas",          desc: "Visualizações via Google Maps — usuários encontrando você no mapa." },
                    { icon: "📞", label: "Ligações",       desc: "Cliques no número de telefone do seu perfil." },
                    { icon: "🌐", label: "Cliques no site",desc: "Acessos ao seu site originados do perfil do Google." },
                    { icon: "🧭", label: "Direções",       desc: "Solicitações de rota para o seu endereço no Maps." },
                  ].map(item => (
                    <div key={item.label} className="flex gap-2.5">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <p className="text-zinc-300 font-medium">{item.label}</p>
                        <p className="text-zinc-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* ── FOOTER ── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="border-t border-zinc-800/60 pt-6 pb-4 flex items-center justify-between flex-wrap gap-3"
        >
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 p-1 rounded border border-zinc-800">
              <Logo className="w-3.5 h-3.5 text-[#C9F80D]" />
            </div>
            <span className="text-xs text-zinc-500">
              Focus<span className="text-[#C9F80D] font-semibold">Dashboard</span>
              {" "}— Google Meu Negócio
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {!loadingInsights && hasInsights ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-zinc-600">Dados em tempo real · Business Profile API</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: GMB_GREEN }} />
                <span className="text-[11px] text-zinc-600">Business Profile API</span>
              </>
            )}
          </div>
        </motion.footer>

      </main>
    </div>
  );
}
