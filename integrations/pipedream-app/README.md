# Truslay for Pipedream

Native Pipedream app for developer-first workflows. It asks the Truslay firewall
for a verdict before the workflow performs the action and returns the full
`ActionVerdict` so the next steps can branch on it.

Isolated project: it consumes the published `@truslay/sdk@^2.1.0`, never the SDK
source.

## Overview

Truslay gates the risky step of a workflow. Instead of trusting the automation,
the **Evaluate Action** action asks the firewall what it thinks about one
intent — an incoming webhook, a scrape, a database write, a checkout or an agent
navigation — and returns `ALLOW`, `REVIEW` or `BLOCK`. Only `ALLOW` should let
the rest of the workflow run.

`REVIEW` is not an approval: the SDK has no approval channel, so anything other
than `ALLOW` must be treated as blocked. In `live` mode the SDK is fail-closed:
an unreachable firewall returns `BLOCK` instead of letting the action through.

## Getting Started

### 1. Connect your Truslay account

The app is key-based: one field, `api_key`, stored by Pipedream as a connected
account and never exposed in the workflow. Create the key in your Truslay
dashboard, then add a connected account for **Truslay** in Pipedream.

The app runs in `sandbox` mode, which decides locally and never opens the
network, so a placeholder key is enough while you build the workflow. Switching
the app to `live` is one line in `truslay.app.mjs` (`firewallMode: "live"` in
the config); v2.1.0 does not infer the mode from the presence of a key.

### 2. Add the action

Search for **Evaluate Action** (key `truslay-evaluate-action`), pick the
connected account, then choose:

| Prop | Notes |
| --- | --- |
| Intent | `webhook_incoming`, `scraping_request`, `database_write`, `checkout`, `agent_navigation` |
| Target URL | Optional; defaults to `pipedream_workflow` |
| Shield ID | Optional; the account's default shield is used when empty |

The firewall mode is not a prop: it is a deploy-time decision in
`truslay.app.mjs`, so the workflow author cannot widen what the firewall checks.
v2.1.0 resolves it as `config.firewallMode ?? "sandbox"`, which keeps this app
sandboxed (offline and deterministic) by default.

### 3. Guard the next steps

The action returns the verdict object:

```json
{
  "verdict": "ALLOW",
  "reason": "sandbox_mode",
  "latencyMs": 0,
  "auditId": "…"
}
```

Add an `if` step on `steps.evaluate_action.verdict === "ALLOW"`, or a Node.js
step calling `$.flow.exit()` on anything else.

### Repository layout

```
integrations/pipedream-app/
├── truslay.app.mjs                        # app: slug, propDefinitions, client methods
├── truslay-logo.png                       # app icon artwork (source export)
├── actions/
│   └── evaluate-action/
│       └── evaluate-action.mjs            # the Evaluate Action component
├── package.json
└── README.md
```

The layout follows the Pipedream registry convention (`[app-slug]/[app-slug].app.mjs`
plus `actions/[action-slug]/[action-slug].mjs`), so this folder maps 1:1 onto
`components/truslay/` in the registry repo.

### Use it without publishing the app

The action file is still an ordinary Pipedream component. In a Pipedream
**project**, drop `actions/evaluate-action/evaluate-action.mjs` into the
project's `components/` folder together with `truslay.app.mjs` one level up, add
`"@truslay/sdk": "^2.1.0"` to the project's `package.json`, and the step shows up
in that project's workflow builder. `defineComponent` is a Pipedream runtime
global, so the file only runs inside Pipedream.

## Troubleshooting

**The app does not appear in the app selector.** The slug in
`truslay.app.mjs` (`app: "truslay"`) must exist as a registered app in
Pipedream; a component alone does not create one. Until the app is registered,
use the project-local instructions above.

**`verdict` is always `sandbox_mode`.** That is the default: the app never asks
the firewall unless `truslay.app.mjs` sets `firewallMode: "live"`. A connected
account alone does not switch modes.

**`verdict` is always `BLOCK` in live mode.** Live mode is fail-closed: check
that the connected account holds a valid key for the same Truslay environment as
the firewall you expect, and that the execution can reach the network.

**The logo is missing or blurry.** Pipedream stores the app icon server-side
(`img_src` on its asset host), not from this repository: upload it in the app
registration form. The bundled `truslay-logo.png` is a 128×128 export, so upload
a 512×512 PNG for a crisp icon on retina screens.

**`@truslay/sdk` cannot be resolved.** Add `"@truslay/sdk": "^2.1.0"` to the
`package.json` of the project/registry folder Pipedream builds; Pipedream bundles
npm dependencies at deploy time.

## Local check

```bash
npm install          # installs @truslay/sdk
node --check truslay.app.mjs
node --check actions/evaluate-action/evaluate-action.mjs
```
