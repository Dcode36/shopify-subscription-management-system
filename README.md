# Shopify subscription management 

GraphQL API (Node.js + TypeScript) plus a React dashboard for viewing subscription contracts and running pause, resume, skip-next-delivery, and cancel flows. Shopify is **mocked** with in-memory fixtures—no real store required.

---

## Setup instructions

Follow these steps **in order**. You only need **Node.js 20+** and **npm**.

### 1. Clone

```bash
git clone git@github.com:Dcode36/shopify-subscription-management-system.git
cd shopify-subscription-management-system
```

(Use HTTPS if you prefer: `https://github.com/Dcode36/shopify-subscription-management-system.git`.)

### 2. Install dependencies

Install **once from the repository root** (npm workspaces install `backend` and `frontend` together):

```bash
npm install
```

### 3. Environment files

Create local env files from the examples (values can stay default for a local demo):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

- **`backend/.env`** — `PORT` (default `4000`), `MOCK_CUSTOMER_ID` (default `cust_01`), optional placeholder `SHOPIFY_ADMIN_ACCESS_TOKEN` (unused with fixtures).
- **`frontend/.env`** — Optional. If **`VITE_GRAPHQL_URL`** is **unset**, the dev server proxies **`/graphql`** to `http://localhost:4000`. Set `VITE_GRAPHQL_URL` only if you point the UI at another origin.

Never commit `.env`—only `.env.example`.

### 4. Run API + web together

From the **repo root**:

```bash
npm run dev
```

Then open:

| Service | URL |
|--------|-----|
| Dashboard | http://localhost:5173 |
| GraphQL HTTP | http://localhost:4000/graphql |
| Health check | http://localhost:4000/health |

**Login:** pick a demo customer on the login screen, then browse subscriptions.

**If port 4000 is busy:** either stop the other process using it or set `PORT=4001` in `backend/.env` and set `VITE_GRAPHQL_URL=http://localhost:4001/graphql` in `frontend/.env` (when not relying on the default proxy).

### 5. Run workspaces separately (optional)

```bash
npm run dev -w backend    # API only
npm run dev -w frontend   # UI only (still expects API on 4000 unless env/proxy changed)
```

### 6. Production-style checks

```bash
npm run build -w backend
npm run build -w frontend
```

---

## Architecture overview

The browser talks **only** to our GraphQL server. Resolvers call an **in-memory store** seeded from **static fixtures**—there is no database and no call to Shopify’s Admin API in this submission.

```text
┌─────────────┐     POST /graphql      ┌──────────────────────┐
│ React +     │ ─────────────────────► │ Express +            │
│ Apollo      │                        │ Apollo Server        │
│ (Vite)      │ ◄───────────────────── │ (resolvers + Zod)    │
└─────────────┘     JSON responses     └──────────┬───────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │ SubscriptionStore    │
                                       │ (Map in RAM)         │
                                       └──────────┬───────────┘
                                                  │
                                                  ▼
                                       ┌──────────────────────┐
                                       │ fixtures + mock      │
                                       │ customer directory   │
                                       └──────────────────────┘
```

- **`backend/`** — Domain types, fixtures, `SubscriptionStore`, GraphQL schema + resolvers, validation.
- **`frontend/`** — Routes, Apollo Client, Tailwind UI; “login” stores selected customer id in **`localStorage`** and sends it as `customerId` when listing contracts.

---

## Decisions & trade-offs

At least three, stated plainly:

1. **Apollo Server + Apollo Client** — Single ecosystem for GraphQL end-to-end, strong docs, and straightforward HTTP integration with Express. Trade-off: both libraries ship frequent major versions; another stack (e.g. Yoga + graphql-request) could be smaller, but Apollo matched speed-to-demo with typed hooks.

2. **React Context + `localStorage` for “login,” not Redux / Zustand** — The brief allows a hardcoded/mock customer; we only need to persist **which demo user is selected** across refreshes. Context + storage is fewer dependencies and less boilerplate than Redux or Zustand for that narrow slice. Trade-off: not a pattern for real auth or SSR.

3. **Static TypeScript fixtures instead of MSW** — Fixtures live beside the store and load synchronously at startup, which is fast to implement and easy to reason about in reviews. MSW would better simulate HTTP latency and errors but cost setup time for this scope.

4. **Mutation payloads with `success` + `userErrors`** instead of relying only on GraphQL errors — Keeps validation and business-rule failures (e.g. pause when not active) in a predictable shape for the UI without overloading top-level `errors` for domain cases.

5. **Manual TS types for GraphQL operations** — Avoids codegen pipeline setup within the time box while keeping `strict` mode; codegen would be preferred for a growing team.

---

## What’s incomplete and why

- **No real Shopify integration** — OAuth, Admin API calls, and webhook-driven sync were out of scope for the time box; fixtures isolate schema and UI behavior.

- **No durable persistence** — The store is in-process memory so mutations vanish on API restart; adding Postgres/SQLite would be straightforward but wasn’t required.

- **Skip delivery** — Implemented as **moving `nextBillingDate` forward by one billing interval**, not a separate fulfillment engine or Shopify billing attempt history.

- **No payment-method update, address editing, or product swap** — Explicitly excluded by the brief unless treated as a stretch goal.

- **Auth is theatrical** — Dropdown + localStorage replaces real customer sessions or Shopify Customer Account API.

---

## What I’d do with another week

Prioritized:

1. **GraphQL Code Generator** — Typed operations and fewer manual assertion boundaries between UI and schema.

2. **Playwright E2E** — Login → open contract → cancel with confirmation, against running API.

3. **Optimistic mutations with rollback** — Snappier UI and clearer error recovery.

4. **Optional real Shopify dev store** — Thin adapter behind the same domain schema, behind a feature flag.

5. **Billing history view** — Paginated list modeled after billing attempts, still behind the abstract schema.

---

## How to run tests

Backend uses **Vitest** (meaningful tests on the store and GraphQL execution path):

```bash
npm run test -w backend
```

Watch mode:

```bash
npm run test:watch -w backend
```

Lint (both workspaces):

```bash
npm run lint -w backend
npm run lint -w frontend
```

---

## Assumptions about the brief

- Mocking Shopify with **fixtures or similar** is acceptable; reviewers should not expect live commerce data.

- **No real auth** — Hardcoded/mock identifiers and env placeholders are fine as long as README states how to run.

- **Strict TypeScript without `any`** applies to **project-authored** code; third-party `.d.ts` boundaries may still use loose typings.

- **“At least three meaningful tests”** was met with backend-focused tests (business rules + GraphQL contract); frontend testing could expand with more time.

- **Monorepo with npm workspaces** is an intentional choice so `npm install` and **`npm run dev`** from root match the brief’s “single dev command” expectation.

---

## Repository layout

```text
├── backend/           # GraphQL API (Express + Apollo)
├── frontend/          # Vite + React app
├── package.json       # workspaces + concurrent dev script
└── README.md
```

---

_Submission for Valar Digital — subscription management take-home._
