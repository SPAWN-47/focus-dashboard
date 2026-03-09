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
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">
              {isEdit ? "Editar Cliente" : "Novo Cliente"}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {!isEdit && (
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">ID (slug único)</label>
                <input
                  value={form.id}
                  onChange={(e) => set("id", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="ex: minha-empresa"
                  className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Nome</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Nome do cliente"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Emoji</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => set("emoji", e)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition ${
                        form.emoji === e
                          ? "bg-violet-600 ring-2 ring-violet-400"
                          : "bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Cor</label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => set("color", c)}
                      style={{ backgroundColor: c }}
                      className={`w-9 h-9 rounded-lg transition ${
                        form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Account ID (Meta)</label>
              <input
                value={form.accountId}
                onChange={(e) => set("accountId", e.target.value)}
                placeholder="act_123456789"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Access Token (Meta)</label>
              <textarea
                value={form.token}
                onChange={(e) => set("token", e.target.value)}
                placeholder="EAABx..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 font-mono resize-none"
              />
            </div>

            {/* Test Connection */}
            <button
              onClick={testConnection}
              disabled={testing || !form.token || !form.accountId}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 border border-gray-700 text-gray-200 rounded-xl py-2.5 text-sm transition"
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
                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl py-2.5 text-sm transition"
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

  async function handleDelete(clientId) {
    setDeleting(true);
    try {
      await authFetch(`/api/config/clients/${clientId}`, { method: "DELETE" });
      await loadClients();
      setDeleteConfirm(null);
    } catch {
      // silence
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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50">
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
            <span className="text-sm text-gray-400">{user?.name}</span>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white text-sm transition"
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
            { id: "conexoes", label: "Conexões & API" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                tab === t.id
                  ? "bg-violet-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
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
                <p className="text-gray-300 text-sm">
                  Credenciais de acesso geradas automaticamente:
                </p>
                <div className="mt-2 font-mono text-sm bg-gray-900 rounded-lg p-3">
                  <div>
                    <span className="text-gray-500">Usuário: </span>
                    <span className="text-white">{newClientResult.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Senha: </span>
                    <span className="text-white">{newClientResult.password}</span>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">Anote estas credenciais — a senha não será exibida novamente.</p>
              </div>
              <button
                onClick={() => setNewClientResult(null)}
                className="text-gray-500 hover:text-white ml-4"
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
              <div className="mb-6 flex items-center gap-2 text-xs text-gray-500 bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3">
                <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Verificando alertas de campanhas...
              </div>
            ) : anomalies.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Alertas de campanha
                    <span className="text-gray-600 font-normal">({anomalies.length})</span>
                  </h3>
                  <button
                    onClick={loadAnomalies}
                    className="text-xs text-gray-500 hover:text-gray-300 transition"
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
                        className="text-xs text-gray-500 hover:text-violet-400 transition shrink-0"
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
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl h-40 animate-pulse" />
                ))}
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                Nenhum cliente cadastrado. Clique em "Adicionar Cliente".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition group"
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
                          <p className="text-xs text-gray-500 font-mono">{c.id}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 font-mono truncate mb-4">
                      {c.accountId}
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`/dashboard?client=${c.id}`}
                        className="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium rounded-lg py-2 transition"
                      >
                        Ver Dashboard
                      </a>
                      <button
                        onClick={() => setModal(c)}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition"
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

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Carregando...</div>
              ) : clients.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhuma conexão configurada.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left text-xs text-gray-500 font-medium px-6 py-3">Cliente</th>
                      <th className="text-left text-xs text-gray-500 font-medium px-6 py-3">Account ID</th>
                      <th className="text-left text-xs text-gray-500 font-medium px-6 py-3">Token</th>
                      <th className="text-right text-xs text-gray-500 font-medium px-6 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c, i) => (
                      <tr
                        key={c.id}
                        className={`${i < clients.length - 1 ? "border-b border-gray-800" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{c.emoji}</span>
                            <div>
                              <p className="text-sm font-medium text-white">{c.name}</p>
                              <p className="text-xs text-gray-500 font-mono">{c.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-gray-400">{c.accountId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-gray-500">
                            {c.token ? `${c.token.slice(0, 12)}...${c.token.slice(-6)}` : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setModal(c)}
                              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
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
            <div className="mt-6 bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Credenciais de Acesso</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {clients.map((c) => {
                  const username = c.id.replace(/-/g, "");
                  return (
                    <div key={c.id} className="bg-gray-800 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span>{c.emoji}</span>
                        <span className="text-sm font-medium text-white">{c.name}</span>
                      </div>
                      <div className="font-mono text-xs text-gray-400 space-y-0.5">
                        <div><span className="text-gray-600">login: </span>{username}</div>
                        <div><span className="text-gray-600">senha: </span>{username}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600 mt-3">
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
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-2">Remover cliente?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Tem certeza que deseja remover <strong className="text-white">{deleteConfirm.name}</strong>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl py-2.5 text-sm"
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
