# Truslay for Make

Custom App package for Make (formerly Integromat). One action module so far:
**Evaluate Agent Action**, which asks the Truslay decision engine for a verdict
before the scenario performs the action.

Isolated project: it consumes the published `@truslay/sdk@^2.1.0`, never the SDK
source.

## Status

- **Not registered yet.** The `truslay` slug proposed here is not registered in
  the Make marketplace, and no version of this app has been reviewed or approved
  by Make. Everything in this folder is the source of truth for the app, not a
  published listing.
- **Sandbox verified locally.** The bundle built from `impl.js` runs and returns
  `ALLOW` with `reason: "sandbox_mode"` (see [Build](#build)).
- **Two statuses, two facts.** The code being ready does not mean the app is
  installable from the Make catalog; registration is a separate, manual step.

### About the file format

Make custom apps are defined as JSON component sections — Base, Connections,
and Modules with their `api`, `parameters`, `interface` and `samples` — authored
in the Apps Editor (or the VS Code extension) and uploaded with the Make
TypeScript SDK (`@makehq/sdk`). Module logic in Make is IML/JSON, and the module
runtime does not install npm packages.

The layout below (`app.json`, `modules/evaluate-action/blueprint.json`,
`modules/evaluate-action/impl.js`) is the structure used for this integration:

- `app.json` and `blueprint.json` map onto the Base/Connection definition and the
  module's `parameters` section, so they paste into the editor as-is.
- `impl.js` is **not** a file Make executes. It documents the exact SDK call and
  is what the esbuild bundle is built from, for local verification and for hosts
  that do run Node. Moving the module to a live path inside Make means calling
  the Truslay firewall over HTTP from the module's `api` section.

## Structure

```
integrations/make-app/
├── app.json                          # app manifest: name, version, connection
├── package.json                      # build-only dependencies (esbuild, SDK)
├── truslay-logo.png                  # reference logo (128x128)
├── modules/
│   └── evaluate-action/
│       ├── blueprint.json            # fields rendered in the Make UI
│       └── impl.js                   # SDK call, CommonJS (bundled by esbuild)
└── README.md
```

## Module: Evaluate Agent Action

Parameters (`modules/evaluate-action/blueprint.json`):

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `intent` | select | yes | `webhook_incoming`, `scraping_request`, `database_write`, `checkout`, `agent_navigation` |
| `shield_id` | text | no | Passed to the SDK as `{ shieldId }` for this evaluation only |
| `target` | text | no | Defaults to `make_workflow` |

Output (`impl.js`):

```json
{
  "verdict": "ALLOW",
  "reason": "sandbox_mode",
  "latencyMs": 0,
  "auditId": "…",
  "status": "✅ Authorized"
}
```

`verdict` is `ALLOW`, `REVIEW` or `BLOCK`, and only `ALLOW` should let the
scenario continue — route on `verdict = ALLOW` with a Make **Filter** or
**Router**. In `live` mode the SDK is fail-closed: an unreachable firewall
returns `BLOCK`. `auditId` is absent in sandbox, where nothing is sent upstream.

## Build

`impl.js` is bundled so the output has no `@truslay/sdk` require left (the SDK is
optional-`puppeteer`-dependent, so `puppeteer` stays external and is never loaded
on the `evaluateAction` path):

```bash
npm install            # installs @truslay/sdk; pulls optional puppeteer + Chrome
npm run build          # -> dist/evaluate-action.js
```

`npm run build` is:

```bash
esbuild modules/evaluate-action/impl.js --bundle --platform=node --format=cjs \
  --outfile=dist/evaluate-action.js --minify --external:puppeteer
```

The result is a self-contained CommonJS bundle (≈730 KB, only Node built-ins like
`crypto`, `fs` and `http` left external) and `dist/` is git-ignored.

To check the module logic without a Make account:

```bash
node --check modules/evaluate-action/impl.js
node -e "require('./dist/evaluate-action.js').execute({}, { intent: 'checkout' }, {}).then(console.log)"
```

That prints `{ verdict: 'ALLOW', reason: 'sandbox_mode', latencyMs: 0 }`.

## Registering the app in Make

None of these steps is done yet; they need a Make account with Custom Apps access.

1. Open **Custom Apps** in the Make sidebar (under *More* if hidden) and create
   an app named **Truslay** (`theme` `#00C853`).
2. **Connection** → API Key, parameter `apiKey` (secret) — the `connection`
   object in `app.json`.
3. **Module** → action named **Evaluate Agent Action**, and paste the
   `parameters` array from `modules/evaluate-action/blueprint.json`.
4. Define the module `interface` (the output fields above) and sample data, so
   downstream modules can map `verdict`, `reason`, `latencyMs` and `auditId`.
5. **Icon**: Make stores one icon per app and recommends a 512×512 PNG. The
   `truslay-logo.png` in this folder is 128×128 (the same asset the n8n node
   ships), so export it at 512×512 before upload to avoid a blurry icon.
6. Test the module in a scenario, then submit the app for review from the Custom
   Apps dashboard. Until review passes it stays private to your organisation, and
   the `truslay` slug is not reserved.

## Sandbox vs live

- Sandbox (default, no `firewallMode` in the config): no credentials, no network,
  deterministic — ideal for reproducible tests.
- Live needs `firewallMode: 'live'`, an API key **and** a firewall URL
  (`firewallUrl` or `TRUSLAY_FIREWALL_URL`); without them the SDK throws, and a
  firewall that cannot be reached returns `BLOCK`. This app does not ship a
  firewall URL: set it in the connection/base once the deployment is reachable.

The connection's API key is passed to the SDK as `apiKey` and never logged.
