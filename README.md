# Truslay

> **Truslay is not a wrapper or a text filter.** It is a local-first, 8-layer
> deterministic security pipeline for AI agents: intent interception,
> policy-graph evaluation, physical tool-call blocking, cryptographic sealing,
> and immutable on-chain audit.

Most "guardrails" inspect a prompt and hope the model behaves. Truslay decides
whether an action is allowed **before the tool runs**, and makes that decision
reproducible: same intent, same policy graph, same verdict — with a signature
that proves what was decided and an on-chain anchor that proves it later.

- **Local-first.** The edge pipeline needs no internet to protect an agent.
- **Fail-closed.** If the decision cannot be made, the action does not execute.
- **Deterministic.** Policies are a graph, not a prompt. The verdict is not a
  suggestion to the model.
- **Auditable.** Every decision is sealed and anchored, not logged in a table
  someone can edit.

## 🏛️ Architecture: The SDK and The Firewall

Truslay ships as two complementary halves: an **Edge** that enforces inside your
process, and a **Core** that governs and notarizes the fleet.

### 1. What the SDK (`@truslay/sdk`) is — "The Sovereign Edge"

- **What it does:** it is the local-first, zero-dependency execution engine. It
  is the **enforcer** that lives inside your application's runtime.
- **Coverage:** it runs Layers 1 to 5 (Signal, Lattice, Shield, Gate, Seal) and
  Layer 6 (the local Ledger) in **<1 ms**.
- **Scope:** full coverage of intent interception, policy evaluation, physical
  blocking of the tool call (fail-closed), and local cryptographic signing
  (ed25519). It does not need the internet to protect the agent.

### 2. What the Truslay Firewall is — "The Trust Core"

- **What it does:** it is the holistic security architecture and the governance
  system. It is not "a server that traffic passes through": it is the policy
  brain and the immutable notary.
- **Coverage:** it contributes Layers 7 and 8 (Anchor and Prism). It manages
  anchoring the Ledger to the **Sui** blockchain for immutable audit (SOX/GDPR)
  and provides the observability dashboard for teams.
- **Scope:** fleet-wide cryptographic truth, macro policy management, and the
  human audit interface.

### 3. The synergy

The SDK (Edge) intercepts the agent's action and evaluates it locally in
milliseconds. If it is safe, it seals it (Seal) and lets it execute. If it is
complex or requires external audit, the SDK pushes the hash to the Firewall
(Core), which anchors it on Sui (Anchor) and makes it visible in the dashboard
(Prism).

> **"El SDK es el guardián soberano en tu código; el Firewall es la bóveda
> inmutable en la red. Juntos forman la única capa de confianza determinista
> para agentes autónomos."**
>
> *"The SDK is the sovereign guardian inside your code; the Firewall is the
> immutable vault on the network. Together they form the only deterministic
> trust layer for autonomous agents."*

<details>
<summary>Canon (Español) — texto exacto</summary>

**1. ¿Qué es el SDK (`@truslay/sdk`)? → "The Sovereign Edge"**

- **Qué hace:** Es el motor de ejecución local-first (zero-dependency). Es el
  "enforcer" (ejecutor) que vive dentro del runtime de tu aplicación.
- **Cobertura:** Ejecuta las Capas 1 a 5 (Signal, Lattice, Shield, Gate, Seal) y
  la Capa 6 (Ledger local) en <1ms.
- **Alcance:** Tiene cobertura total sobre la interceptación de la intención, la
  evaluación de políticas, el bloqueo físico de la herramienta (Fail-Closed) y
  la firma criptográfica local (ed25519). No necesita internet para proteger al
  agente.

**2. ¿Qué es el Firewall de Truslay? → "The Trust Core"**

- **Qué hace:** Es la arquitectura de seguridad holística y el sistema de
  gobierno. No es un "servidor por el que pasa el tráfico", es el cerebro de
  políticas y el notario inmutable.
- **Cobertura:** Aporta las Capas 7 y 8 (Anchor y Prism). Gestiona el anclaje
  del Ledger en la blockchain de Sui para auditoría inmutable (SOX/GDPR) y
  provee el dashboard de observabilidad para equipos.
- **Alcance:** Proporciona la verdad criptográfica a nivel de flota, la gestión
  de políticas macro y la interfaz de auditoría humana.

**3. La Sinergia**

- **El flujo colaborativo:** El SDK (Edge) intercepta la acción del agente y la
  evalúa localmente en milisegundos. Si es segura, la firma (Seal) y la ejecuta.
  Si es compleja o requiere auditoría externa, el SDK empuja el hash al Firewall
  (Core), que la ancla en Sui (Anchor) y la hace visible en el dashboard (Prism).
- **Mensaje clave:** "El SDK es el guardián soberano en tu código; el Firewall
  es la bóveda inmutable en la red. Juntos forman la única capa de confianza
  determinista para agentes autónomos."

</details>

### Who executes what

| | SDK — The Sovereign Edge | Firewall — The Trust Core |
| --- | --- | --- |
| Runs where | Inside your process / agent runtime | Your control plane + Sui |
| Layers | 1 Signal · 2 Lattice · 3 Shield · 4 Gate · 5 Seal · 6 Ledger (local) | 7 Anchor (Sui) · 8 Prism |
| Latency | < 1 ms, no network required | Asynchronous anchoring and reporting |
| Blocks execution | Yes — physically, fail-closed | No — it governs, notarizes and observes |
| Owns | Policy enforcement, local signature | Fleet policy, immutable audit, dashboards |

## 🛡️ The 8-Layer Deterministic Pipeline

| # | Layer | What it does | Runs in |
| --- | --- | --- | --- |
| 01 | **Signal** | Intercepts the agent's intent before any tool is called; normalizes the action, actor and payload. | SDK |
| 02 | **Lattice** | Evaluates the intent against the policy graph: limits, whitelists, roles, dual approval. | SDK |
| 03 | **Shield** | Applies domain rules (finance, HR, health-PII, legal, cyber, DevOps, commerce, support, booking). | SDK |
| 04 | **Gate** | Enforces the verdict at system level: the tool call is blocked (fail-closed), not "advised against". | SDK |
| 05 | **Seal** | Signs the decision locally with ed25519, so the verdict cannot be altered after the fact. | SDK |
| 06 | **Ledger** | Records the sealed decision in the local append-only ledger, available offline. | SDK |
| 07 | **Anchor** | Anchors ledger hashes to the **Sui** blockchain for immutable, third-party-verifiable audit (SOX/GDPR). | Firewall |
| 08 | **Prism** | Fleet observability: dashboards, policy analytics, human audit and evidence export. | Firewall |

The first six layers are the sovereign edge: they run in your runtime and never
depend on a network round trip. The last two are the trust core: they turn local
decisions into fleet-wide, immutable evidence.

## Install

```bash
npm install @truslay/sdk
```

## Quickstart

```ts
import { TruslayUniversalClient } from '@truslay/sdk';

const truslay = new TruslayUniversalClient(
  { mode: 'collaboration', firewallMode: 'live' },
  'agent', // operatorType is the SECOND POSITIONAL ARGUMENT (v2.1.0)
);

const { verdict, reason } = await truslay.evaluateAction({
  intent: 'issue_refund',
  payload: { amount: 480, currency: 'USD', customer_id: 'CUS-1042' },
});

if (verdict !== 'ALLOW') {
  throw new Error(`Blocked by Truslay: ${reason}`);
}

// Only reachable when Gate allowed the action.
await refund(payload);
```

`ALLOW` lets the action run. Anything else is treated as blocked: `live` mode is
fail-closed, so an unreachable Firewall returns `BLOCK` instead of letting the
action through.

## The verdict contract

Every integration and every agent asks the SDK the same question before
performing an action:

```ts
const { verdict, reason } = await truslay.evaluateAction({ intent, payload });
```

The verdict is produced by the Lattice policy graph and enforced by the Gate.
It is not a text classification of the prompt, and it is not delegated to the
model.

## Integrations

This monorepo also ships the integrations that put the pipeline in front of the
tools teams already use.

| Path | Package | Role |
| --- | --- | --- |
| `integrations/n8n/` | [`n8n-nodes-truslay`](integrations/n8n/README.md) | n8n community node: gate a workflow step on a Truslay verdict |
| `integrations/pipedream-app/` | `truslay-pipedream-app` | Pipedream App with its own branding (`truslay.app.mjs` + logo) and the `Evaluate Action` action; code ready, pending registration of the `truslay` slug |
| `integrations/make-app/` | `truslay-make-app` | Make Custom App (`app.json` + `Evaluate Agent Action` module bundled with esbuild); sandbox-verified, registration pending |
| `integrations/zapier/` | — | Planned |

Integrations never import from the SDK source. Each one is an independent
package that depends on the published `@truslay/sdk`, so a release ships the
SDK and its consumers separately.

## 💰 Pricing & Access

Truslay is freemium, with public pricing:

- **1,000 evaluations free.** No credit card required to start.
- **Public plans from $19.99/month** for teams, up to **$5,999.99/month** for
  enterprise fleets with on-chain anchoring, SSO and audit export.
- Current plans and limits: **<https://truslay.com/pricing>**

There is no "contact us for pricing" black box: the entry plan and the top plan
are published. The free tier is enough to run the SDK's first six layers in
production-like tests.

## License

**SEE LICENSE IN [LICENSE.md](LICENSE.md).** Truslay is proprietary software,
licensed — not sold. Versions published before 2.1.0 were released under the MIT
License recorded in [LICENSE](LICENSE).

## Disclaimer

⚠️ **Note: Truslay is not affiliated with "Trustly" or "TrustLayer".** Truslay is
an independent deterministic execution and audit layer for AI agents. Any
similarity in name is coincidental.
