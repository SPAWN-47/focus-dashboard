import { motion } from "framer-motion";
import { ArrowLeft, LogOut, BookOpen, Eye, MousePointer, MessageCircle,
  DollarSign, TrendingUp, Target, BarChart3, HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const Logo = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 3v-3.5A2.5 2.5 0 0 1 5 12.5z" />
    <path d="M9 8.75h6" />
    <path d="M9 11.75h4.5" />
    <circle cx="17.5" cy="17.5" r="2.5" fill="#8b5cf6" stroke="none" />
  </svg>
);

const Section = ({ icon: Icon, color, title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl" style={{ background: color + "20" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h2 className="text-base font-bold text-zinc-100">{title}</h2>
    </div>
    {children}
  </motion.div>
);

const MetricRow = ({ icon, color, label, desc, formula }) => (
  <div className="flex gap-3 py-3 border-b border-zinc-800/60 last:border-0">
    <span className="text-lg mt-0.5">{icon}</span>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-sm font-semibold text-zinc-100">{label}</span>
        {formula && (
          <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-400 font-mono">
            {formula}
          </span>
        )}
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800/60 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-medium text-zinc-200">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="text-xs text-zinc-400 leading-relaxed pb-4">{a}</p>
      )}
    </div>
  );
};

export default function GuidePage() {
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
            <span className="hidden sm:block">Dashboard</span>
          </a>

          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 p-1.5 rounded-md border border-zinc-800">
              <Logo className="w-4 h-4 text-violet-500" />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">
              Chat<span className="text-violet-500">Focus</span>
            </span>
            <span className="text-zinc-600 hidden sm:block">|</span>
            <span className="text-sm text-zinc-400 hidden sm:block flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Guia do Dashboard
            </span>
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-xs font-medium mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Guia completo
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-3">
            Entendendo o seu Dashboard
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xl mx-auto">
            Todas as métricas e gráficos do painel explicados de forma simples,
            para que você saiba exatamente o que está acontecendo com suas campanhas.
          </p>
        </motion.div>

        {/* PERÍODOS */}
        <Section icon={Target} color="#8B5CF6" title="Períodos de análise">
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            No topo do dashboard você escolhe o período que quer analisar. Os dados sempre se referem ao período <strong className="text-zinc-300">já encerrado</strong> (não o dia atual, que ainda está em andamento).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Diário", sub: "Ontem", desc: "Resultados do dia anterior completo" },
              { label: "Semanal", sub: "Semana passada", desc: "Segunda a domingo da semana anterior" },
              { label: "Mensal", sub: "Mês passado", desc: "Mês anterior completo (ex: fevereiro inteiro)" },
            ].map((p) => (
              <div key={p.label} className="px-4 py-3 bg-zinc-800/60 border border-zinc-700 rounded-xl">
                <p className="text-sm font-semibold text-zinc-100">{p.label}</p>
                <p className="text-[11px] text-violet-400 mb-1">{p.sub}</p>
                <p className="text-[11px] text-zinc-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* KPI CARDS */}
        <Section icon={Eye} color="#06B6D4" title="Cards de KPI — O que cada número significa">
          <MetricRow
            icon="👁️"
            color="#06B6D4"
            label="Impressões"
            desc="Quantas vezes o seu anúncio foi exibido na tela de alguém. Não significa que a pessoa prestou atenção — só que o anúncio apareceu."
          />
          <MetricRow
            icon="🎯"
            color="#8B5CF6"
            label="Alcance"
            desc="Quantas pessoas diferentes viram seu anúncio. Difere de Impressões: se a mesma pessoa viu 3 vezes, conta 3 impressões mas só 1 de alcance."
          />
          <MetricRow
            icon="🖱️"
            color="#F59E0B"
            label="Cliques"
            desc="Quantas vezes alguém clicou no anúncio — seja no botão, no link ou na imagem. Indica interesse real."
          />
          <MetricRow
            icon="💬"
            color="#10B981"
            label="Conversas / Leads"
            desc='Quantas pessoas iniciaram uma conversa (WhatsApp, Messenger, Instagram DM) ou realizaram a ação desejada após ver o anúncio. É o principal resultado para campanhas de contato.'
          />
          <MetricRow
            icon="💰"
            color="#EF4444"
            label="Investimento"
            desc="Valor total gasto no período selecionado. É o quanto foi debitado da conta de anúncios."
          />
          <MetricRow
            icon="💵"
            color="#F97316"
            label="CPM"
            formula="Gasto ÷ Impressões × 1000"
            desc="Custo por Mil impressões. Mede quanto custa fazer seu anúncio aparecer 1.000 vezes. Útil para comparar eficiência de alcance."
          />
          <MetricRow
            icon="🖱️"
            color="#F59E0B"
            label="CPC"
            formula="Gasto ÷ Cliques"
            desc="Custo por Clique. Quanto você pagou em média por cada clique. Quanto menor, mais eficiente é o anúncio em gerar interesse."
          />
          <MetricRow
            icon="💬"
            color="#10B981"
            label="CPR (Custo por Resultado)"
            formula="Gasto ÷ Conversas"
            desc="Custo por Conversa ou Lead. O indicador mais importante: quanto você pagou para cada pessoa que entrou em contato. Quanto menor, melhor."
          />
        </Section>

        {/* FUNIL */}
        <Section icon={Target} color="#8B5CF6" title="Funil de Conversão">
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            O funil mostra o caminho do usuário desde ver o anúncio até entrar em contato. As taxas entre etapas mostram onde está a eficiência (ou o problema).
          </p>
          <div className="space-y-2">
            {[
              { label: "Impressões → Cliques", name: "CTR", formula: "Cliques ÷ Impressões × 100", good: "> 1%", desc: "Taxa de cliques. Mede se o anúncio é atrativo o suficiente para gerar curiosidade." },
              { label: "Cliques → Conversas", name: "Taxa de Conversa", formula: "Conversas ÷ Cliques × 100", good: "> 5%", desc: "Mede se quem clicou realmente entrou em contato. Depende da landing page ou do próprio anúncio." },
              { label: "Impressões → Conversas", name: "Taxa Global", formula: "Conversas ÷ Impressões × 100", good: "> 0.05%", desc: "A taxa mais completa: de todos que viram o anúncio, qual percentual virou contato." },
            ].map((t) => (
              <div key={t.name} className="px-4 py-3 bg-zinc-800/40 border border-zinc-700/60 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-zinc-200">{t.name}</span>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{t.formula}</span>
                  <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Bom: {t.good}</span>
                </div>
                <p className="text-[11px] text-zinc-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* TENDÊNCIA */}
        <Section icon={TrendingUp} color="#10B981" title="Tendência — Últimos 30 dias">
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            O card de tendência mostra dois gráficos de linha com a evolução diária ao longo dos últimos 30 dias:
          </p>
          <div className="space-y-3">
            <div className="flex gap-3 px-4 py-3 bg-zinc-800/40 border border-zinc-700/60 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-violet-500 shrink-0 mt-1" />
              <div>
                <p className="text-sm font-semibold text-zinc-200 mb-0.5">Investimento diário (R$)</p>
                <p className="text-xs text-zinc-500">Quanto foi gasto em anúncios a cada dia. Picos indicam datas com orçamento maior ou campanhas temporárias.</p>
              </div>
            </div>
            <div className="flex gap-3 px-4 py-3 bg-zinc-800/40 border border-zinc-700/60 rounded-xl">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 mt-1" />
              <div>
                <p className="text-sm font-semibold text-zinc-200 mb-0.5">Conversas / Leads diários</p>
                <p className="text-xs text-zinc-500">Quantos contatos foram gerados por dia. Ideal que siga o mesmo ritmo do investimento — se o investimento sobe mas as conversas caem, algo está errado.</p>
              </div>
            </div>
          </div>
          <div className="mt-4 px-4 py-3 bg-violet-500/5 border border-violet-500/20 rounded-xl">
            <p className="text-xs text-zinc-400">
              <strong className="text-zinc-300">Resumo no rodapé do card:</strong> Total investido nos 30 dias, total de conversas e dias com pelo menos um resultado registrado.
            </p>
          </div>
        </Section>

        {/* DISTRIBUIÇÃO */}
        <Section icon={BarChart3} color="#F59E0B" title="Distribuição — Cliques vs Conversas">
          <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
            O gráfico de barras mostra os <strong className="text-zinc-300">últimos 21 dias</strong> de cliques de forma proporcional — a barra mais alta representa o dia com mais cliques.
          </p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Passe o mouse sobre cada barra para ver o detalhamento daquele dia: cliques, conversas e gasto. Permite identificar rapidamente quais dias tiveram picos de resultado.
          </p>
        </Section>

        {/* FAQ */}
        <Section icon={HelpCircle} color="#6B7280" title="Dúvidas frequentes">
          <FaqItem
            q="Por que os dados de hoje não aparecem?"
            a="O dashboard sempre mostra dados de períodos concluídos (ontem, semana passada, mês passado). Dados do dia atual ficam incompletos até a meia-noite, então são exibidos apenas no dia seguinte."
          />
          <FaqItem
            q="Os números são do Meta Ads ou do meu site?"
            a="São dados diretamente da sua conta de anúncios do Meta (Facebook/Instagram Ads). Não incluem tráfego orgânico nem dados do Google Analytics."
          />
          <FaqItem
            q="O que significa 'Conversas' exatamente?"
            a="Depende do objetivo configurado na sua campanha. Geralmente são pessoas que clicaram no botão 'Enviar mensagem' e iniciaram uma conversa no WhatsApp, Messenger ou Instagram Direct."
          />
          <FaqItem
            q="Meu CPR está alto. O que fazer?"
            a="CPR alto significa que você está pagando caro por cada contato. Pode ser sinal de anúncio pouco atrativo, público muito amplo ou segmentação errada. Entre em contato com a equipe da Focus para uma análise."
          />
          <FaqItem
            q="Por que os dados do gráfico de tendência diferem dos KPIs?"
            a="Os KPIs mostram o período selecionado (diário/semanal/mensal). O gráfico de tendência sempre mostra os últimos 30 dias corridos, independente do período escolhido."
          />
        </Section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center py-6"
        >
          <p className="text-sm text-zinc-400 mb-4">Pronto para analisar suas campanhas?</p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Ir para o Dashboard
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </a>
        </motion.div>
      </main>

      <footer className="border-t border-zinc-800/60 py-6 mt-8">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-600 text-xs">
            <Logo className="w-4 h-4 text-violet-500/50" />
            <span>Focus Mídia Digital</span>
          </div>
          <span className="text-xs text-zinc-700">Guia do Dashboard</span>
        </div>
      </footer>
    </div>
  );
}
