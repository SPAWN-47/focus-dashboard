import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Lock } from "lucide-react";

const Logo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#C9F80D]">
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 3v-3.5A2.5 2.5 0 0 1 5 12.5z" />
    <path d="M9 8.75h6" />
    <path d="M9 11.75h4.5" />
    <circle cx="17.5" cy="17.5" r="2.5" fill="#C9F80D" stroke="none" />
  </svg>
);

export default function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get("token");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [showConf, setShowConf]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("As senhas não coincidem");
    if (password.length < 6) return setError("Senha deve ter ao menos 6 caracteres");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao redefinir senha");
      setDone(true);
      setTimeout(() => { window.location.href = "/login"; }, 3000);
    } catch (err) {
      setError(err.message || "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 18 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Logo />
          </div>
          <span className="text-base font-bold text-white">Focus</span>
          <span className="text-base font-bold" style={{ color: "#C9F80D" }}>Dashboard</span>
        </div>

        {!token ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-zinc-300 font-semibold">Link inválido</p>
            <p className="text-zinc-500 text-sm mt-1">Este link de recuperação é inválido ou expirou.</p>
            <a href="/forgot-password" className="inline-flex items-center gap-1.5 text-sm font-medium mt-4 transition-colors" style={{ color: "#C9F80D" }}>
              Solicitar novo link
            </a>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#C9F80D]/10 border border-[#C9F80D]/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" style={{ color: "#C9F80D" }} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Senha redefinida!</h2>
                <p className="text-zinc-500 text-sm">Redirecionando para o login em 3 segundos...</p>
                <a href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium mt-4 transition-colors" style={{ color: "#C9F80D" }}>
                  <ArrowLeft className="w-4 h-4" /> Ir para o login agora
                </a>
              </motion.div>
            ) : (
              <motion.div key="form">
                <a href="/login" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6">
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
                </a>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">Nova senha</h2>
                  <p className="text-zinc-500 text-sm mt-1.5">Crie uma nova senha para sua conta.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Nova senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres" required autoFocus
                        className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl pl-10 pr-11 py-3 text-sm outline-none focus:border-[#C9F80D] focus:ring-1 focus:ring-[#C9F80D]/30 transition-all" />
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Confirmar senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input type={showConf ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Repita a nova senha" required
                        className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl pl-10 pr-11 py-3 text-sm outline-none focus:border-[#C9F80D] focus:ring-1 focus:ring-[#C9F80D]/30 transition-all" />
                      <button type="button" onClick={() => setShowConf(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                        {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="text-red-400 text-sm">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(n => (
                          <div key={n} className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{ background: password.length >= n * 3 ? "#C9F80D" : "#3f3f46" }} />
                        ))}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {password.length < 6 ? "Fraca — mínimo 6 caracteres" : password.length < 10 ? "Média" : "Forte"}
                      </p>
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 font-semibold rounded-xl py-3 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "#C9F80D", color: "#09090b" }}>
                    {loading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : "Redefinir senha"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <p className="text-center text-zinc-700 text-xs mt-8">Focus Mídia Digital · {new Date().getFullYear()}</p>
      </motion.div>
    </div>
  );
}
