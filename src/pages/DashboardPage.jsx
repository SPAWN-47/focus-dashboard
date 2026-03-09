import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Eye, Users, MousePointer, MessageCircle,
  TrendingUp, DollarSign, Target, BarChart3, AlertCircle,
  CheckCircle2, XCircle, ExternalLink, ArrowLeft, LogOut, Settings,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

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
    <circle cx="17.5" cy="17.5" r="2.5" fill="#8b5cf6" stroke="none" />
  </svg>
);

// ─────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────

const KpiCard = ({ label, value, sub, icon: Icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="p-1.5 rounded-lg" style={{ background: color + "20" }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </span>
    </div>
    <div className="text-2xl font-bold text-zinc-100 tracking-tight">{value}</div>
    {sub && <div className="text-[11px] text-zinc-500">{sub}</div>}
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

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full overflow-visible">
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

        {/* Dots on hover-ish - show last point */}
        {pts.length > 0 && (
          <circle
            cx={pts[pts.length - 1][0]}
            cy={pts[pts.length - 1][1]}
            r="3.5"
            fill={color}
            stroke="#0f172a"
            strokeWidth="2"
          />
        )}

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

const CplStatus = ({ cpl, conversas }) => {
  let status, color, Icon, bg;
  if (conversas === 0) {
    status = "Sem conversas no período";
    color = "text-zinc-400";
    bg = "bg-zinc-800/50 border-zinc-700/50";
    Icon = AlertCircle;
  } else if (cpl <= 15) {
    status = "CPL Ótimo — performance excelente";
    color = "text-emerald-400";
    bg = "bg-emerald-500/10 border-emerald-500/20";
    Icon = CheckCircle2;
  } else if (cpl <= 30) {
    status = "CPL Dentro do esperado";
    color = "text-amber-400";
    bg = "bg-amber-500/10 border-amber-500/20";
    Icon = AlertCircle;
  } else {
    status = "CPL Alto — revisar segmentação";
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
  const { user, logout } = useAuth();

  // Redirect if not authenticated
  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const isAdmin = user.role === "admin";

  // For client role: lock to their clientId; for admin: allow selection
  const urlClient = new URL(window.location.href).searchParams.get("client");
  const defaultClient = isAdmin ? (urlClient || "vila-odonto") : user.clientId;

  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(defaultClient);
  const [activePeriod, setActivePeriod] = useState("daily");
  const [data, setData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load client list from API
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]));
  }, []);

  const currentClient = clients.find((c) => c.id === activeClient) || { id: activeClient, name: "", emoji: "", color: "#8B5CF6" };

  const fetchInsights = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await fetch(
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
      const res = await fetch(`/api/trend?client=${activeClient}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTrendData(json);
    } catch {
      setTrendData(null);
    } finally {
      setTrendLoading(false);
    }
  }, [activeClient]);

  useEffect(() => {
    fetchInsights();
    fetchTrend();
  }, [fetchInsights, fetchTrend]);

  const metrics = data?.metrics || null;
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
              <Logo className="w-4 h-4 text-violet-500" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">
              Chat<span className="text-violet-500">Focus</span>
            </span>
          </div>

          {/* Platform Tabs */}
          <div className="flex items-center gap-1 ml-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-200">
              <span className="text-[10px]">📘</span>
              <span className="hidden sm:block">Meta Ads</span>
            </div>
            <a
              href="/dashboard/google"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <span className="text-[10px]">🔵</span>
              <span className="hidden sm:block">Google Ads</span>
            </a>
            <a
              href="/guide"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Guia do Dashboard"
            >
              <span className="text-[10px]">📖</span>
              <span className="hidden sm:block">Guia</span>
            </a>
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
              onClick={() => { fetchInsights(true); fetchTrend(); }}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── CLIENT SELECTOR (admin only) ── */}
        {isAdmin && clients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setActiveClient(client.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                  activeClient === client.id
                    ? "border-transparent text-white"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
                style={
                  activeClient === client.id
                    ? { background: client.color + "25", borderColor: client.color + "60", color: client.color }
                    : {}
                }
              >
                <span className="text-base">{client.emoji}</span>
                <span>{client.name}</span>
                {activeClient === client.id && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: client.color }}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── CLIENT HEADER (client role) ── */}
        {!isAdmin && currentClient.name && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ background: currentClient.color + "15", borderColor: currentClient.color + "40" }}
          >
            <span className="text-2xl">{currentClient.emoji}</span>
            <div>
              <p className="font-bold text-white">{currentClient.name}</p>
              <p className="text-xs text-zinc-400">Seus relatórios de performance</p>
            </div>
          </div>
        )}

        {/* ── PERIOD SELECTOR + DATE BADGE ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {PERIODS.map((period) => (
              <button
                key={period.id}
                onClick={() => setActivePeriod(period.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activePeriod === period.id
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
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
            <span className="text-xs font-medium text-zinc-300" style={{ textTransform: "none" }}>
              {getDateRange(activePeriod)}
            </span>
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
                {/* KPI CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <KpiCard
                    label="Investimento"
                    value={`R$ ${fBRL(metrics.gasto)}`}
                    icon={DollarSign}
                    color={currentClient?.color}
                    delay={0}
                  />
                  <KpiCard
                    label="Impressões"
                    value={fNum(metrics.impressoes)}
                    icon={Eye}
                    color="#6366F1"
                    delay={0.05}
                  />
                  <KpiCard
                    label="Alcance"
                    value={fNum(metrics.alcance)}
                    icon={Users}
                    color="#3B82F6"
                    delay={0.08}
                  />
                  <KpiCard
                    label="Cliques"
                    value={fNum(metrics.cliques)}
                    icon={MousePointer}
                    color="#06B6D4"
                    delay={0.11}
                  />
                  <KpiCard
                    label="Conversas/Leads"
                    value={fNum(metrics.conversas)}
                    sub="WhatsApp / Lead"
                    icon={MessageCircle}
                    color="#10B981"
                    delay={0.14}
                  />
                  <KpiCard
                    label="CTR"
                    value={fPct(metrics.ctr)}
                    sub="Tx. clique/impressão"
                    icon={TrendingUp}
                    color="#F59E0B"
                    delay={0.17}
                  />
                  <KpiCard
                    label="CPC"
                    value={metrics.cliques > 0 ? `R$ ${fBRL(metrics.cpc)}` : "N/A"}
                    sub="Custo por clique"
                    icon={Target}
                    color="#EC4899"
                    delay={0.2}
                  />
                  <KpiCard
                    label="CPL"
                    value={metrics.conversas > 0 ? `R$ ${fBRL(metrics.cpl)}` : "N/A"}
                    sub="Custo por conversa"
                    icon={BarChart3}
                    color={currentClient?.color}
                    delay={0.23}
                  />
                </div>

                {/* STATUS BADGE */}
                <CplStatus cpl={metrics.cpl} conversas={metrics.conversas} />

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
                    <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-zinc-800">
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
                      Distribuição — Cliques vs Conversas (30 dias)
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
                      <p className="text-[11px] text-zinc-600 ml-auto">
                        Últimos 21 dias · passe o mouse nos bars para detalhes
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-16 border-t border-zinc-800/60 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-600 text-xs">
            <Logo className="w-4 h-4 text-violet-500/50" />
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
