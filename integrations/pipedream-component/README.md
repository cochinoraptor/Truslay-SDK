# Truslay for Pipedream

Native Node.js component for developer-first workflows. It asks the Truslay
firewall for a verdict before the workflow performs the action and returns the
full `ActionVerdict` so the next steps can branch on it.

Isolated project: it consumes the published `@truslay/sdk@^2.1.0`, never the SDK
source.

## What ships

| File | Role |
| --- | --- |
| `TruslayEvaluate.mjs` | Pipedream action component (`defineComponent`) |
| `package.json` | Records the `@truslay/sdk` dependency for local installs and diffs |

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `truslay_api_key` | string, secret | Optional: sandbox mode decides locally and never opens the network |
| `intent` | string (dropdown) | `webhook_incoming`, `scraping_request`, `database_write`, `checkout`, `agent_navigation` |
| `target_url` | string | Optional; defaults to `pipedream_workflow` |

## Output

The step returns the verdict object unchanged:

```json
{
  "verdict": "ALLOW",
  "reason": "sandbox_mode",
  "latencyMs": 0,
  "auditId": "…"
}
```

`verdict` is one of `ALLOW`, `REVIEW` or `BLOCK`. Only `ALLOW` should let the
rest of the workflow run: a Pipedream `$.flow.exit()` or an `if` step on
`steps.evaluate_action.verdict` is the usual guard. In `live` mode the SDK is
fail-closed, so an unreachable firewall returns `BLOCK`.

## Import it into a Pipedream workflow

1. Open (or create) a Pipedream **project**. Components live with the project so
   every workflow in it can use them.
2. Add `TruslayEvaluate.mjs` to the project's `components/` folder — in the
   project editor create a file with that exact name and paste the component.
3. Add the dependency. Pipedream bundles npm packages at deploy time, so the
   component only needs `import { TruslayUniversalClient } from "@truslay/sdk";`
   to resolve. If your project keeps a `package.json`, add
   `"@truslay/sdk": "^2.1.0"` there; `@pipedream/platform` is provided by
   Pipedream itself.
4. Open a workflow in that project, add a step, and search for **Evaluate
   Action** (key `truslay-evaluate-action`). Fill `intent`, and `target_url` when
   the action touches a specific URL.
5. Add the guard step after it, for example an `if` on
   `steps.evaluate_action.verdict === "ALLOW"`, or a Node.js step calling
   `$.flow.exit()` on anything else.

## Local check

```bash
npm install          # installs @truslay/sdk
node --check TruslayEvaluate.mjs
```

`defineComponent` is a Pipedream runtime global, so the component cannot be
executed with plain `node`; `node --check` validates the syntax and the imports
resolve after `npm install`.

## Notes

- Sandbox mode (`firewallMode: "sandbox"`) is deterministic and offline: the
  same action always returns the same verdict, which is what you want in tests.
- Live mode needs an API key and the firewall URL. This component only exposes
  the key; to point it at a custom firewall, extend the config object in `run`.
- `axios` is imported from `@pipedream/platform` as the standard component
  scaffold; this action does not issue HTTP calls itself (the SDK does).
