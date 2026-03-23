/**
 * lib/meta.js — Shared Meta API helpers
 *
 * Single source of truth for constants and logic used by both
 * server.js (production) and vite-api-plugin.js (dev).
 */

export const META_BASE = "https://graph.facebook.com/v21.0";

export const DATE_PRESETS = {
  daily: "yesterday",
  weekly: "last_week_mon_sun",
  monthly: "last_month",
};

export function extractConversions(actions = []) {
  const types = [
    "onsite_conversion.messaging_conversation_started_7d",
    "onsite_conversion.messaging_first_reply",
    "lead",
    "contact",
  ];
  for (const tipo of types) {
    const action = actions.find((a) => a.action_type === tipo);
    if (action && parseInt(action.value) > 0) {
      return { value: parseInt(action.value), type: tipo };
    }
  }
  const total = actions.reduce((sum, a) => {
    if (
      a.action_type.includes("message") ||
      a.action_type.includes("lead") ||
      a.action_type.includes("contact")
    ) {
      return sum + parseInt(a.value || 0);
    }
    return sum;
  }, 0);
  return { value: total, type: total > 0 ? "aggregate" : null };
}

/**
 * Computes all derived metrics from a raw Meta API insights row.
 */
export function computeMetrics(raw) {
  const gasto = parseFloat(raw.spend || 0);
  const impressoes = parseInt(raw.impressions || 0);
  const cliques = parseInt(raw.clicks || 0);
  const alcance = parseInt(raw.reach || 0);
  const { value: conversas, type: convType } = extractConversions(raw.actions || []);
  const cpl = conversas > 0 ? gasto / conversas : 0;
  const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
  const cpc = cliques > 0 ? gasto / cliques : 0;
  const cpm = impressoes > 0 ? (gasto / impressoes) * 1000 : 0;
  const frequencia = alcance > 0 ? impressoes / alcance : 0;
  return { gasto, impressoes, cliques, alcance, conversas, convType, cpl, ctr, cpc, cpm, frequencia };
}
