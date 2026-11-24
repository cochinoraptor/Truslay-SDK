const { TruslayUniversalClient } = require("@truslay/sdk");

module.exports = {
  name: "Evaluate Agent Action",
  description: "Run the Truslay decision engine against an agent intent.",

  // Make passes credentials in `config` and the blueprint data in `data`
  execute: async (options, data, config) => {
    // 1. Strict v2.1.0 initialization: config first, 'agent' as the second argument
    const client = new TruslayUniversalClient(
      { mode: "collaboration", apiKey: config.apiKey },
      "agent"
    );

    // 2. Build the action
    const action = {
      intent: data.intent,
      target: data.target || "make_workflow"
    };

    // 3. Options (shieldId goes in the second argument)
    const evalOptions = {
      shieldId: data.shield_id || undefined
    };

    // 4. Run the evaluation
    const decision = await client.evaluateAction(action, evalOptions);

    // 5. Return the verdict mapped for downstream Make modules
    return {
      verdict: decision.verdict,
      reason: decision.reason,
      latencyMs: decision.latencyMs,
      auditId: decision.auditId,
      status: decision.verdict === "ALLOW" ? "\u2705 Authorized" : "\u{1F6D1} Blocked"
    };
  }
};
