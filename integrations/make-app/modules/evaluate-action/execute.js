"use strict";

const { TruslayUniversalClient } = require("@truslay/sdk");

/**
 * Make custom-app module logic for "Evaluate Action".
 *
 * Receives the mapped parameters from the visual editor and returns a flat
 * object so later modules can reference `verdict`, `reason`, `latency` and
 * `audit_id` without touching the raw SDK response.
 *
 * @param {object} params
 * @param {string} params.intent
 * @param {string} [params.shield_id]
 * @param {string} [params.target_url]
 * @returns {Promise<{verdict: string, reason: string, latency: number|null, audit_id: string|null}>}
 */
async function executeAction(params) {
  const { intent, shield_id: shieldId, target_url: targetUrl } = params || {};

  if (!intent) {
    throw new Error("Truslay: the `intent` parameter is required");
  }

  // v2.1.0 signature: config first, operatorType as the SECOND POSITIONAL ARGUMENT.
  const truslay = new TruslayUniversalClient(
    { mode: "collaboration", firewallMode: "sandbox" },
    "agent",
  );

  const action = {
    intent,
    ...(targetUrl ? { target: targetUrl } : { target: "make_scenario" }),
  };

  const decision = await truslay.evaluateAction(
    action,
    shieldId ? { shieldId } : undefined,
  );

  // Anything other than ALLOW is blocked: the SDK has no approval channel, so
  // REVIEW must not let the rest of the scenario run.
  return {
    verdict: decision.verdict,
    reason:
      decision.reason ?? (decision.verdict === "ALLOW" ? "allowed" : "blocked"),
    latency: decision.latencyMs ?? null,
    audit_id: decision.auditId ?? null,
  };
}

module.exports = executeAction;
