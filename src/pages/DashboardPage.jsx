import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Eye, Users, MousePointer, MessageCircle,
  TrendingUp, DollarSign, Target, BarChart3, AlertCircle,
  CheckCircle2, XCircle, ExternalLink, ArrowLeft, LogOut, Settings,
  FileDown, Image as ImageIcon, ShoppingBag, Banknote, Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import PlatformNav from "../components/PlatformNav";

const PERIODS = [
  { id: "daily", label: "Diário", sub: "Ontem" },
  { id: "weekly", label: "Semanal", sub: "Semana passada" },
  { id: "monthly", label: "Mensal", sub: "Mês passado" },
];

// ─────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────

const fBRL = (v) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fNum = (v) => Math.round(v).toLocaleString("pt-BR");
const fPct = (v) => v.toFixed(2) + "%";

function getDateRange(period) {
  const today = new Date();
  if (period === "daily") {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  }
  if (period === "weekly") {
    const day = today.getDay(); // 0=dom
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
// HERO NARRATIVA — frase-resumo do período
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
        <span className="font-bold text-[#C9F80D]">R$ {fBRL(metrics.gasto)}</span>
        <span className="text-zinc-400"> e gerou </span>
        <span className="font-bold text-emerald-400">{fNum(metrics.conversas)} {metrics.conversas === 1 ? "conversa" : "conversas"}</span>
        <span className="text-zinc-400"> no WhatsApp. </span>
        {metrics.cpl > 0 && (
          <>
            <span className="text-zinc-400">Custo por lead: </span>
            <span className="font-bold text-sky-400">R$ {fBRL(metrics.cpl)}</span>
            <span className="text-zinc-400">.</span>
          </>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// META PROGRESS — anel circular do progresso de conversas
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
            stroke={statusColor}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
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
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: statusColor }}>
          {status}
        </div>
        <div className="text-sm font-bold text-zinc-100 mb-1">
          <span className="tabular-nums">{fNum(atual)}</span>
          <span className="text-zinc-500"> / {fNum(meta)} conversas</span>
        </div>
        <div className="text-[11px] text-zinc-500">
          {pct >= 100
            ? `+${fNum(atual - meta)} acima da meta 🎉`
            : `Faltam ${fNum(remaining)} para bater a meta`}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────

const DeltaBadge = ({ delta, lowerIsBetter = false }) => {
  if (delta === null || delta === undefined) return null;
  const isPositive = delta >= 0;
  const isGood = lowerIsBetter ? !isPositive : isPositive;
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
      isGood ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
    }`}>
      {isPositive ? "+" : ""}{delta.toFixed(1)}%
    </span>
  );
};

const KpiCard = ({ label, value, sub, icon: Icon, color, delay = 0, delta = null, lowerIsBetter = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, transition: { duration: 0.15 } }}
    transition={{ type: "spring", stiffness: 120, damping: 16, delay }}
    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-2 cursor-default"
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="p-1.5 rounded-lg" style={{ background: color + "20" }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </span>
    </div>
    <div className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">{value}</div>
    <div className="flex items-center justify-between min-h-[16px]">
      <div className="text-[11px] text-zinc-500">
        {delta !== null && delta !== undefined ? "vs período anterior" : (sub || "")}
      </div>
      <DeltaBadge delta={delta} lowerIsBetter={lowerIsBetter} />
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────
// FUNNEL VISUALIZATION
// ─────────────────────────────────────────────

const FunnelViz = ({ metrics, clientColor }) => {
  const stages = [
    { label: "Impressões", value: metrics.impressoes, icon: Eye, color: "#8B5CF6" },
    { label: "Alcance", value: metrics.alcance, icon: Users, color: "#3B82F6" },
    { label: "Cliques", value: metrics.cliques, icon: MousePointer, color: "#06B6D4" },
    { label: "Conversas", value: metrics.conversas, icon: MessageCircle, color: "#10B981" },
  ];

  const W = 440;
  const stageH = 68;
  const gapH = 10;
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
      <svg viewBox={`0 0 ${W} ${svgH}`} className="w-full" style={{ maxHeight: 340 }}>
        <defs>
          {stages.map((s, i) => (
            <linearGradient key={i} id={`funnel-grad-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.08" />
              <stop offset="50%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.08" />
            </linearGradient>
          ))}
          {stages.map((s, i) => (
            <linearGradient key={`stroke-${i}`} id={`funnel-stroke-${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
              <stop offset="50%" stopColor={s.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.3" />
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
          const convRate =
            prevVal != null && prevVal > 0
              ? ((stage.value / prevVal) * 100).toFixed(1)
              : null;

          const Icon = stage.icon;

          return (
            <g key={i}>
              {/* Trapezoid shape */}
              <path
                d={`M ${x1} ${y} L ${x2} ${y} L ${nx2} ${y + stageH} L ${nx1} ${y + stageH} Z`}
                fill={`url(#funnel-grad-${i})`}
              />
              <path
                d={`M ${x1} ${y} L ${x2} ${y} L ${nx2} ${y + stageH} L ${nx1} ${y + stageH} Z`}
                fill="none"
                stroke={`url(#funnel-stroke-${i})`}
                strokeWidth="1.5"
              />

              {/* Stage label left */}
              <text
                x={x1 - 10}
                y={y + stageH / 2 - 6}
                textAnchor="end"
                fill={stage.color}
                fontSize="10"
                fontFamily="system-ui, sans-serif"
                fontWeight="600"
                opacity="0.9"
              >
                {stage.label}
              </text>

              {/* Value inside */}
              <text
                x={W / 2}
                y={y + stageH / 2 + 6}
                textAnchor="middle"
                fill="white"
                fontSize="18"
                fontFamily="system-ui, sans-serif"
                fontWeight="700"
              >
                {fNum(stage.value)}
              </text>

              {/* Conversion rate on right */}
              {convRate && (
                <text
                  x={x2 + 10}
                  y={y + stageH / 2 - 6}
                  textAnchor="start"
                  fill={stage.color}
                  fontSize="10"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="600"
                  opacity="0.8"
                >
                  {convRate}%
                </text>
              )}
              {convRate && (
                <text
                  x={x2 + 10}
                  y={y + stageH / 2 + 7}
                  textAnchor="start"
                  fill="#6B7280"
                  fontSize="8.5"
                  fontFamily="system-ui, sans-serif"
                >
                  conv.
                </text>
              )}

              {/* Gap connector arrows */}
              {i < stages.length - 1 && (
                <g>
                  <line
                    x1={W / 2}
                    y1={y + stageH}
                    x2={W / 2}
                    y2={y + stageH + gapH}
                    stroke={stages[i + 1].color}
                    strokeWidth="1"
                    strokeOpacity="0.4"
                    strokeDasharray="2,2"
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
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
// TREND LINE CHART (SVG)
// ─────────────────────────────────────────────

const TrendChart = ({ days, metric, color, label }) => {
  const [hovered, setHovered] = useState(null);

  const values = days.map((d) => d[metric]);
  const maxVal = Math.max(...values, 0.01);
  const minVal = Math.min(...values, 0);

  const W = 480;
  const H = 120;
  const padX = 8;
  const padY = 12;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const toX = (i) => padX + (i / Math.max(1, days.length - 1)) * chartW;
  const toY = (v) => padY + (1 - (v - minVal) / (maxVal - minVal || 1)) * chartH;

  const pts = values.map((v, i) => [toX(i), toY(v)]);
  const linePath = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`;

  // Axis labels (first and last date)
  const firstDate = days[0]?.date
    ? new Date(days[0].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : "";
  const lastDate = days[days.length - 1]?.date
    ? new Date(days[days.length - 1].date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : "";

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((svgX - padX) / chartW) * (days.length - 1));
    const clipped = Math.max(0, Math.min(days.length - 1, idx));
    setHovered(clipped);
  }

  const hoveredPt = hovered !== null ? pts[hovered] : null;
  const hoveredDay = hovered !== null ? days[hovered] : null;
  const hoveredDate = hoveredDay?.date
    ? new Date(hoveredDay.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : "";
  const hoveredVal = hoveredDay ? hoveredDay[metric] : null;
  const isMonetary = metric === "gasto" || metric === "cpl" || metric === "cpm";

  const tooltipX = hoveredPt ? Math.min(hoveredPt[0], W - 70) : 0;
  const tooltipY = hoveredPt ? Math.max(hoveredPt[1] - 36, padY) : 0;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H + 20}`}
        className="w-full overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id={`trend-area-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={padX}
            y1={padY + pct * chartH}
            x2={W - padX}
            y2={padY + pct * chartH}
            stroke="#27272a"
            strokeWidth="1"
          />
        ))}

        {/* Area */}
        <path d={areaPath} fill={`url(#trend-area-${metric})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

        {/* Vertical hover line */}
        {hoveredPt && (
          <line
            x1={hoveredPt[0]}
            y1={padY}
            x2={hoveredPt[0]}
            y2={H}
            stroke={color}
            strokeWidth="1"
            strokeDasharray="3,3"
            strokeOpacity="0.6"
          />
        )}

        {/* Dots: last point always visible, hovered point larger */}
        {pts.length > 0 && hovered !== pts.length - 1 && (
          <circle
            cx={pts[pts.length - 1][0]}
            cy={pts[pts.length - 1][1]}
            r="3.5"
            fill={color}
            stroke="#0f172a"
            strokeWidth="2"
          />
        )}
        {hoveredPt && (
          <circle
            cx={hoveredPt[0]}
            cy={hoveredPt[1]}
            r="5"
            fill={color}
            stroke="#0f172a"
            strokeWidth="2"
          />
        )}

        {/* Tooltip box */}
        {hoveredPt && hoveredDay && (
          <g>
            <rect
              x={tooltipX - 2}
              y={tooltipY - 2}
              width="72"
              height="30"
              rx="4"
              fill="#18181b"
              stroke="#3f3f46"
              strokeWidth="1"
            />
            <text x={tooltipX + 2} y={tooltipY + 10} fill="#a1a1aa" fontSize="8" fontFamily="system-ui">
              {hoveredDate}
            </text>
            <text x={tooltipX + 2} y={tooltipY + 22} fill={color} fontSize="9" fontFamily="system-ui" fontWeight="700">
              {isMonetary ? `R$ ${fBRL(hoveredVal)}` : fNum(hoveredVal)}
            </text>
          </g>
        )}

        {/* Invisible capture rect */}
        <rect x={padX} y={padY} width={chartW} height={chartH} fill="transparent" />

        {/* Date labels */}
        <text x={padX} y={H + 16} fill="#6B7280" fontSize="9" fontFamily="system-ui">
          {firstDate}
        </text>
        <text x={W - padX} y={H + 16} textAnchor="end" fill="#6B7280" fontSize="9" fontFamily="system-ui">
          {lastDate}
        </text>
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────
// CPL STATUS BADGE
// ─────────────────────────────────────────────

const CplStatus = ({ cpl, conversas, targetCplMax = 0 }) => {
  let status, color, Icon, bg;
  // Use configured target if available, otherwise fall back to defaults
  const limOtimo = targetCplMax > 0 ? targetCplMax * 0.7 : 20;
  const limOk = targetCplMax > 0 ? targetCplMax : 40;

  if (conversas === 0) {
    status = "Sem conversas no período";
    color = "text-zinc-400";
    bg = "bg-zinc-800/50 border-zinc-700/50";
    Icon = AlertCircle;
  } else if (cpl <= limOtimo) {
    status = targetCplMax > 0
      ? `CPL Ótimo — abaixo de 70% do target`
      : "CPL Ótimo — performance excelente";
    color = "text-emerald-400";
    bg = "bg-emerald-500/10 border-emerald-500/20";
    Icon = CheckCircle2;
  } else if (cpl <= limOk) {
    status = targetCplMax > 0
      ? `CPL dentro do target (R$ ${targetCplMax.toFixed(0)})`
      : "CPL Dentro do esperado";
    color = "text-amber-400";
    bg = "bg-amber-500/10 border-amber-500/20";
    Icon = AlertCircle;
  } else {
    status = targetCplMax > 0
      ? `CPL Alto — acima do target R$ ${targetCplMax.toFixed(0)}`
      : "CPL Alto — revisar segmentação";
    color = "text-red-400";
    bg = "bg-red-500/10 border-red-500/20";
    Icon = XCircle;
  }

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${bg}`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-sm font-semibold ${color}`}>{status}</span>
      {conversas > 0 && (
        <span className="ml-auto text-xs text-zinc-500">
          CPL: R$ {fBRL(cpl)}
        </span>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────

const Skeleton = ({ className = "" }) => (
  <div className={`bg-zinc-800/60 rounded-xl animate-pulse ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-80" />
      <Skeleton className="h-80" />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// MAIN DASHBOARD PAGE
// ─────────────────────────────────────────────

export default function DashboardPage() {
  const { user, logout, authFetch } = useAuth();

  // Redirect if not authenticated
  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const isAdmin = user.role === "admin";

  // For client role: lock to their clientId; for admin: allow selection
  const urlClient = new URL(window.location.href).searchParams.get("client");
  const defaultClient = isAdmin ? (urlClient || null) : user.clientId;

  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(defaultClient);
  const [activePeriod, setActivePeriod] = useState("daily");
  const [data, setData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [campaignData, setCampaignData] = useState(null);
  const [creativesData, setCreativesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [campaignSort, setCampaignSort] = useState({ key: "gasto", dir: "desc" });

  const handleExportMonthly = async () => {
    if (!activeClient || exporting) return;
    setExporting(true);
    try {
      const res  = await authFetch(`/api/report/monthly?client=${activeClient}`);
      const json = await res.json();
      if (!json.html) throw new Error(json.error || "Erro ao gerar relatório");
      const blob = new Blob([json.html], { type: "text/html;charset=utf-8" });
      const url  = URL.createObjectURL(blob);
      const win  = window.open(url, "_blank");
      if (!win) {
        // Popup blocked — fallback: download as .html file
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio-mensal.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      // Keep URL alive for 5 minutes so user has time to print
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
    } catch (err) {
      alert(`Não foi possível gerar o relatório:\n${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Load client list from API
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]));
  }, []);

  useEffect(() => {
    if (isAdmin && !activeClient && clients.length > 0) {
      setActiveClient(clients[0].id);
    }
  }, [clients, isAdmin, activeClient]);

  const currentClient = clients.find((c) => c.id === activeClient) || { id: activeClient, name: "", emoji: "", color: "#8B5CF6" };

  const fetchInsights = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await authFetch(
          `/api/insights?client=${activeClient}&period=${activePeriod}`
        );
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Erro ao buscar dados");
        setData(json);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeClient, activePeriod]
  );

  const fetchTrend = useCallback(async () => {
    setTrendLoading(true);
    try {
      const res = await authFetch(`/api/trend?client=${activeClient}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTrendData(json);
    } catch {
      setTrendData(null);
    } finally {
      setTrendLoading(false);
    }
  }, [activeClient]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await authFetch(`/api/campaigns?client=${activeClient}&period=${activePeriod}`);
      const json = await res.json();
      setCampaignData(res.ok ? json : null);
    } catch {
      setCampaignData(null);
    }
  }, [activeClient, activePeriod]);

  const fetchCreatives = useCallback(async () => {
    try {
      const res = await authFetch(`/api/creatives?client=${activeClient}&period=${activePeriod}`);
      const json = await res.json();
      setCreativesData(res.ok ? json : null);
    } catch {
      setCreativesData(null);
    }
  }, [activeClient, activePeriod]);

  useEffect(() => {
    fetchInsights();
    fetchTrend();
    fetchCampaigns();
    fetchCreatives();
  }, [fetchInsights, fetchTrend, fetchCampaigns, fetchCreatives]);

  const metrics = data?.metrics || null;
  const delta = data?.delta || null;
  const targets = data?.targets || {};
  const hasTrend = trendData?.hasData && trendData.days?.length > 1;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* ── TOP HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          {isAdmin ? (
            <a href="/admin" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0 text-xs">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:block">Admin</span>
            </a>
          ) : (
            <a href="/" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </a>
          )}

          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 p-1.5 rounded-md border border-zinc-800">
              <Logo className="w-4 h-4 text-[#C9F80D]" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">
              Focus<span className="text-[#C9F80D]">Dashboard</span>
            </span>
            <span className="text-zinc-600 hidden sm:block">|</span>
            <span className="text-sm font-semibold hidden sm:block text-sky-400">Meta</span>
          </div>

          {/* Platform Tabs */}
          <div className="ml-2 sm:ml-4 overflow-hidden">
            <PlatformNav active="meta" />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[11px] text-zinc-600 hidden sm:block">
                Atualizado{" "}
                {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <span className="text-xs text-zinc-500 hidden sm:block">{user.name}</span>
            <button
              onClick={() => { fetchInsights(true); fetchTrend(); fetchCampaigns(); }}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:block">Atualizar</span>
            </button>
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

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* ── HERO ROW ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-zinc-100">Visão geral</h1>
            <div className="flex items-center gap-2 mt-1.5">
              {currentClient.name && (
                <span className="text-[11px] font-semibold tracking-widest uppercase px-2.5 py-0.5 rounded border bg-zinc-900 font-mono" style={{ color: "#C9F80D", borderColor: "#C9F80D40" }}>
                  {currentClient.name}
                </span>
              )}
              <span className="text-xs text-zinc-600">Campanhas Meta Ads</span>
            </div>
            {/* Admin client switcher — minimal text */}
            {isAdmin && clients.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveClient(c.id)}
                    className={`text-[11px] px-2.5 py-0.5 rounded border transition-colors font-medium ${
                      activeClient === c.id
                        ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                        : "border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Period selector */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              {PERIODS.map((period) => (
                <button
                  key={period.id}
                  onClick={() => setActivePeriod(period.id)}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    activePeriod === period.id
                      ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {period.label}
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
                {getDateRange(activePeriod)}
              </span>
            </div>

            {/* Export */}
            <button
              onClick={handleExportMonthly}
              disabled={exporting || !activeClient}
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
        </div>

        {/* ── ERROR STATE ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Erro ao carregar dados:</strong> {error}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── NO DATA STATE ── */}
        {!loading && data && !data.hasData && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-zinc-400 font-medium">Sem dados no período selecionado</p>
            <p className="text-zinc-600 text-sm mt-1">
              {currentClient?.name || activeClient} não teve campanhas ativas em:{" "}
              <span className="text-zinc-500">
                {PERIODS.find((p) => p.id === activePeriod)?.sub}
              </span>
            </p>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        {loading ? (
          <DashboardSkeleton />
        ) : (
          metrics && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeClient}-${activePeriod}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* HERO NARRATIVA — frase contextual do período */}
                <HeroNarrativa
                  metrics={metrics}
                  period={activePeriod}
                  periodLabel={getDateRange(activePeriod)}
                  clientName={currentClient?.name}
                />

                {/* META PROGRESS + STATUS lado a lado */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {targets.target_conversas > 0 && (
                    <MetaProgress
                      atual={metrics.conversas}
                      meta={targets.target_conversas}
                      color={currentClient?.color || "#C9F80D"}
                    />
                  )}
                  <CplStatus
                    cpl={metrics.cpl}
                    conversas={metrics.conversas}
                    targetCplMax={targets.target_cpl_max || 0}
                  />
                </div>

                {/* ─── RESULTADO DE NEGÓCIO ─── (destaque máximo) */}
                {(() => {
                  const taxa = targets.taxa_conversao ?? 0.1;
                  const vendas = Math.floor(metrics.conversas * taxa);
                  const faturamento = vendas * (targets.ticket_medio || 0);
                  const hasTicket = targets.ticket_medio > 0;
                  return (
                    <div>
                      <p className="text-[11px] text-[#C9F80D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Resultado de negócio
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        <KpiCard
                          label="Conversas/Leads"
                          value={fNum(metrics.conversas)}
                          sub="WhatsApp / Lead"
                          icon={MessageCircle}
                          color="#10B981"
                          delay={0}
                          delta={delta?.conversas}
                        />
                        <KpiCard
                          label="Vendas estimadas"
                          value={fNum(vendas)}
                          sub={`${(taxa * 100).toFixed(0)}% de conversão`}
                          icon={ShoppingBag}
                          color="#06B6D4"
                          delay={0.05}
                        />
                        {hasTicket ? (
                          <>
                            <KpiCard
                              label="Faturamento"
                              value={`R$ ${fBRL(faturamento)}`}
                              sub={`${fNum(vendas)} × R$ ${fBRL(targets.ticket_medio)}`}
                              icon={Banknote}
                              color="#C9F80D"
                              delay={0.1}
                            />
                            <KpiCard
                              label="ROAS"
                              value={metrics.gasto > 0 ? `${(faturamento / metrics.gasto).toFixed(2)}x` : "N/A"}
                              sub={metrics.gasto > 0 && faturamento >= metrics.gasto ? "Acima do break-even" : "Abaixo do break-even"}
                              icon={TrendingUp}
                              color={metrics.gasto > 0 && faturamento >= metrics.gasto ? "#10B981" : "#EF4444"}
                              delay={0.15}
                            />
                          </>
                        ) : (
                          <div className="col-span-2 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            <div>
                              <div className="text-xs font-semibold text-zinc-300">Cadastre o ticket médio</div>
                              <div className="text-[10px] text-zinc-500">No Admin → Cliente → tab Metas, pra ver Faturamento + ROAS</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* ─── INVESTIMENTO E TRÁFEGO ─── (secundário) */}
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Investimento e tráfego</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <KpiCard
                      label="Investimento"
                      value={`R$ ${fBRL(metrics.gasto)}`}
                      icon={DollarSign}
                      color={currentClient?.color}
                      delay={0}
                      delta={delta?.gasto}
                    />
                    <KpiCard
                      label="Impressões"
                      value={fNum(metrics.impressoes)}
                      icon={Eye}
                      color="#6366F1"
                      delay={0.05}
                      delta={delta?.impressoes}
                    />
                    <KpiCard
                      label="Alcance"
                      value={fNum(metrics.alcance)}
                      icon={Users}
                      color="#3B82F6"
                      delay={0.08}
                      delta={delta?.alcance}
                    />
                    <KpiCard
                      label="Cliques"
                      value={fNum(metrics.cliques)}
                      icon={MousePointer}
                      color="#06B6D4"
                      delay={0.11}
                      delta={delta?.cliques}
                    />
                  </div>
                </div>

                {/* ─── EFICIÊNCIA ─── (terciário) */}
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Eficiência</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <KpiCard
                      label="CPL"
                      value={metrics.conversas > 0 ? `R$ ${fBRL(metrics.cpl)}` : "N/A"}
                      sub="Custo por conversa"
                      icon={BarChart3}
                      color={currentClient?.color}
                      delay={0}
                      delta={delta?.cpl}
                      lowerIsBetter
                    />
                    <KpiCard
                      label="CPC"
                      value={metrics.cliques > 0 ? `R$ ${fBRL(metrics.cpc)}` : "N/A"}
                      sub="Custo por clique"
                      icon={Target}
                      color="#EC4899"
                      delay={0.05}
                      lowerIsBetter
                    />
                    <KpiCard
                      label="CTR"
                      value={fPct(metrics.ctr)}
                      sub="Cliques ÷ impressões"
                      icon={TrendingUp}
                      color="#F59E0B"
                      delay={0.08}
                    />
                    <KpiCard
                      label="CPM"
                      value={metrics.impressoes > 0 ? `R$ ${fBRL(metrics.cpm)}` : "N/A"}
                      sub="Custo por 1.000 vistas"
                      icon={Target}
                      color="#A78BFA"
                      delay={0.11}
                      delta={delta?.cpm}
                      lowerIsBetter
                    />
                  </div>
                </div>

                {/* FUNNEL + TREND */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* FUNNEL */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-sm font-bold text-zinc-100">Funil de Conversão</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {PERIODS.find((p) => p.id === activePeriod)?.sub} · {currentClient?.name}
                        </p>
                      </div>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{
                          background: currentClient?.color + "20",
                          color: currentClient?.color,
                        }}
                      >
                        <span>{currentClient?.emoji}</span>
                        <span>{currentClient?.name}</span>
                      </div>
                    </div>

                    <FunnelViz metrics={metrics} clientColor={currentClient?.color} />

                    {/* Funnel stats summary */}
                    <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2 pt-4 border-t border-zinc-800">
                      <div className="text-center">
                        <div className="text-lg font-bold text-cyan-400">
                          {metrics.impressoes > 0
                            ? ((metrics.cliques / metrics.impressoes) * 100).toFixed(2) + "%"
                            : "—"}
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-0.5">Impressão → Clique</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">
                          {metrics.cliques > 0
                            ? ((metrics.conversas / metrics.cliques) * 100).toFixed(1) + "%"
                            : "—"}
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-0.5">Clique → Conversa</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold" style={{ color: currentClient?.color }}>
                          {metrics.impressoes > 0
                            ? ((metrics.conversas / metrics.impressoes) * 100).toFixed(3) + "%"
                            : "—"}
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-0.5">Taxa global</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* TREND CHART */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-zinc-100">Tendência — Últimos 30 dias</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Investimento diário</p>
                      </div>
                    </div>

                    {trendLoading ? (
                      <div className="flex-1 flex items-center justify-center">
                        <Skeleton className="w-full h-32" />
                      </div>
                    ) : hasTrend ? (
                      <div className="flex flex-col gap-6 flex-1">
                        <div>
                          <p className="text-[11px] text-zinc-500 mb-1 uppercase tracking-wider font-medium">
                            Investimento (R$)
                          </p>
                          <TrendChart
                            days={trendData.days}
                            metric="gasto"
                            color={currentClient?.color || "#8B5CF6"}
                            label="Gasto"
                          />
                        </div>
                        <div>
                          <p className="text-[11px] text-zinc-500 mb-1 uppercase tracking-wider font-medium">
                            Conversas / Leads
                          </p>
                          <TrendChart
                            days={trendData.days}
                            metric="conversas"
                            color="#10B981"
                            label="Conversas"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                        <TrendingUp className="w-10 h-10 text-zinc-700 mb-3" />
                        <p className="text-zinc-500 text-sm">Sem dados de tendência</p>
                        <p className="text-zinc-600 text-xs mt-1">
                          Dados históricos disponíveis após campanhas ativas
                        </p>
                      </div>
                    )}

                    {/* 30-day summary */}
                    {hasTrend && (
                      <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10px] text-zinc-600 uppercase tracking-wide">
                            Total 30d
                          </p>
                          <p className="text-sm font-bold text-zinc-200 mt-0.5">
                            R$ {fBRL(trendData.days.reduce((s, d) => s + d.gasto, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-600 uppercase tracking-wide">
                            Conversas 30d
                          </p>
                          <p className="text-sm font-bold text-emerald-400 mt-0.5">
                            {fNum(trendData.days.reduce((s, d) => s + d.conversas, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-600 uppercase tracking-wide">
                            Dias ativos
                          </p>
                          <p className="text-sm font-bold text-zinc-200 mt-0.5">
                            {trendData.days.filter((d) => d.gasto > 0).length}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* MULTI-METRIC BARS */}
                {hasTrend && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                  >
                    <h2 className="text-sm font-bold text-zinc-100 mb-4">
                      Distribuição — Cliques vs Conversas (21 dias)
                    </h2>
                    <div className="flex gap-1 items-end w-full overflow-hidden" style={{ height: 112 }}>
                      {trendData.days.slice(-21).map((d, i) => {
                        const maxCliques = Math.max(
                          ...trendData.days.map((x) => x.cliques),
                          1
                        );
                        const pxHeight = Math.max(2, (d.cliques / maxCliques) * 110);

                        return (
                          <div key={i} className="flex-1 flex items-end group relative" style={{ height: 112 }}>
                            <div
                              className="w-full rounded-t transition-all duration-200 group-hover:opacity-80"
                              style={{
                                height: pxHeight,
                                background: (currentClient?.color || "#8B5CF6") + "60",
                                borderTop: `2px solid ${currentClient?.color || "#8B5CF6"}`,
                              }}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-xl">
                              <p className="text-zinc-300 font-semibold">
                                {new Date(d.date).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                })}
                              </p>
                              <p className="text-cyan-400">Cliques: {fNum(d.cliques)}</p>
                              <p className="text-emerald-400">Conversas: {fNum(d.conversas)}</p>
                              <p className="text-zinc-500">Gasto: R$ {fBRL(d.gasto)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ background: currentClient?.color + "60" }}
                        />
                        <span className="text-[11px] text-zinc-500">Cliques (proporção)</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 ml-auto hidden sm:block">
                        Últimos 21 dias · passe o mouse nos bars para detalhes
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* CAMPAIGN BREAKDOWN */}
                {campaignData?.hasData && campaignData.campaigns.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-zinc-100">Por Campanha</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {campaignData.campaigns.length} campanhas · {PERIODS.find((p) => p.id === activePeriod)?.sub}
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                      <table className="w-full text-xs min-w-[480px]">
                        <thead>
                          <tr className="text-zinc-500 border-b border-zinc-800">
                            {[
                              { key: "name", label: "Campanha", align: "left", cls: "pr-4" },
                              { key: "gasto", label: "Invest.", align: "right", cls: "px-3" },
                              { key: "impressoes", label: "Impr.", align: "right", cls: "px-3" },
                              { key: "cliques", label: "Cliques", align: "right", cls: "px-3" },
                              { key: "conversas", label: "Conv.", align: "right", cls: "px-3" },
                              { key: "cpl", label: "CPL", align: "right", cls: "pl-3" },
                            ].map((col) => (
                              <th
                                key={col.key}
                                className={`pb-2 font-medium ${col.cls} text-${col.align} cursor-pointer select-none hover:text-zinc-300 transition-colors`}
                                onClick={() =>
                                  setCampaignSort((s) =>
                                    s.key === col.key
                                      ? { key: col.key, dir: s.dir === "asc" ? "desc" : "asc" }
                                      : { key: col.key, dir: "desc" }
                                  )
                                }
                              >
                                {col.label}
                                {campaignSort.key === col.key && (
                                  <span className="ml-1">{campaignSort.dir === "asc" ? "▲" : "▼"}</span>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...campaignData.campaigns]
                            .sort((a, b) => {
                              const aVal = a[campaignSort.key] ?? 0;
                              const bVal = b[campaignSort.key] ?? 0;
                              if (typeof aVal === "string") {
                                return campaignSort.dir === "asc"
                                  ? aVal.localeCompare(bVal)
                                  : bVal.localeCompare(aVal);
                              }
                              return campaignSort.dir === "asc" ? aVal - bVal : bVal - aVal;
                            })
                            .map((c, i) => (
                              <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                <td className="py-2.5 pr-4 text-zinc-300 font-medium max-w-[200px] truncate">{c.name}</td>
                                <td className="py-2.5 px-3 text-right text-zinc-200 font-mono">R$ {fBRL(c.gasto)}</td>
                                <td className="py-2.5 px-3 text-right text-zinc-400 font-mono">{fNum(c.impressoes)}</td>
                                <td className="py-2.5 px-3 text-right text-zinc-400 font-mono">{fNum(c.cliques)}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className={`font-semibold ${c.conversas > 0 ? "text-emerald-400" : "text-zinc-600"}`}>
                                    {fNum(c.conversas)}
                                  </span>
                                </td>
                                <td className="py-2.5 pl-3 text-right">
                                  {c.conversas > 0 ? (
                                    <span className="text-zinc-200 font-mono">R$ {fBRL(c.cpl)}</span>
                                  ) : (
                                    <span className="text-zinc-600">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          {(() => {
                            const totalGasto = campaignData.campaigns.reduce((s, c) => s + c.gasto, 0);
                            const totalImpressoes = campaignData.campaigns.reduce((s, c) => s + c.impressoes, 0);
                            const totalCliques = campaignData.campaigns.reduce((s, c) => s + c.cliques, 0);
                            const totalConversas = campaignData.campaigns.reduce((s, c) => s + c.conversas, 0);
                            const totalCpl = totalConversas > 0 ? totalGasto / totalConversas : null;
                            return (
                              <tr className="border-t-2 border-zinc-700 text-zinc-200 font-semibold">
                                <td className="py-2.5 pr-4">Total</td>
                                <td className="py-2.5 px-3 text-right font-mono">R$ {fBRL(totalGasto)}</td>
                                <td className="py-2.5 px-3 text-right font-mono">{fNum(totalImpressoes)}</td>
                                <td className="py-2.5 px-3 text-right font-mono">{fNum(totalCliques)}</td>
                                <td className="py-2.5 px-3 text-right font-mono">{fNum(totalConversas)}</td>
                                <td className="py-2.5 pl-3 text-right font-mono">
                                  {totalCpl !== null ? `R$ ${fBRL(totalCpl)}` : "—"}
                                </td>
                              </tr>
                            );
                          })()}
                        </tfoot>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* ── CRIATIVOS ── */}
                {creativesData?.ads?.length > 0 && (() => {
                  const ads = creativesData.ads.slice(0, 9);
                  const totalGasto = ads.reduce((s, a) => s + (a.gasto || 0), 0);
                  const totalConversas = ads.reduce((s, a) => s + (a.conversas || 0), 0);
                  const avgCpl = totalConversas > 0 ? totalGasto / totalConversas : 0;
                  const maxCtr = Math.max(...ads.map((a) => a.ctr || 0), 0.01);

                  const getCplStyle = (cpl) => {
                    if (!cpl || !avgCpl) return { text: "text-zinc-400", pill: "bg-zinc-800 border-zinc-700/50" };
                    const r = cpl / avgCpl;
                    if (r <= 0.8) return { text: "text-emerald-400", pill: "bg-emerald-500/10 border border-emerald-500/25" };
                    if (r <= 1.2) return { text: "text-yellow-400", pill: "bg-yellow-500/10 border border-yellow-500/25" };
                    return { text: "text-red-400", pill: "bg-red-500/10 border border-red-500/25" };
                  };

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                        <div>
                          <h2 className="text-sm font-bold text-zinc-100">Criativos</h2>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Top {ads.length} anúncios por conversas · {PERIODS.find((p) => p.id === activePeriod)?.sub}
                          </p>
                        </div>
                        {/* Aggregate strip */}
                        <div className="flex items-center gap-4 bg-zinc-800/50 border border-zinc-700/40 rounded-xl px-4 py-2">
                          <div className="text-center">
                            <p className="text-xs font-bold text-zinc-200 tabular-nums">
                              R$ {totalGasto.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-wide mt-0.5">Gasto total</p>
                          </div>
                          <div className="w-px h-6 bg-zinc-700" />
                          <div className="text-center">
                            <p className="text-xs font-bold text-emerald-400 tabular-nums">{totalConversas}</p>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-wide mt-0.5">Conversas</p>
                          </div>
                          <div className="w-px h-6 bg-zinc-700" />
                          <div className="text-center">
                            <p className="text-xs font-bold text-zinc-200 tabular-nums">
                              {avgCpl > 0 ? `R$ ${avgCpl.toFixed(0)}` : "—"}
                            </p>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-wide mt-0.5">CPL médio</p>
                          </div>
                        </div>
                      </div>

                      {/* Cards grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ads.map((ad, i) => {
                          const cplStyle = getCplStyle(ad.cpl);
                          const ctrPct = maxCtr > 0 ? ((ad.ctr || 0) / maxCtr) * 100 : 0;
                          const isTop = i === 0;

                          const rankBadge =
                            i === 0 ? { label: "🥇", cls: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30" }
                            : i === 1 ? { label: "🥈", cls: "bg-zinc-300/10 text-zinc-200 border-zinc-400/25" }
                            : i === 2 ? { label: "🥉", cls: "bg-orange-500/15 text-orange-300 border-orange-500/30" }
                            : { label: `${i + 1}°`, cls: "bg-black/50 text-zinc-400 border-zinc-600/30" };

                          return (
                            <div
                              key={ad.adId || i}
                              className={`group relative flex flex-col bg-zinc-800/30 border rounded-2xl overflow-hidden transition-all duration-200 hover:bg-zinc-800/60 ${
                                isTop
                                  ? "border-yellow-500/30 shadow-lg shadow-yellow-500/5"
                                  : i === 1
                                  ? "border-zinc-400/20 hover:border-zinc-400/30"
                                  : i === 2
                                  ? "border-orange-600/20 hover:border-orange-500/25"
                                  : "border-zinc-700/30 hover:border-zinc-600/40"
                              }`}
                            >
                              {/* Thumbnail */}
                              <div className="relative aspect-[16/9] bg-zinc-900 overflow-hidden flex-shrink-0">
                                {ad.thumbnail ? (
                                  <img
                                    src={ad.thumbnail}
                                    alt={ad.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : null}
                                {/* Fallback placeholder */}
                                {!ad.thumbnail && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-800 to-zinc-900">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-700/40 flex items-center justify-center">
                                      <ImageIcon className="w-5 h-5 text-zinc-600" />
                                    </div>
                                    <p className="text-[10px] text-zinc-600">Sem preview</p>
                                  </div>
                                )}
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

                                {/* Rank badge */}
                                <div className={`absolute top-2 left-2 flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-md border ${rankBadge.cls}`}>
                                  {rankBadge.label}
                                </div>

                                {/* Conversas pill over gradient at bottom */}
                                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                                  {ad.conversas > 0 ? (
                                    <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-sm rounded-full px-2.5 py-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" style={{ animation: "pulse 2s infinite" }} />
                                      <span className="text-[11px] font-bold text-emerald-300 whitespace-nowrap">
                                        {ad.conversas} conversa{ad.conversas !== 1 ? "s" : ""}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-700/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                                      <span className="text-[10px] text-zinc-500">Sem conversas</span>
                                    </div>
                                  )}
                                  {/* CPL pill */}
                                  {ad.conversas > 0 && (
                                    <div className={`text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm whitespace-nowrap ${cplStyle.pill} ${cplStyle.text}`}>
                                      R$ {(ad.cpl || 0).toFixed(0)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex flex-col flex-1 p-3 gap-3">
                                {/* Title */}
                                <p
                                  className="text-[12px] font-semibold text-zinc-200 line-clamp-2 leading-snug min-h-[2.25rem]"
                                  title={ad.creativeTitle || ad.name}
                                >
                                  {ad.creativeTitle || ad.name}
                                </p>

                                {/* Metrics row */}
                                <div className="grid grid-cols-3 gap-1.5">
                                  <div className="bg-zinc-900/70 rounded-xl px-1.5 py-2 text-center">
                                    <p className="text-[11px] font-bold text-white tabular-nums">
                                      R$ {(ad.gasto || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wide">Gasto</p>
                                  </div>
                                  <div className="bg-zinc-900/70 rounded-xl px-1.5 py-2 text-center">
                                    <p className="text-[11px] font-bold text-zinc-300 tabular-nums">
                                      {(ad.impressoes || 0) >= 1000
                                        ? `${((ad.impressoes || 0) / 1000).toFixed(1)}k`
                                        : (ad.impressoes || 0)}
                                    </p>
                                    <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wide">Imp.</p>
                                  </div>
                                  <div className="bg-zinc-900/70 rounded-xl px-1.5 py-2 text-center">
                                    <p className="text-[11px] font-bold text-zinc-300 tabular-nums">
                                      R$ {(ad.cpm || 0).toFixed(0)}
                                    </p>
                                    <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wide">CPM</p>
                                  </div>
                                </div>

                                {/* CTR progress bar */}
                                <div>
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide">CTR</span>
                                    <span className="text-[10px] font-semibold text-zinc-300 tabular-nums">
                                      {(ad.ctr || 0).toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-zinc-700/40 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ${
                                        ctrPct > 66
                                          ? "bg-emerald-500"
                                          : ctrPct > 33
                                          ? "bg-yellow-500"
                                          : "bg-zinc-500"
                                      }`}
                                      style={{ width: `${Math.max(ctrPct, 2)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          )
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-16 border-t border-zinc-800/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-zinc-600 text-xs">
            <Logo className="w-4 h-4 text-[#C9F80D]/50" />
            <span>Focus Mídia Digital — Dashboard de Performance</span>
          </div>
          <a
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Ver site
          </a>
        </div>
      </footer>
    </div>
  );
}
