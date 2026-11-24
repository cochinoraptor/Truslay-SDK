import truslay from "../../truslay.app.mjs";

export default defineComponent({
  key: "truslay-evaluate-action",
  name: "Evaluate Action",
  description:
    "Ask the Truslay firewall for a verdict (ALLOW, REVIEW or BLOCK) before the workflow performs the action",
  version: "0.1.0",
  type: "action",
  props: {
    truslay,
    intent: {
      propDefinition: [
        truslay,
        "intent",
      ],
    },
    target_url: {
      propDefinition: [
        truslay,
        "target_url",
      ],
    },
    shield_id: {
      propDefinition: [
        truslay,
        "shield_id",
      ],
    },
  },
  async run({ $ }) {
    const decision = await this.truslay.evaluateAction({
      intent: this.intent,
      target_url: this.target_url,
      shieldId: this.shield_id,
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
