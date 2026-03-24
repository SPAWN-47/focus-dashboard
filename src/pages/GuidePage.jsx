import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  MessageCircle,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Image,
  ShieldCheck,
  Bell,
  FileText,
  LogIn,
  Users,
  CalendarDays,
  ChevronDown,
  ArrowLeft,
  BookOpen,
  Layers,
  MousePointerClick,
  Activity,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import PlatformNav from "../components/PlatformNav";

// ── Grid icon for logo ──────────────────────────────────────────────────────
const GridIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 text-white"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shrink-0">
      <GridIcon />
    </div>
    <span className="text-lg font-bold text-white tracking-tight">Focus Dashboard</span>
  </div>
);

// ── Step header with number ──────────────────────────────────────────────────
const StepHeader = ({ number, icon: Icon, title, color = "violet" }) => {
  const colorMap = {
    violet: "bg-violet-600/15 border-violet-600/40 text-violet-400",
    cyan: "bg-cyan-500/15 border-cyan-500/40 text-cyan-400",
    green: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
    amber: "bg-amber-500/15 border-amber-500/40 text-amber-400",
    rose: "bg-rose-500/15 border-rose-500/40 text-rose-400",
    blue: "bg-blue-500/15 border-blue-500/40 text-blue-400",
    orange: "bg-orange-500/15 border-orange-500/40 text-orange-400",
  };
  const cls = colorMap[color] || colorMap.violet;

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-600/20 border-2 border-violet-500 shrink-0">
        <span className="text-sm font-bold text-violet-300 font-mono">{number}</span>
      </div>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${cls}`}>
        {Icon && <Icon className="w-4 h-4 shrink-0" />}
        <span className="text-sm font-semibold">{title}</span>
      </div>
    </div>
  );
};

// ── Admin-only badge ─────────────────────────────────────────────────────────
const AdminBadge = () => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
    Apenas Admin
  </span>
);

// ── Fake KPI card ────────────────────────────────────────────────────────────
const DemoKpiCard = ({ icon: Icon, label, value, delta, deltaLabel, positive, color }) => {
  const colorMap = {
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" },
    green: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400" },
  };
  const c = colorMap[color] || colorMap.violet;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-xl font-bold text-white tabular-nums leading-none">{value}</span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            positive
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {positive ? "+" : ""}{delta}
        </span>
      </div>
      {deltaLabel && <p className="text-xs text-zinc-600">{deltaLabel}</p>}
    </div>
  );
};

// ── Fake creative card ───────────────────────────────────────────────────────
const DemoCreativeCard = ({ rank, conversas, cpr, gasto }) => {
  const rankColors = {
    1: "bg-amber-400 text-zinc-900",
    2: "bg-zinc-400 text-zinc-900",
    3: "bg-orange-700 text-white",
  };
  const rankLabel = { 1: "#1", 2: "#2", 3: "#3" };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
      <div className="relative">
        <div className="w-full h-28 bg-zinc-800 flex items-center justify-center">
          <Image className="w-8 h-8 text-zinc-600" />
        </div>
        <span
          className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${rankColors[rank]}`}
        >
          {rankLabel[rank]}
        </span>
        <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
          {conversas} conv.
        </span>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500">CPR</span>
          <span className="text-sm font-semibold text-white">{cpr}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500">Gasto</span>
          <span className="text-sm font-semibold text-white">{gasto}</span>
        </div>
      </div>
    </div>
  );
};

// ── Fake health badge ────────────────────────────────────────────────────────
const DemoHealthBadge = ({ score, label, color }) => {
  const colorMap = {
    green: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
    yellow: "bg-amber-500/15 border-amber-500/40 text-amber-300",
    red: "bg-rose-500/15 border-rose-500/40 text-rose-300",
  };
  const cls = colorMap[color] || colorMap.green;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${cls}`}>
      <span className="text-lg font-bold tabular-nums">{score}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

// ── Fake sparkline SVG ───────────────────────────────────────────────────────
const DemoSparkline = () => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-semibold text-zinc-300">Tendencia 30 dias</span>
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-violet-500 inline-block rounded" /> Investimento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" /> Conversas
        </span>
      </div>
    </div>
    <svg viewBox="0 0 400 80" className="w-full" preserveAspectRatio="none">
      {/* grid lines */}
      <line x1="0" y1="20" x2="400" y2="20" stroke="#27272a" strokeWidth="1" />
      <line x1="0" y1="40" x2="400" y2="40" stroke="#27272a" strokeWidth="1" />
      <line x1="0" y1="60" x2="400" y2="60" stroke="#27272a" strokeWidth="1" />
      {/* investimento line */}
      <path
        d="M0,55 C20,50 40,45 60,40 S100,30 130,35 S170,28 200,22 S240,30 270,25 S310,20 340,15 S370,18 400,12"
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* conversas line */}
      <path
        d="M0,65 C20,60 40,58 60,54 S100,50 130,52 S170,44 200,40 S240,46 270,42 S310,36 340,30 S370,28 400,24"
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <div className="flex items-center justify-between mt-2 text-xs text-zinc-600">
      <span>Dia 1</span>
      <span>Dia 15</span>
      <span>Dia 30</span>
    </div>
  </div>
);

// ── Fake bar chart ───────────────────────────────────────────────────────────
const DemoBarChart = () => {
  const bars = [60, 45, 70, 55, 80, 65, 90, 50, 75, 85, 60, 70, 45, 88, 72, 65, 55, 78, 92, 68, 74];
  const convBars = [30, 22, 38, 28, 42, 35, 48, 25, 38, 44, 30, 36, 22, 46, 38, 32, 28, 40, 50, 34, 38];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-zinc-300">Distribuicao de Cliques — 21 dias</span>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 bg-violet-600/70 inline-block rounded-sm" /> Cliques
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 bg-emerald-500/70 inline-block rounded-sm" /> Conversas
          </span>
        </div>
      </div>
      <div className="flex items-end gap-1 h-20">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full bg-violet-600/60 rounded-sm"
              style={{ height: `${(h / 100) * 60}px` }}
            />
            <div
              className="w-full bg-emerald-500/60 rounded-sm"
              style={{ height: `${(convBars[i] / 100) * 60}px` }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-zinc-600">
        <span>Dia 1</span>
        <span>Dia 11</span>
        <span>Dia 21</span>
      </div>
    </div>
  );
};

// ── FAQ item ─────────────────────────────────────────────────────────────────
const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-900/60 transition-colors"
      >
        <span className="text-sm font-medium text-zinc-200 pr-4">{question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Metric row ───────────────────────────────────────────────────────────────
const MetricRow = ({ label, description, color = "zinc" }) => {
  const colorMap = {
    cyan: "bg-cyan-500 ",
    green: "bg-emerald-500",
    orange: "bg-orange-500",
    violet: "bg-violet-500",
    zinc: "bg-zinc-500",
  };

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-800/60 last:border-0">
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${colorMap[color]}`} />
      <div>
        <span className="text-sm font-semibold text-zinc-200">{label}</span>
        <p className="text-sm text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

// ── Conversion funnel row ────────────────────────────────────────────────────
const FunnelRow = ({ label, formula, benchmark, explanation, color }) => {
  const colorMap = {
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  };
  const cls = colorMap[color] || colorMap.violet;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <span className="text-sm font-bold text-zinc-100">{label}</span>
        <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${cls}`}>{formula}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-zinc-500">Benchmark:</span>
        <span className="text-xs font-semibold text-emerald-400">{benchmark}</span>
      </div>
      <p className="text-sm text-zinc-500 leading-relaxed">{explanation}</p>
    </div>
  );
};

// ── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ children, index }) => (
  <motion.section
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.4, delay: index * 0.04 }}
    className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 sm:p-8"
  >
    {children}
  </motion.section>
);

// ── Score bar ────────────────────────────────────────────────────────────────
const ScoreBar = ({ label, pts, color }) => {
  const colorMap = {
    violet: "bg-violet-500",
    green: "bg-emerald-500",
    cyan: "bg-cyan-500",
    orange: "bg-orange-500",
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorMap[color]}`}
          style={{ width: `${pts}%` }}
        />
      </div>
      <span className="text-xs font-mono text-zinc-400 w-10 text-right shrink-0">{pts} pts</span>
    </div>
  );
};

// ── Fake alert row ───────────────────────────────────────────────────────────
const DemoAlert = ({ level, message }) => {
  const levelMap = {
    critical: { dot: "bg-rose-500", badge: "bg-rose-500/10 border-rose-500/30 text-rose-400", label: "Critico" },
    warning: { dot: "bg-amber-500", badge: "bg-amber-500/10 border-amber-500/30 text-amber-400", label: "Atencao" },
  };
  const s = levelMap[level];

  return (
    <div className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 leading-relaxed">{message}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${s.badge}`}>
        {s.label}
      </span>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function GuidePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">

      {/* HEADER */}
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <PlatformNav active="guide" />
            <a
              href="/"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-4">

        {/* PAGE HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center pb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-600/10 border border-violet-600/20 rounded-full text-violet-400 text-xs font-semibold mb-5">
            <BookOpen className="w-3.5 h-3.5" />
            Guia de uso completo
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Focus Dashboard
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-base leading-relaxed">
            Tudo o que voce precisa saber para usar a plataforma com confianca. Siga as secoes abaixo na ordem ou navegue diretamente para o topico de interesse.
          </p>
          {user && (
            <p className="mt-4 text-sm text-zinc-500">
              Logado como{" "}
              <span className="text-violet-400 font-medium">{user.name || user.username}</span>
              {user.role === "admin" && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  Admin
                </span>
              )}
            </p>
          )}
        </motion.div>

        {/* ── SECTION 1: O que e o Focus Dashboard ── */}
        <Section index={0}>
          <StepHeader number="1" icon={Layers} title="O que e o Focus Dashboard" color="violet" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            O <span className="text-violet-400 font-semibold">Focus Dashboard</span> e uma plataforma de analytics de trafego pago desenvolvida para consolidar os resultados de campanhas publicitarias em um unico lugar. Ela integra dados do <span className="text-white font-medium">Meta Ads</span> (Facebook e Instagram) e, em breve, do <span className="text-white font-medium">Google Ads</span>.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "Central de resultados", desc: "Todas as metricas das campanhas em um so painel, sem precisar acessar o Gerenciador de Anuncios." },
              { label: "Visao por cliente", desc: "Admins enxergam todos os clientes. Clientes enxergam apenas sua propria conta." },
              { label: "Dados em tempo real", desc: "Metricas atualizadas diariamente via API oficial do Meta, com autenticacao segura por JWT." },
            ].map((item) => (
              <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-zinc-200 mb-1">{item.label}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION 2: Como acessar ── */}
        <Section index={1}>
          <StepHeader number="2" icon={LogIn} title="Como acessar" color="blue" />
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-600/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-violet-400">1</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">Acesse a pagina de login</p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Navegue ate{" "}
                  <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-violet-400 text-xs font-mono">/login</code>{" "}
                  e insira suas credenciais (usuario e senha) fornecidas pelo administrador.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-600/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-violet-400">2</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">Autenticacao JWT</p>
                <p className="text-sm text-zinc-500 mt-0.5">
                  O sistema utiliza <span className="text-white font-medium">JSON Web Tokens (JWT)</span> para autenticar as requisicoes. O token e armazenado localmente e renovado automaticamente a cada sessao.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-600/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-violet-400">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  Selecione o cliente
                  <Users className="w-3.5 h-3.5 text-zinc-500" />
                </p>
                <p className="text-sm text-zinc-500 mt-0.5 mb-3">
                  Apos o login, voce vera um seletor de cliente no topo da pagina.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-4">
                    <span className="text-xs font-semibold text-amber-400 mb-1.5 block">Perfil Admin</span>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Visualiza todos os clientes cadastrados. Pode alternar entre contas livremente pelo seletor no header.
                    </p>
                  </div>
                  <div className="bg-zinc-900 border border-violet-500/20 rounded-xl p-4">
                    <span className="text-xs font-semibold text-violet-400 mb-1.5 block">Perfil Cliente</span>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Visualiza apenas a propria conta. O seletor nao aparece — o dashboard ja carrega diretamente com os dados do cliente logado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── SECTION 3: Escolhendo o periodo ── */}
        <Section index={2}>
          <StepHeader number="3" icon={CalendarDays} title="Escolhendo o periodo" color="cyan" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            O Focus Dashboard exibe metricas com base no periodo selecionado. O dia corrente <span className="text-white font-medium">nao e incluido</span> nos calculos pois os dados estao incompletos — o periodo de ontem em diante e o mais recente disponivel.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              {
                label: "Diario",
                range: "Ontem",
                desc: "Visualiza os resultados do dia anterior. Ideal para monitoramento diario de performance.",
                color: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
                dot: "bg-cyan-500",
              },
              {
                label: "Semanal",
                range: "Semana passada",
                desc: "Agrega os resultados dos ultimos 7 dias completos. Bom para identificar tendencias de curto prazo.",
                color: "bg-violet-500/15 border-violet-500/30 text-violet-300",
                dot: "bg-violet-500",
              },
              {
                label: "Mensal",
                range: "Mes passado",
                desc: "Consolida o mes anterior completo. Essencial para relatorios mensais e comparativos.",
                color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
                dot: "bg-emerald-500",
              },
            ].map((p) => (
              <div key={p.label} className={`border rounded-xl p-4 ${p.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                  <span className="text-sm font-bold">{p.label}</span>
                </div>
                <p className="text-xs font-mono mb-2 opacity-75">{p.range}</p>
                <p className="text-xs opacity-70 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2.5 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <p className="text-sm text-zinc-400 leading-relaxed">
              <span className="text-amber-400 font-medium">Dado incompleto:</span> o dia atual nao aparece porque as metricas so ficam consolidadas apos o encerramento do dia pela API do Meta.
            </p>
          </div>
        </Section>

        {/* ── SECTION 4: Cards de KPI ── */}
        <Section index={3}>
          <StepHeader number="4" icon={Activity} title="Cards de KPI" color="green" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            Os cards de KPI ficam no topo do dashboard e mostram os principais indicadores do periodo selecionado. Cada card inclui o valor atual e a variacao percentual em relacao ao periodo anterior.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <DemoKpiCard icon={Eye} label="Impressoes" value="142.830" delta="12%" positive={true} deltaLabel="vs periodo anterior" color="cyan" />
            <DemoKpiCard icon={MessageCircle} label="Conversas" value="347" delta="8%" positive={true} deltaLabel="vs periodo anterior" color="green" />
            <DemoKpiCard icon={DollarSign} label="Investimento" value="R$ 4.280" delta="-3%" positive={false} deltaLabel="vs periodo anterior" color="orange" />
            <DemoKpiCard icon={Target} label="CPR" value="R$ 12,34" delta="-8%" positive={true} deltaLabel="bom — queda no custo" color="violet" />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800/60">
            <MetricRow color="cyan" label="Impressoes" description="Quantas vezes o anuncio foi exibido na tela de algum usuario. Nao representa cliques ou interacoes." />
            <MetricRow color="green" label="Conversas" description="Numero de conversas iniciadas via Messenger, WhatsApp ou Instagram Direct geradas pelos anuncios." />
            <MetricRow color="orange" label="Investimento" description="Total gasto no periodo selecionado. Uma queda pode ser natural (ex: menos dias) ou intencional." />
            <MetricRow color="violet" label="CPR (Custo por Resultado)" description="Quanto custou em media cada conversa iniciada. Quanto menor, melhor — indica eficiencia da campanha." />
          </div>
          <div className="mt-4 flex items-start gap-2.5 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <TrendingDown className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-sm text-zinc-400 leading-relaxed">
              Para o CPR, uma <span className="text-emerald-400 font-medium">queda e positiva</span> — significa que cada conversa esta custando menos. Para Conversas e Impressoes, uma <span className="text-emerald-400 font-medium">alta e positiva</span>.
            </p>
          </div>
        </Section>

        {/* ── SECTION 5: Indicadores de conversao ── */}
        <Section index={4}>
          <StepHeader number="5" icon={MousePointerClick} title="Indicadores de conversao (Funil)" color="cyan" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            Alem dos KPIs principais, o dashboard exibe indicadores de conversao que mostram a eficiencia de cada etapa do funil — do clique no anuncio ate a conversa iniciada.
          </p>
          <div className="space-y-3">
            <FunnelRow
              label="CTR — Taxa de Clique"
              formula="Cliques / Impressoes x 100"
              benchmark="Bom: > 1,5%"
              explanation="Mede o percentual de pessoas que clicaram no anuncio apos ve-lo. Um CTR baixo sugere que o criativo ou o publico-alvo precisam de ajustes."
              color="cyan"
            />
            <FunnelRow
              label="Taxa de Conversa"
              formula="Conversas / Cliques x 100"
              benchmark="Bom: > 8%"
              explanation="Mede quantos dos usuarios que clicaram no anuncio efetivamente iniciaram uma conversa. Uma taxa baixa pode indicar problemas na landing page ou CTA confuso."
              color="green"
            />
            <FunnelRow
              label="Taxa Global"
              formula="Conversas / Impressoes x 100"
              benchmark="Bom: > 0,15%"
              explanation="Taxa combinada de todo o funil: da impressao ate a conversa. E o indicador mais completo de eficiencia da campanha como um todo."
              color="violet"
            />
          </div>
        </Section>

        {/* ── SECTION 6: Grafico de tendencia ── */}
        <Section index={5}>
          <StepHeader number="6" icon={TrendingUp} title="Grafico de tendencia (30 dias)" color="violet" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            O grafico de linha exibe a evolucao de duas metricas ao longo dos ultimos 30 dias: <span className="text-violet-400 font-medium">Investimento</span> e <span className="text-emerald-400 font-medium">Conversas</span>. Ideal para identificar padroes e sazonalidades.
          </p>
          <DemoSparkline />
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-300 mb-1.5">Como ler o grafico</p>
              <ul className="space-y-1.5">
                {[
                  "Eixo X: dias do periodo (1 a 30)",
                  "Eixo Y: valores normalizados para comparacao relativa",
                  "Passe o mouse sobre o grafico para ver os valores exatos do dia",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-300 mb-1.5">Sinais de alerta</p>
              <ul className="space-y-1.5">
                {[
                  "Investimento subindo e conversas caindo: campanha perdendo eficiencia",
                  "Ambas caindo: possivel esgotamento de publico",
                  "Ambas subindo de forma proporcional: campanha saudavel",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* ── SECTION 7: Grafico de barras ── */}
        <Section index={6}>
          <StepHeader number="7" icon={BarChart2} title="Distribuicao de Cliques (Barras)" color="blue" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            O grafico de barras empilhadas exibe a distribuicao de <span className="text-violet-400 font-medium">cliques</span> e <span className="text-emerald-400 font-medium">conversas</span> nos ultimos 21 dias. E possivel identificar rapidamente quais dias concentram maior volume de interacoes.
          </p>
          <DemoBarChart />
          <div className="mt-4 space-y-2.5 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-sm font-semibold text-zinc-300 mb-3">Como usar esse grafico</p>
            <MetricRow color="violet" label="Barra violeta (Cliques)" description="Representa o total de cliques recebidos no dia. Dias com barras altas indicam maior interesse do publico." />
            <MetricRow color="green" label="Barra verde (Conversas)" description="Representa as conversas iniciadas no mesmo dia. Idealmente deve crescer proporcionalmente aos cliques." />
            <MetricRow color="zinc" label="Tooltip ao passar o mouse" description="Ao passar o cursor sobre uma barra, aparece um tooltip com o valor exato de cliques e conversas daquele dia." />
            <MetricRow color="cyan" label="Correlacao entre as barras" description="Dias em que a barra de conversas e proporcionalmente maior que a de cliques indicam altissima taxa de conversao." />
          </div>
        </Section>

        {/* ── SECTION 8: Criativos ── */}
        <Section index={7}>
          <StepHeader number="8" icon={Image} title="Criativos — Top Anuncios" color="amber" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            A aba <span className="text-white font-medium">Criativos</span> exibe os anuncios com melhor performance no periodo, ranqueados pelo numero de conversas geradas. Cada card mostra thumbnail, metricas-chave e a posicao no ranking.
          </p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <DemoCreativeCard rank={1} conversas={142} cpr="R$ 8,90" gasto="R$ 1.264" />
            <DemoCreativeCard rank={2} conversas={98} cpr="R$ 11,20" gasto="R$ 1.097" />
            <DemoCreativeCard rank={3} conversas={61} cpr="R$ 15,44" gasto="R$ 941" />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800/60">
            <MetricRow color="orange" label="Badge de ranking (#1, #2, #3)" description="Dourado para o 1o lugar, prata para o 2o e bronze para o 3o. Reflete o total de conversas no periodo." />
            <MetricRow color="green" label="Badge de conversas" description="Numero de conversas geradas especificamente por aquele criativo. Principal criterio de ranqueamento." />
            <MetricRow color="violet" label="CPR do criativo" description="Custo por resultado especifico daquele anuncio. Permite comparar a eficiencia entre diferentes criativos." />
            <MetricRow color="orange" label="Gasto do criativo" description="Total investido naquele anuncio especifico. Ajuda a entender a distribuicao de orcamento entre criativos." />
          </div>
        </Section>

        {/* ── SECTION 9: Anuncios ativos ── */}
        <Section index={8}>
          <StepHeader number="9" icon={Eye} title="Anuncios Ativos" color="green" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            A secao <span className="text-white font-medium">Anuncios Ativos</span> esta disponivel na aba do cliente e lista todos os anuncios com status <span className="text-emerald-400 font-medium">ATIVO</span> no momento. E uma visao operacional para acompanhar o que esta rodando agora.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            {[
              { nome: "Criativo Verao 2025 — V1", status: "Ativo", gasto: "R$ 890", cpl: "R$ 10,20", ctr: "2.3%", impressoes: "38.400" },
              { nome: "Oferta Limitada — Stories", status: "Ativo", gasto: "R$ 640", cpl: "R$ 13,80", ctr: "1.8%", impressoes: "24.100" },
            ].map((ad) => (
              <div key={ad.nome} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                    <Image className="w-5 h-5 text-zinc-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{ad.nome}</p>
                    <span className="inline-flex items-center gap-1 mt-0.5 text-xs font-semibold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {ad.status}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    { l: "Gasto", v: ad.gasto },
                    { l: "CPL", v: ad.cpl },
                    { l: "CTR", v: ad.ctr },
                    { l: "Impressoes", v: ad.impressoes },
                  ].map((m) => (
                    <div key={m.l}>
                      <span className="text-xs text-zinc-500">{m.l}</span>
                      <p className="text-xs font-semibold text-zinc-200">{m.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2.5 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
            <p className="text-sm text-zinc-400 leading-relaxed">
              O grid de anuncios ativos e responsivo — em telas menores exibe uma coluna, em telas maiores exibe 2 ou 3 colunas. Cada card tem thumbnail, status em tempo real e as principais metricas do anuncio.
            </p>
          </div>
        </Section>

        {/* ── SECTION 10: Painel Admin — Saude dos clientes ── */}
        <Section index={9}>
          <StepHeader number="10" icon={ShieldCheck} title="Painel Admin — Saude dos Clientes" color="violet" />
          <div className="flex items-center gap-2 mb-5">
            <AdminBadge />
            <span className="text-xs text-zinc-500">Visivel apenas para contas com perfil Admin</span>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            O <span className="text-white font-medium">Score de Saude</span> e um indice de 0 a 100 que resume automaticamente a performance de cada cliente. Facilita a identificacao de quem precisa de atencao imediata.
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            <DemoHealthBadge score={95} label="Excelente" color="green" />
            <DemoHealthBadge score={78} label="Bom" color="green" />
            <DemoHealthBadge score={52} label="Atencao" color="yellow" />
            <DemoHealthBadge score={28} label="Critico" color="red" />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-zinc-300 mb-4">Composicao do score</p>
            <ScoreBar label="CPR" pts={35} color="violet" />
            <ScoreBar label="Conversas" pts={35} color="green" />
            <ScoreBar label="Budget" pts={20} color="cyan" />
            <ScoreBar label="Tendencia" pts={10} color="orange" />
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-300 mb-2">Faixas de score</p>
              <div className="space-y-1.5">
                {[
                  { range: "80 – 100", label: "Excelente", color: "text-emerald-400" },
                  { range: "60 – 79", label: "Bom", color: "text-emerald-400" },
                  { range: "40 – 59", label: "Atencao", color: "text-amber-400" },
                  { range: "0 – 39", label: "Critico", color: "text-rose-400" },
                ].map((f) => (
                  <div key={f.range} className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-500">{f.range}</span>
                    <span className={`text-xs font-semibold ${f.color}`}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-300 mb-2">O que influencia o score</p>
              <ul className="space-y-1.5">
                {[
                  "CPR abaixo do benchmark do cliente (+pts)",
                  "Volume de conversas crescendo (+pts)",
                  "Orcamento sendo utilizado adequadamente (+pts)",
                  "Tendencia positiva nos ultimos 7 dias (+pts)",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-zinc-500">
                    <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* ── SECTION 11: Alertas e Campanhas ── */}
        <Section index={10}>
          <StepHeader number="11" icon={Bell} title="Painel Admin — Alertas e Campanhas" color="amber" />
          <div className="flex items-center gap-2 mb-5">
            <AdminBadge />
            <span className="text-xs text-zinc-500">Visivel apenas para contas com perfil Admin</span>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            A aba <span className="text-white font-medium">Alertas</span> exibe notificacoes automaticas baseadas em regras configuradas por metrica. Permite identificar rapidamente campanhas fora do padrao.
          </p>
          <div className="space-y-2.5 mb-6">
            <DemoAlert level="critical" message="Cliente Loja ABC — CPR atingiu R$ 24,80, acima do limite configurado de R$ 20,00." />
            <DemoAlert level="warning" message="Cliente Studio XYZ — Conversas caindo ha 3 dias consecutivos. Tendencia negativa detectada." />
            <DemoAlert level="critical" message="Cliente Escola Top — Sem impressoes nas ultimas 24h. Possivelmente campanha pausada." />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
            <p className="text-sm font-semibold text-zinc-300 mb-3">Exemplos de regras de alerta</p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {[
                { rule: "CPR > R$ 20", label: "Critico", color: "text-rose-400" },
                { rule: "CPR entre R$ 15–20", label: "Atencao", color: "text-amber-400" },
                { rule: "Conversas < 5 / dia", label: "Atencao", color: "text-amber-400" },
                { rule: "Sem impressoes > 12h", label: "Critico", color: "text-rose-400" },
              ].map((r) => (
                <div key={r.rule} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2">
                  <span className="text-xs font-mono text-zinc-400">{r.rule}</span>
                  <span className={`text-xs font-semibold ${r.color}`}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-sm font-semibold text-zinc-300 mb-2">Aba Campanhas</p>
            <p className="text-sm text-zinc-500 leading-relaxed">
              A aba <span className="text-white font-medium">Campanhas</span> no painel admin exibe um breakdown detalhado por campanha de cada cliente: nome, status, impressoes, cliques, conversas, CPR e gasto total. Permite uma analise granular sem sair do Focus Dashboard.
            </p>
          </div>
        </Section>

        {/* ── SECTION 12: Exportacao e Relatorios ── */}
        <Section index={11}>
          <StepHeader number="12" icon={FileText} title="Exportacao e Relatorios" color="green" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            O Focus Dashboard permite gerar relatorios profissionais em HTML para compartilhar com clientes ou arquivar resultados. Voce pode enviar manualmente ou agendar envios automaticos por e-mail.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-zinc-200">Relatorio em HTML</span>
              </div>
              <ul className="space-y-2">
                {[
                  "Abre em nova aba no navegador",
                  "Layout estilizado e pronto para impressao",
                  "Inclui todos os KPIs, graficos e criativos do periodo",
                  "Pode ser salvo como PDF pelo navegador (Ctrl+P)",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-zinc-200">Agendamento automatico</span>
              </div>
              <ul className="space-y-2">
                {[
                  "Configure o e-mail destinatario",
                  "Escolha o periodo: diario, semanal ou mensal",
                  "Defina o dia da semana ou do mes para envio",
                  "Clique em Enviar agora para teste imediato",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <p className="text-sm text-zinc-400 leading-relaxed">
              Os relatorios sao gerados dinamicamente com base nos dados mais recentes disponíveis no momento da exportacao. Sempre verifique o periodo antes de exportar.
            </p>
          </div>
        </Section>

        {/* ── FAQ ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="pt-4"
        >
          <h2 className="text-xl font-bold text-white mb-2">Perguntas frequentes</h2>
          <p className="text-zinc-500 text-sm mb-6">Duvidas comuns sobre o uso do Focus Dashboard.</p>
          <div className="space-y-2">
            <FaqItem
              question="Por que os dados de hoje nao aparecem no dashboard?"
              answer="O Focus Dashboard exibe apenas dados de dias completos. O dia atual fica com dados parciais ate a meia-noite, quando a API do Meta finaliza a consolidacao. Isso evita que numeros incompletos distorcam sua analise — o periodo mais recente disponivel e sempre ontem."
            />
            <FaqItem
              question="O que fazer se o CPR esta muito alto?"
              answer="Um CPR elevado indica que cada conversa esta custando mais do que o esperado. Primeiro, verifique quais criativos possuem CPR mais alto na aba Criativos e considere pausa-los. Em seguida, analise o CTR: se estiver baixo, o problema pode ser no criativo ou na segmentacao. Se o CTR esta bom mas as conversas sao poucas, o problema pode estar na abordagem de vendas."
            />
            <FaqItem
              question="Como interpretar o Score de Saude do cliente?"
              answer="O Score de Saude varia de 0 a 100 e combina 4 fatores: CPR (35 pts), volume de conversas (35 pts), utilizacao do budget (20 pts) e tendencia dos ultimos 7 dias (10 pts). Um score acima de 80 indica campanha saudavel. Entre 40 e 79 requer monitoramento. Abaixo de 40 exige intervencao imediata — verifique os alertas para entender o motivo."
            />
            <FaqItem
              question="Posso acessar o dashboard pelo celular?"
              answer="Sim. O Focus Dashboard e totalmente responsivo e foi desenvolvido com abordagem mobile-first. Todos os graficos, cards e tabelas se adaptam a telas menores. Para melhor experiencia em dispositivos moveis, recomendamos o modo paisagem ao visualizar os graficos de tendencia."
            />
            <FaqItem
              question="Com que frequencia os dados sao atualizados?"
              answer="Os dados sao sincronizados diariamente via API oficial do Meta Ads. A atualizacao ocorre automaticamente a cada 24 horas. Se notar discrepancias entre o Focus Dashboard e o Gerenciador de Anuncios do Meta, aguarde ate o proximo ciclo de sincronizacao — os dados do Meta podem demorar algumas horas para serem finalizados pela propria plataforma."
            />
          </div>
        </motion.section>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="text-center py-10"
        >
          <p className="text-zinc-500 text-sm mb-5">Pronto para acompanhar suas campanhas?</p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-violet-900/30"
          >
            <Layers className="w-4 h-4" />
            Ir para o Dashboard
          </a>
        </motion.div>

      </main>

      <footer className="border-t border-zinc-800 mt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
          <Logo />
          <p className="text-xs text-zinc-600">
            Focus Dashboard — Plataforma de analytics de trafego pago
          </p>
        </div>
      </footer>

    </div>
  );
}
