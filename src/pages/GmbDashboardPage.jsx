import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  LogOut, Star, MapPin, Phone, Globe, TrendingUp,
  Eye, Navigation, Search, Settings, MessageCircle, ArrowLeft,
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

const KpiCard = ({ label, value, icon: Icon, color, delay = 0 }) => (
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
              <Logo className="w-4 h-4 text-violet-500" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">
              Focus<span className="text-violet-500">Dashboard</span>
            </span>
            <span className="text-zinc-600 hidden sm:block">|</span>
            <span className="text-sm font-semibold hidden sm:block" style={{ color: GMB_GREEN }}>
              Meu Negócio
            </span>
          </div>

          <div className="ml-4">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

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
              className="flex items-center justify-between flex-wrap gap-3"
            >
              <div>
                <h1 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: GMB_GREEN }} />
                  Google Meu Negócio
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Visibilidade e avaliações do seu perfil no Google
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

            {/* ── KPI CARDS ── */}
            {(loadingInsights || hasInsights) && !isApiError && !isQuotaError && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Impressões", key: "impressoes", icon: Eye,        color: GMB_GREEN },
                  { label: "Buscas",     key: "buscas",     icon: Search,      color: "#4285F4" },
                  { label: "Mapas",      key: "mapas",      icon: MapPin,      color: "#EA4335" },
                  { label: "Ligações",   key: "ligacoes",   icon: Phone,       color: "#FBBC04" },
                  { label: "Site",       key: "cliquessite",icon: Globe,       color: "#34A853" },
                  { label: "Direções",   key: "direcoes",   icon: Navigation,  color: "#9C27B0" },
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
                <div className="flex items-center justify-between flex-wrap gap-3">
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
              <Logo className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <span className="text-xs text-zinc-500">
              Focus<span className="text-violet-500 font-semibold">Dashboard</span>
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
