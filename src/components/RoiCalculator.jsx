import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, ReferenceLine, ReferenceDot, Cell,
} from "recharts";
import {
  Calculator, DollarSign, Users, Target,
  TrendingUp, TrendingDown, Calendar, Wallet, AlertTriangle, Info, Save, Trash2,
  ChevronDown, FileText, User, Sparkles, X, Activity, RefreshCw,
  Briefcase, Clock, Heart, PiggyBank, Layers, Plus, Gauge, FileDown,
  Link2, Copy, Check,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  calcularPlano,
  GATILHOS,
  PARAMETROS_PADRAO,
  FASE_LABEL,
  FASE_COLOR,
  CANAIS_TEMPLATE,
} from "../lib/calculos";
import { SEGMENTOS, classifyCpl } from "../lib/benchmarks";
import { pdf } from "@react-pdf/renderer";
import RoiPdfTemplate from "./RoiPdfTemplate";

// ─────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────
const fBRL = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fBRLfull = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const fNum = (v) => Math.round(v).toLocaleString("pt-BR");
const fPct = (v) => (v * 100).toFixed(1) + "%";

// ─────────────────────────────────────────────
// FIELD
// ─────────────────────────────────────────────
const Field = ({ label, hint, children, autoFilled, suggestion }) => (
  <label className="flex flex-col gap-1.5">
    <span className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
      {autoFilled && (
        <span className="flex items-center gap-1 text-[9px] text-[#C9F80D] font-semibold uppercase tracking-wider">
          <Sparkles className="w-2.5 h-2.5" />
          do cliente
        </span>
      )}
    </span>
    {children}
    {suggestion}
    {hint && <span className="text-[10px] text-zinc-600">{hint}</span>}
  </label>
);

/**
 * Mostra sugestão "Real: X · Usar" abaixo do input quando há valor real disponível.
 * - `currentValue`: valor projetado atual
 * - `realValue`: valor real dos últimos 30 dias
 * - `formatter`: como exibir o valor (ex: fBRL)
 * - `lowerIsBetter`: pra CPL/gasto, quanto menor melhor. Avisa quando projetado < real*0.8 (otimista demais)
 * - `onApply`: callback ao clicar "usar este valor"
 */
const RealSuggestion = ({ currentValue, realValue, formatter, lowerIsBetter = false, onApply }) => {
  if (!realValue || realValue === 0) return null;

  const cur = Number(currentValue) || 0;
  const diff = cur > 0 ? ((cur - realValue) / realValue) * 100 : 0;
  // Aviso se projeção está "otimista demais": pra lower-is-better, projetado muito < real; pra higher-is-better, projetado muito > real
  const isTooOptimistic = cur > 0 && (
    lowerIsBetter ? cur < realValue * 0.8 : cur > realValue * 1.3
  );
  // Já está alinhado com real (±10%)
  const isClose = cur > 0 && Math.abs(diff) <= 10;

  return (
    <div className={`flex items-center justify-between gap-2 px-2 py-1 rounded-md border ${
      isTooOptimistic
        ? "bg-amber-500/10 border-amber-500/30"
        : isClose
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-zinc-950 border-zinc-800"
    }`}>
      <span className={`text-[10px] flex items-center gap-1 ${
        isTooOptimistic ? "text-amber-400" : "text-zinc-500"
      }`}>
        {isTooOptimistic && <AlertTriangle className="w-2.5 h-2.5" />}
        <span>Real 30d: <span className="font-mono text-zinc-300">{formatter(realValue)}</span></span>
        {cur > 0 && Math.abs(diff) > 1 && (
          <span className={diff < 0 ? "text-emerald-400" : diff > 0 ? "text-red-400" : ""}>
            ({diff > 0 ? "+" : ""}{diff.toFixed(0)}%)
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={() => onApply(realValue)}
        className="text-[10px] font-semibold text-[#C9F80D] hover:text-[#b8e308] transition-colors whitespace-nowrap"
      >
        Usar este valor
      </button>
    </div>
  );
};

const NumberInput = ({ value, onChange, prefix, suffix, step = 1, min = 0 }) => (
  <div className="flex items-stretch bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden focus-within:border-[#C9F80D]/50 transition-colors">
    {prefix && (
      <span className="px-2.5 flex items-center text-xs text-zinc-500 bg-zinc-950/40 border-r border-zinc-800">
        {prefix}
      </span>
    )}
    <input
      type="number"
      step={step}
      min={min}
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? 0 : Number(v));
      }}
      className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
    {suffix && (
      <span className="px-2.5 flex items-center text-xs text-zinc-500 bg-zinc-950/40 border-l border-zinc-800">
        {suffix}
      </span>
    )}
  </div>
);

// ─────────────────────────────────────────────
// KPI CARD
// ─────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 130, damping: 18, delay }}
    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex flex-col gap-2"
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="p-1.5 rounded-lg" style={{ background: color + "20" }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </span>
    </div>
    <div className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight tabular-nums">{value}</div>
    {sub && <div className="text-[11px] text-zinc-500">{sub}</div>}
  </motion.div>
);

// ─────────────────────────────────────────────
// FUNNEL DISTRIBUTION (Topo / Meio / Fundo)
// ─────────────────────────────────────────────
const FunilDistribuicao = ({ params, setParams, resultado }) => {
  const total = params.percTopo + params.percMeio + params.percFundo;
  const off = total - 100;

  const handleChange = (campo, valor) => {
    setParams((prev) => ({ ...prev, [campo]: Math.max(0, Math.min(100, Number(valor) || 0)) }));
  };

  const stages = [
    { id: "percTopo",  label: "Topo (consciência)",  perc: params.percTopo,  verba: resultado.verbaTopo,  color: "#8B5CF6" },
    { id: "percMeio",  label: "Meio (consideração)", perc: params.percMeio,  verba: resultado.verbaMeio,  color: "#3B82F6" },
    { id: "percFundo", label: "Fundo (conversão)",   perc: params.percFundo, verba: resultado.verbaFundo, color: "#C9F80D" },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-bold text-zinc-100">Distribuição do funil</h3>
        </div>
        <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
          off === 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
        }`}>
          {total}%
        </span>
      </div>

      <div className="space-y-4">
        {stages.map((s) => (
          <div key={s.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-300">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 tabular-nums">{fBRL(s.verba)}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={s.perc}
                  onChange={(e) => handleChange(s.id, e.target.value)}
                  className="w-14 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-100 outline-none focus:border-[#C9F80D]/50 text-right tabular-nums"
                />
                <span className="text-xs text-zinc-600">%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={s.perc}
              onChange={(e) => handleChange(s.id, e.target.value)}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#C9F80D]"
              style={{
                background: `linear-gradient(to right, ${s.color} 0%, ${s.color} ${s.perc}%, #27272a ${s.perc}%, #27272a 100%)`,
              }}
            />
          </div>
        ))}
      </div>

      {off !== 0 && (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-red-400">
          <AlertTriangle className="w-3 h-3" />
          A soma precisa fechar em 100% (atualmente {total}%, diferença {off > 0 ? "+" : ""}{off}%)
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// CENÁRIOS
// ─────────────────────────────────────────────
const Cenarios = ({ resultado, params }) => {
  const cenarios = [
    { label: "Otimista",   leads: resultado.cenarioOtimista,   sub: "CPL −20%", color: "#10B981" },
    { label: "Realista",   leads: resultado.cenarioRealista,   sub: "CPL base", color: "#C9F80D" },
    { label: "Pessimista", leads: resultado.cenarioPessimista, sub: "CPL +30%", color: "#F59E0B" },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-zinc-400" />
        <h3 className="text-sm font-bold text-zinc-100">Cenários de leads</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {cenarios.map((c) => {
          const vendas = Math.floor(c.leads * params.taxaConversao);
          const faturamento = vendas * params.ticketMedio;
          return (
            <div key={c.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                <span className="text-[11px] font-semibold text-zinc-300">{c.label}</span>
              </div>
              <div className="text-lg font-bold tabular-nums" style={{ color: c.color }}>
                {fNum(c.leads)}
              </div>
              <div className="text-[10px] text-zinc-500 mb-2">leads · {c.sub}</div>
              <div className="border-t border-zinc-800 pt-2 space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-500">Vendas</span>
                  <span className="text-zinc-300 tabular-nums">{fNum(vendas)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-500">Fat.</span>
                  <span className="text-zinc-300 tabular-nums">{fBRL(faturamento)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CRONOGRAMA
// ─────────────────────────────────────────────
const Cronograma = ({ cronograma }) => {
  const maxVerba = Math.max(...cronograma.map((s) => s.verba));
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-zinc-400" />
        <h3 className="text-sm font-bold text-zinc-100">Cronograma semanal</h3>
      </div>

      <div className="space-y-3">
        {cronograma.map((s) => {
          const w = (s.verba / maxVerba) * 100;
          const color = FASE_COLOR[s.fase];
          return (
            <div key={s.semana} className="flex items-center gap-3">
              <div className="w-16 shrink-0">
                <div className="text-[11px] font-semibold text-zinc-300">Semana {s.semana}</div>
                <div className="text-[10px] text-zinc-500">{FASE_LABEL[s.fase]}</div>
              </div>
              <div className="flex-1">
                <div className="relative h-7 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${w}%` }}
                    transition={{ type: "spring", stiffness: 110, damping: 20 }}
                    className="absolute inset-y-0 left-0 rounded-lg"
                    style={{ background: `linear-gradient(90deg, ${color}30, ${color}80)` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-2.5">
                    <span className="text-[10px] text-zinc-400 truncate pr-2">{s.foco}</span>
                    <span className="text-[11px] font-semibold text-zinc-100 tabular-nums">
                      {fBRL(s.verba)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-16 text-right shrink-0">
                <div className="text-[11px] font-bold text-zinc-200 tabular-nums">{fNum(s.metaLeads)}</div>
                <div className="text-[10px] text-zinc-500">leads</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// GATILHOS DE AJUSTE
// ─────────────────────────────────────────────
const SEV_STYLE = {
  info:   { bg: "bg-sky-500/10",    border: "border-sky-500/30",    text: "text-sky-400",    icon: Info },
  aviso:  { bg: "bg-amber-500/10",  border: "border-amber-500/30",  text: "text-amber-400",  icon: AlertTriangle },
  alerta: { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400",    icon: AlertTriangle },
};

const GatilhosAjuste = () => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
    <div className="flex items-center gap-2 mb-4">
      <AlertTriangle className="w-4 h-4 text-zinc-400" />
      <h3 className="text-sm font-bold text-zinc-100">Gatilhos de ajuste</h3>
    </div>
    <div className="grid sm:grid-cols-2 gap-3">
      {GATILHOS.map((g) => {
        const s = SEV_STYLE[g.severidade];
        const SIcon = s.icon;
        return (
          <div key={g.id} className={`rounded-xl border ${s.border} ${s.bg} p-3`}>
            <div className="flex items-start gap-2 mb-2">
              <SIcon className={`w-3.5 h-3.5 mt-0.5 ${s.text}`} />
              <span className={`text-[11px] font-bold ${s.text}`}>{g.titulo}</span>
            </div>
            <div className="text-[10px] text-zinc-400 mb-1.5">
              <span className="text-zinc-500">SE: </span>{g.condicao}
            </div>
            <div className="text-[10px] text-zinc-300">
              <span className="text-zinc-500">ENTÃO: </span>{g.acao}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// PAYBACK CHART — verba investida vs margem acumulada mês a mês
// Mostra visualmente quando a campanha "se paga"
// ─────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <div className="text-[11px] font-bold text-zinc-200 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="text-[10px] flex items-center gap-2 tabular-nums">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="font-mono text-zinc-100">{p.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}</span>
        </div>
      ))}
    </div>
  );
};

const PaybackChart = ({ params, resultado }) => {
  const margemPct = (params.margemContribuicao || 0) / 100;
  const retencao = Math.max(1, params.retencaoMeses || 1);

  if (!margemPct || margemPct === 0 || resultado.vendasProjetadas === 0) {
    return null;
  }

  // Projeção temporal: investe verba todo mês durante a duração da campanha (assume diasCampanha = 1 mês)
  // Recebe margem ao longo dos meses de retenção
  // Para simplicidade: 1 mês = verba investida; nos N meses seguintes, margem mensal × vendas totais
  const meses = Math.max(retencao + 2, 6); // sempre mostra pelo menos 6 meses

  const margemMensalPorCliente = (params.ticketMedio * margemPct * (params.comprasPorCliente || 1)) / retencao;
  const margemMensalTotal = margemMensalPorCliente * resultado.vendasProjetadas;
  const verbaInvestida = params.verbaMensal;

  const data = [];
  let verbaAcum = 0;
  let margemAcum = 0;
  let paybackMes = null;

  for (let m = 0; m <= meses; m++) {
    // Mês 0 = investimento inicial
    // Demais meses = recebimento de margem (até o fim da retenção)
    if (m === 0) verbaAcum = verbaInvestida;
    if (m >= 1 && m <= retencao) margemAcum += margemMensalTotal;

    const saldo = margemAcum - verbaAcum;
    if (paybackMes === null && saldo >= 0 && m > 0) paybackMes = m;

    data.push({
      mes: m === 0 ? "Início" : `M${m}`,
      mesNum: m,
      "Verba investida": Math.round(verbaAcum),
      "Margem acumulada": Math.round(margemAcum),
      "Saldo líquido": Math.round(saldo),
    });
  }

  const fmtY = (v) => {
    if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
    return `R$ ${v}`;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#C9F80D]" />
          <h3 className="text-sm font-bold text-zinc-100">Curva de Payback</h3>
          <span className="text-[10px] text-zinc-500">· evolução mensal</span>
        </div>
        {paybackMes !== null ? (
          <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-0.5 font-semibold">
            Payback no mês {paybackMes}
          </div>
        ) : (
          <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-2.5 py-0.5 font-semibold">
            Não se paga em {meses} meses
          </div>
        )}
      </div>

      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="mes" stroke="#71717a" tick={{ fontSize: 10 }} />
            <YAxis stroke="#71717a" tick={{ fontSize: 10 }} tickFormatter={fmtY} />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "10px", paddingTop: 8 }}
              iconType="line"
            />
            <ReferenceLine y={0} stroke="#52525b" strokeDasharray="2 2" />
            {paybackMes !== null && (
              <ReferenceDot
                x={`M${paybackMes}`}
                y={0}
                r={5}
                fill="#10B981"
                stroke="#0a0a0a"
                strokeWidth={2}
                label={{ value: "Payback", position: "top", fill: "#10B981", fontSize: 10, fontWeight: 700 }}
              />
            )}
            <Line type="monotone" dataKey="Verba investida"   stroke="#EF4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Margem acumulada"  stroke="#10B981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Saldo líquido"     stroke="#C9F80D" strokeWidth={2.5} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-[10px] text-zinc-500 flex items-start gap-1">
        <Info className="w-2.5 h-2.5 mt-0.5 shrink-0" />
        Premissas: verba investida no mês 0, margem recebida durante {retencao} {retencao === 1 ? "mês" : "meses"} de retenção.
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CENÁRIOS BAR CHART — comparativo lado a lado
// ─────────────────────────────────────────────
const CenariosChart = ({ resultado, params }) => {
  if (!resultado.cenarioRealista || resultado.cenarioRealista === 0) return null;

  const data = [
    {
      cenario: "Pessimista",
      Leads: Math.round(resultado.cenarioPessimista),
      Vendas: Math.floor(resultado.cenarioPessimista * params.taxaConversao),
      Faturamento: Math.floor(resultado.cenarioPessimista * params.taxaConversao) * params.ticketMedio,
      color: "#F59E0B",
    },
    {
      cenario: "Realista",
      Leads: Math.round(resultado.cenarioRealista),
      Vendas: Math.floor(resultado.cenarioRealista * params.taxaConversao),
      Faturamento: Math.floor(resultado.cenarioRealista * params.taxaConversao) * params.ticketMedio,
      color: "#C9F80D",
    },
    {
      cenario: "Otimista",
      Leads: Math.round(resultado.cenarioOtimista),
      Vendas: Math.floor(resultado.cenarioOtimista * params.taxaConversao),
      Faturamento: Math.floor(resultado.cenarioOtimista * params.taxaConversao) * params.ticketMedio,
      color: "#10B981",
    },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#C9F80D]" />
        <h3 className="text-sm font-bold text-zinc-100">Cenários comparativos</h3>
        <span className="text-[10px] text-zinc-500">· faturamento por cenário</span>
      </div>

      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="cenario" stroke="#71717a" tick={{ fontSize: 11, fontWeight: 600 }} />
            <YAxis
              stroke="#71717a"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => Math.abs(v) >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#27272a40" }} />
            <Bar dataKey="Faturamento" radius={[6, 6, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {data.map((d) => (
          <div key={d.cenario} className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center">
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">{d.cenario}</div>
            <div className="text-xs font-mono text-zinc-300">{d.Leads} leads</div>
            <div className="text-xs font-mono font-bold tabular-nums" style={{ color: d.color }}>
              {d.Vendas} vendas
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// BENCHMARK por nicho — termômetro visual + insights
// ─────────────────────────────────────────────
const BenchmarkInsight = ({ params, resultado, realMetrics }) => {
  if (!params.segmento || !SEGMENTOS[params.segmento]) return null;

  const seg = SEGMENTOS[params.segmento];
  const cplAtual = resultado.cplEfetivo || params.cplEstimado;
  const cplReal = realMetrics?.cpl;
  const classProj = classifyCpl(cplAtual, params.segmento);
  const classReal = cplReal > 0 ? classifyCpl(cplReal, params.segmento) : null;

  // Termômetro: faixas
  const faixas = [
    { from: 0,                  to: seg.cplExcepcional, label: "Excepcional", color: "#10B981" },
    { from: seg.cplExcepcional, to: seg.cplBom,         label: "Bom",         color: "#C9F80D" },
    { from: seg.cplBom,         to: seg.cplOk,          label: "Médio",       color: "#F59E0B" },
    { from: seg.cplOk,          to: seg.cplRuim,        label: "Caro",        color: "#EF4444" },
    { from: seg.cplRuim,        to: seg.cplRuim * 1.5,  label: "Crítico",     color: "#991B1B" },
  ];
  const maxX = seg.cplRuim * 1.5;
  const xPct = (v) => Math.min(100, Math.max(0, (v / maxX) * 100));

  // Comparação de taxa de conversão
  const conversaoAtual = params.taxaConversao;
  const conversaoVsBench = ((conversaoAtual - seg.conversaoBom) / seg.conversaoBom) * 100;

  // Comparação de ticket
  const ticketVsBench = seg.ticketTipico > 0
    ? ((params.ticketMedio - seg.ticketTipico) / seg.ticketTipico) * 100
    : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[#C9F80D]" />
          <h3 className="text-sm font-bold text-zinc-100">Benchmark do nicho</h3>
          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
            · {seg.emoji} {seg.nome}
          </span>
        </div>
        {classProj && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ background: classProj.color + "20", color: classProj.color, border: `1px solid ${classProj.color}50` }}
          >
            {classProj.label}
          </div>
        )}
      </div>

      {/* Termômetro */}
      <div className="mb-4">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">CPL no espectro do mercado</div>
        <div className="relative h-5 w-full rounded-full overflow-hidden bg-zinc-950 border border-zinc-800">
          {faixas.map((f, i) => {
            const left = xPct(f.from);
            const width = xPct(f.to) - left;
            return (
              <div
                key={i}
                className="absolute top-0 h-full"
                style={{ left: `${left}%`, width: `${width}%`, background: f.color, opacity: 0.6 }}
                title={`${f.label}: ${f.from}–${f.to}`}
              />
            );
          })}
          {/* Marcador CPL projetado */}
          <div
            className="absolute top-0 h-full w-0.5 bg-white"
            style={{ left: `${xPct(cplAtual)}%` }}
          />
          <div
            className="absolute -top-1.5 w-3 h-3 rounded-full bg-white border-2 border-zinc-950"
            style={{ left: `calc(${xPct(cplAtual)}% - 6px)` }}
          />
          {/* Marcador CPL real (se houver) */}
          {cplReal > 0 && (
            <>
              <div
                className="absolute top-0 h-full w-0.5 bg-sky-300"
                style={{ left: `${xPct(cplReal)}%` }}
              />
              <div
                className="absolute -bottom-1 w-2.5 h-2.5 rotate-45 bg-sky-300 border border-zinc-950"
                style={{ left: `calc(${xPct(cplReal)}% - 5px)` }}
              />
            </>
          )}
        </div>

        {/* Legenda de tiers */}
        <div className="flex justify-between mt-1.5 text-[9px] text-zinc-500 font-mono">
          <span>R$ 0</span>
          <span style={{ color: "#10B981" }}>R$ {seg.cplExcepcional}</span>
          <span style={{ color: "#C9F80D" }}>R$ {seg.cplBom}</span>
          <span style={{ color: "#F59E0B" }}>R$ {seg.cplOk}</span>
          <span style={{ color: "#EF4444" }}>R$ {seg.cplRuim}+</span>
        </div>

        {/* Legenda dos marcadores */}
        <div className="flex items-center gap-4 mt-2 text-[10px]">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-zinc-700" />
            Projetado: <span className="font-mono text-zinc-200">{fBRL(cplAtual)}</span>
          </span>
          {cplReal > 0 && (
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rotate-45 bg-sky-300" />
              Real: <span className="font-mono text-zinc-200">{fBRL(cplReal)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Veredicto + comparações */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">CPL projetado</div>
          <div className="text-base font-bold tabular-nums" style={{ color: classProj?.color || "#71717a" }}>
            {classProj?.label || "—"}
          </div>
          <div className="text-[10px] text-zinc-500">{classProj?.desc || ""}</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Taxa de conversão</div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold tabular-nums text-zinc-100">
              {(conversaoAtual * 100).toFixed(1)}%
            </span>
            <span className={`text-[10px] font-semibold ${
              conversaoVsBench >= 0 ? "text-emerald-400" : "text-red-400"
            }`}>
              {conversaoVsBench >= 0 ? "+" : ""}{conversaoVsBench.toFixed(0)}%
            </span>
          </div>
          <div className="text-[10px] text-zinc-500">vs {(seg.conversaoBom * 100).toFixed(0)}% típico</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Ticket médio</div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold tabular-nums text-zinc-100">
              {fBRL(params.ticketMedio)}
            </span>
            <span className={`text-[10px] font-semibold ${
              ticketVsBench >= 0 ? "text-emerald-400" : "text-amber-400"
            }`}>
              {ticketVsBench >= 0 ? "+" : ""}{ticketVsBench.toFixed(0)}%
            </span>
          </div>
          <div className="text-[10px] text-zinc-500">vs {fBRL(seg.ticketTipico)} típico</div>
        </div>
      </div>

      {/* Nota do segmento */}
      <div className="text-[11px] text-zinc-400 bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 flex items-start gap-2">
        <Info className="w-3 h-3 mt-0.5 shrink-0 text-zinc-500" />
        <span>{seg.nota}</span>
      </div>

      {/* Comparação real vs projetado se houver real */}
      {classReal && classProj && classReal.tier !== classProj.tier && (
        <div className="mt-3 text-[11px] rounded-lg px-3 py-2 flex items-start gap-2 bg-sky-500/10 border border-sky-500/30">
          <Activity className="w-3 h-3 mt-0.5 shrink-0 text-sky-400" />
          <span className="text-zinc-300">
            <b className="text-sky-400">Real ({classReal.label})</b> está {classReal.tier > classProj.tier ? "pior" : "melhor"} que o projetado (<b style={{ color: classProj.color }}>{classProj.label}</b>) no benchmark do nicho.
          </span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// MULTI-CANAL — Editor (no form) + Breakdown (no painel direito)
// ─────────────────────────────────────────────
const MultiCanalEditor = ({ canais, setCanais, verbaTotal }) => {
  const somaPerc = canais.reduce((s, c) => s + (Number(c.percVerba) || 0), 0);
  const fechou100 = Math.abs(somaPerc - 100) < 0.5;

  const updateCanal = (idx, patch) => {
    setCanais(canais.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const removeCanal = (idx) => {
    setCanais(canais.filter((_, i) => i !== idx));
  };

  const addCanal = (template) => {
    const t = CANAIS_TEMPLATE[template];
    if (!t || canais.some((c) => c.id === t.id)) return;
    // Sugere % restante / cpl 50
    const restante = Math.max(0, 100 - somaPerc);
    setCanais([...canais, { ...t, percVerba: restante > 0 ? restante : 0, cpl: 50 }]);
  };

  const balancear = () => {
    if (canais.length === 0) return;
    const each = Math.round((100 / canais.length) * 10) / 10;
    setCanais(canais.map((c) => ({ ...c, percVerba: each })));
  };

  const disponiveis = Object.keys(CANAIS_TEMPLATE).filter(
    (k) => !canais.some((c) => c.id === k)
  );

  return (
    <div className="space-y-2">
      {canais.length === 0 ? (
        <div className="text-[10px] text-zinc-500 italic px-1">
          Nenhum canal — usa o CPL único acima.
        </div>
      ) : (
        <>
          {canais.map((c, i) => {
            const verbaCanal = (verbaTotal * (Number(c.percVerba) || 0)) / 100;
            const leadsCanal = c.cpl > 0 ? verbaCanal / c.cpl : 0;
            return (
              <div key={c.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                    <span>{c.emoji}</span>
                    <span className="text-xs font-semibold text-zinc-200 truncate">{c.nome}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCanal(i)}
                    className="p-0.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400"
                    title="Remover"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">% Verba</div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={c.percVerba}
                        onChange={(e) => updateCanal(i, { percVerba: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100 outline-none focus:border-[#C9F80D]/50 tabular-nums"
                      />
                      <span className="text-[10px] text-zinc-600">%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-0.5">CPL</div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-600">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={c.cpl}
                        onChange={(e) => updateCanal(i, { cpl: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100 outline-none focus:border-[#C9F80D]/50 tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/50">
                  <span>{fBRL(verbaCanal)} de verba</span>
                  <span className="text-zinc-300 font-semibold">{fNum(leadsCanal)} leads</span>
                </div>
              </div>
            );
          })}

          <div className={`text-[10px] flex items-center justify-between px-1 ${fechou100 ? "text-emerald-400" : "text-amber-400"}`}>
            <span>
              {fechou100 ? "✓ Soma 100%" : `⚠ Soma ${somaPerc.toFixed(1)}% (diferença ${(somaPerc - 100 > 0 ? "+" : "") + (somaPerc - 100).toFixed(1)}%)`}
            </span>
            {canais.length > 1 && (
              <button
                type="button"
                onClick={balancear}
                className="text-zinc-400 hover:text-zinc-200 underline"
              >
                Balancear
              </button>
            )}
          </div>
        </>
      )}

      {disponiveis.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {disponiveis.map((id) => {
            const t = CANAIS_TEMPLATE[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => addCanal(id)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-medium text-zinc-300 transition-colors"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>{t.emoji}</span>
                {t.nome}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MultiCanalBreakdown = ({ resultado, params }) => {
  if (!resultado.multiCanalAtivo || !resultado.canaisBreakdown?.length) return null;

  const canais = resultado.canaisBreakdown;
  const totalLeads = canais.reduce((s, c) => s + c.leadsCanal, 0);
  const cplPonderado = resultado.cplEfetivo;
  const cplVsProjetado = params.cplEstimado > 0
    ? ((cplPonderado - params.cplEstimado) / params.cplEstimado) * 100
    : 0;

  // Encontrar canal mais e menos eficiente
  const ordenados = [...canais].filter((c) => c.cpl > 0).sort((a, b) => a.cpl - b.cpl);
  const maisEficiente = ordenados[0];
  const menosEficiente = ordenados[ordenados.length - 1];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#C9F80D]" />
          <h3 className="text-sm font-bold text-zinc-100">Breakdown por canal</h3>
          <span className="text-[10px] text-zinc-500">· {canais.length} {canais.length === 1 ? "canal" : "canais"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
          <span>CPL ponderado:</span>
          <span className="font-mono font-semibold text-[#C9F80D]">{fBRL(cplPonderado)}</span>
          {Math.abs(cplVsProjetado) > 1 && (
            <span className={cplVsProjetado < 0 ? "text-emerald-400" : "text-red-400"}>
              ({cplVsProjetado > 0 ? "+" : ""}{cplVsProjetado.toFixed(0)}% vs estimado)
            </span>
          )}
        </div>
      </div>

      {/* Barra horizontal proporcional */}
      <div className="mb-4 h-2.5 w-full flex rounded-full overflow-hidden bg-zinc-950 border border-zinc-800">
        {canais.map((c) => (
          <div
            key={c.id}
            className="h-full"
            style={{ width: `${c.percVerba}%`, background: c.color }}
            title={`${c.nome}: ${c.percVerba}%`}
          />
        ))}
      </div>

      <div className="space-y-2">
        {canais.map((c) => {
          const eficiencia = totalLeads > 0 ? (c.leadsCanal / totalLeads) - (c.percVerba / 100) : 0;
          // Eficiência: % de leads − % de verba. Positivo = entrega mais leads do que a verba sugere
          return (
            <div key={c.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span>{c.emoji}</span>
                  <span className="text-xs font-semibold text-zinc-100">{c.nome}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500">Eficiência</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      eficiencia > 0.02 ? "bg-emerald-500/15 text-emerald-400" :
                      eficiencia < -0.02 ? "bg-red-500/15 text-red-400" :
                      "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {eficiencia > 0 ? "+" : ""}{(eficiencia * 100).toFixed(1)}pp
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider">% Verba</div>
                  <div className="font-mono tabular-nums text-zinc-300">{c.percVerba.toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Verba R$</div>
                  <div className="font-mono tabular-nums text-zinc-300">{fBRL(c.verbaCanal)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider">CPL</div>
                  <div className="font-mono tabular-nums" style={{ color: c.color }}>{fBRL(c.cpl)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Leads</div>
                  <div className="font-mono tabular-nums font-semibold text-zinc-100">{fNum(c.leadsCanal)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      {ordenados.length >= 2 && maisEficiente.id !== menosEficiente.id && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-2.5 py-2">
            <span className="text-emerald-400 font-semibold">Mais eficiente:</span>{" "}
            <span className="text-zinc-300">{maisEficiente.emoji} {maisEficiente.nome}</span>{" "}
            <span className="text-zinc-500">— CPL {fBRL(maisEficiente.cpl)}</span>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-2.5 py-2">
            <span className="text-red-400 font-semibold">Menos eficiente:</span>{" "}
            <span className="text-zinc-300">{menosEficiente.emoji} {menosEficiente.nome}</span>{" "}
            <span className="text-zinc-500">— CPL {fBRL(menosEficiente.cpl)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// ANÁLISE DE SENSIBILIDADE — ROAS vs CPL
// Mostra como o retorno varia conforme o CPL real muda
// e identifica o break-even (CPL máximo viável)
// ─────────────────────────────────────────────
const SensibilidadeAnalise = ({ params }) => {
  const baseCpl = params.cplEstimado;
  if (!baseCpl || baseCpl <= 0 || !params.ticketMedio || !params.taxaConversao || !params.verbaMensal) {
    return null;
  }

  const margemPct = (params.margemContribuicao || 0) / 100;
  const usaMargem = margemPct > 0;

  // Faixa: 0.4x a 2.5x do CPL projetado
  const minMult = 0.4;
  const maxMult = 2.5;
  const steps = 40;

  const points = [];
  for (let i = 0; i <= steps; i++) {
    const mult = minMult + (maxMult - minMult) * (i / steps);
    const cpl = baseCpl * mult;
    const leads = params.verbaMensal / cpl;
    const vendas = Math.floor(leads * params.taxaConversao);
    const fat = vendas * params.ticketMedio;
    const roas = params.verbaMensal > 0 ? fat / params.verbaMensal : 0;
    const lucro = usaMargem ? fat * margemPct - params.verbaMensal : fat - params.verbaMensal;
    points.push({ mult, cpl, roas, lucro });
  }

  // Break-even matemático:
  // ROAS=1 → fat=verba → cpl = conversao × ticket
  // Com margem → margem×fat=verba → cpl = margem × conversao × ticket
  const breakEvenCpl = usaMargem
    ? margemPct * params.taxaConversao * params.ticketMedio
    : params.taxaConversao * params.ticketMedio;

  // Faixas de CPL renderizadas
  const cplMin = baseCpl * minMult;
  const cplMax = baseCpl * maxMult;

  // Métrica plotada: ROAS (ou ROI líquido se margem definida)
  const yValues = points.map((p) => (usaMargem ? p.lucro / params.verbaMensal : p.roas));
  const yMin = Math.min(0, ...yValues);
  const yMax = Math.max(...yValues, usaMargem ? 0.5 : 2);

  // SVG dims
  const W = 600;
  const H = 200;
  const padL = 50, padR = 20, padT = 16, padB = 32;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xFromCpl = (cpl) => padL + ((cpl - cplMin) / (cplMax - cplMin)) * plotW;
  const yFromVal = (val) => padT + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

  const pathD = points
    .map((p, i) => {
      const x = xFromCpl(p.cpl);
      const y = yFromVal(usaMargem ? p.lucro / params.verbaMensal : p.roas);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  // Área sob a curva — fill suave
  const areaD = pathD +
    ` L ${xFromCpl(cplMax).toFixed(1)} ${yFromVal(yMin).toFixed(1)}` +
    ` L ${xFromCpl(cplMin).toFixed(1)} ${yFromVal(yMin).toFixed(1)} Z`;

  // Linha break-even (Y=0 ou Y=1)
  const breakEvenY = usaMargem ? yFromVal(0) : yFromVal(1);

  // Posições dos marcadores
  const currentCpl = baseCpl;
  const currentVal = (() => {
    const leads = params.verbaMensal / currentCpl;
    const vendas = Math.floor(leads * params.taxaConversao);
    const fat = vendas * params.ticketMedio;
    if (usaMargem) return (fat * margemPct - params.verbaMensal) / params.verbaMensal;
    return params.verbaMensal > 0 ? fat / params.verbaMensal : 0;
  })();

  const currentX = xFromCpl(currentCpl);
  const currentY = yFromVal(currentVal);
  const beX = breakEvenCpl >= cplMin && breakEvenCpl <= cplMax ? xFromCpl(breakEvenCpl) : null;

  const yLabel = usaMargem ? "ROI líquido" : "ROAS";
  const yFmt = (v) => usaMargem ? `${(v * 100).toFixed(0)}%` : `${v.toFixed(1)}x`;
  const xFmt = (v) => fBRLloc(v);

  // Y ticks
  const ticks = 4;
  const yTicks = [];
  for (let i = 0; i <= ticks; i++) {
    const v = yMin + (yMax - yMin) * (i / ticks);
    yTicks.push({ value: v, y: yFromVal(v) });
  }

  // X ticks (5 pontos)
  const xTickValues = [cplMin, baseCpl * 0.8, baseCpl, baseCpl * 1.5, cplMax];

  // Insight: quão longe está do break-even?
  const margemAteBreakEven = breakEvenCpl > 0
    ? ((breakEvenCpl - currentCpl) / currentCpl) * 100
    : 0;
  const insightCor = margemAteBreakEven > 50
    ? "#10B981"
    : margemAteBreakEven > 20
      ? "#C9F80D"
      : margemAteBreakEven > 0
        ? "#F59E0B"
        : "#EF4444";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#C9F80D]" />
          <h3 className="text-sm font-bold text-zinc-100">Análise de sensibilidade</h3>
          <span className="text-[10px] text-zinc-500">· {yLabel} vs CPL</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-[#C9F80D]" />
            Projeção atual
          </span>
          <span className="flex items-center gap-1 text-zinc-500">
            <span className="w-2 h-0.5 bg-amber-400" />
            Break-even
          </span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 480 }}>
          <defs>
            <linearGradient id="sens-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9F80D" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#C9F80D" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid horizontal */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={padL}
                x2={W - padR}
                y1={t.y}
                y2={t.y}
                stroke="#27272a"
                strokeDasharray="2,3"
                strokeWidth="1"
              />
              <text
                x={padL - 8}
                y={t.y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#71717a"
                fontFamily="system-ui"
              >
                {yFmt(t.value)}
              </text>
            </g>
          ))}

          {/* Break-even reference line (horizontal) */}
          <line
            x1={padL}
            x2={W - padR}
            y1={breakEvenY}
            y2={breakEvenY}
            stroke="#F59E0B"
            strokeWidth="1"
            strokeDasharray="4,3"
            opacity="0.7"
          />
          <text
            x={W - padR - 4}
            y={breakEvenY - 4}
            textAnchor="end"
            fontSize="9"
            fill="#F59E0B"
            fontFamily="system-ui"
            fontWeight="600"
          >
            break-even
          </text>

          {/* Área */}
          <path d={areaD} fill="url(#sens-area)" />

          {/* Linha */}
          <path
            d={pathD}
            fill="none"
            stroke="#C9F80D"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Linha vertical do break-even */}
          {beX !== null && (
            <g>
              <line
                x1={beX}
                x2={beX}
                y1={padT}
                y2={H - padB}
                stroke="#F59E0B"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.5"
              />
              <text
                x={beX}
                y={padT - 4}
                textAnchor="middle"
                fontSize="9"
                fill="#F59E0B"
                fontFamily="system-ui"
                fontWeight="600"
              >
                CPL máx: {fBRLloc(breakEvenCpl)}
              </text>
            </g>
          )}

          {/* Marcador da projeção atual */}
          <circle cx={currentX} cy={currentY} r="6" fill="#C9F80D" stroke="#0a0a0a" strokeWidth="2" />
          <circle cx={currentX} cy={currentY} r="10" fill="#C9F80D" opacity="0.2" />

          {/* X axis labels */}
          {xTickValues.map((cpl, i) => (
            <text
              key={i}
              x={xFromCpl(cpl)}
              y={H - padB + 16}
              textAnchor="middle"
              fontSize="10"
              fill="#71717a"
              fontFamily="system-ui"
            >
              {xFmt(cpl)}
            </text>
          ))}

          {/* X axis title */}
          <text
            x={padL + plotW / 2}
            y={H - 4}
            textAnchor="middle"
            fontSize="9"
            fill="#52525b"
            fontFamily="system-ui"
          >
            CPL real (R$)
          </text>
        </svg>
      </div>

      {/* Insights */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">CPL projetado</div>
          <div className="text-base font-bold text-[#C9F80D] tabular-nums">{fBRLloc(currentCpl)}</div>
          <div className="text-[10px] text-zinc-500">
            {yLabel}: {yFmt(currentVal)}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">CPL máximo viável</div>
          <div className="text-base font-bold text-amber-400 tabular-nums">{fBRLloc(breakEvenCpl)}</div>
          <div className="text-[10px] text-zinc-500">
            {usaMargem ? "Onde o lucro zera" : "Onde ROAS = 1.0"}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Margem de segurança</div>
          <div className="text-base font-bold tabular-nums" style={{ color: insightCor }}>
            {margemAteBreakEven > 0 ? "+" : ""}{margemAteBreakEven.toFixed(0)}%
          </div>
          <div className="text-[10px] text-zinc-500">
            {margemAteBreakEven > 50 ? "Confortável" :
             margemAteBreakEven > 20 ? "Razoável" :
             margemAteBreakEven > 0 ? "Apertada" : "Acima do limite"}
          </div>
        </div>
      </div>

      {!usaMargem && (
        <div className="mt-3 text-[10px] text-zinc-600 flex items-start gap-1">
          <Info className="w-2.5 h-2.5 mt-0.5 shrink-0" />
          Análise baseada em ROAS bruto. Defina <b>margem de contribuição</b> em Análise financeira para usar lucro líquido real.
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// ANÁLISE FINANCEIRA (CAC, LTV, Payback, Margem)
// ─────────────────────────────────────────────
const fBRLloc = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const AnaliseFinanceira = ({ params, resultado }) => {
  const temMargem = (params.margemContribuicao || 0) > 0;
  const temLTV = (params.comprasPorCliente || 1) > 1 || (params.retencaoMeses || 1) > 1;

  const ltvCac = resultado.ltvCacRatio;
  // Health status do LTV:CAC
  const healthStatus = ltvCac >= 3
    ? { label: "Saudável", color: "#10B981", desc: "≥ 3:1 — escalável" }
    : ltvCac >= 1
      ? { label: "Atenção",  color: "#F59E0B", desc: "1:1 a 3:1 — margem apertada" }
      : ltvCac > 0
        ? { label: "Crítico", color: "#EF4444", desc: "< 1:1 — quebra a cada cliente" }
        : { label: "—", color: "#6B7280", desc: "Defina margem e LTV" };

  const paybackStatus = resultado.paybackMeses > 0 && resultado.paybackMeses <= 3
    ? { color: "#10B981", desc: "Recupera em até 3 meses" }
    : resultado.paybackMeses > 0 && resultado.paybackMeses <= 12
      ? { color: "#F59E0B", desc: "Recupera em até 12 meses" }
      : resultado.paybackMeses > 12
        ? { color: "#EF4444", desc: "Demora 12+ meses" }
        : { color: "#6B7280", desc: "—" };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#C9F80D]" />
          <h3 className="text-sm font-bold text-zinc-100">Análise financeira</h3>
          <span className="text-[10px] text-zinc-500">· unit economics</span>
        </div>
        {!temMargem && (
          <div className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
            <Info className="w-2.5 h-2.5" />
            Defina margem de contribuição para análise completa
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* CAC */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="p-1 rounded" style={{ background: "#3B82F620" }}>
              <Users className="w-3 h-3" style={{ color: "#3B82F6" }} />
            </span>
            <span className="text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">CAC</span>
          </div>
          <div className="text-lg font-bold tabular-nums" style={{ color: "#3B82F6" }}>
            {resultado.cac > 0 ? fBRLloc(resultado.cac) : "—"}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            Custo por cliente novo
          </div>
        </div>

        {/* LTV */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="p-1 rounded" style={{ background: "#8B5CF620" }}>
              <Heart className="w-3 h-3" style={{ color: "#8B5CF6" }} />
            </span>
            <span className="text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">LTV</span>
          </div>
          <div className="text-lg font-bold tabular-nums" style={{ color: "#8B5CF6" }}>
            {resultado.ltv > 0 ? fBRLloc(resultado.ltv) : "—"}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            {temLTV ? `${params.comprasPorCliente}× compras` : "Sem retenção"}
            {temMargem && ` · ${params.margemContribuicao}% margem`}
          </div>
        </div>

        {/* LTV:CAC */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="p-1 rounded" style={{ background: healthStatus.color + "20" }}>
              <TrendingUp className="w-3 h-3" style={{ color: healthStatus.color }} />
            </span>
            <span className="text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">LTV:CAC</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tabular-nums" style={{ color: healthStatus.color }}>
              {ltvCac > 0 ? ltvCac.toFixed(2) : "—"}
            </span>
            {ltvCac > 0 && (
              <span className="text-[10px] font-mono text-zinc-500">: 1</span>
            )}
          </div>
          <div className="text-[10px] mt-1 font-medium" style={{ color: healthStatus.color }}>
            {healthStatus.label}
          </div>
        </div>

        {/* Payback */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="p-1 rounded" style={{ background: paybackStatus.color + "20" }}>
              <Clock className="w-3 h-3" style={{ color: paybackStatus.color }} />
            </span>
            <span className="text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">Payback</span>
          </div>
          <div className="text-lg font-bold tabular-nums" style={{ color: paybackStatus.color }}>
            {resultado.paybackMeses > 0
              ? `${resultado.paybackMeses.toFixed(1)} ${resultado.paybackMeses < 2 ? "mês" : "meses"}`
              : "—"}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">{paybackStatus.desc}</div>
        </div>
      </div>

      {/* Linha de lucro líquido — só aparece se margem definida */}
      {temMargem && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <PiggyBank className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Margem bruta</span>
            </div>
            <div className="text-base font-bold tabular-nums text-emerald-400">
              {fBRLloc(resultado.margemValor)}
            </div>
            <div className="text-[10px] text-zinc-500">{params.margemContribuicao}% × faturamento</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3 h-3" style={{ color: resultado.lucroLiquido >= 0 ? "#C9F80D" : "#EF4444" }} />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Lucro líquido</span>
            </div>
            <div
              className="text-base font-bold tabular-nums"
              style={{ color: resultado.lucroLiquido >= 0 ? "#C9F80D" : "#EF4444" }}
            >
              {fBRLloc(resultado.lucroLiquido)}
            </div>
            <div className="text-[10px] text-zinc-500">Margem − verba de tráfego</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3" style={{ color: resultado.roiLiquido >= 0 ? "#C9F80D" : "#EF4444" }} />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">ROI real</span>
            </div>
            <div
              className="text-base font-bold tabular-nums"
              style={{ color: resultado.roiLiquido >= 0 ? "#C9F80D" : "#EF4444" }}
            >
              {(resultado.roiLiquido * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-zinc-500">Lucro / verba investida</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// COMPARATIVO PROJETADO vs REALIZADO
// ─────────────────────────────────────────────
const DiffBadge = ({ projetado, real, lowerIsBetter = false, format }) => {
  if (!real || real === 0 || !projetado || projetado === 0) {
    return <span className="text-[10px] text-zinc-600">—</span>;
  }
  const diff = ((real - projetado) / projetado) * 100;
  const isGood = lowerIsBetter ? diff <= 0 : diff >= 0;
  const Icon = diff >= 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
      isGood ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
    }`}>
      <Icon className="w-2.5 h-2.5" />
      {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
    </span>
  );
};

const ComparativoRealizado = ({ cliente, projetado, real, loading, error, onRefresh }) => {
  const fNumLoc = (v) => Math.round(v).toLocaleString("pt-BR");

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-zinc-400 animate-pulse" />
          <h3 className="text-sm font-bold text-zinc-100">Realizado · últimos 30 dias</h3>
        </div>
        <div className="text-xs text-zinc-500">Buscando métricas reais de {cliente.name}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-zinc-100">Realizado · últimos 30 dias</h3>
          </div>
          <button onClick={onRefresh} className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Tentar novamente
          </button>
        </div>
        <p className="text-[11px] text-amber-400">{error}</p>
        <p className="text-[10px] text-zinc-500 mt-1">
          Verifique se {cliente.name} tem credenciais Meta configuradas em Conexões & API.
        </p>
      </div>
    );
  }

  if (!real) return null;

  // Estima leads possíveis projetados
  const leadsProjetados = projetado.cplEstimado > 0 ? projetado.verbaMensal / projetado.cplEstimado : 0;
  const realRoas = real.roas || 0;

  // ROAS projetado (verba × conversão × ticket / verba)
  const roasProjetado = projetado.verbaMensal > 0
    ? (leadsProjetados * (projetado.taxaConversao || 0) * (projetado.ticketMedio || 0)) / projetado.verbaMensal
    : 0;

  const rows = [
    {
      label: "Gasto / Verba",
      icon: DollarSign,
      color: "#C9F80D",
      proj: projetado.verbaMensal,
      real: real.gasto,
      projFmt: fBRLloc(projetado.verbaMensal),
      realFmt: fBRLloc(real.gasto),
      lowerIsBetter: false,
      note: real.gasto > projetado.verbaMensal * 1.1 ? "Gasto excedeu projeção" : null,
    },
    {
      label: "CPL",
      icon: Target,
      color: "#3B82F6",
      proj: projetado.cplEstimado,
      real: real.cpl,
      projFmt: fBRLloc(projetado.cplEstimado),
      realFmt: real.conversas > 0 ? fBRLloc(real.cpl) : "N/A",
      lowerIsBetter: true,
      note: real.cpl > projetado.cplEstimado * 1.2
        ? "CPL real 20%+ acima do projetado"
        : real.cpl < projetado.cplEstimado * 0.8
          ? "CPL real bem abaixo — projeção conservadora"
          : null,
    },
    {
      label: "Leads / Conversas",
      icon: Users,
      color: "#06B6D4",
      proj: leadsProjetados,
      real: real.conversas,
      projFmt: fNumLoc(leadsProjetados),
      realFmt: fNumLoc(real.conversas),
      lowerIsBetter: false,
    },
    {
      label: "ROAS",
      icon: TrendingUp,
      color: "#10B981",
      proj: roasProjetado,
      real: realRoas,
      projFmt: roasProjetado.toFixed(2) + "x",
      realFmt: realRoas > 0 ? realRoas.toFixed(2) + "x" : "N/A",
      lowerIsBetter: false,
    },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#C9F80D]" />
          <h3 className="text-sm font-bold text-zinc-100">
            Projetado vs Realizado
          </h3>
          <span className="text-[10px] text-zinc-500">· últimos 30 dias · Meta Ads</span>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Atualizar"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1 rounded" style={{ background: r.color + "20" }}>
                  <Icon className="w-3 h-3" style={{ color: r.color }} />
                </span>
                <span className="text-[11px] font-semibold text-zinc-300">{r.label}</span>
                <DiffBadge projetado={r.proj} real={r.real} lowerIsBetter={r.lowerIsBetter} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Projetado</div>
                  <div className="text-zinc-300 font-mono tabular-nums">{r.projFmt}</div>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider">Real</div>
                  <div className="font-mono tabular-nums font-semibold" style={{ color: r.color }}>{r.realFmt}</div>
                </div>
              </div>
              {r.note && (
                <div className="mt-2 text-[10px] text-amber-400 flex items-start gap-1">
                  <AlertTriangle className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                  {r.note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// PLANOS SALVOS — SQLite via /api/roi/plans
// Compatível com legado em localStorage (migra na 1ª carga)
// ─────────────────────────────────────────────
const LEGACY_STORAGE_KEY = "focus_roi_planos";
const MIGRATION_FLAG = "focus_roi_migrated_v1";

/** Lê planos antigos do localStorage para migração (run once) */
const loadLegacyPlans = () => {
  try {
    return JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

// ─────────────────────────────────────────────
// ROI CALCULATOR — main reusable component
// `embedded` = true when used as a tab (no hero title, no outer padding)
// ─────────────────────────────────────────────
export default function RoiCalculator({ embedded = false }) {
  const { authFetch } = useAuth();
  const [params, setParams] = useState(PARAMETROS_PADRAO);
  const [nomePlano, setNomePlano] = useState("");
  const [planos, setPlanos] = useState([]);
  const [planosLoading, setPlanosLoading] = useState(true);
  const [planosError, setPlanosError] = useState(null);
  const [showPlanos, setShowPlanos] = useState(false);
  const [savedToast, setSavedToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const toastTimer = useRef(null);

  /** Carrega planos do servidor + migra legado do localStorage uma única vez */
  const fetchPlanos = async () => {
    setPlanosLoading(true);
    setPlanosError(null);
    try {
      // Migração: se houver planos no localStorage e ainda não foi migrado, envia tudo pro servidor
      const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG) === "1";
      if (!alreadyMigrated) {
        const legacy = loadLegacyPlans();
        if (legacy.length > 0) {
          for (const p of legacy) {
            try {
              await authFetch("/api/roi/plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  nome: p.nome || "Plano migrado",
                  clienteId: p.clienteId || null,
                  clienteNome: p.clienteNome || null,
                  clienteEmoji: p.clienteEmoji || null,
                  parametros: p.parametros || {},
                  resultado: p.resultado || {},
                  status: "rascunho",
                }),
              });
            } catch { /* ignore individual failures */ }
          }
          console.log(`[ROI] Migrados ${legacy.length} planos do localStorage para SQLite`);
        }
        localStorage.setItem(MIGRATION_FLAG, "1");
      }

      const res = await authFetch("/api/roi/plans");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar planos");
      setPlanos(Array.isArray(data) ? data : []);
    } catch (err) {
      setPlanosError(err.message);
      setPlanos([]);
    } finally {
      setPlanosLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cliente vinculado
  const [clientes, setClientes] = useState([]);
  const [clientesLoading, setClientesLoading] = useState(true);
  const [clienteId, setClienteId] = useState("");
  const [autoFilledFields, setAutoFilledFields] = useState({});

  // Métricas reais (últimos 30d) do cliente vinculado
  const [realMetrics, setRealMetrics] = useState(null);
  const [realLoading, setRealLoading] = useState(false);
  const [realError, setRealError] = useState(null);

  const fetchRealMetrics = async (id) => {
    if (!id) {
      setRealMetrics(null);
      setRealError(null);
      return;
    }
    setRealLoading(true);
    setRealError(null);
    try {
      const res = await authFetch(`/api/insights?client=${id}&period=monthly`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao buscar métricas reais");
      setRealMetrics(json.metrics || null);
    } catch (err) {
      setRealError(err.message || "Falha ao carregar métricas reais");
      setRealMetrics(null);
    } finally {
      setRealLoading(false);
    }
  };

  useEffect(() => {
    fetchRealMetrics(clienteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  // Buscar clientes (somente admin tem /api/config/clients; já estamos em contexto admin)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/config/clients");
        const data = await res.json();
        if (!cancelled) setClientes(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setClientes([]);
      } finally {
        if (!cancelled) setClientesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authFetch]);

  const clienteSelecionado = clientes.find((c) => c.id === clienteId) || null;

  const handleClienteChange = (id) => {
    setClienteId(id);
    if (!id) {
      setAutoFilledFields({});
      return;
    }
    const c = clientes.find((x) => x.id === id);
    if (!c) return;

    // Mapeia metas cadastradas → params (só preenche se cliente tiver o valor)
    const filled = {};
    const next = { ...params };

    const verba = Number(c.target_spend);
    if (verba > 0) { next.verbaMensal = verba; filled.verbaMensal = true; }

    const cpl = Number(c.target_cpl_max);
    if (cpl > 0) { next.cplEstimado = cpl; filled.cplEstimado = true; }

    const leads = Number(c.target_conversas);
    if (leads > 0) { next.metaLeads = leads; filled.metaLeads = true; }

    const ticket = Number(c.ticket_medio);
    if (ticket > 0) { next.ticketMedio = ticket; filled.ticketMedio = true; }

    // Auto-preenche segmento do cliente (se cadastrado) — habilita benchmark direto
    if (c.segmento && SEGMENTOS[c.segmento]) {
      next.segmento = c.segmento;
      filled.segmento = true;
    }

    setParams(next);
    setAutoFilledFields(filled);

    // Sugerir nome do plano com base no cliente
    const mesRef = new Date().toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
    if (!nomePlano.trim()) {
      setNomePlano(`${c.name} — ${mesRef}`);
    }
  };

  const resultado = useMemo(() => calcularPlano(params), [params]);

  const handleParamChange = (campo, valor) => {
    setParams((prev) => ({ ...prev, [campo]: valor }));
    // remover marca de auto-fill quando user editar manualmente
    if (autoFilledFields[campo]) {
      setAutoFilledFields((prev) => {
        const next = { ...prev };
        delete next[campo];
        return next;
      });
    }
  };

  const handleSalvar = async () => {
    if (saving) return;
    const nome = (nomePlano || "").trim() || `Plano ${new Date().toLocaleDateString("pt-BR")}`;
    setSaving(true);
    try {
      const res = await authFetch("/api/roi/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          clienteId: clienteId || null,
          clienteNome: clienteSelecionado?.name || null,
          clienteEmoji: clienteSelecionado?.emoji || null,
          parametros: { ...params },
          resultado,
          status: "rascunho",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao salvar");
      setPlanos((prev) => [data, ...prev]);
      setNomePlano("");
      setSavedToast(`Plano "${nome}" salvo`);
    } catch (err) {
      setSavedToast(`✗ ${err.message || "Erro ao salvar"}`);
    } finally {
      setSaving(false);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setSavedToast(null), 2800);
    }
  };

  const handleCarregar = (plano) => {
    setParams(plano.parametros);
    setNomePlano(plano.nome);
    setClienteId(plano.clienteId || "");
    setAutoFilledFields({}); // limpa para não mostrar selo verde em campos carregados
    setShowPlanos(false);
  };

  // ── SHARE ─────────────────────────────────────────────────────────────
  const [shareModal, setShareModal] = useState(null); // { plano, url } | null
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handleCompartilhar = async (plano) => {
    setShareLoading(true);
    try {
      const res = await authFetch(`/api/roi/plans/${plano.id}/share`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao gerar link");
      const url = `${window.location.origin}/r/${data.shareToken}`;
      setShareModal({ plano, url });
      // Atualiza local para refletir shareToken
      setPlanos((prev) => prev.map((p) => p.id === plano.id ? { ...p, shareToken: data.shareToken } : p));
    } catch (err) {
      setSavedToast(`✗ ${err.message}`);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setSavedToast(null), 2500);
    } finally {
      setShareLoading(false);
    }
  };

  const handleRevogarShare = async (plano) => {
    if (!plano.shareToken) return;
    try {
      await authFetch(`/api/roi/plans/${plano.id}/share`, { method: "DELETE" });
      setPlanos((prev) => prev.map((p) => p.id === plano.id ? { ...p, shareToken: null } : p));
      setShareModal(null);
      setSavedToast("Link revogado");
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setSavedToast(null), 2000);
    } catch {
      setSavedToast("✗ Erro ao revogar");
    }
  };

  const handleCopyShare = (url) => {
    navigator.clipboard?.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1500);
  };

  const handleExcluir = async (id) => {
    const prev = planos;
    setPlanos((cur) => cur.filter((p) => p.id !== id)); // otimista
    try {
      const res = await authFetch(`/api/roi/plans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
    } catch (err) {
      setPlanos(prev); // rollback
      setSavedToast(`✗ ${err.message || "Erro ao excluir"}`);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setSavedToast(null), 2500);
    }
  };

  const handleResetar = () => {
    setParams(PARAMETROS_PADRAO);
    setNomePlano("");
    setClienteId("");
    setAutoFilledFields({});
  };

  const [gerandoPdf, setGerandoPdf] = useState(false);

  const handleExportarPdf = async () => {
    if (gerandoPdf) return;
    setGerandoPdf(true);
    try {
      const plano = {
        nome: nomePlano || `Plano ${new Date().toLocaleDateString("pt-BR")}`,
        clienteNome: clienteSelecionado?.name || null,
        clienteEmoji: clienteSelecionado?.emoji || null,
        parametros: params,
        resultado,
        criadoEm: new Date().toISOString(),
      };
      const blob = await pdf(<RoiPdfTemplate plano={plano} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plano-midia-${(plano.nome).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      setSavedToast(`✗ Erro ao gerar PDF: ${err.message}`);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setSavedToast(null), 3500);
    } finally {
      setGerandoPdf(false);
    }
  };

  const handleExportarTexto = () => {
    const segmentoInfo = params.segmento && SEGMENTOS[params.segmento]
      ? `Segmento: ${SEGMENTOS[params.segmento].emoji} ${SEGMENTOS[params.segmento].nome}`
      : null;

    const txt = [
      `# Plano de Mídia${nomePlano ? ` — ${nomePlano}` : ""}`,
      clienteSelecionado ? `Cliente: ${clienteSelecionado.emoji || ""} ${clienteSelecionado.name}` : null,
      segmentoInfo,
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
      ``,
      `## Parâmetros`,
    ].filter(Boolean).concat([
      `- Verba mensal: ${fBRLfull(params.verbaMensal)}`,
      `- Meta de leads: ${params.metaLeads}`,
      `- CPL estimado: ${fBRLfull(params.cplEstimado)}`,
      `- Taxa de conversão: ${fPct(params.taxaConversao)}`,
      `- Ticket médio: ${fBRLfull(params.ticketMedio)}`,
      `- Dias de campanha: ${params.diasCampanha}`,
      ``,
      `## KPIs projetados`,
      `- Verba/dia: ${fBRLfull(resultado.verbaDia)}`,
      `- Leads/dia: ${resultado.leadsDia.toFixed(1)}`,
      `- Leads/semana: ${resultado.leadsSemana.toFixed(0)}`,
      `- Total de leads: ${resultado.leadsPossiveis.toFixed(0)}`,
      `- Vendas projetadas: ${resultado.vendasProjetadas}`,
      `- Faturamento projetado: ${fBRLfull(resultado.faturamentoProjetado)}`,
      `- ROAS projetado: ${resultado.roasProjetado.toFixed(2)}x`,
      ``,
      ...(resultado.multiCanalAtivo ? [
        `## Multi-canal`,
        `CPL ponderado: ${fBRLfull(resultado.cplEfetivo)}`,
        ...resultado.canaisBreakdown.map(
          (c) => `- ${c.emoji} ${c.nome}: ${c.percVerba.toFixed(0)}% (${fBRLfull(c.verbaCanal)}) · CPL ${fBRLfull(c.cpl)} · ${Math.round(c.leadsCanal)} leads`
        ),
        ``,
      ] : []),
      `## Análise financeira`,
      `- CAC: ${resultado.cac > 0 ? fBRLfull(resultado.cac) : "—"}`,
      `- LTV: ${resultado.ltv > 0 ? fBRLfull(resultado.ltv) : "—"}`,
      `- LTV:CAC: ${resultado.ltvCacRatio > 0 ? resultado.ltvCacRatio.toFixed(2) + ":1" : "—"}`,
      `- Payback: ${resultado.paybackMeses > 0 ? resultado.paybackMeses.toFixed(1) + " meses" : "—"}`,
      ...(params.margemContribuicao > 0 ? [
        `- Margem bruta: ${fBRLfull(resultado.margemValor)} (${params.margemContribuicao}%)`,
        `- Lucro líquido: ${fBRLfull(resultado.lucroLiquido)}`,
        `- ROI real: ${(resultado.roiLiquido * 100).toFixed(0)}%`,
      ] : []),
      ``,
      `## Distribuição do funil`,
      `- Topo: ${params.percTopo}% (${fBRLfull(resultado.verbaTopo)})`,
      `- Meio: ${params.percMeio}% (${fBRLfull(resultado.verbaMeio)})`,
      `- Fundo: ${params.percFundo}% (${fBRLfull(resultado.verbaFundo)})`,
      ``,
      `## Cronograma`,
      ...resultado.cronograma.map(
        (s) => `- Semana ${s.semana} (${FASE_LABEL[s.fase]}): ${fBRLfull(s.verba)} · ${s.metaLeads} leads · ${s.foco}`
      ),
    ]).join("\n");

    const blob = new Blob([txt], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plano-midia-${(nomePlano || "rascunho").toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={embedded ? "" : "space-y-4 sm:space-y-6"}>
      {/* HERO */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div>
          <h2 className={`font-bold text-zinc-100 flex items-center gap-2 ${embedded ? "text-xl" : "text-lg"}`}>
            <Calculator className="w-4 h-4 text-[#C9F80D]" />
            Calculadora de ROI
          </h2>
          <p className="text-[12px] text-zinc-500 mt-1">
            Planejamento estratégico de mídia paga · KPIs reativos · 3 cenários · cronograma semanal
          </p>
          {clienteSelecionado && (
            <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#C9F80D]/10 border border-[#C9F80D]/30">
              <span>{clienteSelecionado.emoji}</span>
              <span className="text-[11px] font-semibold text-[#C9F80D]">{clienteSelecionado.name}</span>
              <span className="text-[10px] text-[#C9F80D]/60 uppercase tracking-wider">plano vinculado</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPlanos((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Planos salvos
            <span className="text-[10px] text-zinc-500">({planos.length})</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showPlanos ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={handleResetar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-400 transition-colors"
          >
            Resetar
          </button>
          <button
            onClick={handleExportarTexto}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
            title="Exportar resumo em Markdown"
          >
            <FileText className="w-3.5 h-3.5" />
            .md
          </button>
          <button
            onClick={handleExportarPdf}
            disabled={gerandoPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C9F80D] hover:bg-[#b8e308] disabled:opacity-60 text-zinc-950 text-xs font-bold transition-colors"
            title="Gerar PDF formal para apresentar ao cliente"
          >
            <FileDown className={`w-3.5 h-3.5 ${gerandoPdf ? "animate-pulse" : ""}`} />
            {gerandoPdf ? "Gerando..." : "Exportar PDF"}
          </button>
        </div>
      </div>

      {/* PLANOS SALVOS DROPDOWN */}
      <AnimatePresence>
        {showPlanos && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Planos salvos
                </h3>
                <button
                  onClick={fetchPlanos}
                  disabled={planosLoading}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                  title="Recarregar"
                >
                  <RefreshCw className={`w-3 h-3 ${planosLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
              {planosLoading ? (
                <div className="text-xs text-zinc-500 text-center py-4">Carregando planos...</div>
              ) : planosError ? (
                <div className="text-xs text-amber-400 text-center py-4">
                  Erro: {planosError}
                </div>
              ) : planos.length === 0 ? (
                <div className="text-xs text-zinc-500 text-center py-4">
                  Nenhum plano salvo ainda. Preencha os parâmetros e clique em "Salvar plano".
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {planos.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                          {p.clienteEmoji && <span>{p.clienteEmoji}</span>}
                          <span className="truncate">{p.nome}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 flex gap-3 flex-wrap">
                          {p.clienteNome && (
                            <span className="text-[#C9F80D]/80 font-medium">{p.clienteNome}</span>
                          )}
                          <span>{new Date(p.criadoEm).toLocaleDateString("pt-BR")}</span>
                          <span>Verba: {fBRL(p.parametros.verbaMensal)}</span>
                          <span>ROAS: {p.resultado.roasProjetado.toFixed(2)}x</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCarregar(p)}
                        className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] font-medium text-zinc-300"
                      >
                        Carregar
                      </button>
                      <button
                        onClick={() => handleCompartilhar(p)}
                        disabled={shareLoading}
                        className={`p-1 rounded-md border transition-colors ${
                          p.shareToken
                            ? "bg-[#C9F80D]/15 border-[#C9F80D]/40 text-[#C9F80D] hover:bg-[#C9F80D]/25"
                            : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-500 hover:text-[#C9F80D]"
                        } disabled:opacity-50`}
                        title={p.shareToken ? "Ver link público" : "Gerar link público"}
                      >
                        <Link2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleExcluir(p.id)}
                        className="p-1 rounded-md bg-zinc-800 hover:bg-red-500/20 border border-zinc-700 hover:border-red-500/40 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PARÂMETROS */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 lg:sticky lg:top-20">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-bold text-zinc-100">Parâmetros</h3>
            </div>

            <div className="space-y-3">
              {/* Seletor de cliente */}
              <Field label="Cliente" hint={clienteSelecionado ? "Metas cadastradas foram carregadas" : "Opcional — preenche params automaticamente"}>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <select
                    value={clienteId}
                    onChange={(e) => handleClienteChange(e.target.value)}
                    disabled={clientesLoading}
                    className="w-full pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-[#C9F80D]/50 appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">
                      {clientesLoading ? "Carregando..." : "— Sem cliente vinculado —"}
                    </option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                  {clienteId && (
                    <button
                      type="button"
                      onClick={() => handleClienteChange("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200"
                      title="Remover vínculo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!clienteId && (
                    <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  )}
                </div>
                {clienteSelecionado && Object.keys(autoFilledFields).length > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                    <Sparkles className="w-2.5 h-2.5" />
                    {Object.keys(autoFilledFields).length} {Object.keys(autoFilledFields).length === 1 ? "campo carregado" : "campos carregados"} do cadastro
                  </div>
                )}
              </Field>

              <Field
                label="Segmento / Nicho"
                hint="Habilita benchmarks de mercado"
                autoFilled={autoFilledFields.segmento}
              >
                <div className="relative">
                  <Gauge className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <select
                    value={params.segmento || ""}
                    onChange={(e) => handleParamChange("segmento", e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 outline-none focus:border-[#C9F80D]/50 appearance-none cursor-pointer"
                  >
                    <option value="">— Sem segmento —</option>
                    {Object.entries(SEGMENTOS).map(([id, s]) => (
                      <option key={id} value={id}>
                        {s.emoji} {s.nome}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              </Field>

              <Field label="Nome do plano" hint="Opcional — usado ao salvar">
                <input
                  type="text"
                  value={nomePlano}
                  onChange={(e) => setNomePlano(e.target.value)}
                  placeholder="Ex: Cliente X — Maio/26"
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#C9F80D]/50 transition-colors"
                />
              </Field>

              <Field
                label="Verba mensal"
                autoFilled={autoFilledFields.verbaMensal}
                suggestion={
                  realMetrics?.gasto > 0 && (
                    <RealSuggestion
                      currentValue={params.verbaMensal}
                      realValue={realMetrics.gasto}
                      formatter={fBRL}
                      onApply={(v) => handleParamChange("verbaMensal", Math.round(v))}
                    />
                  )
                }
              >
                <NumberInput
                  value={params.verbaMensal}
                  onChange={(v) => handleParamChange("verbaMensal", v)}
                  prefix="R$"
                  step={100}
                />
              </Field>

              <Field
                label="Meta de leads"
                autoFilled={autoFilledFields.metaLeads}
                suggestion={
                  realMetrics?.conversas > 0 && (
                    <RealSuggestion
                      currentValue={params.metaLeads}
                      realValue={realMetrics.conversas}
                      formatter={(v) => fNum(v) + " leads"}
                      onApply={(v) => handleParamChange("metaLeads", Math.round(v))}
                    />
                  )
                }
              >
                <NumberInput
                  value={params.metaLeads}
                  onChange={(v) => handleParamChange("metaLeads", v)}
                  suffix="leads"
                />
              </Field>

              <Field
                label="CPL estimado"
                hint={resultado.multiCanalAtivo
                  ? `Ignorado — usando CPL ponderado dos canais: ${fBRL(resultado.cplEfetivo)}`
                  : "Custo por lead esperado"}
                autoFilled={autoFilledFields.cplEstimado}
                suggestion={
                  realMetrics?.cpl > 0 && !resultado.multiCanalAtivo && (
                    <RealSuggestion
                      currentValue={params.cplEstimado}
                      realValue={realMetrics.cpl}
                      formatter={fBRL}
                      lowerIsBetter
                      onApply={(v) => handleParamChange("cplEstimado", Math.round(v))}
                    />
                  )
                }
              >
                <NumberInput
                  value={params.cplEstimado}
                  onChange={(v) => handleParamChange("cplEstimado", v)}
                  prefix="R$"
                  step={1}
                />
              </Field>

              <Field label="Taxa de conversão" hint="Leads → vendas (0 a 1, ex: 0.1 = 10%)">
                <NumberInput
                  value={params.taxaConversao}
                  onChange={(v) => handleParamChange("taxaConversao", v)}
                  step={0.01}
                  suffix={`(${fPct(params.taxaConversao)})`}
                />
              </Field>

              <Field label="Ticket médio" autoFilled={autoFilledFields.ticketMedio}>
                <NumberInput
                  value={params.ticketMedio}
                  onChange={(v) => handleParamChange("ticketMedio", v)}
                  prefix="R$"
                  step={50}
                />
              </Field>

              <Field label="Dias de campanha">
                <NumberInput
                  value={params.diasCampanha}
                  onChange={(v) => handleParamChange("diasCampanha", v)}
                  suffix="dias"
                />
              </Field>

              {/* ── ANÁLISE FINANCEIRA (opcional) ── */}
              <details className="border-t border-zinc-800 pt-3 mt-1 group">
                <summary className="cursor-pointer flex items-center gap-2 text-[11px] font-semibold text-zinc-300 uppercase tracking-wider hover:text-zinc-100 list-none">
                  <Briefcase className="w-3.5 h-3.5 text-[#C9F80D]" />
                  Análise financeira
                  <span className="text-[9px] text-zinc-600 font-normal normal-case tracking-normal">opcional</span>
                  <ChevronDown className="w-3 h-3 ml-auto transition-transform group-open:rotate-180" />
                </summary>

                <div className="space-y-3 mt-3">
                  <Field label="Margem de contribuição" hint="% do faturamento que vira margem (0–100)">
                    <NumberInput
                      value={params.margemContribuicao}
                      onChange={(v) => handleParamChange("margemContribuicao", Math.max(0, Math.min(100, v)))}
                      suffix={`% (${(params.margemContribuicao || 0)}%)`}
                      step={5}
                      min={0}
                    />
                  </Field>

                  <Field label="Compras por cliente" hint="Quantas compras um cliente faz em média">
                    <NumberInput
                      value={params.comprasPorCliente}
                      onChange={(v) => handleParamChange("comprasPorCliente", Math.max(1, v))}
                      suffix="×"
                      step={1}
                      min={1}
                    />
                  </Field>

                  <Field label="Retenção (meses)" hint="Por quantos meses o cliente fica ativo">
                    <NumberInput
                      value={params.retencaoMeses}
                      onChange={(v) => handleParamChange("retencaoMeses", Math.max(1, v))}
                      suffix="meses"
                      step={1}
                      min={1}
                    />
                  </Field>
                </div>
              </details>

              {/* ── MULTI-CANAL (opcional) ── */}
              <details className="border-t border-zinc-800 pt-3 group" open={params.canais?.length > 0}>
                <summary className="cursor-pointer flex items-center gap-2 text-[11px] font-semibold text-zinc-300 uppercase tracking-wider hover:text-zinc-100 list-none">
                  <Layers className="w-3.5 h-3.5 text-[#C9F80D]" />
                  Multi-canal
                  <span className="text-[9px] text-zinc-600 font-normal normal-case tracking-normal">opcional</span>
                  {params.canais?.length > 0 && (
                    <span className="text-[9px] bg-[#C9F80D]/15 text-[#C9F80D] rounded-full px-1.5 py-0.5 font-bold">
                      {params.canais.length}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 ml-auto transition-transform group-open:rotate-180" />
                </summary>

                <div className="mt-3">
                  <MultiCanalEditor
                    canais={params.canais || []}
                    setCanais={(newCanais) => handleParamChange("canais", newCanais)}
                    verbaTotal={params.verbaMensal}
                  />
                </div>
              </details>

              <button
                onClick={handleSalvar}
                disabled={saving}
                className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#C9F80D] hover:bg-[#b8e308] disabled:opacity-60 disabled:cursor-not-allowed text-zinc-950 text-xs font-bold transition-colors"
              >
                <Save className={`w-3.5 h-3.5 ${saving ? "animate-pulse" : ""}`} />
                {saving ? "Salvando..." : "Salvar plano"}
              </button>
            </div>
          </div>
        </div>

        {/* RESULTADOS */}
        <div className="lg:col-span-2 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiCard label="Verba/dia"    value={fBRL(resultado.verbaDia)}            icon={DollarSign} color="#C9F80D" delay={0.00} />
            <KpiCard label="Leads/dia"    value={resultado.leadsDia.toFixed(1)}       icon={Users}      color="#3B82F6" delay={0.05} />
            <KpiCard label="Leads/semana" value={fNum(resultado.leadsSemana)}         icon={Users}      color="#06B6D4" delay={0.10} />
            <KpiCard
              label="Vendas"
              value={fNum(resultado.vendasProjetadas)}
              sub={fPct(params.taxaConversao) + " de conversão"}
              icon={Target}
              color="#10B981"
              delay={0.15}
            />
            <KpiCard
              label="Faturamento"
              value={fBRL(resultado.faturamentoProjetado)}
              sub={`${resultado.vendasProjetadas} × ${fBRL(params.ticketMedio)}`}
              icon={TrendingUp}
              color="#8B5CF6"
              delay={0.20}
            />
            <KpiCard
              label="ROAS"
              value={resultado.roasProjetado.toFixed(2) + "x"}
              sub={resultado.roasProjetado >= 1 ? "Acima do break-even" : "Abaixo do break-even"}
              icon={TrendingUp}
              color={resultado.roasProjetado >= 1 ? "#C9F80D" : "#EF4444"}
              delay={0.25}
            />
          </div>

          <BenchmarkInsight params={params} resultado={resultado} realMetrics={realMetrics} />
          <AnaliseFinanceira params={params} resultado={resultado} />
          <PaybackChart params={params} resultado={resultado} />
          <MultiCanalBreakdown resultado={resultado} params={params} />
          <SensibilidadeAnalise params={params} />

          {/* Comparativo Projetado vs Realizado — só quando há cliente vinculado */}
          {clienteSelecionado && (
            <ComparativoRealizado
              cliente={clienteSelecionado}
              projetado={params}
              real={realMetrics}
              loading={realLoading}
              error={realError}
              onRefresh={() => fetchRealMetrics(clienteId)}
            />
          )}

          <FunilDistribuicao params={params} setParams={setParams} resultado={resultado} />
          <CenariosChart resultado={resultado} params={params} />
          <Cronograma cronograma={resultado.cronograma} />
          <GatilhosAjuste />
        </div>
      </div>

      {/* SHARE MODAL */}
      <AnimatePresence>
        {shareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShareModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#C9F80D]" />
                  <h3 className="text-sm font-bold text-zinc-100">Link público</h3>
                </div>
                <button
                  onClick={() => setShareModal(null)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 mb-3">
                Qualquer pessoa com este link pode ver o plano <b className="text-zinc-200">{shareModal.plano.nome}</b> em modo somente leitura. Sem login necessário.
              </p>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 mb-3 flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-300 flex-1 truncate">
                  {shareModal.url}
                </span>
                <button
                  onClick={() => handleCopyShare(shareModal.url)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#C9F80D] text-zinc-950 text-[10px] font-bold hover:bg-[#b8e308] shrink-0"
                >
                  {shareCopied ? (<><Check className="w-3 h-3" /> Copiado</>) : (<><Copy className="w-3 h-3" /> Copiar</>)}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <a
                  href={shareModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#C9F80D] hover:underline flex items-center gap-1"
                >
                  <Activity className="w-3 h-3" />
                  Abrir em nova aba
                </a>
                <button
                  onClick={() => handleRevogarShare(shareModal.plano)}
                  className="text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md px-2.5 py-1 transition-colors"
                >
                  Revogar link
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-start gap-1.5">
                <Info className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                <span>
                  O cliente vê os KPIs, cenários, cronograma e gatilhos — mas <b>não vê</b> observações internas, status ou histórico. Pode baixar o PDF.
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#C9F80D] text-zinc-950 text-xs font-bold px-4 py-2 rounded-full shadow-lg"
          >
            {savedToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
