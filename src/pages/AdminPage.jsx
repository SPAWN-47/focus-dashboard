import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";


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

function CreativeCard({ ad, rank }) {
  const medals = ["🥇", "🥈", "🥉"];
  const medal = rank <= 3 ? medals[rank - 1] : null;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition">
      <div className="aspect-video bg-zinc-800 relative overflow-hidden">
        {ad.thumbnail ? (
          <img
            src={ad.thumbnail}
            alt={ad.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}
        {medal && (
          <div className="absolute top-2 left-2 text-xl leading-none drop-shadow">
            {medal}
          </div>
        )}
        {!medal && (
          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-zinc-700/80 flex items-center justify-center text-[10px] text-zinc-300 font-bold">
            {rank}
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-white mb-1 truncate" title={ad.creativeTitle || ad.name}>
          {ad.creativeTitle || ad.name}
        </p>
        {ad.creativeTitle && (
          <p className="text-xs text-zinc-600 mb-2 truncate">{ad.name}</p>
        )}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "Gasto", value: `R$ ${(ad.gasto || 0).toFixed(0)}` },
            { label: "Conversas", value: ad.conversas ?? 0 },
            { label: "CPL", value: ad.conversas > 0 ? `R$ ${(ad.cpl || 0).toFixed(0)}` : "—" },
          ].map((m) => (
            <div key={m.label} className="text-center bg-zinc-800 rounded-xl py-3">
              <p className="text-base font-bold text-white tabular-nums">{m.value}</p>
              <p className="text-xs text-zinc-400 mt-1 font-medium">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-zinc-400 mt-3 font-medium">
          <span>CTR {(ad.ctr || 0).toFixed(1)}%</span>
          <span>CPM R$ {(ad.cpm || 0).toFixed(0)}</span>
          <span>{(ad.impressoes || 0).toLocaleString("pt-BR")} imp.</span>
        </div>
      </div>
    </div>
  );
}

function ClientPerfCard({ client, data, period, anomalies }) {
  const clientAnomalies = (anomalies || []).filter((a) => a.clientId === client.id);
  const hasCritical = clientAnomalies.some((a) => a.severity === "critical");
  const hasWarning = clientAnomalies.some((a) => a.severity === "warning");
  const m = data?.metrics;
  const t = data?.targets;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: client.color + "20", border: `1px solid ${client.color}40` }}
          >
            {client.emoji}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{client.name}</p>
            <p className="text-xs text-zinc-500 font-mono">{client.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasCritical && <span className="w-2 h-2 rounded-full bg-red-500" title="Alerta crítico" />}
          {!hasCritical && hasWarning && <span className="w-2 h-2 rounded-full bg-yellow-500" title="Alerta" />}
          <a
            href={`/dashboard?client=${client.id}`}
            className="text-xs text-zinc-500 hover:text-violet-400 transition"
          >
            Ver →
          </a>
        </div>
      </div>

      {data?.loading ? (
        <div className="space-y-2 py-2">
          <div className="h-2.5 bg-zinc-800 rounded animate-pulse w-3/4" />
          <div className="h-2.5 bg-zinc-800 rounded animate-pulse w-1/2" />
          <div className="h-2.5 bg-zinc-800 rounded animate-pulse w-2/3" />
        </div>
      ) : !data || data.error || !data.hasData ? (
        <p className="text-xs text-zinc-600 py-4 text-center italic">
          {data?.error ? "Erro ao buscar dados" : "Sem dados para o período"}
        </p>
      ) : (
        <>
          {clientAnomalies.length > 0 && (
            <div
              className={`mb-3 px-3 py-1.5 rounded-lg text-xs truncate ${
                hasCritical
                  ? "bg-red-500/10 text-red-400"
                  : "bg-yellow-500/10 text-yellow-400"
              }`}
              title={clientAnomalies[0].message}
            >
              {clientAnomalies[0].message}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              {
                label: "Investimento",
                value: `R$ ${(m.gasto || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
                alert: t?.target_spend > 0 && m.gasto > t.target_spend,
              },
              {
                label: "Conversas",
                value: m.conversas ?? 0,
                alert: t?.target_conversas > 0 && m.conversas < t.target_conversas * 0.5,
              },
              {
                label: "CPL",
                value: m.cpl > 0 ? `R$ ${m.cpl.toFixed(2)}` : "—",
                alert: t?.target_cpl_max > 0 && m.cpl > t.target_cpl_max,
              },
              {
                label: "CTR",
                value: `${(m.ctr || 0).toFixed(2)}%`,
              },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-zinc-800/70 rounded-xl px-3 py-3 text-center">
                <p
                  className={`text-lg font-bold tabular-nums leading-tight ${
                    kpi.alert ? "text-red-400" : "text-white"
                  }`}
                >
                  {kpi.value}
                </p>
                <p className="text-xs text-zinc-400 mt-1 font-medium">{kpi.label}</p>
              </div>
            ))}
          </div>
          {period === "monthly" && (t?.target_spend > 0 || t?.target_conversas > 0) && (
            <div className="space-y-2.5">
              {t?.target_spend > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1.5 font-medium">
                    <span>Budget mensal</span>
                    <span>{Math.round((m.gasto / t.target_spend) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (m.gasto / t.target_spend) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {t?.target_conversas > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1.5 font-medium">
                    <span>Meta conversas</span>
                    <span>
                      {m.conversas} / {t.target_conversas}
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (m.conversas / t.target_conversas) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
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

                    <div className="flex gap-2">
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
              <h2 className="text-xl font-bold">Performance</h2>
              <div className="flex items-center gap-2">
                <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
                  {[
                    { id: "daily", label: "Ontem" },
                    { id: "weekly", label: "Semana" },
                    { id: "monthly", label: "Mês" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPerfPeriod(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        perfPeriod === p.id
                          ? "bg-zinc-800 text-zinc-200"
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
                    return (db.metrics[perfSort] || 0) - (da.metrics[perfSort] || 0);
                  })
                  .map((c) => (
                    <ClientPerfCard
                      key={c.id}
                      client={c}
                      data={perfData[c.id]}
                      period={perfPeriod}
                      anomalies={anomalies}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: Criativos */}
        {tab === "criativos" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Criativos</h2>
              <p className="text-xs text-zinc-500">Top 10 anúncios por conversas</p>
            </div>

            {clients.length === 0 ? (
              <div className="text-center text-zinc-500 py-16">
                Nenhum cliente cadastrado.
              </div>
            ) : (
              <>
                {/* Selectors */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <div className="flex flex-wrap gap-2 flex-1">
                    {clients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCreativesClientId(c.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                          creativesClientId === c.id
                            ? "bg-violet-600 text-white"
                            : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                        }`}
                      >
                        <span>{c.emoji}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1 shrink-0">
                    {[
                      { id: "daily", label: "Ontem" },
                      { id: "weekly", label: "Semana" },
                      { id: "monthly", label: "Mês" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setCreativesPeriod(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          creativesPeriod === p.id
                            ? "bg-zinc-800 text-zinc-200"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
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
