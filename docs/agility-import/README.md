# Digital.ai Agility import

Export user stories and Gherkin acceptance criteria from `features/` into CSV files, or push via the Bulk JSON API.

**Project Scope for this app:** `T5 - Vehicles` (`Scope:58962` on `https://www3.v1host.com/OklahomaChristianUniversity`).

## Generate CSV import files

```bash
npm run agility:export
# or:
node scripts/export-agility-import.mjs --project "T5 - Vehicles"
```

Creates `docs/agility-import/PortfolioItem.csv`, `Story.csv`, and `Test.csv` for Excel import into Agility.

Feature specs are **auto-discovered** from `features/feature-N-*.md` (epic title = `# Feature: …`). Default Scope is `T5 - Vehicles` in `scripts/agility/backlog-data.mjs` (override with `--project`).

## Push via Agility Bulk API

1. Copy `.env.agility.example` → `.env.agility` and set `AGILITY_BASE_URL`, `AGILITY_ACCESS_TOKEN`, `AGILITY_SCOPE` (`T5 - Vehicles`). Do **not** commit `.env.agility`.
2. Run:

```bash
npm run agility:push:dry-run
npm run agility:verify
npm run agility:push -- --feature 8            # create epic + stories + tests
npm run agility:push -- --feature 8 --upsert   # update existing by Reference
```

Prefer `--upsert` after story/Gherkin edits. A second full create push duplicates assets.
