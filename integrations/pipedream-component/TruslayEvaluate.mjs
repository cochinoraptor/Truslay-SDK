import { axios } from "@pipedream/platform";
import { TruslayUniversalClient } from "@truslay/sdk";

export default defineComponent({
  key: "truslay-evaluate-action",
  name: "Evaluate Action",
  description:
    "Ask the Truslay firewall for a verdict (ALLOW, REVIEW or BLOCK) before the workflow performs the action",
  version: "0.1.0",
  type: "action",
  props: {
    truslay_api_key: {
      type: "string",
      label: "Truslay API Key",
      description:
        "API key for the firewall in live mode. Sandbox mode decides locally and does not need it.",
      secret: true,
      optional: true,
    },
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
  },
  async run({ steps, $ }) {
    // v2.1.0 signature: config first, operatorType as the SECOND POSITIONAL ARGUMENT.
    const truslay = new TruslayUniversalClient(
      {
        mode: "collaboration",
        firewallMode: "sandbox",
        ...(this.truslay_api_key ? { apiKey: this.truslay_api_key } : {}),
      },
      "agent",
    );

    const decision = await truslay.evaluateAction({
      intent: this.intent,
      target: this.target_url || "pipedream_workflow",
    });

    // Anything other than ALLOW is blocked: the SDK has no approval channel,
    // so REVIEW must not let the following steps run unchecked.
    $.export(
      "$summary",
      `Truslay verdict: ${decision.verdict}${
        decision.reason ? ` (${decision.reason})` : ""
      }`,
    );

    return decision;
  },
});
