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
  LogOut,
  Users,
  CalendarDays,
  ChevronDown,
  ArrowLeft,
  BookOpen,
  Layers,
  MousePointerClick,
  Activity,
  MapPin,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import PlatformNav from "../components/PlatformNav";

const Logo = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 3v-3.5A2.5 2.5 0 0 1 5 12.5z" />
    <path d="M9 8.75h6" />
    <path d="M9 11.75h4.5" />
    <circle cx="17.5" cy="17.5" r="2.5" fill="#C9F80D" stroke="none" />
  </svg>
);

// ── Step header with number ──────────────────────────────────────────────────
const StepHeader = ({ number, icon: Icon, title, color = "violet" }) => {
  const colorMap = {
    violet: "bg-[#C9F80D]/10 border-[#C9F80D]/40 text-[#C9F80D]",
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
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#C9F80D]/15 border-2 border-[#C9F80D]/50 shrink-0">
        <span className="text-sm font-bold text-[#C9F80D] font-mono">{number}</span>
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
    violet: { bg: "bg-[#C9F80D]/10", border: "border-[#C9F80D]/20", text: "text-[#C9F80D]" },
  };
  const c = colorMap[color] || colorMap.violet;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] sm:text-xs text-zinc-500 font-medium">{label}</span>
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}>
          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${c.text}`} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-lg sm:text-xl font-bold text-white tabular-nums leading-none">{value}</span>
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
          <span className="w-3 h-0.5 bg-[#C9F80D] inline-block rounded" /> Investimento
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
        stroke="#C9F80D"
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
            <span className="w-3 h-2.5 bg-[#C9F80D]/70 inline-block rounded-sm" /> Cliques
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
              className="w-full bg-[#C9F80D]/60 rounded-sm"
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
    violet: "bg-[#C9F80D]",
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
    violet: "bg-[#C9F80D]/10 border-[#C9F80D]/20 text-[#C9F80D]",
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
    violet: "bg-[#C9F80D]",
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
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Meta</span>
          </a>

          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 p-1.5 rounded-md border border-zinc-800">
              <Logo className="w-4 h-4 text-[#C9F80D]" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">
              Focus<span className="text-[#C9F80D]">Dashboard</span>
            </span>
            <span className="text-zinc-600 hidden sm:block">|</span>
            <span className="text-sm font-semibold hidden sm:block text-[#C9F80D]">Guia</span>
          </div>

          <div className="ml-2 sm:ml-4 overflow-hidden">
            <PlatformNav active="guide" />
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

      <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-12 space-y-4">

        {/* PAGE HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center pb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#C9F80D]/10 border border-[#C9F80D]/20 rounded-full text-[#C9F80D] text-xs font-semibold mb-5">
            <BookOpen className="w-3.5 h-3.5" />
            Guia do cliente
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Entenda suas campanhas
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Veja o que cada número significa e como acompanhar os resultados das suas campanhas no FocusDashboard.
          </p>
          {user && (
            <p className="mt-4 text-sm text-zinc-500">
              Olá,{" "}
              <span className="text-[#C9F80D] font-medium">{user.name || user.username}</span>
            </p>
          )}
        </motion.div>

        {/* ── SECTION 1: O que é o FocusDashboard ── */}
        <Section index={0}>
          <StepHeader number="1" icon={Layers} title="O que é o FocusDashboard" color="violet" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            O <span className="text-[#C9F80D] font-semibold">FocusDashboard</span> é o seu painel de controle de campanhas. Aqui você acompanha em tempo real os resultados de todos os seus anúncios — sem precisar entrar no Meta Ads, Google Ads ou Google Meu Negócio separadamente.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "Tudo em um lugar", desc: "Meta Ads, Google Ads e Google Meu Negócio reunidos em um único painel atualizado diariamente." },
              { label: "Dados reais", desc: "As métricas vêm diretamente das plataformas de anúncios via integração oficial. O que você vê aqui é o que aconteceu de verdade." },
              { label: "Focado no seu negócio", desc: "Você acessa apenas os dados da sua empresa. Cada número aqui representa resultado real das suas campanhas." },
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
            {[
              {
                n: "1",
                title: "Acesse o link enviado pela Focus Mídia",
                desc: "Você recebeu um link personalizado do dashboard. Acesse pelo celular ou computador.",
              },
              {
                n: "2",
                title: "Faça login com seu usuário e senha",
                desc: "Use as credenciais enviadas pela agência. Em caso de dúvida, entre em contato com seu gerente de conta.",
              },
              {
                n: "3",
                title: "Pronto — seus dados carregam automaticamente",
                desc: "O dashboard carrega direto com os dados da sua empresa. Não é preciso configurar nada.",
              },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#C9F80D]/10 border border-[#C9F80D]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-[#C9F80D]">{step.n}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{step.title}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── SECTION 3: Navegando entre as plataformas ── */}
        <Section index={2}>
          <StepHeader number="3" icon={BarChart2} title="Navegando entre as plataformas" color="blue" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            Na parte superior da tela você verá abas de navegação. Cada aba mostra os resultados de uma plataforma diferente.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-zinc-900 border border-sky-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">📘</span>
                <span className="text-sm font-bold text-sky-400">Meta Ads</span>
              </div>
              <p className="text-xs text-zinc-500 font-medium mb-1">Facebook e Instagram</p>
              <p className="text-xs text-zinc-600 leading-relaxed">Resultados de anúncios no feed, stories e reels. Inclui impressões, conversas iniciadas e custo por resultado.</p>
            </div>
            <div className="bg-zinc-900 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🔵</span>
                <span className="text-sm font-bold text-blue-400">Google Ads</span>
              </div>
              <p className="text-xs text-zinc-500 font-medium mb-1">Pesquisa e Display</p>
              <p className="text-xs text-zinc-600 leading-relaxed">Resultados dos anúncios que aparecem no Google quando alguém pesquisa pelo seu negócio ou serviço.</p>
            </div>
            <div className="bg-zinc-900 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">📍</span>
                <span className="text-sm font-bold text-emerald-400">Meu Negócio</span>
              </div>
              <p className="text-xs text-zinc-500 font-medium mb-1">Perfil local no Google</p>
              <p className="text-xs text-zinc-600 leading-relaxed">Visualizações do seu perfil no Google Maps e buscas, ligações recebidas e avaliações dos clientes.</p>
            </div>
          </div>
        </Section>

        {/* ── SECTION 4: Escolhendo o período ── */}
        <Section index={3}>
          <StepHeader number="4" icon={CalendarDays} title="Escolhendo o período" color="cyan" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            Use os botões <span className="text-white font-medium">Diário</span>, <span className="text-white font-medium">Semanal</span> ou <span className="text-white font-medium">Mensal</span> para ver os resultados do período que você quer analisar.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className="border border-cyan-500/30 bg-cyan-500/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-sm font-bold text-cyan-300">Diário</span>
              </div>
              <p className="text-xs font-mono text-cyan-400/70 mb-2">Ontem</p>
              <p className="text-xs text-cyan-300/60 leading-relaxed">Ideal para verificar rapidamente o que aconteceu no dia anterior.</p>
            </div>
            <div className="border border-[#C9F80D]/30 bg-[#C9F80D]/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#C9F80D]" />
                <span className="text-sm font-bold text-[#C9F80D]">Semanal</span>
              </div>
              <p className="text-xs font-mono text-[#C9F80D]/70 mb-2">Últimos 7 dias</p>
              <p className="text-xs text-[#C9F80D]/60 leading-relaxed">Bom para ver tendências da semana e comparar com a semana anterior.</p>
            </div>
            <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-emerald-300">Mensal</span>
              </div>
              <p className="text-xs font-mono text-emerald-400/70 mb-2">Últimos 30 dias</p>
              <p className="text-xs text-emerald-300/60 leading-relaxed">Visão completa do mês. Use para entender a performance geral das campanhas.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <p className="text-sm text-zinc-400 leading-relaxed">
              Os dados do dia atual não aparecem porque as plataformas só finalizam os números após a meia-noite. O período mais recente disponível é sempre ontem.
            </p>
          </div>
        </Section>

        {/* ── SECTION 5: Meta Ads ── */}
        <Section index={4}>
          <StepHeader number="5" icon={MessageCircle} title="Meta Ads — O que cada número significa" color="green" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            Estes são os principais indicadores das suas campanhas no Facebook e Instagram. Veja o que cada um representa para o seu negócio:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
            <DemoKpiCard icon={Eye} label="Impressões" value="142.830" delta="12%" positive={true} deltaLabel="vs período anterior" color="cyan" />
            <DemoKpiCard icon={MessageCircle} label="Conversas" value="347" delta="8%" positive={true} deltaLabel="vs período anterior" color="green" />
            <DemoKpiCard icon={DollarSign} label="Investimento" value="R$ 4.280" delta="-3%" positive={false} deltaLabel="vs período anterior" color="orange" />
            <DemoKpiCard icon={Target} label="CPR" value="R$ 12,34" delta="-8%" positive={true} deltaLabel="bom — queda no custo" color="violet" />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800/60 mb-4">
            <MetricRow color="cyan" label="Impressões" description="Quantas vezes seu anúncio apareceu na tela de alguém. Um número alto indica boa distribuição, mas o que importa mesmo é quantas conversas esse alcance gerou." />
            <MetricRow color="green" label="Conversas" description="Pessoas que clicaram no anúncio e iniciaram uma conversa no WhatsApp, Messenger ou Instagram Direct. É o seu lead — o contato direto com um potencial cliente." />
            <MetricRow color="orange" label="Investimento" description="Total gasto no período. Esse valor reflete o que foi aprovado no orçamento da campanha." />
            <MetricRow color="violet" label="CPR — Custo por Resultado" description="Quanto custou em média cada conversa. Quanto menor esse número, mais eficiente está a campanha. Uma queda no CPR é uma boa notícia." />
          </div>
          <div className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <TrendingDown className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-sm text-zinc-400 leading-relaxed">
              Para o CPR, uma <span className="text-emerald-400 font-medium">queda é positiva</span> — significa que cada conversa está custando menos. Para Conversas, uma <span className="text-emerald-400 font-medium">alta é positiva</span>. Sempre analise os dois juntos.
            </p>
          </div>
        </Section>

        {/* ── SECTION 6: Gráfico de tendência ── */}
        <Section index={5}>
          <StepHeader number="6" icon={TrendingUp} title="Gráfico de tendência" color="violet" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            O gráfico de linha mostra como o Investimento e as Conversas evoluíram ao longo dos últimos 30 dias. É a melhor forma de entender se a campanha está melhorando ou piorando.
          </p>
          <DemoSparkline />
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-300 mb-1.5">Como ler</p>
              <ul className="space-y-1.5">
                {[
                  "Linha roxa = Investimento diário",
                  "Linha verde = Conversas geradas por dia",
                  "Passe o mouse sobre o gráfico para ver os valores exatos de cada dia",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-300 mb-1.5">O que observar</p>
              <ul className="space-y-1.5">
                {[
                  "Investimento subindo e conversas também → campanha saudável",
                  "Investimento subindo e conversas caindo → eficiência está diminuindo",
                  "Ambas crescendo juntas → ótimo sinal de escala",
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

        {/* ── SECTION 7: Melhores anúncios ── */}
        <Section index={6}>
          <StepHeader number="7" icon={Image} title="Seus melhores anúncios" color="amber" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            A seção de Criativos mostra quais anúncios geraram mais conversas no período. Use isso para entender quais peças estão funcionando melhor com o seu público.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <DemoCreativeCard rank={1} conversas={142} cpr="R$ 8,90" gasto="R$ 1.264" />
            <DemoCreativeCard rank={2} conversas={98} cpr="R$ 11,20" gasto="R$ 1.097" />
            <DemoCreativeCard rank={3} conversas={61} cpr="R$ 15,44" gasto="R$ 941" />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800/60 mb-4">
            <MetricRow color="orange" label="Badge #1, #2, #3" description="Os anúncios são classificados pela quantidade de conversas geradas. O primeiro lugar é o seu anúncio mais eficiente no período." />
            <MetricRow color="green" label="Conversas" description="Número de conversas que aquele anúncio específico gerou. É o critério principal de ranqueamento." />
            <MetricRow color="violet" label="CPR do criativo" description="Custo por conversa daquele anúncio. Compare com os outros para identificar os mais eficientes." />
          </div>
          <div className="flex items-start gap-2.5 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <p className="text-sm text-zinc-400 leading-relaxed">
              Se o anúncio #1 tem CPR bem menor que os outros, considere conversar com sua agência sobre aumentar o investimento nele.
            </p>
          </div>
        </Section>

        {/* ── SECTION 8: Google Ads ── */}
        <Section index={7}>
          <StepHeader number="8" icon={Activity} title="Google Ads — O que os números significam" color="blue" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            Os anúncios no Google aparecem quando alguém pesquisa pelo seu produto ou serviço. Aqui estão as métricas mais importantes:
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800/60 mb-4">
            <MetricRow color="cyan" label="Impressões" description="Quantas vezes seu anúncio apareceu nos resultados de pesquisa do Google. Indica o alcance das suas campanhas de busca." />
            <MetricRow color="violet" label="Cliques" description="Quantas pessoas clicaram no seu anúncio e foram para o seu site ou página de destino." />
            <MetricRow color="green" label="CTR — Taxa de Clique" description="Percentual de pessoas que viram o anúncio e clicaram. Um CTR bom indica que o texto do anúncio está atraente para o público certo." />
            <MetricRow color="orange" label="Gasto" description="Total investido nas campanhas Google no período selecionado." />
          </div>
          <div className="flex items-start gap-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
            <p className="text-sm text-zinc-400 leading-relaxed">
              No Google, o objetivo geralmente é levar o cliente ao site ou landing page. Diferente do Meta onde medimos conversas, no Google medimos cliques e conversões no site.
            </p>
          </div>
        </Section>

        {/* ── SECTION 9: Google Meu Negócio ── */}
        <Section index={8}>
          <StepHeader number="9" icon={MapPin} title="Meu Negócio — Sua presença local" color="green" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            O Google Meu Negócio é o perfil da sua empresa no Google Maps e nas pesquisas locais. Essas métricas mostram como as pessoas estão encontrando e interagindo com seu negócio:
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800/60 mb-5">
            <MetricRow color="cyan" label="Impressões totais" description="Quantas vezes seu perfil apareceu para alguém — seja numa busca no Google ou no Maps." />
            <MetricRow color="violet" label="Buscas" description="Pessoas que encontraram seu negócio pesquisando no Google (ex: 'clínica odontológica perto de mim')." />
            <MetricRow color="green" label="Mapas" description="Pessoas que visualizaram seu negócio diretamente no Google Maps." />
            <MetricRow color="orange" label="Ligações" description="Quantas pessoas clicaram em 'Ligar' no seu perfil. Cada ligação é um potencial cliente interessado." />
            <MetricRow color="cyan" label="Cliques no site" description="Acessos ao seu site vindos diretamente do perfil no Google." />
            <MetricRow color="violet" label="Direções/Rotas" description="Pessoas que pediram rota até sua localização — sinal claro de intenção de visita." />
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-sm font-semibold text-zinc-200 mb-3">Avaliações dos clientes</p>
            <p className="text-sm text-zinc-500 leading-relaxed mb-4">
              Além das métricas de visibilidade, você também acompanha a nota média da sua empresa e as avaliações recentes dos seus clientes no Google.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
                <p className="text-sm font-semibold text-zinc-200 mb-1">Nota média (★)</p>
                <p className="text-xs text-zinc-500 leading-relaxed">Média das estrelas. Uma nota acima de 4,5 transmite confiança e influencia novos clientes a escolherem sua empresa.</p>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
                <p className="text-sm font-semibold text-zinc-200 mb-1">Total de avaliações</p>
                <p className="text-xs text-zinc-500 leading-relaxed">Quantidade total de reviews. Quanto mais avaliações, mais relevância seu perfil tem no Google.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── SECTION 10: Exportando o relatório ── */}
        <Section index={9}>
          <StepHeader number="10" icon={FileText} title="Exportando seu relatório" color="green" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-5">
            Você pode gerar um relatório completo do mês com um clique. Ideal para guardar o histórico ou compartilhar os resultados com sua equipe.
          </p>
          <div className="space-y-4 mb-5">
            {[
              { n: "1", text: "Clique no botão 'Exportar Relatório' no canto superior direito do dashboard" },
              { n: "2", text: "O relatório abre em uma nova aba com todos os dados do mês: Meta Ads, Google Ads e Meu Negócio" },
              { n: "3", text: "Para salvar como PDF: pressione Ctrl+P (ou Cmd+P no Mac) e escolha 'Salvar como PDF'" },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-emerald-400">{step.n}</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed pt-1">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <p className="text-sm text-zinc-400 leading-relaxed">
              O relatório é gerado com os dados mais recentes disponíveis no momento da exportação. Sempre verifique a data no topo do documento.
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
          <p className="text-zinc-500 text-sm mb-6">Dúvidas comuns sobre o FocusDashboard.</p>
          <div className="space-y-2">
            <FaqItem
              question="Por que os dados de hoje não aparecem?"
              answer="As plataformas de anúncios finalizam os dados do dia após a meia-noite. Por isso, o período mais recente disponível é sempre ontem. Isso garante que você veja apenas números completos e precisos."
            />
            <FaqItem
              question="O que fazer se o CPR está alto?"
              answer="Um CPR elevado significa que cada conversa está custando mais do que o esperado. Não se preocupe — isso é normal em alguns momentos. Avise seu gerente de conta na Focus Mídia: a equipe analisa os criativos e faz ajustes nas campanhas para reduzir esse custo."
            />
            <FaqItem
              question="Com que frequência os dados são atualizados?"
              answer="Os dados são sincronizados automaticamente uma vez por dia, via integração direta com as plataformas. Se notar alguma diferença entre o dashboard e o que aparece no gerenciador da plataforma, aguarde até o próximo ciclo — pode haver um atraso de algumas horas na consolidação."
            />
            <FaqItem
              question="Posso acessar pelo celular?"
              answer="Sim! O FocusDashboard é totalmente responsivo e funciona bem em smartphones e tablets. Para ver os gráficos com mais conforto, recomendamos o modo paisagem no celular."
            />
            <FaqItem
              question="O que é uma 'impressão'?"
              answer="Uma impressão acontece toda vez que seu anúncio é exibido na tela de alguém — mesmo que essa pessoa não clique. É a medida de alcance: quantas vezes seu anúncio foi visto no total."
            />
            <FaqItem
              question="Como sei se minha campanha está indo bem?"
              answer="Os principais sinais positivos são: CPR estável ou caindo, número de conversas crescendo, e os gráficos de tendência subindo juntos. Se tiver dúvidas sobre a performance, fale com seu gerente na Focus Mídia — estamos aqui para explicar tudo."
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
          <p className="text-zinc-500 text-sm mb-5">Acompanhe seus resultados em tempo real</p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#C9F80D] hover:bg-[#b8e00c] text-zinc-950 font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-[#C9F80D]/20"
          >
            <Layers className="w-4 h-4" />
            Ir para o Dashboard
          </a>
        </motion.div>

      </main>

      <footer className="border-t border-zinc-800 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Logo className="w-4 h-4 text-[#C9F80D]" />
            <span className="text-sm font-bold">Focus<span className="text-[#C9F80D]">Dashboard</span></span>
          </div>
          <p className="text-xs text-zinc-600">
            Focus Dashboard — Plataforma de analytics de tráfego pago
          </p>
        </div>
      </footer>

    </div>
  );
}
