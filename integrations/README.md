# Integrations

Third-party apps that consume the published `@truslay/sdk`. Each one is its own
npm package with its own README, tests and release cycle.

| Integration | Package | Status |
| --- | --- | --- |
| [n8n](n8n/README.md) | `n8n-nodes-truslay` | Node implemented — not published yet |
| [pipedream](pipedream-app/README.md) | `truslay-pipedream-app` | App with branding (`truslay.app.mjs` + logo) and `Evaluate Action` implemented — pending `truslay` app registration in Pipedream |
| [make](make-app/README.md) | `truslay-make-app` | Custom App (`app.json` + esbuild bundle) implemented and sandbox-verified — `truslay` app registration pending |
| zapier | — | Planned |

Rules for every integration in this folder:

- Depend on `@truslay/sdk` from npm, never on files in `../sdk`.
- Ask the SDK for a verdict before the platform performs the action.
- Treat every verdict other than `ALLOW` as blocked, and make the fail-closed
  behaviour visible to the user of the platform.
