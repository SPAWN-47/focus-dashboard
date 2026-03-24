import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, LogOut, Search, TrendingUp, TrendingDown,
  MousePointer, Eye, Target, DollarSign, BarChart3, Zap,
  ChevronDown, ChevronUp, Settings,
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
    <circle cx="17.5" cy="17.5" r="2.5" fill="#8b5cf6" stroke="none" />
  </svg>
);

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const GOOGLE_BLUE = "#4285F4";

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
    color: "#8b5cf6",
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
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
      isGood ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
    }`}>
      {isPositive ? "+" : ""}{delta.toFixed(1)}%
    </span>
  );
};

const KpiCard = ({ label, value, delta, icon: Icon, color, lowerIsBetter, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2"
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider leading-tight">{label}</span>
      <span className="p-1.5 rounded-lg shrink-0" style={{ background: color + "20" }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </span>
    </div>
    <div className="text-2xl font-bold text-zinc-100 tracking-tight">{value}</div>
    <div className="flex items-center justify-between min-h-[16px]">
      <span className="text-[11px] text-zinc-600">vs período anterior</span>
      <DeltaBadge delta={delta} lowerIsBetter={lowerIsBetter} />
    </div>
  </motion.div>
);

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
// PAGE
// ─────────────────────────────────────────────

export default function GoogleDashboardPage() {
  const { user, logout, authFetch } = useAuth();
  const [period,    setPeriod]    = useState("monthly");
  const [sortCol,   setSortCol]   = useState(null);
  const [sortDir,   setSortDir]   = useState("desc");

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [data,       setData]       = useState(null);      // /api/google/insights
  const [trendData,  setTrendData]  = useState(null);      // /api/google/trend
  const [campaigns,  setCampaigns]  = useState(null);      // /api/google/campaigns

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  // Derive the client ID — admins must pass ?client= in the URL
  const params    = new URLSearchParams(window.location.search);
  const clientId  = user.role === "client" ? user.clientId : (params.get("client") || user.clientId);

  const fetchData = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    setError(null);

    try {
      const [insRes, trendRes, campRes] = await Promise.all([
        authFetch(`/api/google/insights?client=${clientId}&period=${period}`),
        authFetch(`/api/google/trend?client=${clientId}`),
        authFetch(`/api/google/campaigns?client=${clientId}&period=${period}`),
      ]);

      const [ins, trend, camp] = await Promise.all([
        insRes.json(),
        trendRes.json(),
        campRes.json(),
      ]);

      setData(ins);
      setTrendData(trend);
      setCampaigns(camp);
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
        { label: "Impressões",   value: fNum(m.impressoes),   delta: data.delta?.impressoes ?? null, icon: Eye,          color: "#0ea5e9", lowerIsBetter: false },
        { label: "Cliques",      value: fNum(m.cliques),      delta: data.delta?.cliques    ?? null, icon: MousePointer, color: GOOGLE_BLUE, lowerIsBetter: false },
        { label: "CTR",          value: fPct(m.ctr),          delta: null,                           icon: Target,       color: "#8b5cf6", lowerIsBetter: false },
        { label: "CPC Médio",    value: fBRL(m.cpc),          delta: null,                           icon: DollarSign,   color: "#22c55e", lowerIsBetter: true },
        { label: "Conversões",   value: fNum(m.conversas),    delta: data.delta?.conversas  ?? null, icon: Zap,          color: "#10b981", lowerIsBetter: false },
        { label: "CPL",          value: m.cpl > 0 ? fBRL(m.cpl) : "—", delta: data.delta?.cpl ?? null, icon: Target, color: "#f97316", lowerIsBetter: true },
        { label: "Investimento", value: fBRL0(m.gasto),       delta: data.delta?.gasto      ?? null, icon: DollarSign,   color: "#f59e0b", lowerIsBetter: false },
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
              <Logo className="w-4 h-4 text-violet-500" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">
              Focus<span className="text-violet-500">Dashboard</span>
            </span>
            <span className="text-zinc-600 hidden sm:block">|</span>
            <span className="text-sm font-semibold hidden sm:block" style={{ color: GOOGLE_BLUE }}>
              Google Ads
            </span>
          </div>

          <div className="ml-4">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

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

        {/* ── NOT CONFIGURED ── */}
        {!loading && !error && notConfigured && (
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
        {!loading && !error && !notConfigured && (
          <>
            {/* Period selector row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="flex items-center justify-between flex-wrap gap-3"
            >
              <div>
                <h1 className="text-lg font-bold text-zinc-100">Visão geral</h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {data?.client
                    ? `${data.client} · Resultados agregados das campanhas Google Ads`
                    : "Resultados agregados das campanhas Google Ads"}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
            </motion.div>

            {/* ── NO DATA STATE ── */}
            {data && !data.hasData && (
              <div className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl px-4 py-3 text-sm">
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Sem dados para o período selecionado.</span>
              </div>
            )}

            {/* ── KPI GRID ── */}
            {kpiData.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {kpiData.map((kpi, i) => (
                  <KpiCard
                    key={kpi.label}
                    label={kpi.label}
                    value={kpi.value}
                    delta={kpi.delta}
                    icon={kpi.icon}
                    color={kpi.color}
                    lowerIsBetter={kpi.lowerIsBetter}
                    delay={0.1 + i * 0.05}
                  />
                ))}
              </div>
            )}

            {/* ── TREND CHART ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
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

            {/* ── CAMPAIGNS TABLE ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-3">
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
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
              <Logo className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <span className="text-xs text-zinc-500">
              Focus<span className="text-violet-500 font-semibold">Dashboard</span>
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
