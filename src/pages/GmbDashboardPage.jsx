import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, LogOut, Star, MapPin, Phone, Globe, TrendingUp,
  Eye, Navigation, MousePointer, Search, Settings, MessageCircle,
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

const GMB_GREEN = "#34A853";

const PERIODS = [
  { id: "daily",   label: "Diário",  sub: "Ontem" },
  { id: "weekly",  label: "Semanal", sub: "Últimos 7 dias" },
  { id: "monthly", label: "Mensal",  sub: "Últimos 30 dias" },
];

const STAR_LABELS = {
  ONE:   1,
  TWO:   2,
  THREE: 3,
  FOUR:  4,
  FIVE:  5,
};

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
        <Icon size={14} style={{ color }} />
      </span>
    </div>
    <div className="text-2xl font-bold text-white">{value}</div>
    {sub && <div className="text-xs text-zinc-500">{sub}</div>}
  </motion.div>
);

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
              className="ml-1 text-violet-400 text-xs hover:underline"
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

  const clientId = user?.clientId || "";

  const fetchInsights = useCallback(async () => {
    setLoadingInsights(true);
    setError("");
    try {
      const params = new URLSearchParams({ period });
      if (user?.role === "admin" && clientId) params.set("clientId", clientId);
      const data = await authFetch(`/api/gmb/insights?${params}`).then(r => r.json());
      setInsights(data);
    } catch {
      setError("Erro ao carregar métricas do Google Meu Negócio.");
    } finally {
      setLoadingInsights(false);
    }
  }, [period, clientId, authFetch, user?.role]);

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const params = new URLSearchParams();
      if (user?.role === "admin" && clientId) params.set("clientId", clientId);
      const data = await authFetch(`/api/gmb/reviews?${params}`).then(r => r.json());
      setReviews(data);
    } catch {
      // silent — reviews failure shouldn't block insights
    } finally {
      setLoadingReviews(false);
    }
  }, [clientId, authFetch, user?.role]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const m = insights?.metrics || {};

  const isNotConfigured = insights && !insights.configured;
  const hasInsights     = insights?.configured && insights?.metrics;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/60 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo className="w-7 h-7 text-violet-400" />
            <span className="text-sm font-semibold text-zinc-200">Focus Dashboard</span>
          </div>

          <PlatformNav active="gmb" />

          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <a href="/admin" className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                <Settings size={16} />
              </a>
            )}
            <button onClick={logout} className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin size={18} style={{ color: GMB_GREEN }} />
              Google Meu Negócio
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">Visibilidade e avaliações do seu perfil no Google</p>
          </div>

          {/* Period switcher */}
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 self-start">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p.id
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">{error}</div>
        )}

        {/* Not configured */}
        {isNotConfigured && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center"
          >
            <MapPin size={32} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-zinc-400 font-medium mb-1">Google Meu Negócio não configurado</p>
            <p className="text-sm text-zinc-600">
              {user?.role === "admin"
                ? "Adicione o Location ID em Admin → editar cliente."
                : "Entre em contato com a agência para configurar."}
            </p>
          </motion.div>
        )}

        {/* ── KPI CARDS ── */}
        {(loadingInsights || hasInsights) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Impressões", key: "impressoes", icon: Eye,          color: GMB_GREEN },
              { label: "Buscas",     key: "buscas",     icon: Search,        color: "#4285F4" },
              { label: "Mapas",      key: "mapas",       icon: MapPin,        color: "#EA4335" },
              { label: "Ligações",   key: "ligacoes",    icon: Phone,         color: "#FBBC04" },
              { label: "Site",       key: "cliquessite", icon: Globe,         color: "#34A853" },
              { label: "Direções",   key: "direcoes",    icon: Navigation,    color: "#9C27B0" },
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
                />
              )
            ))}
          </div>
        )}

        {/* ── REVIEWS SECTION ── */}
        {(loadingReviews || reviews?.configured) && (
          <div>
            {/* Reviews header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  Avaliações
                </h2>
                {reviews?.configured && !loadingReviews && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {reviews.totalReviewCount} avaliações no total
                  </p>
                )}
              </div>

              {/* Average rating badge */}
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
                <MessageCircle size={28} className="mx-auto mb-2 text-zinc-600" />
                <p className="text-zinc-500 text-sm">Nenhuma avaliação encontrada ainda.</p>
              </div>
            )}
          </div>
        )}

        {/* Not configured for reviews */}
        {reviews && !reviews.configured && !isNotConfigured && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <Star size={28} className="mx-auto mb-2 text-zinc-600" />
            <p className="text-zinc-500 text-sm">Avaliações não disponíveis.</p>
          </div>
        )}

        {/* About section */}
        {!isNotConfigured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <TrendingUp size={14} style={{ color: GMB_GREEN }} />
              O que essas métricas significam?
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-xs text-zinc-400">
              {[
                { icon: "👁️", label: "Impressões", desc: "Quantas vezes seu perfil apareceu no Google (buscas + Maps)." },
                { icon: "🔍", label: "Buscas",     desc: "Visualizações via Google Search — usuários buscando seu negócio." },
                { icon: "📍", label: "Mapas",      desc: "Visualizações via Google Maps — usuários encontrando você no mapa." },
                { icon: "📞", label: "Ligações",   desc: "Cliques no número de telefone do seu perfil." },
                { icon: "🌐", label: "Cliques no site", desc: "Acessos ao seu site originados do perfil do Google." },
                { icon: "🧭", label: "Direções",   desc: "Solicitações de rota para o seu endereço no Maps." },
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
      </main>
    </div>
  );
}
