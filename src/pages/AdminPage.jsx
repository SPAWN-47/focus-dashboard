import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

function ClientNoteField({ clientId, initialNote = "" }) {
  const { authFetch } = useAuth();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(false);
  const taRef = useRef(null);

  useEffect(() => { setNote(initialNote); }, [initialNote]);

  function handleEdit() {
    setEditing(true);
    setTimeout(() => taRef.current?.focus(), 0);
  }

  async function handleSave() {
    setEditing(false);
    try {
      await authFetch(`/api/config/clients/${clientId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: note }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  }

  return (
    <div className="mt-3 pt-3 border-t border-zinc-800/70">
      {editing ? (
        <div>
          <textarea
            ref={taRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => { if (e.key === "Escape") { setEditing(false); setNote(initialNote); } }}
            placeholder="Escreva uma nota sobre este cliente..."
            rows={3}
            className="w-full bg-zinc-800 border border-violet-500/50 text-zinc-200 placeholder-zinc-600 text-xs rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-violet-500"
          />
          <p className="text-[10px] text-zinc-600 mt-1">Enter para nova linha · clique fora para salvar · Esc para cancelar</p>
        </div>
      ) : note ? (
        <button
          onClick={handleEdit}
          className="w-full text-left group"
        >
          <div className="flex items-start gap-2">
            <svg className="w-3 h-3 text-zinc-600 shrink-0 mt-0.5 group-hover:text-zinc-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p className="text-xs text-zinc-500 group-hover:text-zinc-300 transition line-clamp-2 text-left leading-relaxed">
              {note}
            </p>
          </div>
          {saved && <span className="text-[10px] text-emerald-500 mt-1 block">Salvo ✓</span>}
        </button>
      ) : (
        <button
          onClick={handleEdit}
          className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Adicionar nota
        </button>
      )}
    </div>
  );
}

function DeltaBadge({ delta, lowerIsBetter = false }) {
  if (delta === null || delta === undefined) return null;
  const isPositive = delta >= 0;
  const isGood = lowerIsBetter ? !isPositive : isPositive;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
      isGood ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
    }`}>
      {isPositive ? "+" : ""}{delta.toFixed(1)}%
    </span>
  );
}

const EMOJI_OPTIONS = ["🏢", "🦷", "🏥", "🚗", "🏋️", "💅", "🍕", "🏠", "👗", "💊", "🎓", "🐾"];
const COLOR_OPTIONS = [
  "#8B5CF6", "#EF4444", "#F59E0B", "#10B981", "#3B82F6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
];

function ClientModal({ client, onClose, onSave }) {
  const { authFetch } = useAuth();
  const isEdit = !!client;

  const [form, setForm] = useState({
    id: client?.id || "",
    name: client?.name || "",
    emoji: client?.emoji || "🏢",
    color: client?.color || "#8B5CF6",
    token: client?.token || "",
    accountId: client?.accountId || "",
    ticket_medio: client?.ticket_medio || "",
    target_cpl_max: client?.target_cpl_max || "",
    target_conversas: client?.target_conversas || "",
    target_spend: client?.target_spend || "",
    google_ads_customer_id: client?.google_ads_customer_id || "",
    gmb_location_id: client?.gmb_location_id || "",
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await authFetch("/api/config/test-connection", {
        method: "POST",
        body: JSON.stringify({ token: form.token, accountId: form.accountId }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, error: "Erro de rede" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await authFetch(`/api/config/clients/${client.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: form.name,
            emoji: form.emoji,
            color: form.color,
            token: form.token,
            accountId: form.accountId,
            ticket_medio: parseFloat(form.ticket_medio) || 0,
            target_cpl_max: parseFloat(form.target_cpl_max) || 0,
            target_conversas: parseInt(form.target_conversas) || 0,
            target_spend: parseFloat(form.target_spend) || 0,
            google_ads_customer_id: form.google_ads_customer_id || null,
            gmb_location_id: form.gmb_location_id || null,
          }),
        });
      } else {
        res = await authFetch("/api/config/clients", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      onSave(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">
              {isEdit ? "Editar Cliente" : "Novo Cliente"}
            </h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {!isEdit && (
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">ID (slug único)</label>
                <input
                  value={form.id}
                  onChange={(e) => set("id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="ex: minha-empresa"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Nome</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Nome do cliente"
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Emoji</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => set("emoji", e)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition ${
                        form.emoji === e
                          ? "bg-violet-600 ring-2 ring-violet-400"
                          : "bg-zinc-800 hover:bg-zinc-700"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Cor</label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => set("color", c)}
                      style={{ backgroundColor: c }}
                      className={`w-9 h-9 rounded-lg transition ${
                        form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Account ID (Meta)</label>
              <input
                value={form.accountId}
                onChange={(e) => set("accountId", e.target.value)}
                placeholder="act_123456789"
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Access Token (Meta)</label>
              <textarea
                value={form.token}
                onChange={(e) => set("token", e.target.value)}
                placeholder="EAABx..."
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 font-mono resize-none"
              />
            </div>

            {/* Google Ads */}
            <div className="border-t border-zinc-800 pt-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Google Ads</p>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Customer ID (Google Ads)</label>
                <input
                  value={form.google_ads_customer_id}
                  onChange={(e) => set("google_ads_customer_id", e.target.value)}
                  placeholder="ex: 123-456-7890"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 font-mono"
                />
                <p className="text-[10px] text-zinc-600 mt-1">Apenas o número da conta. Ex: 123-456-7890</p>
              </div>

              {/* GMB Location ID */}
              <div className="mt-3">
                <label className="block text-xs text-zinc-400 mb-1">Location ID (Google Meu Negócio)</label>
                <input
                  value={form.gmb_location_id}
                  onChange={(e) => set("gmb_location_id", e.target.value)}
                  placeholder="ex: 17414490206052773930"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 font-mono"
                />
                <p className="text-[10px] text-zinc-600 mt-1">ID numérico da localização. Encontre em business.google.com/locations</p>
              </div>
            </div>

            {/* Targets */}
            <div className="border-t border-zinc-800 pt-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Metas</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Ticket Médio (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.ticket_medio}
                    onChange={(e) => set("ticket_medio", e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">CPL Máximo (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.target_cpl_max}
                    onChange={(e) => set("target_cpl_max", e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Conversas alvo/mês</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.target_conversas}
                    onChange={(e) => set("target_conversas", e.target.value)}
                    placeholder="0"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Budget mensal (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.target_spend}
                    onChange={(e) => set("target_spend", e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* Test Connection */}
            <button
              onClick={testConnection}
              disabled={testing || !form.token || !form.accountId}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 border border-zinc-700 text-zinc-200 rounded-xl py-2.5 text-sm transition"
            >
              {testing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Testando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Testar Conexão
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  testResult.success
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}
              >
                {testResult.success
                  ? `✓ Conexão OK! Spend ontem: R$ ${testResult.data?.spend || "0"}`
                  : `✗ ${testResult.error}`}
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl py-2.5 text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const rankColors = [
  { border: "border-yellow-500/40", bg: "bg-yellow-500/10", text: "text-yellow-400", label: "text-yellow-500/70" },
  { border: "border-zinc-400/30", bg: "bg-zinc-400/10", text: "text-zinc-300", label: "text-zinc-500/70" },
  { border: "border-orange-600/30", bg: "bg-orange-600/10", text: "text-orange-400", label: "text-orange-600/70" },
];

function CreativeCard({ ad, rank }) {
  const rankStyle = rank <= 3 ? rankColors[rank - 1] : null;
  const rankLabel = rank <= 3 ? ["1°", "2°", "3°"][rank - 1] : `${rank}°`;

  return (
    <div className={`bg-zinc-900 border rounded-2xl overflow-hidden hover:border-zinc-600 transition-all duration-200 group ${rankStyle ? rankStyle.border : "border-zinc-800"}`}>
      {/* Thumbnail */}
      <div className="aspect-video bg-zinc-800 relative overflow-hidden">
        {ad.thumbnail ? (
          <img
            src={ad.thumbnail}
            alt={ad.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Rank badge */}
        <div className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm ${rankStyle ? `${rankStyle.bg} ${rankStyle.text} border ${rankStyle.border}` : "bg-zinc-900/80 text-zinc-400 border border-zinc-700/50"}`}>
          {rankLabel}
        </div>
        {/* Conversations badge — bottom right of thumbnail */}
        {ad.conversas > 0 && (
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-300 tabular-nums">{ad.conversas}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <p className="text-sm font-semibold text-white leading-snug truncate mb-0.5" title={ad.creativeTitle || ad.name}>
          {ad.creativeTitle || ad.name}
        </p>
        {ad.creativeTitle && (
          <p className="text-xs text-zinc-600 truncate mb-3">{ad.name}</p>
        )}

        {/* Divider */}
        <div className="h-px bg-zinc-800 mb-3 mt-2" />

        {/* Primary metrics */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Investido", value: `R$ ${(ad.gasto || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` },
            { label: "Conversas", value: ad.conversas ?? 0 },
            { label: "CPL", value: ad.conversas > 0 ? `R$ ${(ad.cpl || 0).toFixed(0)}` : "—" },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-base font-bold text-white tabular-nums leading-tight">{m.value}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium uppercase tracking-wide">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Secondary metrics */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/60">
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <span className="font-medium">CTR</span>
            <span className="text-zinc-400 font-semibold tabular-nums">{(ad.ctr || 0).toFixed(1)}%</span>
          </div>
          <div className="w-px h-3 bg-zinc-800" />
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <span className="font-medium">CPM</span>
            <span className="text-zinc-400 font-semibold tabular-nums">R$ {(ad.cpm || 0).toFixed(0)}</span>
          </div>
          <div className="w-px h-3 bg-zinc-800" />
          <span className="text-[11px] text-zinc-500 tabular-nums">{(ad.impressoes || 0).toLocaleString("pt-BR")} imp.</span>
        </div>
      </div>
    </div>
  );
}

const PERIOD_LABELS = { daily: "Ontem", weekly: "Última semana", monthly: "Este mês" };

function generateClientReportHTML(client, data, period) {
  const m = data.metrics;
  const t = data.targets || {};
  const d = data.delta || {};
  const score = computeHealthScore(m, t, d);
  const now = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const periodLabel = PERIOD_LABELS[period] || period;

  const fBRL = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fBRL0 = (v) => `R$ ${(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
  const fPct = (v) => `${(v || 0).toFixed(2)}%`;

  const deltaHtml = (val, lowerIsBetter = false) => {
    if (val == null) return "";
    const good = lowerIsBetter ? val < 0 : val >= 0;
    const color = good ? "#16a34a" : "#dc2626";
    const bg = good ? "#f0fdf4" : "#fef2f2";
    const sign = val >= 0 ? "+" : "";
    return `<span style="font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px;background:${bg};color:${color};margin-left:6px;">${sign}${val.toFixed(1)}%</span>`;
  };

  const progressBar = (value, target, color) => {
    if (!target) return "";
    const pct = Math.min(100, Math.round((value / target) * 100));
    const barColor = pct > 100 ? "#dc2626" : color;
    return `
      <div style="margin-top:8px;">
        <div style="height:6px;background:#e5e7eb;border-radius:999px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:999px;"></div>
        </div>
        <div style="font-size:11px;color:#6b7280;margin-top:4px;text-align:right;">${pct}% da meta</div>
      </div>`;
  };

  const scoreColor = score >= 80 ? "#16a34a" : score >= 60 ? "#15803d" : score >= 40 ? "#ca8a04" : score >= 20 ? "#ea580c" : "#dc2626";
  const scoreBg = score >= 80 ? "#f0fdf4" : score >= 60 ? "#f0fdf4" : score >= 40 ? "#fefce8" : score >= 20 ? "#fff7ed" : "#fef2f2";
  const scoreLabel = score >= 80 ? "Excelente" : score >= 60 ? "Bom" : score >= 40 ? "Regular" : score >= 20 ? "Atenção" : "Crítico";

  const kpis = [
    { label: "Investimento", value: fBRL0(m.gasto), delta: d.gasto, li: false, sub: t.target_spend ? `Meta: ${fBRL0(t.target_spend)}` : null, progress: progressBar(m.gasto, t.target_spend, "#7c3aed") },
    { label: "Conversas", value: m.conversas ?? 0, delta: d.conversas, li: false, sub: t.target_conversas ? `Meta: ${t.target_conversas}` : null, progress: progressBar(m.conversas, t.target_conversas, "#059669") },
    { label: "CPL", value: m.cpl > 0 ? fBRL(m.cpl) : "—", delta: d.cpl, li: true, sub: t.target_cpl_max ? `Limite: ${fBRL(t.target_cpl_max)}` : null },
    { label: "CTR", value: fPct(m.ctr), delta: null },
    { label: "CPM", value: fBRL(m.cpm), delta: d.cpm, li: true },
    { label: "Impressões", value: (m.impressoes || 0).toLocaleString("pt-BR"), delta: d.impressoes, li: false },
  ];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório — ${client.name} — ${periodLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f9fafb; color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { max-width: 860px; margin: 0 auto; padding: 48px 40px; background: #fff; min-height: 100vh; }
    @media print {
      body { background: #fff; }
      .page { padding: 32px; box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Print button -->
  <div class="no-print" style="text-align:right;margin-bottom:24px;">
    <button onclick="window.print()" style="background:#7c3aed;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;">
      ↓ Salvar como PDF
    </button>
  </div>

  <!-- Header -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:40px;padding-bottom:28px;border-bottom:2px solid #f3f4f6;">
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="width:56px;height:56px;border-radius:16px;background:${client.color}18;border:1.5px solid ${client.color}40;display:flex;align-items:center;justify-content:center;font-size:28px;">
        ${client.emoji}
      </div>
      <div>
        <div style="font-size:22px;font-weight:800;color:#111827;line-height:1.2;">${client.name}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px;">Relatório de Performance · ${periodLabel}</div>
        <div style="font-size:12px;color:#9ca3af;margin-top:2px;">Gerado em ${now}</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:6px;">Score de Saúde</div>
      <div style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;background:${scoreBg};border:1.5px solid ${scoreColor}30;">
        <div style="width:10px;height:10px;border-radius:50%;background:${scoreColor};"></div>
        <span style="font-size:26px;font-weight:800;color:${scoreColor};">${score}</span>
        <span style="font-size:13px;font-weight:600;color:${scoreColor};">${scoreLabel}</span>
      </div>
    </div>
  </div>

  <!-- KPI Grid -->
  <div style="margin-bottom:36px;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:16px;">Métricas do período</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
      ${kpis.map((k) => `
        <div style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:14px;padding:18px 20px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:8px;">${k.label}</div>
          <div style="display:flex;align-items:baseline;flex-wrap:wrap;gap:4px;">
            <span style="font-size:22px;font-weight:800;color:#111827;line-height:1;">${k.value}</span>
            ${deltaHtml(k.delta, k.li)}
          </div>
          ${k.sub ? `<div style="font-size:11px;color:#9ca3af;margin-top:6px;">${k.sub}</div>` : ""}
          ${k.progress || ""}
        </div>`).join("")}
    </div>
  </div>

  ${(t.target_spend > 0 || t.target_conversas > 0) ? `
  <!-- Metas -->
  <div style="margin-bottom:36px;">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:16px;">Acompanhamento de metas</div>
    <div style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:14px;padding:24px;">
      ${t.target_spend > 0 ? (() => {
        const pct = Math.min(100, Math.round((m.gasto / t.target_spend) * 100));
        const over = pct > 100;
        return `
        <div style="margin-bottom:${t.target_conversas > 0 ? "20px" : "0"};">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:13px;font-weight:600;color:#374151;">Budget mensal</span>
            <span style="font-size:13px;font-weight:700;color:${over ? "#dc2626" : "#111827"};">${fBRL0(m.gasto)} / ${fBRL0(t.target_spend)} <span style="color:${over ? "#dc2626" : "#6b7280"};font-weight:500;">(${pct}%)</span></span>
          </div>
          <div style="height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${over ? "#dc2626" : "#7c3aed"};border-radius:999px;"></div>
          </div>
        </div>`;
      })() : ""}
      ${t.target_conversas > 0 ? (() => {
        const pct = Math.min(100, Math.round((m.conversas / t.target_conversas) * 100));
        return `
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:13px;font-weight:600;color:#374151;">Meta de conversas</span>
            <span style="font-size:13px;font-weight:700;color:#111827;">${m.conversas} / ${t.target_conversas} <span style="color:#6b7280;font-weight:500;">(${pct}%)</span></span>
          </div>
          <div style="height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:#059669;border-radius:999px;"></div>
          </div>
        </div>`;
      })() : ""}
    </div>
  </div>` : ""}

  <!-- Footer -->
  <div style="border-top:1.5px solid #f3f4f6;padding-top:20px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="width:24px;height:24px;border-radius:6px;background:#7c3aed;display:flex;align-items:center;justify-content:center;">
        <svg viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
      </div>
      <span style="font-size:12px;font-weight:700;color:#374151;">Focus Dashboard</span>
    </div>
    <span style="font-size:11px;color:#9ca3af;">${client.id} · ${periodLabel} · ${now}</span>
  </div>

</div>
</body>
</html>`;
}

function openClientReport(client, data, period) {
  const html = generateClientReportHTML(client, data, period);
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}

function computeHealthScore(metrics, targets, delta) {
  if (!metrics) return null;
  const m = metrics;
  const t = targets || {};
  const d = delta || {};
  let score = 0;

  // ── CPL (35 pts) ─────────────────────────────
  if (t.target_cpl_max > 0 && m.cpl > 0) {
    const ratio = m.cpl / t.target_cpl_max;
    if (ratio <= 1.0) score += 35;
    else if (ratio <= 1.2) score += 25;
    else if (ratio <= 1.5) score += 12;
    else score += 0;
  } else if (m.cpl > 0) {
    score += 20; // sem meta definida, neutro
  } else {
    score += 10; // sem conversas ainda
  }

  // ── Conversas vs meta (35 pts) ───────────────
  if (t.target_conversas > 0) {
    const ratio = m.conversas / t.target_conversas;
    if (ratio >= 1.0) score += 35;
    else if (ratio >= 0.75) score += 25;
    else if (ratio >= 0.5) score += 15;
    else score += 5;
  } else if (m.conversas > 0) {
    score += 20; // sem meta, neutro
  } else {
    score += 10;
  }

  // ── Budget (20 pts) ───────────────────────────
  if (t.target_spend > 0) {
    const ratio = m.gasto / t.target_spend;
    if (ratio >= 0.7 && ratio <= 1.0) score += 20; // no ritmo certo
    else if (ratio >= 0.5) score += 13;
    else if (ratio > 1.0) score += 8;  // estourou
    else score += 5;
  } else {
    score += 10; // sem meta, neutro
  }

  // ── Tendência de conversas (10 pts) ──────────
  if (d.conversas != null) {
    if (d.conversas > 5) score += 10;
    else if (d.conversas >= -10) score += 6;
    else score += 2;
  } else {
    score += 5; // sem histórico, neutro
  }

  return Math.min(100, Math.max(0, score));
}

function HealthBadge({ score }) {
  if (score === null || score === undefined) return null;
  let label, colorClass, ringClass;
  if (score >= 80) {
    label = "Excelente"; colorClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"; ringClass = "bg-emerald-400";
  } else if (score >= 60) {
    label = "Bom"; colorClass = "text-green-400 bg-green-500/10 border-green-500/25"; ringClass = "bg-green-400";
  } else if (score >= 40) {
    label = "Regular"; colorClass = "text-yellow-400 bg-yellow-500/10 border-yellow-500/25"; ringClass = "bg-yellow-400";
  } else if (score >= 20) {
    label = "Atenção"; colorClass = "text-orange-400 bg-orange-500/10 border-orange-500/25"; ringClass = "bg-orange-400";
  } else {
    label = "Crítico"; colorClass = "text-red-400 bg-red-500/10 border-red-500/25"; ringClass = "bg-red-400";
  }
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-bold ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ringClass}`} />
      <span className="tabular-nums">{score}</span>
      <span className="font-medium opacity-80">{label}</span>
    </div>
  );
}

function ClientPerfCard({ client, data, period, anomalies, onExport, trendDays, note }) {
  const clientAnomalies = (anomalies || []).filter((a) => a.clientId === client.id);
  const hasCritical = clientAnomalies.some((a) => a.severity === "critical");
  const hasWarning = clientAnomalies.some((a) => a.severity === "warning");
  const m = data?.metrics;
  const t = data?.targets;
  const d = data?.delta;

  const statusColor = hasCritical ? "red" : hasWarning ? "yellow" : null;
  const healthScore = data?.hasData ? computeHealthScore(m, t, d) : null;
  const projection = (period === "monthly" && data?.hasData)
    ? computeProjection(trendDays, m)
    : null;

  return (
    <div
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-200"
      style={{ borderLeftColor: client.color, borderLeftWidth: "3px" }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: client.color + "20", border: `1px solid ${client.color}40` }}
          >
            {client.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white text-sm leading-tight">{client.name}</p>
              {statusColor && (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                  statusColor === "red"
                    ? "bg-red-500/15 text-red-400 border border-red-500/25"
                    : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25"
                }`}>
                  {statusColor === "red" ? "Crítico" : "Alerta"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-600 font-mono mt-0.5">{client.id}</p>
            {note && (
              <p className="text-[11px] text-zinc-500 mt-1 max-w-[180px] truncate italic" title={note}>
                "{note}"
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <HealthBadge score={healthScore} />
          {data?.hasData && onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-violet-600 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition"
              title="Exportar relatório"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
          <a
            href={`/dashboard?client=${client.id}`}
            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition"
          >
            Ver
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-800 mx-5" />

      {/* Body */}
      <div className="px-5 pb-5 pt-4">
        {data?.loading ? (
          <div className="space-y-2.5 py-1">
            <div className="h-8 bg-zinc-800 rounded-xl animate-pulse w-full" />
            <div className="h-8 bg-zinc-800 rounded-xl animate-pulse w-4/5" />
          </div>
        ) : !data || data.error || !data.hasData ? (
          <div className="py-6 flex flex-col items-center gap-1">
            <svg className="w-5 h-5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
            <p className="text-xs text-zinc-600 italic">
              {data?.error ? "Erro ao buscar dados" : "Sem dados para o período"}
            </p>
          </div>
        ) : (
          <>
            {/* Anomaly banner */}
            {clientAnomalies.length > 0 && (
              <div
                className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                  hasCritical
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                }`}
                title={clientAnomalies[0].message}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="truncate">{clientAnomalies[0].message}</span>
              </div>
            )}

            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "Investimento",
                  value: `R$ ${(m.gasto || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
                  alert: t?.target_spend > 0 && m.gasto > t.target_spend,
                  delta: d?.gasto ?? null,
                  lowerIsBetter: false,
                },
                {
                  label: "Conversas",
                  value: m.conversas ?? 0,
                  alert: t?.target_conversas > 0 && m.conversas < t.target_conversas * 0.5,
                  delta: d?.conversas ?? null,
                  lowerIsBetter: false,
                },
                {
                  label: "CPL",
                  value: m.cpl > 0 ? `R$ ${m.cpl.toFixed(2)}` : "—",
                  alert: t?.target_cpl_max > 0 && m.cpl > t.target_cpl_max,
                  delta: d?.cpl ?? null,
                  lowerIsBetter: true,
                },
                {
                  label: "CTR",
                  value: `${(m.ctr || 0).toFixed(2)}%`,
                  delta: null,
                  lowerIsBetter: false,
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className={`rounded-xl px-3 py-3 ${
                    kpi.alert
                      ? "bg-red-500/10 border border-red-500/20"
                      : "bg-zinc-800/60 border border-zinc-700/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className={`text-xl font-bold tabular-nums leading-tight ${kpi.alert ? "text-red-400" : "text-white"}`}>
                      {kpi.value}
                    </p>
                    <DeltaBadge delta={kpi.delta} lowerIsBetter={kpi.lowerIsBetter} />
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wide">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Progress bars (monthly) */}
            {period === "monthly" && (t?.target_spend > 0 || t?.target_conversas > 0) && (
              <div className="space-y-3 pt-1">
                {t?.target_spend > 0 && (() => {
                  const pct = Math.min(100, Math.round((m.gasto / t.target_spend) * 100));
                  const over = pct >= 100;
                  return (
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-zinc-500 font-medium">Budget mensal</span>
                        <span className={`font-semibold tabular-nums ${over ? "text-red-400" : "text-zinc-300"}`}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-violet-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
                {t?.target_conversas > 0 && (() => {
                  const pct = Math.min(100, Math.round((m.conversas / t.target_conversas) * 100));
                  return (
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-zinc-500 font-medium">Meta conversas</span>
                        <span className="text-zinc-300 font-semibold tabular-nums">{m.conversas} / {t.target_conversas}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          {/* Projeção fim do mês */}
          {projection && (
            <div className="mt-4 pt-4 border-t border-zinc-800/60">
              <div className="flex items-center gap-1.5 mb-3">
                <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wide">Projeção · fim do mês</span>
                <span className="text-[10px] text-zinc-600 ml-auto">{projection.daysRemaining}d restantes</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Gasto projetado */}
                {(() => {
                  const willOver = t?.target_spend > 0 && projection.projGasto > t.target_spend;
                  const willUnder = t?.target_spend > 0 && projection.projGasto < t.target_spend * 0.8;
                  const currentPct = t?.target_spend > 0 ? Math.min(100, (m.gasto / t.target_spend) * 100) : null;
                  const projPct = t?.target_spend > 0 ? Math.min(120, (projection.projGasto / t.target_spend) * 100) : null;
                  return (
                    <div className="bg-zinc-800/40 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide mb-1">Investimento</p>
                      <p className={`text-sm font-bold tabular-nums ${willOver ? "text-red-400" : "text-white"}`}>
                        R$ {projection.projGasto.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </p>
                      {t?.target_spend > 0 && (
                        <>
                          <div className="relative h-1.5 bg-zinc-700 rounded-full overflow-hidden mt-2">
                            <div className="absolute h-full bg-zinc-600 rounded-full" style={{ width: `${Math.min(100, currentPct)}%` }} />
                            <div className="absolute h-full rounded-full opacity-50" style={{ left: `${Math.min(100, currentPct)}%`, width: `${Math.max(0, projPct - currentPct)}%`, background: willOver ? "#ef4444" : "#7c3aed" }} />
                          </div>
                          <p className={`text-[10px] mt-1.5 font-medium ${willOver ? "text-red-400" : willUnder ? "text-yellow-400" : "text-emerald-400"}`}>
                            {willOver ? "⚠ Vai estourar" : willUnder ? "↘ Abaixo do budget" : "✓ No ritmo certo"}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Conversas projetadas */}
                {(() => {
                  const willHit = t?.target_conversas > 0 && projection.projConversas >= t.target_conversas;
                  const willMiss = t?.target_conversas > 0 && projection.projConversas < t.target_conversas;
                  const currentPct = t?.target_conversas > 0 ? Math.min(100, (m.conversas / t.target_conversas) * 100) : null;
                  const projPct = t?.target_conversas > 0 ? Math.min(120, (projection.projConversas / t.target_conversas) * 100) : null;
                  return (
                    <div className="bg-zinc-800/40 rounded-xl px-3 py-2.5">
                      <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide mb-1">Conversas</p>
                      <p className="text-sm font-bold text-white tabular-nums">{projection.projConversas}</p>
                      {t?.target_conversas > 0 && (
                        <>
                          <div className="relative h-1.5 bg-zinc-700 rounded-full overflow-hidden mt-2">
                            <div className="absolute h-full bg-zinc-600 rounded-full" style={{ width: `${Math.min(100, currentPct)}%` }} />
                            <div className="absolute h-full rounded-full opacity-50" style={{ left: `${Math.min(100, currentPct)}%`, width: `${Math.max(0, projPct - currentPct)}%`, background: willHit ? "#10b981" : "#f59e0b" }} />
                          </div>
                          <p className={`text-[10px] mt-1.5 font-medium ${willHit ? "text-emerald-400" : "text-yellow-400"}`}>
                            {willHit
                              ? `✓ Vai bater a meta`
                              : `↘ Faltam ~${t.target_conversas - projection.projConversas}`}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              <p className="text-[10px] text-zinc-700 mt-2">Baseado na média dos últimos 7 dias · {projection.dayOfMonth}/{projection.totalDays} dias decorridos</p>
            </div>
          )}
          </>
        )}

        {/* Sparkline — últimos 7 dias */}
        {trendDays && trendDays.length >= 2 && (
          <div className="mt-4 pt-4 border-t border-zinc-800/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wide">Últimos 7 dias · Conversas</span>
            </div>
            <MiniSparkline days={trendDays} metric="conversas" color={client.color || "#8B5CF6"} />
          </div>
        )}
      </div>
    </div>
  );
}

function computeProjection(trendDays, currentMetrics) {
  if (!trendDays || trendDays.length < 3 || !currentMetrics) return null;

  const now = new Date();
  const dayOfMonth = now.getDate(); // days elapsed (including today)
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = totalDays - dayOfMonth;
  if (daysRemaining <= 0) return null;

  // Use last 7 days (or all available) to calculate daily average
  const window = trendDays.slice(-7);
  const avgGasto = window.reduce((s, d) => s + (d.gasto || 0), 0) / window.length;
  const avgConversas = window.reduce((s, d) => s + (d.conversas || 0), 0) / window.length;

  const projGasto = currentMetrics.gasto + avgGasto * daysRemaining;
  const projConversas = currentMetrics.conversas + avgConversas * daysRemaining;

  return {
    projGasto: Math.round(projGasto),
    projConversas: Math.round(projConversas),
    daysRemaining,
    avgGasto,
    avgConversas,
    dayOfMonth,
    totalDays,
  };
}

function MiniSparkline({ days, metric = "conversas", color }) {
  const [hovered, setHovered] = useState(null);
  if (!days || days.length < 2) return null;

  const last7 = days.slice(-7);
  const values = last7.map((d) => d[metric] ?? 0);
  const maxVal = Math.max(...values, 0.01);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const W = 200, H = 40, padX = 4, padY = 4;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;
  const toX = (i) => padX + (i / (last7.length - 1)) * chartW;
  const toY = (v) => padY + (1 - (v - minVal) / range) * chartH;
  const pts = values.map((v, i) => [toX(i), toY(v)]);
  const linePath = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`;

  const gradId = `spark-${metric}-${color.replace("#", "")}`;
  const isMonetary = metric === "gasto";
  const fmt = (v) => isMonetary
    ? `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
    : v;

  const hovPt = hovered !== null ? pts[hovered] : null;
  const hovDay = hovered !== null ? last7[hovered] : null;

  return (
    <div className="relative w-full" style={{ height: 40 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full overflow-visible cursor-crosshair"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const svgX = ((e.clientX - rect.left) / rect.width) * W;
          const idx = Math.round(((svgX - padX) / chartW) * (last7.length - 1));
          setHovered(Math.max(0, Math.min(last7.length - 1, idx)));
        }}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {hovPt && (
          <>
            <line x1={hovPt[0]} y1={padY} x2={hovPt[0]} y2={H} stroke={color} strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.5" />
            <circle cx={hovPt[0]} cy={hovPt[1]} r="3" fill={color} />
          </>
        )}
      </svg>
      {hovDay && hovPt && (
        <div
          className="absolute pointer-events-none z-10 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 shadow-lg"
          style={{
            bottom: "calc(100% - " + (hovPt[1] / H * 40) + "px + 8px)",
            left: hovPt[0] / W * 100 + "%",
            transform: hovPt[0] > W * 0.6 ? "translateX(-100%)" : "translateX(-50%)",
            whiteSpace: "nowrap",
          }}
        >
          <p className="text-[10px] text-zinc-400">{hovDay.date ? new Date(hovDay.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}</p>
          <p className="text-xs font-bold text-white tabular-nums">{fmt(hovDay[metric] ?? 0)}</p>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user, authFetch, logout } = useAuth();
  const [tab, setTab] = useState("clientes");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "new" | client object
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [newClientResult, setNewClientResult] = useState(null);
  const [anomalies, setAnomalies] = useState(null); // null = carregando
  const [deleteError, setDeleteError] = useState("");
  // Performance tab
  const [perfData, setPerfData] = useState({});
  const [perfPeriod, setPerfPeriod] = useState("daily");
  const [perfSort, setPerfSort] = useState("gasto");
  // Criativos tab
  const [creativesClientId, setCreativesClientId] = useState(null);
  const [creativesPeriod, setCreativesPeriod] = useState("daily");
  const [creatives, setCreatives] = useState(null);
  const [creativesLoading, setCreativesLoading] = useState(false);
  // Trend sparklines
  const [trendData, setTrendData] = useState({});
  // Alertas tab
  const [alertRules, setAlertRules] = useState([]);
  const [alertForm, setAlertForm] = useState({ clientId: "", metric: "cpl", operator: "gt", threshold: "", severity: "warning" });
  const [alertSaving, setAlertSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  // Relatórios tab
  const [schedules, setSchedules] = useState([]);
  const [schedForm, setSchedForm] = useState({ clientId: "", email: "", period: "weekly", dayOfWeek: "1" });
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedSendingId, setSchedSendingId] = useState(null);
  const [schedMsg, setSchedMsg] = useState(null); // { clientId: { loading, days } }
  // Campanhas tab
  const [campPeriod, setCampPeriod] = useState("daily");
  const [campSort, setCampSort] = useState("gasto");
  const [campData, setCampData] = useState({}); // { clientId: { loading, campaigns, error } }
  const [campFilter, setCampFilter] = useState(""); // text filter

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/config/clients");
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const loadAnomalies = useCallback(async () => {
    setAnomalies(null);
    try {
      const res = await authFetch("/api/anomalies");
      const data = await res.json();
      setAnomalies(Array.isArray(data) ? data : []);
    } catch {
      setAnomalies([]);
    }
  }, [authFetch]);

  useEffect(() => {
    loadClients();
    loadAnomalies();
  }, [loadClients, loadAnomalies]);

  // Auto-select first client for creatives tab
  useEffect(() => {
    if (clients.length > 0 && !creativesClientId) {
      setCreativesClientId(clients[0].id);
    }
  }, [clients]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load performance data when tab is active
  useEffect(() => {
    if (tab !== "performance" || clients.length === 0) return;
    const init = {};
    clients.forEach((c) => { init[c.id] = { loading: true }; });
    setPerfData(init);
    for (const c of clients) {
      authFetch(`/api/insights?client=${c.id}&period=${perfPeriod}`)
        .then((r) => r.json())
        .then((d) => setPerfData((prev) => ({ ...prev, [c.id]: d })))
        .catch(() => setPerfData((prev) => ({ ...prev, [c.id]: { error: true } })));
    }
  }, [tab, perfPeriod, clients.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load trend sparklines when performance tab is active (once per session)
  useEffect(() => {
    if (tab !== "performance" || clients.length === 0) return;
    const missing = clients.filter((c) => !trendData[c.id]);
    if (missing.length === 0) return;
    const init = {};
    missing.forEach((c) => { init[c.id] = { loading: true }; });
    setTrendData((prev) => ({ ...prev, ...init }));
    for (const c of missing) {
      authFetch(`/api/trend?client=${c.id}`)
        .then((r) => r.json())
        .then((d) => setTrendData((prev) => ({ ...prev, [c.id]: { days: d.days || [], loading: false } })))
        .catch(() => setTrendData((prev) => ({ ...prev, [c.id]: { days: [], loading: false } })));
    }
  }, [tab, clients.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load creatives when tab is active
  useEffect(() => {
    if (tab !== "criativos" || !creativesClientId) return;
    setCreativesLoading(true);
    setCreatives(null);
    authFetch(`/api/creatives?client=${creativesClientId}&period=${creativesPeriod}`)
      .then((r) => r.json())
      .then((d) => { setCreatives(d.ads || []); setCreativesLoading(false); })
      .catch(() => { setCreatives([]); setCreativesLoading(false); });
  }, [tab, creativesClientId, creativesPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load campaigns for all clients when tab is active
  useEffect(() => {
    if (tab !== "campanhas" || clients.length === 0) return;
    const init = {};
    clients.forEach((c) => { init[c.id] = { loading: true }; });
    setCampData(init);
    for (const c of clients) {
      authFetch(`/api/campaigns?client=${c.id}&period=${campPeriod}`)
        .then((r) => r.json())
        .then((d) => setCampData((prev) => ({ ...prev, [c.id]: { campaigns: d.campaigns || [], loading: false } })))
        .catch(() => setCampData((prev) => ({ ...prev, [c.id]: { campaigns: [], loading: false, error: true } })));
    }
  }, [tab, campPeriod, clients.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load alert rules
  useEffect(() => {
    if (tab !== "alertas") return;
    authFetch("/api/alert-rules").then((r) => r.json()).then(setAlertRules).catch(() => {});
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load schedules
  useEffect(() => {
    if (tab !== "relatorios") return;
    authFetch("/api/report-schedules").then((r) => r.json()).then(setSchedules).catch(() => {});
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(clientId) {
    setDeleting(true);
    setDeleteError("");
    try {
      await authFetch(`/api/config/clients/${clientId}`, { method: "DELETE" });
      await loadClients();
      setDeleteConfirm(null);
    } catch {
      setDeleteError("Erro ao remover cliente. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  function handleSaved(result) {
    if (result.username) {
      setNewClientResult(result);
    }
    setModal(null);
    loadClients();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-white">Focus Dashboard</span>
              <span className="ml-2 text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full px-2 py-0.5">
                Admin
              </span>
            {anomalies !== null && anomalies.length > 0 && (
              <span className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {anomalies.length}
              </span>
            )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">{user?.name}</span>
            <button
              onClick={logout}
              className="text-zinc-400 hover:text-white text-sm transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: "clientes", label: "Clientes" },
            { id: "performance", label: "Performance" },
            { id: "criativos", label: "Criativos" },
            { id: "campanhas", label: "Campanhas" },
            { id: "alertas", label: "Alertas" },
            { id: "relatorios", label: "Relatórios" },
            { id: "conexoes", label: "Conexões & API" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                tab === t.id
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* New client result banner */}
        {newClientResult && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-400 font-semibold mb-1">Cliente criado com sucesso!</p>
                <p className="text-zinc-300 text-sm">
                  Credenciais de acesso geradas automaticamente:
                </p>
                <div className="mt-2 font-mono text-sm bg-zinc-900 rounded-lg p-3">
                  <div>
                    <span className="text-zinc-500">Usuário: </span>
                    <span className="text-white">{newClientResult.username}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Senha: </span>
                    <span className="text-white">{newClientResult.password}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-zinc-500 text-xs">Anote estas credenciais — a senha não será exibida novamente.</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(`Login: ${newClientResult.username}\nSenha: ${newClientResult.password}`)}
                    className="text-xs text-violet-400 hover:text-violet-300 underline transition shrink-0"
                  >
                    Copiar credenciais
                  </button>
                </div>
              </div>
              <button
                onClick={() => setNewClientResult(null)}
                className="text-zinc-500 hover:text-white ml-4"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* TAB: Clientes */}
        {tab === "clientes" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Visão Geral</h2>
              <button
                onClick={() => setModal("new")}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Adicionar Cliente
              </button>
            </div>

            {/* Painel de alertas */}
            {anomalies === null ? (
              <div className="mb-6 flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
                <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Verificando alertas de campanhas...
              </div>
            ) : anomalies.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Alertas de campanha
                    <span className="text-zinc-600 font-normal">({anomalies.length})</span>
                  </h3>
                  <button
                    onClick={loadAnomalies}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition"
                  >
                    Atualizar
                  </button>
                </div>
                <div className="space-y-2">
                  {anomalies.map((a, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                        a.severity === "critical"
                          ? "bg-red-500/5 border-red-500/20"
                          : "bg-yellow-500/5 border-yellow-500/20"
                      }`}
                    >
                      <span className="text-base shrink-0">{a.severity === "critical" ? "🔴" : "🟡"}</span>
                      <span className="text-xl shrink-0">{a.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{a.name}</p>
                        <p className={`text-xs mt-0.5 ${a.severity === "critical" ? "text-red-400" : "text-yellow-400"}`}>
                          {a.message}
                        </p>
                      </div>
                      <a
                        href={`/dashboard?client=${a.clientId}`}
                        className="text-xs text-zinc-500 hover:text-violet-400 transition shrink-0"
                      >
                        Ver →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-40 animate-pulse" />
                ))}
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center text-zinc-500 py-16">
                Nenhum cliente cadastrado. Clique em "Adicionar Cliente".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                          style={{ backgroundColor: c.color + "20", border: `1px solid ${c.color}40` }}
                        >
                          {c.emoji}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{c.name}</p>
                          <p className="text-xs text-zinc-500 font-mono">{c.id}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-500 font-mono truncate mb-4">
                      {c.accountId}
                    </div>

                    <ClientNoteField clientId={c.id} initialNote={c.notes || ""} />

                    <div className="flex gap-2 mt-3">
                      <a
                        href={`/dashboard?client=${c.id}`}
                        className="flex-1 text-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium rounded-lg py-2 transition"
                      >
                        Ver Dashboard
                      </a>
                      <button
                        onClick={() => setModal(c)}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition"
                        title="Editar"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(c)}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition"
                        title="Excluir"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Performance */}
        {tab === "performance" && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Performance</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Visão consolidada por cliente</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Export all */}
                {clients.some((c) => perfData[c.id]?.hasData) && (
                  <button
                    onClick={() => {
                      clients.forEach((c) => {
                        if (perfData[c.id]?.hasData) {
                          setTimeout(() => openClientReport(c, perfData[c.id], perfPeriod), 0);
                        }
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-violet-600 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar todos
                  </button>
                )}
                <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-0.5">
                  {[
                    { id: "daily", label: "Ontem" },
                    { id: "weekly", label: "Semana" },
                    { id: "monthly", label: "Mês" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPerfPeriod(p.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        perfPeriod === p.id
                          ? "bg-violet-600 text-white shadow"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <select
                  value={perfSort}
                  onChange={(e) => setPerfSort(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500"
                >
                  <option value="gasto">↓ Gasto</option>
                  <option value="conversas">↓ Conversas</option>
                  <option value="cpl">↑ CPL</option>
                  <option value="score">↓ Score</option>
                </select>
              </div>
            </div>

            {clients.length === 0 ? (
              <div className="text-center text-zinc-500 py-16">
                Nenhum cliente cadastrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...clients]
                  .sort((a, b) => {
                    const da = perfData[a.id];
                    const db = perfData[b.id];
                    if (!da?.metrics || !db?.metrics) return 0;
                    if (perfSort === "cpl") {
                      return (da.metrics.cpl || 999) - (db.metrics.cpl || 999);
                    }
                    if (perfSort === "score") {
                      const sa = computeHealthScore(da.metrics, da.targets, da.delta) ?? -1;
                      const sb = computeHealthScore(db.metrics, db.targets, db.delta) ?? -1;
                      return sb - sa;
                    }
                    return (db.metrics[perfSort] || 0) - (da.metrics[perfSort] || 0);
                  })
                  .map((c) => (
                    <ClientPerfCard
                      key={c.id}
                      client={c}
                      data={perfData[c.id]}
                      period={perfPeriod}
                      anomalies={anomalies}
                      onExport={() => openClientReport(c, perfData[c.id], perfPeriod)}
                      trendDays={trendData[c.id]?.days}
                      note={c.notes || ""}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Criativos */}
        {tab === "criativos" && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Criativos</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Top 10 anúncios por conversas</p>
              </div>
              {/* Period selector */}
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-0.5 shrink-0">
                {[
                  { id: "daily", label: "Ontem" },
                  { id: "weekly", label: "Semana" },
                  { id: "monthly", label: "Mês" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setCreativesPeriod(p.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      creativesPeriod === p.id
                        ? "bg-violet-600 text-white shadow"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {clients.length === 0 ? (
              <div className="text-center text-zinc-500 py-16">
                Nenhum cliente cadastrado.
              </div>
            ) : (
              <>
                {/* Client selector */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCreativesClientId(c.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                        creativesClientId === c.id
                          ? "bg-zinc-800 text-white border border-zinc-600 shadow"
                          : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white hover:border-zinc-700"
                      }`}
                      style={creativesClientId === c.id ? { borderLeftColor: c.color, borderLeftWidth: "3px" } : {}}
                    >
                      <span className="text-base leading-none">{c.emoji}</span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>

                {/* Creatives grid */}
                {creativesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl h-64 animate-pulse"
                      />
                    ))}
                  </div>
                ) : !creatives || creatives.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-zinc-500">Nenhum criativo com dados para este período.</p>
                    <p className="text-xs text-zinc-600 mt-2">
                      Verifique se há campanhas ativas neste período.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {creatives.map((ad, i) => (
                      <CreativeCard key={ad.adId || i} ad={ad} rank={i + 1} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB: Campanhas */}
        {tab === "campanhas" && (() => {
          // Flatten all campaigns with client info
          const allLoading = clients.some((c) => campData[c.id]?.loading);
          const rows = [];
          for (const c of clients) {
            const cd = campData[c.id];
            if (!cd || cd.loading || cd.error) continue;
            for (const camp of cd.campaigns || []) {
              rows.push({ ...camp, clientId: c.id, clientName: c.name, clientEmoji: c.emoji, clientColor: c.color });
            }
          }

          // Filter
          const filtered = campFilter
            ? rows.filter((r) =>
                r.name.toLowerCase().includes(campFilter.toLowerCase()) ||
                r.clientName.toLowerCase().includes(campFilter.toLowerCase())
              )
            : rows;

          // Sort
          const sorted = [...filtered].sort((a, b) => {
            if (campSort === "cpl") return (a.cpl || 999) - (b.cpl || 999);
            if (campSort === "conversas") return (b.conversas || 0) - (a.conversas || 0);
            if (campSort === "ctr") return (b.ctr || 0) - (a.ctr || 0);
            return (b.gasto || 0) - (a.gasto || 0);
          });

          // Totals
          const totals = sorted.reduce((acc, r) => ({
            gasto: acc.gasto + (r.gasto || 0),
            conversas: acc.conversas + (r.conversas || 0),
          }), { gasto: 0, conversas: 0 });

          return (
            <div>
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Campanhas</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Todas as campanhas de todos os clientes</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Search */}
                  <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Filtrar campanha..."
                      value={campFilter}
                      onChange={(e) => setCampFilter(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 text-zinc-300 placeholder-zinc-600 text-xs rounded-xl pl-8 pr-3 py-2 w-44 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  {/* Sort */}
                  <select
                    value={campSort}
                    onChange={(e) => setCampSort(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-violet-500"
                  >
                    <option value="gasto">↓ Gasto</option>
                    <option value="conversas">↓ Conversas</option>
                    <option value="cpl">↑ CPL</option>
                    <option value="ctr">↓ CTR</option>
                  </select>
                  {/* Period */}
                  <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-0.5">
                    {[
                      { id: "daily", label: "Ontem" },
                      { id: "weekly", label: "Semana" },
                      { id: "monthly", label: "Mês" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setCampPeriod(p.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                          campPeriod === p.id
                            ? "bg-violet-600 text-white shadow"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary strip */}
              {!allLoading && sorted.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Campanhas", value: sorted.length },
                    { label: "Investimento total", value: `R$ ${totals.gasto.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` },
                    { label: "Total conversas", value: totals.conversas },
                  ].map((s) => (
                    <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                      <p className="text-xl font-bold text-white tabular-nums">{s.value}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 uppercase tracking-wide font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Table */}
              {allLoading ? (
                <div className="space-y-2">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                  {campFilter ? "Nenhuma campanha encontrada para este filtro." : "Sem dados para o período selecionado."}
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-zinc-800 text-[11px] text-zinc-500 uppercase tracking-wide font-semibold">
                    <span>Campanha</span>
                    <span className="text-right w-24">Gasto</span>
                    <span className="text-right w-20">Conversas</span>
                    <span className="text-right w-20">CPL</span>
                    <span className="text-right w-16">CTR</span>
                    <span className="text-right w-20">CPM</span>
                  </div>
                  {/* Rows */}
                  <div className="divide-y divide-zinc-800/60">
                    {sorted.map((row, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 hover:bg-zinc-800/30 transition items-center"
                      >
                        {/* Campaign name + client */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: row.clientColor }}
                            />
                            <span className="text-[11px] text-zinc-500 font-medium shrink-0">{row.clientEmoji} {row.clientName}</span>
                          </div>
                          <p className="text-sm font-medium text-white truncate" title={row.name}>{row.name}</p>
                        </div>
                        {/* Metrics */}
                        <span className="text-sm font-semibold text-white tabular-nums text-right w-24">
                          R$ {(row.gasto || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-sm font-semibold text-white tabular-nums text-right w-20">
                          {row.conversas ?? 0}
                        </span>
                        <span className={`text-sm font-semibold tabular-nums text-right w-20 ${row.conversas > 0 ? "text-white" : "text-zinc-600"}`}>
                          {row.conversas > 0 ? `R$ ${(row.cpl || 0).toFixed(0)}` : "—"}
                        </span>
                        <span className="text-sm font-semibold text-white tabular-nums text-right w-16">
                          {(row.ctr || 0).toFixed(1)}%
                        </span>
                        <span className="text-sm font-semibold text-white tabular-nums text-right w-20">
                          R$ {(row.cpm || 0).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB: Alertas */}
        {tab === "alertas" && (() => {
          const METRICS = [
            { value: "cpl",              label: "CPL (R$)",             unit: "R$" },
            { value: "conversas",        label: "Conversas (qtd)",      unit: "" },
            { value: "gasto",            label: "Investimento diário (R$)", unit: "R$" },
            { value: "ctr",              label: "CTR (%)",               unit: "%" },
            { value: "cpm",              label: "CPM (R$)",              unit: "R$" },
            { value: "conversas_delta",  label: "Queda de conversas (%)", unit: "%" },
          ];
          const OPERATORS = [
            { value: "gt", label: "maior que (>)" },
            { value: "lt", label: "menor que (<)" },
          ];
          const SEVERITIES = [
            { value: "warning",  label: "Aviso", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25" },
            { value: "critical", label: "Crítico", color: "text-red-400 bg-red-500/10 border-red-500/25" },
          ];
          const metricUnit = (m) => METRICS.find((x) => x.value === m)?.unit || "";
          const metricLabel = (m) => METRICS.find((x) => x.value === m)?.label || m;
          const opLabel = (o) => o === "gt" ? ">" : "<";
          const sevStyle = (s) => SEVERITIES.find((x) => x.value === s)?.color || "";
          const sevLabel = (s) => SEVERITIES.find((x) => x.value === s)?.label || s;

          async function handleAdd(e) {
            e.preventDefault();
            if (!alertForm.clientId || !alertForm.threshold) return;
            setAlertSaving(true);
            try {
              const r = await authFetch("/api/alert-rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  clientId: alertForm.clientId,
                  metric: alertForm.metric,
                  operator: alertForm.operator,
                  threshold: Number(alertForm.threshold),
                  severity: alertForm.severity,
                }),
              });
              if (!r.ok) throw new Error();
              const updated = await authFetch("/api/alert-rules").then((r) => r.json());
              setAlertRules(updated);
              setAlertForm((f) => ({ ...f, threshold: "" }));
              setAlertMsg({ type: "success", text: "Regra criada com sucesso." });
            } catch {
              setAlertMsg({ type: "error", text: "Erro ao criar regra." });
            } finally {
              setAlertSaving(false);
              setTimeout(() => setAlertMsg(null), 3000);
            }
          }

          async function handleToggle(id, active) {
            await authFetch(`/api/alert-rules/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ active: !active }),
            });
            setAlertRules((prev) => prev.map((r) => r.id === id ? { ...r, active: r.active ? 0 : 1 } : r));
          }

          async function handleDelete(id) {
            await authFetch(`/api/alert-rules/${id}`, { method: "DELETE" });
            setAlertRules((prev) => prev.filter((r) => r.id !== id));
          }

          // Group by client
          const grouped = {};
          for (const rule of alertRules) {
            if (!grouped[rule.client_id]) grouped[rule.client_id] = [];
            grouped[rule.client_id].push(rule);
          }

          return (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Alertas configuráveis</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Regras personalizadas avaliadas diariamente</p>
                </div>
              </div>

              {alertMsg && (
                <div className={`mb-5 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
                  alertMsg.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    : "bg-red-500/10 border-red-500/25 text-red-400"
                }`}>
                  {alertMsg.type === "success"
                    ? <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  }
                  {alertMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Form — 2 cols */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Nova regra</h3>
                  <form onSubmit={handleAdd} className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Cliente</label>
                      <select
                        value={alertForm.clientId}
                        onChange={(e) => setAlertForm((f) => ({ ...f, clientId: e.target.value }))}
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
                      >
                        <option value="">Selecionar cliente...</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Métrica</label>
                      <select
                        value={alertForm.metric}
                        onChange={(e) => setAlertForm((f) => ({ ...f, metric: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
                      >
                        {METRICS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Condição</label>
                        <select
                          value={alertForm.operator}
                          onChange={(e) => setAlertForm((f) => ({ ...f, operator: e.target.value }))}
                          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
                        >
                          {OPERATORS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 font-medium mb-1.5 block">
                          Valor {metricUnit(alertForm.metric) && <span className="text-zinc-600">({metricUnit(alertForm.metric)})</span>}
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="ex: 80"
                          value={alertForm.threshold}
                          onChange={(e) => setAlertForm((f) => ({ ...f, threshold: e.target.value }))}
                          required
                          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Severidade</label>
                      <div className="flex gap-2">
                        {SEVERITIES.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setAlertForm((f) => ({ ...f, severity: s.value }))}
                            className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                              alertForm.severity === s.value
                                ? s.color
                                : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preview */}
                    {alertForm.clientId && alertForm.threshold && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/60 rounded-xl border border-zinc-700/40">
                        <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-zinc-400">
                          Alertar quando <span className="text-white font-medium">{metricLabel(alertForm.metric)}</span>{" "}
                          <span className="text-violet-400 font-medium">{opLabel(alertForm.operator)} {alertForm.threshold}{metricUnit(alertForm.metric)}</span>
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={alertSaving}
                      className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition mt-1"
                    >
                      {alertSaving ? "Salvando..." : "Criar regra"}
                    </button>
                  </form>
                </div>

                {/* Rules list — 3 cols */}
                <div className="lg:col-span-3">
                  <h3 className="text-sm font-semibold text-white mb-4">
                    Regras ativas
                    {alertRules.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-zinc-500">({alertRules.length})</span>
                    )}
                  </h3>

                  {alertRules.length === 0 ? (
                    <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-10 text-center">
                      <svg className="w-8 h-8 text-zinc-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                      </svg>
                      <p className="text-zinc-500 text-sm">Nenhuma regra configurada.</p>
                      <p className="text-xs text-zinc-600 mt-1">Crie uma regra para receber alertas personalizados.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(grouped).map(([clientId, rules]) => {
                        const c = clients.find((x) => x.id === clientId);
                        return (
                          <div key={clientId} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            {/* Client header */}
                            <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-800/60 bg-zinc-800/30">
                              {c && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />}
                              <span className="text-sm font-semibold text-white">{c ? `${c.emoji} ${c.name}` : clientId}</span>
                              <span className="text-xs text-zinc-600">{rules.length} {rules.length === 1 ? "regra" : "regras"}</span>
                            </div>
                            {/* Rules */}
                            <div className="divide-y divide-zinc-800/50">
                              {rules.map((rule) => (
                                <div key={rule.id} className={`flex items-center gap-3 px-4 py-3 transition ${!rule.active ? "opacity-50" : ""}`}>
                                  {/* Severity badge */}
                                  <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${sevStyle(rule.severity)}`}>
                                    {sevLabel(rule.severity)}
                                  </span>
                                  {/* Rule description */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white">
                                      <span className="text-zinc-400">{metricLabel(rule.metric)}</span>
                                      {" "}<span className="font-bold text-violet-400">{opLabel(rule.operator)}</span>{" "}
                                      <span className="font-semibold tabular-nums">
                                        {["cpl","gasto","cpm"].includes(rule.metric) ? `R$ ${rule.threshold}` : `${rule.threshold}${metricUnit(rule.metric)}`}
                                      </span>
                                    </p>
                                  </div>
                                  {/* Actions */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => handleToggle(rule.id, rule.active)}
                                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition"
                                      title={rule.active ? "Pausar" : "Ativar"}
                                    >
                                      {rule.active
                                        ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" /></svg>
                                        : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                                      }
                                    </button>
                                    <button
                                      onClick={() => handleDelete(rule.id)}
                                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition"
                                      title="Excluir"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB: Relatórios */}
        {tab === "relatorios" && (() => {
          const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
          const PERIODS = { daily: "Diário", weekly: "Semanal", monthly: "Mensal" };

          async function handleAddSchedule(e) {
            e.preventDefault();
            if (!schedForm.clientId || !schedForm.email) return;
            setSchedSaving(true);
            try {
              const r = await authFetch("/api/report-schedules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  clientId: schedForm.clientId,
                  email: schedForm.email,
                  period: schedForm.period,
                  dayOfWeek: Number(schedForm.dayOfWeek),
                }),
              });
              if (!r.ok) throw new Error();
              const updated = await authFetch("/api/report-schedules").then((r) => r.json());
              setSchedules(updated);
              setSchedForm((f) => ({ ...f, email: "" }));
              setSchedMsg({ type: "success", text: "Agendamento criado com sucesso." });
            } catch {
              setSchedMsg({ type: "error", text: "Erro ao criar agendamento." });
            } finally {
              setSchedSaving(false);
              setTimeout(() => setSchedMsg(null), 3000);
            }
          }

          async function handleToggle(id, active) {
            await authFetch(`/api/report-schedules/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ active: !active }),
            });
            setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, active: s.active ? 0 : 1 } : s));
          }

          async function handleDelete(id) {
            await authFetch(`/api/report-schedules/${id}`, { method: "DELETE" });
            setSchedules((prev) => prev.filter((s) => s.id !== id));
          }

          async function handleSendNow(id) {
            setSchedSendingId(id);
            try {
              const r = await authFetch(`/api/report-schedules/${id}/send-now`, { method: "POST" });
              const data = await r.json();
              if (!r.ok) throw new Error(data.error || "Erro");
              setSchedMsg({ type: "success", text: "Email enviado com sucesso!" });
            } catch (err) {
              setSchedMsg({ type: "error", text: err.message });
            } finally {
              setSchedSendingId(null);
              setTimeout(() => setSchedMsg(null), 4000);
            }
          }

          return (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Relatórios automáticos</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Envio de email agendado por cliente</p>
                </div>
              </div>

              {/* Feedback message */}
              {schedMsg && (
                <div className={`mb-5 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
                  schedMsg.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    : "bg-red-500/10 border-red-500/25 text-red-400"
                }`}>
                  {schedMsg.type === "success"
                    ? <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  }
                  {schedMsg.text}
                </div>
              )}

              {/* Resend key warning */}
              <div className="mb-6 flex items-start gap-3 px-4 py-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl">
                <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-amber-400">Configure antes de usar</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">
                    Adicione <code className="bg-amber-500/20 px-1 rounded">RESEND_API_KEY</code> e <code className="bg-amber-500/20 px-1 rounded">REPORT_FROM_EMAIL</code> no seu <code className="bg-amber-500/20 px-1 rounded">.env</code>. Crie sua chave em{" "}
                    <span className="underline">resend.com</span>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Novo agendamento</h3>
                  <form onSubmit={handleAddSchedule} className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Cliente</label>
                      <select
                        value={schedForm.clientId}
                        onChange={(e) => setSchedForm((f) => ({ ...f, clientId: e.target.value }))}
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
                      >
                        <option value="">Selecionar cliente...</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Email do destinatário</label>
                      <input
                        type="email"
                        placeholder="cliente@empresa.com"
                        value={schedForm.email}
                        onChange={(e) => setSchedForm((f) => ({ ...f, email: e.target.value }))}
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Período</label>
                        <select
                          value={schedForm.period}
                          onChange={(e) => setSchedForm((f) => ({ ...f, period: e.target.value }))}
                          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
                        >
                          <option value="daily">Diário (ontem)</option>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensal</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Dia de envio</label>
                        <select
                          value={schedForm.dayOfWeek}
                          onChange={(e) => setSchedForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
                          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
                        >
                          {DOW.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={schedSaving}
                      className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition mt-1"
                    >
                      {schedSaving ? "Salvando..." : "Criar agendamento"}
                    </button>
                  </form>
                </div>

                {/* Schedules list */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Agendamentos ativos</h3>
                  {schedules.length === 0 ? (
                    <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-8 text-center">
                      <p className="text-zinc-500 text-sm">Nenhum agendamento configurado.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {schedules.map((s) => {
                        const c = clients.find((c) => c.id === s.client_id);
                        return (
                          <div key={s.id} className={`bg-zinc-900 border rounded-xl px-4 py-3.5 transition ${s.active ? "border-zinc-800" : "border-zinc-800/50 opacity-60"}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {c && (
                                    <span
                                      className="w-2 h-2 rounded-full shrink-0"
                                      style={{ backgroundColor: c.color }}
                                    />
                                  )}
                                  <span className="text-sm font-semibold text-white">{c ? `${c.emoji} ${c.name}` : s.client_id}</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${s.active ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-700 text-zinc-500"}`}>
                                    {s.active ? "Ativo" : "Pausado"}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-400 truncate">{s.email}</p>
                                <p className="text-xs text-zinc-600 mt-0.5">
                                  {PERIODS[s.period] || s.period} · toda {DOW[s.day_of_week]}
                                  {s.last_sent_at && ` · Último envio: ${new Date(s.last_sent_at).toLocaleDateString("pt-BR")}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleSendNow(s.id)}
                                  disabled={schedSendingId === s.id}
                                  className="p-1.5 bg-zinc-800 hover:bg-violet-600 rounded-lg text-zinc-400 hover:text-white transition"
                                  title="Enviar agora"
                                >
                                  {schedSendingId === s.id
                                    ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                    : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                  }
                                </button>
                                <button
                                  onClick={() => handleToggle(s.id, s.active)}
                                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition"
                                  title={s.active ? "Pausar" : "Ativar"}
                                >
                                  {s.active
                                    ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" /></svg>
                                    : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                                  }
                                </button>
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition"
                                  title="Excluir"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB: Conexões */}
        {tab === "conexoes" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Conexões & API</h2>
              <button
                onClick={() => setModal("new")}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nova Conexão
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-zinc-500">Carregando...</div>
              ) : clients.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">Nenhuma conexão configurada.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-xs text-zinc-500 font-medium px-6 py-3">Cliente</th>
                      <th className="text-left text-xs text-zinc-500 font-medium px-6 py-3">Account ID</th>
                      <th className="text-left text-xs text-zinc-500 font-medium px-6 py-3">Token</th>
                      <th className="text-right text-xs text-zinc-500 font-medium px-6 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c, i) => (
                      <tr
                        key={c.id}
                        className={`${i < clients.length - 1 ? "border-b border-zinc-800" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{c.emoji}</span>
                            <div>
                              <p className="text-sm font-medium text-white">{c.name}</p>
                              <p className="text-xs text-zinc-500 font-mono">{c.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-zinc-400">{c.accountId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-zinc-500">
                            {c.token ? `${c.token.slice(0, 12)}...${c.token.slice(-6)}` : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setModal(c)}
                              className="text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(c)}
                              className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Users info */}
            <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Credenciais de Acesso</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {clients.map((c) => {
                  const username = c.id.replace(/-/g, "");
                  return (
                    <div key={c.id} className="bg-zinc-800 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span>{c.emoji}</span>
                        <span className="text-sm font-medium text-white">{c.name}</span>
                      </div>
                      <div className="font-mono text-xs text-zinc-400 space-y-0.5">
                        <div><span className="text-zinc-600">login: </span>{username}</div>
                        <div className="text-zinc-600 italic">Senha definida no primeiro acesso</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-zinc-600 mt-3">
                * Para alterar senhas, edite config/users.json diretamente no servidor.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <ClientModal
          client={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-2">Remover cliente?</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Tem certeza que deseja remover <strong className="text-white">{deleteConfirm.name}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            {deleteError && <p className="text-red-400 text-xs mb-4">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteConfirm(null); setDeleteError(""); }}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl py-2.5 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition"
              >
                {deleting ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
