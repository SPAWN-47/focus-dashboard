import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, LogOut, Search, TrendingUp, TrendingDown,
  MousePointer, Eye, Target, DollarSign, BarChart3, Zap,
  ChevronDown, ChevronUp, Settings, PlayCircle, FileDown, RefreshCw,
  Sparkles, ShoppingBag, Banknote, AlertCircle, CheckCircle2, XCircle, MessageCircle,
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

const GOOGLE_BLUE  = "#4285F4";
const YOUTUBE_RED  = "#ef4444";

const PERIODS = [
  { id: "daily",   label: "Diário",  sub: "Ontem" },
  { id: "weekly",  label: "Semanal", sub: "Últimos 7 dias" },
  { id: "monthly", label: "Mensal",  sub: "Últimos 30 dias" },
];

const AD_TYPES = [
  {
    emoji: "🔍",
    label: "Search Ads",
    desc: "Texto relevante quando o usuário pesquisa. Maior intenção de compra.",
    color: GOOGLE_BLUE,
  },
  {
    emoji: "🖼️",
    label: "Display Ads",
    desc: "Banners visuais em sites parceiros. Bom para remarketing e awareness.",
    color: "#06b6d4",
  },
  {
    emoji: "📹",
    label: "YouTube Ads",
    desc: "Anúncios em vídeo. Alcance de audiência ampla com forte apelo visual.",
    color: "#ef4444",
  },
  {
    emoji: "⚡",
    label: "Performance Max",
    desc: "Campanha automatizada em todos os canais Google com IA.",
    color: "#C9F80D",
  },
];

// ─────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────

const fBRL = (v) =>
  `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fBRL0 = (v) =>
  `R$ ${(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

const fNum = (v) => (v || 0).toLocaleString("pt-BR");

const fPct = (v) => `${(v || 0).toFixed(2)}%`;

// ─────────────────────────────────────────────
// DATE RANGE HELPER
// ─────────────────────────────────────────────

function getDateRange(period) {
  const today = new Date();
  if (period === "daily") {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  }
  if (period === "weekly") {
    const day = today.getDay();
    const lastMon = new Date(today);
    lastMon.setDate(today.getDate() - ((day + 6) % 7) - 7);
    const lastSun = new Date(lastMon);
    lastSun.setDate(lastMon.getDate() + 6);
    const fmt = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    return `${fmt(lastMon)} – ${fmt(lastSun)}/${lastSun.getFullYear()}`;
  }
  if (period === "monthly") {
    const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const str = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  return "";
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function buildPolyline(data, svgW, svgH, padding = 10) {
  if (!data || data.length < 2) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (svgW - padding * 2);
      const y = svgH - padding - ((v - min) / range) * (svgH - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildAreaPath(data, svgW, svgH, padding = 10) {
  if (!data || data.length < 2) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (svgW - padding * 2);
    const y = svgH - padding - ((v - min) / range) * (svgH - padding * 2);
    return [x, y];
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `M ${first[0].toFixed(1)},${(svgH - padding).toFixed(1)} L ${line} L ${last[0].toFixed(1)},${(svgH - padding).toFixed(1)} Z`;
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

const DeltaBadge = ({ delta, lowerIsBetter = false }) => {
  if (delta === null || delta === undefined) return null;
  const isPositive = delta >= 0;
  const isGood = lowerIsBetter ? !isPositive : isPositive;
  const arrow = isPositive ? "↑" : "↓";
  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 ${
        isGood ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
      }`}
      title={`${isPositive ? "Aumento" : "Redução"} de ${Math.abs(delta).toFixed(1)}% vs período anterior`}
    >
      <span className="text-[9px]">{arrow}</span>
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
};

const METRIC_HELP = {
  "Impressões":       "Quantas vezes seu anúncio apareceu nos resultados de busca.",
  "Cliques":          "Quantas pessoas clicaram no seu anúncio do Google.",
  "CTR":              "De cada 100 que viram, quantos clicaram. Quanto maior, melhor.",
  "CPC Médio":        "Custo médio que você pagou por cada clique.",
  "Conversões":       "Ações de valor que aconteceram após o clique (lead, compra, contato).",
  "CPL":              "Custo por lead. Métrica principal — quanto menor, melhor.",
  "Investimento":     "Total gasto em Google Ads no período.",
  "ROAS":             "Retorno sobre investimento. 2x = cada R$1 virou R$2.",
  "Imp. Share":       "Sua fatia da audiência total. 50% = aparece em metade das buscas.",
  "CPM":              "Custo por mil impressões. Quanto menor, mais barato anunciar.",
  "Vendas estimadas": "Calculado: conversões × taxa de conversão cadastrada do cliente.",
  "Faturamento":      "Calculado: vendas estimadas × ticket médio cadastrado.",
};

const KpiCard = ({ label, value, delta, icon: Icon, color, lowerIsBetter, delay = 0, help }) => {
  const helpText = help || METRIC_HELP[label];
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, transition: { duration: 0.15 } }}
    transition={{ type: "spring", stiffness: 120, damping: 16, delay }}
    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-2 cursor-default group"
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
    <div className="flex items-center justify-between min-h-[16px]">
      <span className="text-[11px] text-zinc-600">vs período anterior</span>
      <DeltaBadge delta={delta} lowerIsBetter={lowerIsBetter} />
    </div>
  </motion.div>
  );
};

const StatusDot = ({ status }) => {
  const isActive = status === "ENABLED" || status === "Ativo";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isActive ? "text-emerald-400" : "text-zinc-500"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-zinc-600"}`} />
      {isActive ? "Ativo" : "Pausado"}
    </span>
  );
};

// ─────────────────────────────────────────────
// HERO NARRATIVA — frase-resumo do período (Google)
// ─────────────────────────────────────────────
const HeroNarrativa = ({ metrics, period, periodLabel, clientName }) => {
  if (!metrics || metrics.conversas === 0) return null;
  const periodTextMap = {
    daily:   "ontem",
    weekly:  "na semana passada",
    monthly: `em ${periodLabel.toLowerCase()}`,
  };
  const periodText = periodTextMap[period] || periodLabel;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-zinc-900 to-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5"
    >
      <div className="text-sm sm:text-base text-zinc-200 leading-relaxed">
        {clientName && <span className="text-zinc-500">{clientName} · </span>}
        <span className="text-zinc-400">{periodText.charAt(0).toUpperCase() + periodText.slice(1)} você investiu </span>
        <span className="font-bold text-[#C9F80D]">{fBRL0(metrics.gasto)}</span>
        <span className="text-zinc-400"> no Google Ads e gerou </span>
        <span className="font-bold text-emerald-400">{fNum(metrics.conversas)} {metrics.conversas === 1 ? "conversão" : "conversões"}</span>
        <span className="text-zinc-400">. </span>
        {metrics.cpl > 0 && (
          <>
            <span className="text-zinc-400">Custo por conversão: </span>
            <span className="font-bold text-sky-400">{fBRL0(metrics.cpl)}</span>
            <span className="text-zinc-400">.</span>
          </>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// META PROGRESS — anel circular do progresso de conversões
// ─────────────────────────────────────────────
const MetaProgress = ({ atual, meta, color = "#C9F80D" }) => {
  if (!meta || meta <= 0) return null;
  const pct = Math.min(100, (atual / meta) * 100);
  const R = 40;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct / 100);
  const remaining = Math.max(0, meta - atual);
  const status = pct >= 100 ? "Meta batida!" : pct >= 75 ? "Quase lá" : pct >= 40 ? "No ritmo" : "Acelerar";
  const statusColor = pct >= 100 ? "#10B981" : pct >= 75 ? color : pct >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex items-center gap-4"
    >
      <div className="relative shrink-0">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={R} stroke="#27272a" strokeWidth="8" fill="none" />
          <motion.circle
            cx="50" cy="50" r={R}
            stroke={statusColor} strokeWidth="8" fill="none" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold tabular-nums text-zinc-100">{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: statusColor }}>{status}</div>
        <div className="text-sm font-bold text-zinc-100 mb-1">
          <span className="tabular-nums">{fNum(atual)}</span>
          <span className="text-zinc-500"> / {fNum(meta)} conversões</span>
        </div>
        <div className="text-[11px] text-zinc-500">
          {pct >= 100 ? `+${fNum(atual - meta)} acima da meta 🎉` : `Faltam ${fNum(remaining)} para bater a meta`}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// SCORE DE SAÚDE — Google Ads
// ─────────────────────────────────────────────
const computeScore = ({ metrics, delta, targets }) => {
  let score = 0;
  const signals = [];

  if (metrics.conversas > 0 && targets?.target_cpl_max > 0) {
    const ratio = metrics.cpl / targets.target_cpl_max;
    if (ratio <= 0.7)      { score += 40; signals.push({ ok: true,  msg: "CPL ótimo" }); }
    else if (ratio <= 1.0) { score += 28; signals.push({ ok: true,  msg: "CPL dentro do target" }); }
    else if (ratio <= 1.3) { score += 12; signals.push({ ok: false, msg: "CPL acima do target" }); }
    else                   { score += 0;  signals.push({ ok: false, msg: "CPL muito alto" }); }
  } else if (metrics.conversas > 0) {
    score += 25; signals.push({ ok: true, msg: "Sem CPL alvo cadastrado" });
  }

  if (delta?.conversas != null) {
    if (delta.conversas >= 20)      { score += 30; signals.push({ ok: true,  msg: "Conversões crescendo forte" }); }
    else if (delta.conversas >= 0)  { score += 20; signals.push({ ok: true,  msg: "Conversões estáveis" }); }
    else if (delta.conversas >= -15){ score += 8;  signals.push({ ok: false, msg: "Conversões em queda" }); }
    else                            { score += 0;  signals.push({ ok: false, msg: "Conversões caíram muito" }); }
  } else if (metrics.conversas > 0) score += 18;

  if (targets?.target_conversas > 0) {
    const pct = (metrics.conversas / targets.target_conversas) * 100;
    if (pct >= 100)      { score += 30; signals.push({ ok: true,  msg: "Meta batida" }); }
    else if (pct >= 75)  { score += 22; signals.push({ ok: true,  msg: "Quase batendo meta" }); }
    else if (pct >= 40)  { score += 12; signals.push({ ok: false, msg: "Metade da meta" }); }
    else                 { score += 0;  signals.push({ ok: false, msg: "Longe da meta" }); }
  } else if (metrics.conversas > 0) score += 18;

  return { score: Math.round(score), signals };
};

const ScoreSaude = ({ metrics, delta, targets }) => {
  if (!metrics || metrics.conversas === 0) return null;
  const { score, signals } = computeScore({ metrics, delta, targets });
  const status = score >= 80
    ? { label: "Saudável",  color: "#10B981", icon: CheckCircle2, desc: "Campanha indo muito bem" }
    : score >= 50
      ? { label: "Atenção",  color: "#F59E0B", icon: AlertCircle, desc: "Há sinais a observar" }
      : { label: "Crítico",  color: "#EF4444", icon: XCircle,     desc: "Precisa otimização" };
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
// INSIGHTS — Google Ads
// ─────────────────────────────────────────────
const generateInsights = ({ metrics, delta, targets, campaigns, keywords }) => {
  const insights = [];

  if (delta?.gasto != null && delta?.conversas != null && metrics.conversas > 0) {
    if (delta.gasto < -5 && delta.conversas >= 0) {
      insights.push({ type: "win", icon: "💰", msg: `Você economizou ${Math.abs(delta.gasto).toFixed(0)}% em verba sem perder conversões` });
    }
  }
  if (delta?.cpl != null && delta.cpl < -5) {
    insights.push({ type: "win", icon: "📉", msg: `CPL caiu ${Math.abs(delta.cpl).toFixed(0)}% — campanha mais eficiente` });
  } else if (delta?.cpl != null && delta.cpl > 15) {
    insights.push({ type: "alert", icon: "📈", msg: `CPL subiu ${delta.cpl.toFixed(0)}% — revisar palavras-chave e lances` });
  }
  if (delta?.conversas != null && delta.conversas >= 20) {
    insights.push({ type: "win", icon: "🚀", msg: `Conversões cresceram ${delta.conversas.toFixed(0)}% — considere aumentar investimento` });
  } else if (delta?.conversas != null && delta.conversas <= -20) {
    insights.push({ type: "alert", icon: "⚠️", msg: `Conversões caíram ${Math.abs(delta.conversas).toFixed(0)}% — atenção urgente` });
  }
  if (targets?.target_conversas > 0) {
    const pct = (metrics.conversas / targets.target_conversas) * 100;
    if (pct >= 100) insights.push({ type: "win", icon: "🎯", msg: `Meta de ${fNum(targets.target_conversas)} conversões batida` });
    else if (pct >= 80) {
      const faltam = targets.target_conversas - metrics.conversas;
      insights.push({ type: "info", icon: "🎯", msg: `Faltam apenas ${fNum(faltam)} conversões pra meta` });
    }
  }
  if (campaigns?.campaigns?.length > 0) {
    const withConv = campaigns.campaigns.filter((c) => c.conversas > 0 && c.cpl > 0);
    if (withConv.length > 0) {
      const best = [...withConv].sort((a, b) => a.cpl - b.cpl)[0];
      insights.push({ type: "info", icon: "🏆", msg: `Melhor campanha: "${best.name}" com CPL ${fBRL(best.cpl)}` });
    }
  }
  if (metrics.impressionShare != null && metrics.impressionShare < 30 && metrics.impressoes > 1000) {
    insights.push({ type: "alert", icon: "👁️", msg: `Imp. Share de ${fPct(metrics.impressionShare)} — você aparece em menos de 1/3 das buscas` });
  }
  return insights.slice(0, 4);
};

const InsightsBox = ({ metrics, delta, targets, campaigns }) => {
  const insights = generateInsights({ metrics, delta, targets, campaigns });
  if (insights.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#C9F80D]" />
        <h3 className="text-sm font-bold text-zinc-100">Insights automáticos</h3>
        <span className="text-[10px] text-zinc-500">· análise da campanha</span>
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
// CAMPAIGN HIGHLIGHTS — Google Ads
// ─────────────────────────────────────────────
const CampaignHighlights = ({ campaigns }) => {
  if (!campaigns?.campaigns || campaigns.campaigns.length < 2) return null;
  const withConv = campaigns.campaigns.filter((c) => c.conversas > 0 && c.cpl > 0);
  if (withConv.length < 2) return null;
  const sorted = [...withConv].sort((a, b) => a.cpl - b.cpl);
  const best = sorted[0], worst = sorted[sorted.length - 1];
  if (best.name === worst.name) return null;

  const HCard = ({ label, c, color, icon, kind }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-zinc-900 border rounded-2xl p-4 ${kind === "best" ? "border-emerald-500/30" : "border-amber-500/30"}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
      </div>
      <div className="text-sm font-bold text-zinc-100 truncate mb-2" title={c.name}>{c.name}</div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider">CPL</div>
          <div className="text-sm font-mono font-bold tabular-nums" style={{ color }}>{fBRL(c.cpl)}</div>
        </div>
        <div>
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Conv.</div>
          <div className="text-sm font-mono tabular-nums text-zinc-200">{fNum(c.conversas)}</div>
        </div>
        <div>
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Gasto</div>
          <div className="text-sm font-mono tabular-nums text-zinc-200">{fBRL0(c.gasto)}</div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div>
      <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Destaques de campanha</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <HCard label="Melhor performance" c={best} color="#10B981" icon="🏆" kind="best" />
        <HCard label="Precisa de atenção" c={worst} color="#F59E0B" icon="⚠️" kind="worst" />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CPL STATUS — semáforo simples
// ─────────────────────────────────────────────
const CplStatus = ({ cpl, conversas, targetCplMax = 0 }) => {
  const limOtimo = targetCplMax > 0 ? targetCplMax * 0.7 : 20;
  const limOk = targetCplMax > 0 ? targetCplMax : 40;
  let status, color, Icon, bg;

  if (conversas === 0) {
    status = "Sem conversões no período"; color = "text-zinc-400"; bg = "bg-zinc-800/50 border-zinc-700/50"; Icon = AlertCircle;
  } else if (cpl <= limOtimo) {
    status = targetCplMax > 0 ? "CPL Ótimo — abaixo de 70% do target" : "CPL Ótimo — performance excelente";
    color = "text-emerald-400"; bg = "bg-emerald-500/10 border-emerald-500/20"; Icon = CheckCircle2;
  } else if (cpl <= limOk) {
    status = targetCplMax > 0 ? `CPL dentro do target (${fBRL0(targetCplMax)})` : "CPL Dentro do esperado";
    color = "text-amber-400"; bg = "bg-amber-500/10 border-amber-500/20"; Icon = AlertCircle;
  } else {
    status = targetCplMax > 0 ? `CPL Alto — acima do target ${fBRL0(targetCplMax)}` : "CPL Alto — revisar palavras-chave";
    color = "text-red-400"; bg = "bg-red-500/10 border-red-500/20"; Icon = XCircle;
  }

  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border ${bg}`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-sm font-semibold ${color}`}>{status}</span>
      {conversas > 0 && (
        <span className="ml-auto text-xs text-zinc-500">CPL: {fBRL0(cpl)}</span>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// TREND CHART
// ─────────────────────────────────────────────

const TrendChart = ({ days }) => {
  const W   = 800;
  const H   = 160;
  const PAD = 14;

  const clicksData = (days || []).map((d) => d.cliques   || 0);
  const convsData  = (days || []).map((d) => d.conversas || 0);

  const clicksLine = buildPolyline(clicksData, W, H, PAD);
  const convsLine  = buildPolyline(convsData,  W, H, PAD);
  const clicksArea = buildAreaPath(clicksData, W, H, PAD);
  const convsArea  = buildAreaPath(convsData,  W, H, PAD);

  const gridLines = [0.2, 0.4, 0.6, 0.8].map((r) =>
    (PAD + (H - PAD * 2) * (1 - r)).toFixed(1)
  );

  // Build x-axis date labels (first, ~1/4, ~1/2, ~3/4, last)
  const labels = [];
  if (days && days.length > 0) {
    const indices = [0, Math.floor(days.length / 4), Math.floor(days.length / 2), Math.floor((days.length * 3) / 4), days.length - 1];
    for (const i of indices) {
      const d = days[i];
      if (d?.date) {
        const parts = d.date.split("-");
        labels.push(`${parts[2]}/${parts[1]}`);
      }
    }
  } else {
    labels.push(...["Dia 1", "Dia 8", "Dia 15", "Dia 22", "Dia 30"]);
  }

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        <defs>
          <linearGradient id="ggrad-clicks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOOGLE_BLUE} stopOpacity="0.35" />
            <stop offset="100%" stopColor={GOOGLE_BLUE} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="ggrad-convs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridLines.map((y, i) => (
          <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 4" />
        ))}

        {clicksArea && <path d={clicksArea} fill="url(#ggrad-clicks)" />}
        {convsArea  && <path d={convsArea}  fill="url(#ggrad-convs)" />}

        {clicksLine && <polyline points={clicksLine} fill="none" stroke={GOOGLE_BLUE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {convsLine  && <polyline points={convsLine}  fill="none" stroke="#10B981"     strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
      </svg>

      <div className="flex justify-between px-[14px] mt-1">
        {labels.map((l, i) => (
          <span key={i} className="text-[10px] text-zinc-600">{l}</span>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// GOOGLE FUNNEL VIZ
// ─────────────────────────────────────────────

const GoogleFunnelViz = ({ metrics }) => {
  const fNum = (v) => (v || 0).toLocaleString("pt-BR");
  const stages = [
    { label: "Impressões", value: metrics.impressoes || 0, color: "#4285F4" },
    { label: "Cliques",    value: metrics.cliques    || 0, color: "#C9F80D" },
    { label: "Conversões", value: metrics.conversas  || 0, color: "#10B981" },
  ];

  const W = 440;
  const stageH = 72;
  const gapH = 12;
  const maxVal = Math.max(1, stages[0].value);
  const minW = 72;
  const maxW = W * 0.92;

  const widths = stages.map((s) => {
    const ratio = Math.max(0, s.value) / maxVal;
    return minW + (maxW - minW) * Math.sqrt(ratio);
  });

  const svgH = stages.length * (stageH + gapH) + 10;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${svgH}`} className="w-full" style={{ maxHeight: 280 }}>
        <defs>
          {stages.map((s, i) => (
            <linearGradient key={i} id={`gfunnel-grad-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={s.color} stopOpacity="0.06" />
              <stop offset="50%"  stopColor={s.color} stopOpacity="0.26" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.06" />
            </linearGradient>
          ))}
          {stages.map((s, i) => (
            <linearGradient key={`gs-${i}`} id={`gfunnel-stroke-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={s.color} stopOpacity="0.25" />
              <stop offset="50%"  stopColor={s.color} stopOpacity="0.85" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.25" />
            </linearGradient>
          ))}
        </defs>

        {stages.map((stage, i) => {
          const y = i * (stageH + gapH);
          const w = widths[i];
          const nextW = i < stages.length - 1 ? widths[i + 1] : w * 0.55;
          const x1 = (W - w) / 2;
          const x2 = (W + w) / 2;
          const nx1 = (W - nextW) / 2;
          const nx2 = (W + nextW) / 2;

          const prevVal = i > 0 ? stages[i - 1].value : null;
          const convRate = prevVal != null && prevVal > 0
            ? ((stage.value / prevVal) * 100).toFixed(1)
            : null;

          return (
            <g key={i}>
              <path d={`M ${x1} ${y} L ${x2} ${y} L ${nx2} ${y + stageH} L ${nx1} ${y + stageH} Z`}
                fill={`url(#gfunnel-grad-${i})`} />
              <path d={`M ${x1} ${y} L ${x2} ${y} L ${nx2} ${y + stageH} L ${nx1} ${y + stageH} Z`}
                fill="none" stroke={`url(#gfunnel-stroke-${i})`} strokeWidth="1.5" />

              <text x={x1 - 10} y={y + stageH / 2 - 6} textAnchor="end" fill={stage.color}
                fontSize="10" fontFamily="system-ui, sans-serif" fontWeight="600" opacity="0.9">
                {stage.label}
              </text>
              <text x={W / 2} y={y + stageH / 2 + 6} textAnchor="middle" fill="white"
                fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="700">
                {fNum(stage.value)}
              </text>

              {convRate && (
                <text x={x2 + 10} y={y + stageH / 2 - 6} textAnchor="start" fill={stage.color}
                  fontSize="10" fontFamily="system-ui, sans-serif" fontWeight="600" opacity="0.8">
                  {convRate}%
                </text>
              )}
              {convRate && (
                <text x={x2 + 10} y={y + stageH / 2 + 7} textAnchor="start" fill="#6B7280"
                  fontSize="8.5" fontFamily="system-ui, sans-serif">
                  conv.
                </text>
              )}

              {i < stages.length - 1 && (
                <line x1={W / 2} y1={y + stageH} x2={W / 2} y2={y + stageH + gapH}
                  stroke={stages[i + 1].color} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="2,2" />
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-[11px] text-zinc-400">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function GoogleDashboardPage() {
  const { user, logout, authFetch } = useAuth();
  const [period,    setPeriod]    = useState("monthly");
  const [sortCol,   setSortCol]   = useState(null);
  const [sortDir,   setSortDir]   = useState("desc");

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [exporting,  setExporting]  = useState(false);
  const [data,       setData]       = useState(null);      // /api/google/insights
  const [trendData,  setTrendData]  = useState(null);      // /api/google/trend
  const [campaigns,  setCampaigns]  = useState(null);      // /api/google/campaigns
  const [keywords,   setKeywords]   = useState(null);      // /api/google/keywords
  const [adGroups,   setAdGroups]   = useState(null);      // /api/google/adgroups
  const [devices,    setDevices]    = useState(null);      // /api/google/devices
  const [adsData,    setAdsData]    = useState(null);      // /api/google/ads
  const [youtube,    setYoutube]    = useState(null);      // /api/google/youtube
  const [kwSearch,   setKwSearch]   = useState("");

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  // Derive the client ID — admins must pass ?client= in the URL
  const params    = new URLSearchParams(window.location.search);
  const clientId  = user.role === "client" ? user.clientId : (params.get("client") || user.clientId);

  const handleExportMonthly = async () => {
    if (!clientId || exporting) return;
    setExporting(true);
    try {
      const res  = await authFetch(`/api/report/monthly?client=${clientId}`);
      const json = await res.json();
      if (!json.html) throw new Error(json.error || "Erro ao gerar relatório");
      const blob = new Blob([json.html], { type: "text/html;charset=utf-8" });
      const url  = URL.createObjectURL(blob);
      const win  = window.open(url, "_blank");
      if (!win) {
        const a = document.createElement("a");
        a.href = url;
        a.download = "relatorio-mensal-google.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
    } catch (err) {
      alert(`Não foi possível gerar o relatório:\n${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const [insRes, trendRes, campRes, kwRes, agRes, devRes, adsRes, ytRes] = await Promise.all([
        authFetch(`/api/google/insights?client=${clientId}&period=${period}`),
        authFetch(`/api/google/trend?client=${clientId}`),
        authFetch(`/api/google/campaigns?client=${clientId}&period=${period}`),
        authFetch(`/api/google/keywords?client=${clientId}&period=${period}`),
        authFetch(`/api/google/adgroups?client=${clientId}&period=${period}`),
        authFetch(`/api/google/devices?client=${clientId}&period=${period}`),
        authFetch(`/api/google/ads?client=${clientId}&period=${period}`),
        authFetch(`/api/google/youtube?client=${clientId}&period=${period}`),
      ]);

      const [ins, trend, camp, kw, ag, dev, ads, yt] = await Promise.all([
        insRes.json(),
        trendRes.json(),
        campRes.json(),
        kwRes.json(),
        agRes.json(),
        devRes.json(),
        adsRes.json(),
        ytRes.json(),
      ]);

      setData(ins);
      setTrendData(trend);
      setCampaigns(camp);
      setKeywords(kw);
      setAdGroups(ag);
      setDevices(dev);
      setAdsData(ads);
      setYoutube(yt);
    } catch (err) {
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [clientId, period, authFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const TABLE_HEADERS = [
    { key: "name",      label: "Campanha" },
    { key: "status",    label: "Status" },
    { key: "gasto",     label: "Investimento" },
    { key: "cliques",   label: "Cliques" },
    { key: "ctr",       label: "CTR" },
    { key: "cpc",       label: "CPC" },
    { key: "conversas", label: "Conv." },
    { key: "cpl",       label: "CPL" },
  ];

  // Sort campaigns table
  const sortedCampaigns = campaigns?.campaigns
    ? [...campaigns.campaigns].sort((a, b) => {
        if (!sortCol) return 0;
        const av = a[sortCol];
        const bv = b[sortCol];
        if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      })
    : [];

  const m = data?.metrics || {};

  // Build KPI array from real data
  const kpiData = data?.hasData
    ? [
        { label: "Impressões",       value: fNum(m.impressoes),   delta: data.delta?.impressoes ?? null, icon: Eye,          color: "#0ea5e9", lowerIsBetter: false },
        { label: "Cliques",          value: fNum(m.cliques),      delta: data.delta?.cliques    ?? null, icon: MousePointer, color: GOOGLE_BLUE, lowerIsBetter: false },
        { label: "CTR",              value: fPct(m.ctr),          delta: null,                           icon: Target,       color: "#C9F80D", lowerIsBetter: false },
        { label: "CPC Médio",        value: fBRL(m.cpc),          delta: null,                           icon: DollarSign,   color: "#22c55e", lowerIsBetter: true },
        { label: "Conversões",       value: fNum(m.conversas),    delta: data.delta?.conversas  ?? null, icon: Zap,          color: "#10b981", lowerIsBetter: false },
        { label: "CPL",              value: m.cpl > 0 ? fBRL(m.cpl) : "—", delta: data.delta?.cpl ?? null, icon: Target, color: "#f97316", lowerIsBetter: true },
        { label: "Investimento",     value: fBRL0(m.gasto),       delta: data.delta?.gasto      ?? null, icon: DollarSign,   color: "#f59e0b", lowerIsBetter: false },
        ...(m.roas != null ? [{ label: "ROAS", value: `${(m.roas).toFixed(2)}x`, delta: data.delta?.roas ?? null, icon: TrendingUp, color: "#a855f7", lowerIsBetter: false }] : []),
        ...(m.impressionShare != null ? [{ label: "Imp. Share", value: fPct(m.impressionShare), delta: null, icon: BarChart3, color: "#06b6d4", lowerIsBetter: false }] : []),
      ]
    : [];

  // ── Not-configured state (no Customer ID set for this client)
  const notConfigured = data && data.configured === false;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Meta Ads</span>
          </a>

          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 p-1.5 rounded-md border border-zinc-800">
              <Logo className="w-4 h-4 text-[#C9F80D]" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">
              Focus<span className="text-[#C9F80D]">Dashboard</span>
            </span>
            <span className="text-zinc-600 hidden sm:block">|</span>
            <span className="text-sm font-semibold hidden sm:block" style={{ color: GOOGLE_BLUE }}>
              Google Ads
            </span>
          </div>

          <div className="ml-2 sm:ml-4 overflow-hidden">
            <PlatformNav active="google" />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:block">{user.name}</span>
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

        {/* ── LOADING ── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-sm text-zinc-500">Carregando Google Ads...</span>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {!loading && error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            <span className="font-semibold">Erro:</span> {error}
            <button onClick={fetchData} className="ml-auto underline text-xs">Tentar novamente</button>
          </div>
        )}

        {/* ── NO CLIENT SELECTED (admin without ?client= param) ── */}
        {!loading && !error && !clientId && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-6"
          >
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Settings className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">Nenhum cliente selecionado</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Selecione um cliente no painel principal para visualizar os dados do Google Ads.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── NOT CONFIGURED ── */}
        {!loading && !error && clientId && notConfigured && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-6"
          >
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Settings className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">Google Ads não configurado</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Configure o Customer ID do Google Ads nas configurações do cliente para começar a ver os dados reais.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── MAIN DATA VIEW ── */}
        {!loading && !error && clientId && !notConfigured && (
          <>
            {/* Period selector row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="relative">
                {/* Glow azul Google sutil */}
                <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full opacity-[0.05] blur-3xl pointer-events-none bg-[#4285F4]" />
                <h1 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2 relative">
                  <span>🔵</span>
                  <span>
                    {data?.client ? (
                      <>Olá, <span className="text-[#4285F4]">{data.client}</span></>
                    ) : "Visão geral"}
                  </span>
                </h1>
                <div className="flex items-center gap-2 mt-1.5 relative">
                  <span className="text-xs text-zinc-500">Campanhas <span className="text-[#4285F4]">Google Ads</span></span>
                  <span className="w-1 h-1 rounded-full bg-[#4285F4]" />
                  <span className="text-xs text-zinc-600">{getDateRange(period)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Period selector */}
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                  {PERIODS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPeriod(p.id)}
                      className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        period === p.id
                          ? "text-zinc-100 border border-zinc-700"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      style={period === p.id ? { background: GOOGLE_BLUE + "22" } : {}}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Date range badge */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="text-xs font-medium text-zinc-300">
                    {getDateRange(period)}
                  </span>
                </div>

                {/* Export */}
                <button
                  onClick={handleExportMonthly}
                  disabled={exporting || !clientId}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: exporting ? "#C9F80D22" : "#C9F80D15",
                    borderColor: "#C9F80D50",
                    color: "#C9F80D",
                  }}
                  title="Exportar relatório mensal"
                >
                  {exporting
                    ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    : <FileDown className="w-3.5 h-3.5" />
                  }
                  <span className="hidden sm:inline">{exporting ? "Gerando..." : "Exportar Relatório"}</span>
                </button>
              </div>
            </motion.div>

            {/* ── NO DATA STATE ── */}
            {data && !data.hasData && (
              <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl px-4 py-3 text-sm">
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Sem dados para o período selecionado.</span>
              </div>
            )}

            {/* ── HERO NARRATIVA ── */}
            {data?.hasData && (
              <HeroNarrativa
                metrics={m}
                period={period}
                periodLabel={getDateRange(period)}
                clientName={data?.client}
              />
            )}

            {/* ── SCORE SAÚDE + META PROGRESS + CPL STATUS ── */}
            {data?.hasData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <ScoreSaude metrics={m} delta={data.delta} targets={data.targets} />
                {data.targets?.target_conversas > 0 && (
                  <MetaProgress atual={m.conversas} meta={data.targets.target_conversas} color="#C9F80D" />
                )}
                <CplStatus cpl={m.cpl} conversas={m.conversas} targetCplMax={data.targets?.target_cpl_max || 0} />
              </div>
            )}

            {/* ── INSIGHTS AUTOMÁTICOS ── */}
            {data?.hasData && (
              <InsightsBox metrics={m} delta={data.delta} targets={data.targets} campaigns={campaigns} />
            )}

            {/* ── RESULTADO DE NEGÓCIO ── */}
            {data?.hasData && (() => {
              const taxa = data.targets?.taxa_conversao ?? 0.1;
              const ticket = data.targets?.ticket_medio ?? 0;
              const vendas = Math.floor(m.conversas * taxa);
              const faturamento = vendas * ticket;
              const hasTicket = ticket > 0;
              return (
                <div>
                  <p className="text-[11px] text-[#C9F80D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Resultado de negócio
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    <KpiCard
                      label="Conversões"
                      value={fNum(m.conversas)}
                      delta={data.delta?.conversas ?? null}
                      icon={Zap}
                      color="#10b981"
                      delay={0}
                    />
                    <KpiCard
                      label="Vendas estimadas"
                      value={fNum(vendas)}
                      icon={ShoppingBag}
                      color="#06B6D4"
                      delay={0.05}
                    />
                    {hasTicket ? (
                      <>
                        <KpiCard
                          label="Faturamento"
                          value={fBRL0(faturamento)}
                          icon={Banknote}
                          color="#C9F80D"
                          delay={0.1}
                        />
                        <KpiCard
                          label="ROAS"
                          value={m.gasto > 0 ? `${(faturamento / m.gasto).toFixed(2)}x` : "—"}
                          icon={TrendingUp}
                          color={m.gasto > 0 && faturamento >= m.gasto ? "#10B981" : "#EF4444"}
                          delay={0.15}
                        />
                      </>
                    ) : (
                      <div className="col-span-2 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-zinc-300">Cadastre o ticket médio</div>
                          <div className="text-[10px] text-zinc-500">Em Admin → Cliente → Metas, pra ver Faturamento + ROAS</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── INVESTIMENTO E TRÁFEGO ── */}
            {kpiData.length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Investimento e tráfego</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <KpiCard label="Investimento" value={fBRL0(m.gasto)} delta={data.delta?.gasto ?? null} icon={DollarSign} color="#f59e0b" delay={0} />
                  <KpiCard label="Impressões"   value={fNum(m.impressoes)} delta={data.delta?.impressoes ?? null} icon={Eye} color="#0ea5e9" delay={0.05} />
                  <KpiCard label="Cliques"      value={fNum(m.cliques)} delta={data.delta?.cliques ?? null} icon={MousePointer} color="#4285F4" delay={0.08} />
                  {m.impressionShare != null
                    ? <KpiCard label="Imp. Share" value={fPct(m.impressionShare)} icon={BarChart3} color="#06b6d4" delay={0.11} />
                    : <KpiCard label="CTR" value={fPct(m.ctr)} icon={Target} color="#C9F80D" delay={0.11} />}
                </div>
              </div>
            )}

            {/* ── EFICIÊNCIA ── */}
            {kpiData.length > 0 && (
              <div>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Eficiência</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <KpiCard label="CPL"       value={m.cpl > 0 ? fBRL(m.cpl) : "—"} delta={data.delta?.cpl ?? null} icon={Target} color="#f97316" lowerIsBetter delay={0} />
                  <KpiCard label="CPC Médio" value={fBRL(m.cpc)} icon={DollarSign} color="#22c55e" lowerIsBetter delay={0.05} />
                  <KpiCard label="CTR"       value={fPct(m.ctr)} icon={Target} color="#C9F80D" delay={0.08} />
                  <KpiCard label="CPM"       value={m.impressoes > 0 ? fBRL(m.cpm) : "—"} icon={BarChart3} color="#A78BFA" lowerIsBetter delay={0.11} />
                </div>
              </div>
            )}

            {/* ── FUNNEL + TREND CHART ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* FUNNEL */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">Funil de Conversão</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Impressões → Cliques → Conversões</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{ background: GOOGLE_BLUE + "20", color: GOOGLE_BLUE }}>
                    Google Ads
                  </div>
                </div>

                <GoogleFunnelViz metrics={m} />

                <div className="mt-4 grid grid-cols-2 gap-2 pt-4 border-t border-zinc-800">
                  <div className="text-center">
                    <div className="text-lg font-bold" style={{ color: GOOGLE_BLUE }}>
                      {m.impressoes > 0 ? ((m.cliques / m.impressoes) * 100).toFixed(2) + "%" : "—"}
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">Impressão → Clique (CTR)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-400">
                      {m.cliques > 0 ? ((m.conversas / m.cliques) * 100).toFixed(2) + "%" : "—"}
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-0.5">Clique → Conversão</div>
                  </div>
                </div>
              </motion.div>

              {/* TREND CHART */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">Evolução 30 dias — Cliques vs Conversões</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Tendência diária do período</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 rounded-full" style={{ background: GOOGLE_BLUE, display: "inline-block" }} />
                      <span className="text-xs text-zinc-400">Cliques</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-xs text-zinc-400">Conversões</span>
                    </div>
                  </div>
                </div>
                <TrendChart days={trendData?.days || []} />
              </motion.div>

            </div>

            {/* ── DEVICE BREAKDOWN ── */}
            {devices?.hasData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-zinc-100">Performance por Dispositivo</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Distribuição de cliques e investimento</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(devices.devices || []).map((d, i) => (
                    <motion.div
                      key={d.device}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.37 + i * 0.06 }}
                      className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{d.emoji}</span>
                        <span className="text-sm font-semibold text-zinc-200">{d.label}</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-zinc-500">Cliques</span>
                            <span className="text-zinc-300 font-medium">{fNum(d.cliques)} <span className="text-zinc-500">({d.shareCliques.toFixed(0)}%)</span></span>
                          </div>
                          <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${d.shareCliques}%`, background: d.color }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-zinc-500">Investimento</span>
                            <span className="text-zinc-300 font-medium">{fBRL0(d.gasto)} <span className="text-zinc-500">({d.shareGasto.toFixed(0)}%)</span></span>
                          </div>
                          <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${d.shareGasto}%`, background: d.color }} />
                          </div>
                        </div>
                        <div className="flex justify-between text-[11px] pt-1 border-t border-zinc-700/50">
                          <span className="text-zinc-500">CTR</span>
                          <span className="text-zinc-300">{fPct(d.ctr)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">CPC</span>
                          <span className="text-zinc-300">{fBRL(d.cpc)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-zinc-500">Conv.</span>
                          <span className="text-zinc-300 font-semibold">{fNum(d.conversas)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── CAMPAIGN HIGHLIGHTS — Best / Worst ── */}
            {campaigns?.campaigns?.length > 1 && (
              <CampaignHighlights campaigns={campaigns} />
            )}

            {/* ── CAMPAIGNS TABLE ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <div className="px-4 sm:px-5 py-4 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">Campanhas</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {sortedCampaigns.length} {sortedCampaigns.length === 1 ? "campanha" : "campanhas"} no período
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-400">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Google Ads</span>
                </div>
              </div>

              {sortedCampaigns.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-zinc-600">
                  Sem campanhas com dados para o período selecionado.
                </div>
              ) : (
                <div className="overflow-x-auto -mx-px">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {TABLE_HEADERS.map((h) => (
                          <th
                            key={h.key}
                            onClick={() => handleSort(h.key)}
                            className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors whitespace-nowrap select-none"
                          >
                            <span className="flex items-center gap-1">
                              {h.label}
                              {sortCol === h.key ? (
                                sortDir === "asc"
                                  ? <ChevronUp className="w-3 h-3" />
                                  : <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3 opacity-30" />
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCampaigns.map((c, i) => (
                        <motion.tr
                          key={`${c.name}-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + i * 0.05 }}
                          className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="px-4 py-3.5 font-medium text-zinc-200 whitespace-nowrap max-w-[220px]">
                            <span className="truncate block">{c.name}</span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <StatusDot status={c.status} />
                          </td>
                          <td className="px-4 py-3.5 text-zinc-300 font-medium whitespace-nowrap">{fBRL0(c.gasto)}</td>
                          <td className="px-4 py-3.5 text-zinc-300 whitespace-nowrap">{fNum(c.cliques)}</td>
                          <td className="px-4 py-3.5 text-zinc-300 whitespace-nowrap">{fPct(c.ctr)}</td>
                          <td className="px-4 py-3.5 text-zinc-300 whitespace-nowrap">{fBRL(c.cpc)}</td>
                          <td className="px-4 py-3.5 text-zinc-300 font-semibold whitespace-nowrap">{fNum(c.conversas)}</td>
                          <td className="px-4 py-3.5 text-zinc-300 whitespace-nowrap">
                            {c.cpl > 0 ? fBRL(c.cpl) : "—"}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* ── YOUTUBE ADS ── */}
            {youtube && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.43 }}
                className="space-y-4"
              >
                {/* Section header — always visible when youtube object exists */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: YOUTUBE_RED + "20" }}>
                    <PlayCircle className="w-4 h-4" style={{ color: YOUTUBE_RED }} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">YouTube Ads</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Campanhas de vídeo no período</p>
                  </div>
                </div>

                {/* Error state */}
                {youtube.error && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <span className="text-base">⚠️</span>
                    <span><strong>Erro ao buscar dados YouTube:</strong> {youtube.error}</span>
                  </div>
                )}

                {/* No video campaigns in period */}
                {!youtube.error && youtube.configured && !youtube.hasData && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <PlayCircle className="w-10 h-10 text-zinc-700" />
                    <p className="text-sm font-medium text-zinc-400">Nenhuma campanha de vídeo no período selecionado</p>
                    <p className="text-xs text-zinc-600">Crie uma campanha de tipo "Vídeo" no Google Ads para ver os dados aqui</p>
                  </div>
                )}

                {/* Not configured */}
                {!youtube.error && youtube.configured === false && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <PlayCircle className="w-10 h-10 text-zinc-700" />
                    <p className="text-sm font-medium text-zinc-400">Google Ads não configurado para este cliente</p>
                  </div>
                )}

                {/* Has data — KPIs + table */}
                {youtube.hasData && (() => {
                  const yt = youtube.totals || {};
                  const ytKpis = [
                    { label: "Views",        value: fNum(yt.views),                           color: YOUTUBE_RED,  icon: PlayCircle },
                    { label: "View Rate",    value: fPct(yt.viewRate),                        color: "#f97316",    icon: Eye        },
                    { label: "CPV Médio",    value: yt.cpv != null ? fBRL(yt.cpv) : "—",     color: "#f59e0b",    icon: DollarSign, lowerIsBetter: true },
                    { label: "Conversões",   value: fNum(yt.conversas),                       color: "#10b981",    icon: Zap        },
                    { label: "Investimento", value: fBRL0(yt.gasto),                          color: "#C9F80D",    icon: DollarSign },
                  ];
                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                        {ytKpis.map((k, i) => (
                          <KpiCard key={k.label} label={k.label} value={k.value} icon={k.icon}
                            color={k.color} lowerIsBetter={k.lowerIsBetter} delay={0.44 + i * 0.05} />
                        ))}
                      </div>

                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                          <p className="text-xs text-zinc-500">
                            {(youtube.campaigns || []).length} {(youtube.campaigns || []).length === 1 ? "campanha" : "campanhas"} de vídeo
                          </p>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border"
                            style={{ background: YOUTUBE_RED + "15", borderColor: YOUTUBE_RED + "40", color: YOUTUBE_RED }}>
                            <PlayCircle className="w-3.5 h-3.5" />
                            YouTube
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-zinc-800">
                                {["Campanha", "Status", "Views", "View Rate", "CPV", "Cliques", "Conv.", "Investimento"].map((h) => (
                                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(youtube.campaigns || []).map((c, i) => (
                                <motion.tr
                                  key={`${c.name}-${i}`}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.5 + i * 0.04 }}
                                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                                >
                                  <td className="px-4 py-3 text-zinc-200 font-medium max-w-[220px]">
                                    <span className="flex items-center gap-2">
                                      <PlayCircle className="w-3.5 h-3.5 shrink-0" style={{ color: YOUTUBE_RED }} />
                                      <span className="truncate block">{c.name}</span>
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap"><StatusDot status={c.status} /></td>
                                  <td className="px-4 py-3 text-zinc-100 font-bold whitespace-nowrap">{fNum(c.views)}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                                      style={{ background: YOUTUBE_RED + "15", color: YOUTUBE_RED }}>
                                      {fPct(c.viewRate)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{c.cpv != null ? fBRL(c.cpv) : "—"}</td>
                                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{fNum(c.cliques)}</td>
                                  <td className="px-4 py-3 text-zinc-300 font-semibold whitespace-nowrap">{fNum(c.conversas)}</td>
                                  <td className="px-4 py-3 text-zinc-300 font-medium whitespace-nowrap">{fBRL0(c.gasto)}</td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* ── TOP ADS (RSA/ETA COPY) ── */}
            {adsData?.hasData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.41 }}
              >
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-zinc-100">Top Anúncios</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Copy dos anúncios com mais cliques no período</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {(adsData.ads || []).slice(0, 6).map((ad, i) => (
                    <motion.div
                      key={`${ad.id}-${i}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.43 + i * 0.05 }}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="text-[11px] text-zinc-500 truncate">{ad.campaign} · {ad.adGroup}</p>
                        </div>
                        <StatusDot status={ad.status} />
                      </div>

                      {/* Headlines */}
                      {ad.headlines.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-zinc-400 mb-1">Headlines</p>
                          <div className="space-y-1">
                            {ad.headlines.map((h, j) => (
                              <p key={j} className="text-sm font-semibold text-blue-400 leading-snug">{h}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Descriptions */}
                      {ad.descriptions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-zinc-400 mb-1">Descrições</p>
                          {ad.descriptions.map((d, j) => (
                            <p key={j} className="text-xs text-zinc-400 leading-relaxed">{d}</p>
                          ))}
                        </div>
                      )}

                      {/* Metrics row */}
                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800 flex-wrap">
                        <span className="text-[11px] text-zinc-500">{fNum(ad.cliques)} cliques</span>
                        <span className="text-[11px] text-zinc-600">·</span>
                        <span className="text-[11px] text-zinc-500">CTR {fPct(ad.ctr)}</span>
                        <span className="text-[11px] text-zinc-600">·</span>
                        <span className="text-[11px] text-zinc-500">Conv. {fNum(ad.conversas)}</span>
                        <span className="text-[11px] text-zinc-600">·</span>
                        <span className="text-[11px] text-zinc-300 font-medium">{fBRL0(ad.gasto)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── AD GROUPS + QUALITY SCORE ── */}
            {adGroups?.hasData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.42 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">Grupos de Anúncios</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Performance por grupo · Quality Score de 1 a 10
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" />≥ 7 Bom</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500" />4–6 Médio</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" />≤ 3 Ruim</span>
                  </div>
                </div>
                <div className="overflow-x-auto -mx-px">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {["Grupo", "Campanha", "Status", "QS", "Cliques", "CTR", "CPC", "Conv.", "CPL", "Gasto"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(adGroups.adGroups || []).map((ag, i) => {
                        const qs = ag.qualityScore;
                        const qsColor = qs == null ? "text-zinc-600"
                          : qs >= 7 ? "text-emerald-400"
                          : qs >= 4 ? "text-yellow-400"
                          : "text-red-400";
                        const qsBg = qs == null ? "bg-zinc-800"
                          : qs >= 7 ? "bg-emerald-500/15"
                          : qs >= 4 ? "bg-yellow-500/15"
                          : "bg-red-500/15";
                        return (
                          <motion.tr
                            key={`${ag.name}-${i}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 + i * 0.04 }}
                            className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="px-4 py-3 text-zinc-200 font-medium max-w-[200px]">
                              <span className="truncate block">{ag.name}</span>
                            </td>
                            <td className="px-4 py-3 text-zinc-500 text-xs max-w-[160px]">
                              <span className="truncate block">{ag.campaign}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <StatusDot status={ag.status} />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {qs != null ? (
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${qsBg} ${qsColor}`}>
                                  {qs}
                                </span>
                              ) : (
                                <span className="text-zinc-600 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-zinc-300 font-medium whitespace-nowrap">{fNum(ag.cliques)}</td>
                            <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{fPct(ag.ctr)}</td>
                            <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{fBRL(ag.cpc)}</td>
                            <td className="px-4 py-3 text-zinc-300 font-semibold whitespace-nowrap">{fNum(ag.conversas)}</td>
                            <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{ag.cpl > 0 ? fBRL(ag.cpl) : "—"}</td>
                            <td className="px-4 py-3 text-zinc-300 font-medium whitespace-nowrap">{fBRL0(ag.gasto)}</td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ── SEARCH TERMS / KEYWORDS ── */}
            {keywords?.hasData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.48 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-zinc-800">
                  <h2 className="text-sm font-semibold text-zinc-100">Termos de Pesquisa</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Top 10 palavras-chave que acionaram seus anúncios no período
                  </p>
                </div>
                <div className="overflow-x-auto -mx-px">
                  <table className="w-full text-sm min-w-[580px]">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {["#", "Termo de Pesquisa", "Impressões", "Cliques", "CTR", "CPC", "Conv.", "Gasto"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(keywords.keywords || []).map((k, i) => (
                        <motion.tr
                          key={`${k.termo}-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.04 }}
                          className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-zinc-600 text-xs font-mono w-8">{i + 1}</td>
                          <td className="px-4 py-3 text-zinc-200 font-medium max-w-[260px]">
                            <span className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: GOOGLE_BLUE }} />
                              <span className="truncate block">{k.termo}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{fNum(k.impressoes)}</td>
                          <td className="px-4 py-3 text-zinc-300 font-medium whitespace-nowrap">{fNum(k.cliques)}</td>
                          <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{fPct(k.ctr)}</td>
                          <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{fBRL(k.cpc)}</td>
                          <td className="px-4 py-3 text-zinc-300 font-semibold whitespace-nowrap">{fNum(k.conversas)}</td>
                          <td className="px-4 py-3 text-zinc-300 font-medium whitespace-nowrap">{fBRL0(k.gasto)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ── AD TYPES ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
            >
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-zinc-100">Tipos de anúncios ativos</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Formatos utilizados nas campanhas deste período</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {AD_TYPES.map((ad, i) => (
                  <motion.div
                    key={ad.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.07 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: ad.color + "20" }}
                      >
                        {ad.emoji}
                      </div>
                      <span className="text-sm font-semibold text-zinc-200">{ad.label}</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{ad.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
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
              {" "}— Google Ads
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {!loading && data?.hasData ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-zinc-600">Dados em tempo real · Google Ads API</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: GOOGLE_BLUE }} />
                <span className="text-[11px] text-zinc-600">Google Ads API</span>
              </>
            )}
          </div>
        </motion.footer>

      </main>
    </div>
  );
}
