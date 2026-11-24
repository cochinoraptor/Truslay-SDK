# Truslay for Make

App structure for visual, no-code agency automations. One module so far:
**Evaluate Action**, which asks the Truslay firewall for a verdict before the
scenario performs the action.

Isolated project: it consumes the published `@truslay/sdk@^2.1.0`, never the SDK
source.

## Structure

```
integrations/make-app/
├── package.json
└── modules/
    └── evaluate-action/
        ├── parameters.json   # fields rendered in the Make UI
        └── execute.js        # module logic (CommonJS)
```

## Module: Evaluate Action

Parameters (`parameters.json`):

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `intent` | select | yes | `webhook_incoming`, `scraping_request`, `database_write`, `checkout`, `agent_navigation` |
| `shield_id` | text | no | Passed to the SDK as `{ shieldId }` for this evaluation only |
| `target_url` | text | no | Defaults to `make_scenario` |

Output (`execute.js`):

```json
{
  "verdict": "ALLOW",
  "reason": "sandbox_mode",
  "latency": 0,
  "audit_id": "…"
}
```

The SDK field is `latencyMs`; the module exposes it as `latency` for the visual
mapping. `verdict` is `ALLOW`, `REVIEW` or `BLOCK`, and only `ALLOW` should let
the scenario continue — use a Make **Filter** or **Router** on
`verdict = ALLOW`. In `live` mode the SDK is fail-closed: an unreachable
firewall returns `BLOCK`.

## Build and upload to the Make app directory

Make custom apps are configured on Make's side; this folder is the source of
truth for the module's parameters and logic.

1. Install the dependency locally and check the module:

   ```bash
   npm install
   node --check modules/evaluate-action/execute.js
   ```

2. In Make, open **Custom Apps** (left sidebar, under *More* if hidden) and
   create an app named **Truslay**. Custom Apps is available on paid plans and
   the app is private to your organisation unless you publish it.
3. Add a module named **Evaluate Action** (type *Action*). In the module
   configuration, open the **Parameters** section and paste the JSON from
   `parameters.json`; open the module code and paste `execute.js`.
4. Make sure the app runtime can resolve `@truslay/sdk@^2.1.0`. If your editor
   does not install npm dependencies for custom apps, bundle `execute.js` with
   esbuild (`npx esbuild modules/evaluate-action/execute.js --bundle
   --platform=node --format=cjs --outfile=dist/execute.js`) and paste the
   bundled output instead.
5. Save, then test the module from the app editor with a sample `intent`. In
   sandbox mode it returns `ALLOW` with `reason: "sandbox_mode"` and needs no
   credentials or network.
6. To use it, add the **Truslay → Evaluate Action** module to a scenario, map
   `intent` (and `shield_id` / `target_url` when needed) and route on `verdict`.

For organisation-wide distribution, submit the app for review from the Custom
Apps dashboard; until then it stays in your organisation's app list.

## Notes

- Sandbox mode is offline and deterministic, so scenarios are reproducible in
  tests.
- Live mode needs an API key and the firewall URL. Add them as app connection
  parameters and pass them in the config object in `execute.js` before moving
  past sandbox.
