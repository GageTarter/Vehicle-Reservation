# API Reference

**Status:** Feature 13 on `feature-13-vehicle-issue-reporting`.

Authenticated routes use `Authorization: Bearer <token>`. Issue routes are mounted at `/vehicleapi`.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/vehicleapi/issues` | List issues the caller may access |
| `GET` | `/vehicleapi/issues/:id` | View one issue |
| `POST` | `/vehicleapi/issues` | Report an issue |
| `PATCH` | `/vehicleapi/issues/:id/status` | Update issue status (`Open`, `In Progress`, `Resolved`) |
| `GET` | `/vehicleapi/vehicles/:id/issues` | Issue history for a vehicle |

### POST `/vehicleapi/issues`

Request: `{ "vehicle_id", "reservation_id?", "issue_type", "description" }`  
Issue types: `Low Gas`, `Dirty Vehicle`, `Maintenance Needed`.  
Success `201`: `{ "message": "Vehicle issue reported successfully.", "issue": { ... } }` with `status: "Open"`.

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- `400` missing/invalid type or status, `401` unauthenticated, `403` another user's reservation or outside area, `404` missing vehicle/reservation/issue, `409` vehicle/reservation mismatch.
