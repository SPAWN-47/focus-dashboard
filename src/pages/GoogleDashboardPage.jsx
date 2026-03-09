import { motion } from "framer-motion";
import { ArrowLeft, LogOut, Construction, Clock, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import PlatformNav from "../components/PlatformNav";

const Logo = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 3v-3.5A2.5 2.5 0 0 1 5 12.5z" />
    <path d="M9 8.75h6" />
    <path d="M9 11.75h4.5" />
    <circle cx="17.5" cy="17.5" r="2.5" fill="#8b5cf6" stroke="none" />
  </svg>
);

export default function GoogleDashboardPage() {
  const { user, logout } = useAuth();

  if (!user) {
    window.location.href = "/login";
    return null;
  }

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
            <span className="hidden sm:block">Meta Ads</span>
          </a>

          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 p-1.5 rounded-md border border-zinc-800">
              <Logo className="w-4 h-4 text-violet-500" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">
              Chat<span className="text-violet-500">Focus</span>
            </span>
            <span className="text-zinc-600 hidden sm:block">|</span>
            <span className="text-sm text-zinc-400 hidden sm:block">Google Ads</span>
          </div>

          {/* Platform Tabs */}
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

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-lg"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Construction className="w-10 h-10 text-yellow-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                <span className="text-sm">🔵</span>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-zinc-100 mb-2">
            Google Ads — Em desenvolvimento
          </h1>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            A integração com a API do Google Ads está sendo preparada. Em breve você poderá
            acompanhar campanhas de Search, Display e YouTube neste painel.
          </p>

          {/* Features coming */}
          <div className="grid grid-cols-1 gap-3 text-left mb-8">
            {[
              { icon: "🔍", label: "Campanhas de Search", desc: "Impressões, cliques e conversões" },
              { icon: "🖼️", label: "Display & YouTube", desc: "Alcance, visualizações e CPV" },
              { icon: "💰", label: "ROAS e CPA", desc: "Retorno sobre o investimento" },
              { icon: "📈", label: "Tendência diária", desc: "Evolução dos resultados" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-center gap-3 px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl"
              >
                <span className="text-xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{f.label}</p>
                  <p className="text-xs text-zinc-500">{f.desc}</p>
                </div>
                <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-lg">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-[10px] text-zinc-500">Em breve</span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.a
            href="/dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Zap className="w-4 h-4" />
            Ver dashboard Meta Ads
          </motion.a>
        </motion.div>
      </main>
    </div>
  );
}
