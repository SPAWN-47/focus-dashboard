import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, BarChart3, Target, Globe, AlertCircle, Mail, CheckCircle2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Logo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#C9F80D]">
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 3v-3.5A2.5 2.5 0 0 1 5 12.5z" />
    <path d="M9 8.75h6" />
    <path d="M9 11.75h4.5" />
    <circle cx="17.5" cy="17.5" r="2.5" fill="#C9F80D" stroke="none" />
  </svg>
);

const features = [
  { icon: BarChart3, label: "Meta Ads", desc: "Resultados de Facebook & Instagram em tempo real" },
  { icon: Target,    label: "Google Ads", desc: "Search, Performance Max e YouTube" },
  { icon: Globe,     label: "Meu Negócio", desc: "Avaliações e presença no Google Maps" },
];

// ── Modal de recuperação de senha (fake — só UI) ──────────────────────────────
function ForgotModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    /* Backdrop */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          {sent ? (
            /* ── Success ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center pt-2 pb-1"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#C9F80D15", border: "1px solid #C9F80D30" }}>
                <CheckCircle2 className="w-7 h-7" style={{ color: "#C9F80D" }} />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Email enviado!</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Enviamos um link de recuperação para<br />
                <span className="text-zinc-200 font-medium">{email}</span>
              </p>
              <p className="text-xs text-zinc-600 mt-2">Verifique sua caixa de entrada e spam.</p>
              <button
                onClick={onClose}
                className="mt-5 w-full font-semibold rounded-xl py-2.5 text-sm transition-all"
                style={{ background: "#C9F80D", color: "#09090b" }}
              >
                Fechar
              </button>
            </motion.div>
          ) : (
            /* ── Form ── */
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#C9F80D15" }}>
                  <Mail className="w-4 h-4" style={{ color: "#C9F80D" }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Recuperar senha</h3>
                  <p className="text-xs text-zinc-500">Informe o email cadastrado</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoFocus
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#C9F80D] focus:ring-1 focus:ring-[#C9F80D]/30 transition-all"
                />
                <button
                  type="submit"
                  className="w-full font-semibold rounded-xl py-2.5 text-sm transition-all"
                  style={{ background: "#C9F80D", color: "#09090b" }}
                >
                  Enviar link de recuperação
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      window.location.href = user.role === "admin" ? "/admin" : "/dashboard";
    } catch (err) {
      setError(err.message || "Usuário ou senha incorretos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">

      {/* LEFT BRAND PANEL — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 bg-zinc-900 border-r border-zinc-800 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: "#C9F80D", transform: "translate(-50%, -50%)" }} />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-5" style={{ background: "#C9F80D", transform: "translate(40%, 40%)" }} />
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Top: Logo */}
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Logo />
            </div>
            <div>
              <span className="text-base font-bold text-white">Focus</span>
              <span className="text-base font-bold" style={{ color: "#C9F80D" }}>Dashboard</span>
            </div>
          </div>
        </div>

        {/* Middle: headline + features */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative space-y-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Seus resultados de<br />
              <span style={{ color: "#C9F80D" }}>tráfego pago</span> em<br />
              tempo real.
            </h1>
            <p className="text-zinc-500 mt-3 text-sm leading-relaxed">
              Acompanhe Meta Ads, Google Ads e Google Meu Negócio em um único painel, com dados atualizados e relatórios automáticos.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#C9F80D20" }}>
                  <f.icon className="w-4 h-4" style={{ color: "#C9F80D" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{f.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom: agency info */}
        <div className="relative">
          <p className="text-zinc-600 text-xs">Focus Mídia | Marketing e Performance</p>
          <p className="text-zinc-700 text-xs mt-0.5">Londrina/PR · © {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Logo />
          </div>
          <span className="text-base font-bold text-white">Focus</span>
          <span className="text-base font-bold" style={{ color: "#C9F80D" }}>Dashboard</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
          className="w-full max-w-sm"
        >
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>
            <p className="text-zinc-500 text-sm mt-1.5">Faça login para acessar o painel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                required
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm transition-all outline-none focus:border-[#C9F80D] focus:ring-1 focus:ring-[#C9F80D]/30"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-zinc-500 hover:text-[#C9F80D] transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3 pr-11 text-sm transition-all outline-none focus:border-[#C9F80D] focus:ring-1 focus:ring-[#C9F80D]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-red-400 text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-semibold rounded-xl py-3 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#C9F80D", color: "#09090b" }}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-zinc-700 text-xs mt-8">
            Focus Mídia Digital · {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>

      {/* Forgot password modal */}
      <AnimatePresence>
        {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
      </AnimatePresence>

    </div>
  );
}
