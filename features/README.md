# Feature Specifications

Spec-driven development (SDD) source of truth for **this** application.  
No application code may be written unless it maps to a requirement in one of these files.

**Methodology:** [framework.md](./framework.md) — how to write, trace, and ship feature specs.  
**Student guide (requirements):** [writing-feature-requirements.md](./writing-feature-requirements.md) — stories, FRs, initial data model, Gherkin AC.  
**Student guide (design):** [writing-feature-design.md](./writing-feature-design.md) — ownership, API, screens, test map, DoD, out of scope.  
**Student guide (living reference):** [reference/writing-living-reference.md](./reference/writing-living-reference.md) — update api / data-model / behavior in the same PR.

*(Examples in the writing guides often cite the OC CS Speckit Todo sample app — use them as patterns for your product.)*

**Sprints** live in your agile tool — they are **not** part of these specs.

## Feature catalog

| ID | File | Branch | Depends on |
|----|------|--------|------------|
| 1 | [feature-1-google-auth.md](./feature-1-google-auth.md) *(on `origin/features/1-google-auth`)* | `features/1-google-auth` | — |
| 2 | [feature-2-user-management.md](./feature-2-user-management.md) *(on `origin/features/2-user-management`)* | `features/2-user-management` | Feature 1 |
| 3 | [feature-3-vehicle-management.md](./feature-3-vehicle-management.md) *(on `origin/feature-3-vehicle-management`)* | `feature/3-vehicle-management` | Feature 1 |
| 4 | [feature-4-driver-management.md](./feature-4-driver-management.md) *(stub on `origin/feature-4-driver-management`)* | `feature/4-driver-management` | Feature 1 |
| 5 | [feature-5-destination-management.md](./feature-5-destination-management.md) *(stub on `origin/feature-5-destination-management`)* | `feature/5-destination-management` | Feature 1 |
| 6 | [feature-6-area-management.md](./feature-6-area-management.md) *(stub on `origin/feature-6-area-management`)* | `feature/6-area-management` | Feature 1 |
| 8 | [feature-8-vehicle-reservation-requests.md](./feature-8-vehicle-reservation-requests.md) | `feature/8-vehicle-reservation-requests` | Features 1–5 |
| 9 | [feature-9-vehicle-assignment-and-availability.md](./feature-9-vehicle-assignment-and-availability.md) | `feature/9-vehicle-assignment-and-availability` | Features 3, 8 |
| 10 | [feature-10-reservation-status-management.md](./feature-10-reservation-status-management.md) | `feature/10-reservation-status-management` | Features 6, 8, 9 |
| 11 | [feature-11-weekly-reservation-calendar.md](./feature-11-weekly-reservation-calendar.md) | `feature/11-weekly-reservation-calendar` | Features 8, 9 |
| 12 | *Reserved: checkout / return* | `feature-12-vehicle-checkout-return-management` | Feature 9+ |
| 13 | *Reserved: issue reporting* | `feature-13-vehicle-issue-reporting` | Feature 12 |

Feature 7 is unused. Features 1 and 2 are on this branch. Features 3–6 are still required before Features 9–11. Do not implement feature work on `main`.

New features: follow [framework.md](./framework.md#feature-spec-template) — **Status**, **Input**, **FR-00N**, **SC-00N**, **Key Entities**, Gherkin, **Agent implementation request**, **Definition of Done**.

**Branch roles:** `main` = scaffold-only starter kit · `dev` = integration · `feature/N-*` = feature work (branch from `dev`).

## Living reference

Keep snapshots in sync when schema, API, or product rules change — **in the same PR as implementation** (required DoD; see [Merge checklist + Agility sync](./framework.md#merge-checklist--agility-sync)). Each `feature-N-*.md` includes an **Agent implementation request** block so Cursor updates reference during implementation ([framework.md](./framework.md#agent-implementation-request)). Spec evolution after merge: [prefer a new feature delta](./framework.md#spec-evolution-after-merge).

| File | Purpose |
|------|---------|
| [reference/README.md](./reference/README.md) | How to maintain reference docs |
| [reference/writing-living-reference.md](./reference/writing-living-reference.md) | Student guide — writing/updating living reference |
| [reference/data-model.md](./reference/data-model.md) | Current database tables (update in feature PR when schema changes) |
| [reference/api.md](./reference/api.md) | Current REST API (update in feature PR when API changes) |
| [reference/behavior.md](./reference/behavior.md) | Current product rules (update in feature PR when rules change) |

## Related

- Cursor rules: `.cursor/rules/`
- ADRs: `docs/adr/`
- Quality attributes (NFRs): `docs/nfr/`
- Starter kit notes: `docs/STARTER-KIT.md`
