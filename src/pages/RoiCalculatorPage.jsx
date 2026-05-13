import { ArrowLeft, LogOut, Calculator } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import RoiCalculator from "../components/RoiCalculator";

const Logo = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 3v-3.5A2.5 2.5 0 0 1 5 12.5z" />
    <path d="M9 8.75h6" />
    <path d="M9 11.75h4.5" />
    <circle cx="17.5" cy="17.5" r="2.5" fill="#C9F80D" stroke="none" />
  </svg>
);

export default function RoiCalculatorPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <a href="/admin" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0 text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Admin</span>
          </a>

          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 p-1.5 rounded-md border border-zinc-800">
              <Logo className="w-4 h-4 text-[#C9F80D]" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">
              Focus<span className="text-[#C9F80D]">Dashboard</span>
            </span>
            <span className="text-zinc-600 hidden sm:block">|</span>
            <span className="text-xs bg-[#C9F80D]/15 text-[#C9F80D] border border-[#C9F80D]/30 rounded-full px-2 py-0.5 hidden sm:flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              Calculadora ROI
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:block">{user?.name}</span>
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

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <RoiCalculator />
      </main>
    </div>
  );
}
