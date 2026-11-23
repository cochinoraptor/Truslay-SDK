# Truslay SDK

Monorepo for the Truslay ecosystem: the SDK that evaluates agent actions
against the firewall, and the integrations that put it in front of the tools
people already use.

```
.
├── sdk/                    # npm: @truslay/sdk
└── integrations/
    ├── n8n/                # n8n-nodes-truslay
    ├── zapier/             # planned
    └── make/               # planned
```

## What each part is

| Path | Package | Role |
| --- | --- | --- |
| `sdk/` | [`@truslay/sdk`](https://www.npmjs.com/package/@truslay/sdk) | The published SDK: `TruslayUniversalClient`, local guards, and the firewall decision client |
| `integrations/n8n/` | [`n8n-nodes-truslay`](integrations/n8n/README.md) | n8n community node: gate a workflow step on a Truslay verdict |
| `integrations/zapier/` | — | Zapier app (not started) |
| `integrations/make/` | — | Make app (not started) |

Integrations never import from the SDK source. Each one is an independent
package that depends on the published `@truslay/sdk`, so a release ships the
SDK and its consumers separately.

## The verdict contract

Every integration asks the SDK the same question before performing an action:

```ts
const truslay = new TruslayUniversalClient(
  { mode: 'collaboration', firewallMode: 'sandbox' },
  'agent', // operatorType is the SECOND POSITIONAL ARGUMENT (v2.1.0)
);

const { verdict, reason } = await truslay.evaluateAction({ intent, payload: data });
```

`ALLOW` lets the action run. Anything else is treated as blocked: `live` mode is
fail-closed, so an unreachable firewall returns `BLOCK` instead of letting the
action through.

## Working in the monorepo

Each package is self-contained; the root workspaces only aggregate them.

```bash
npm install                                   # installs every workspace
npm run build --workspace integrations/n8n    # or: npm run build --workspaces
```

`integrations/*` are the only workspaces today. `sdk/` joins them once its
source lives here; until then the npm package is the contract.

## License

MIT — see [LICENSE](LICENSE).
