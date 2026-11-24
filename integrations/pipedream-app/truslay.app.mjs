import { TruslayUniversalClient } from "@truslay/sdk";

// Pipedream app file. The slug below ("truslay") is the app key registered with
// Pipedream: it is what makes Truslay appear as its own app, with its own logo,
// in the workflow builder's app selector.
export default {
  type: "app",
  app: "truslay",
  propDefinitions: {
    intent: {
      type: "string",
      label: "Intent",
      description: "Action the workflow is about to perform",
      options: [
        "webhook_incoming",
        "scraping_request",
        "database_write",
        "checkout",
        "agent_navigation",
      ],
    },
    target_url: {
      type: "string",
      label: "Target URL",
      description:
        "URL the action touches. Defaults to `pipedream_workflow` when empty.",
      optional: true,
    },
    shield_id: {
      type: "string",
      label: "Shield ID",
      description:
        "Shield that evaluates this action. Optional: the account's default shield is used when empty.",
      optional: true,
    },
  },
  methods: {
    // v2.1.0 signature: config first, operatorType as the SECOND POSITIONAL ARGUMENT.
    // `firewallMode` is not set here on purpose: v2.1.0 resolves it as
    // `config.firewallMode ?? 'sandbox'`, so the firewall mode stays a deploy-time
    // decision and never a user-editable workflow prop.
    _client() {
      const apiKey = this.$auth?.api_key;

      return new TruslayUniversalClient(
        {
          mode: "collaboration",
          ...(apiKey
            ? {
              apiKey,
            }
            : {}),
        },
        "agent",
      );
    },
    evaluateAction({
      intent, target_url: targetUrl, shieldId,
    }) {
      const truslay = this._client();

      // v2.1.0 reads `options.shieldId ?? client.shieldId`, so an empty value
      // falls back to the account's default shield instead of breaking.
      return truslay.evaluateAction(
        {
          intent,
          target: targetUrl || "pipedream_workflow",
        },
        {
          shieldId,
        },
      );
    },
  },
};
