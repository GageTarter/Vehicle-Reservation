# API Reference

**Status:** Feature 14 on `feature/14-vehicle-maintenance-management`.

Authenticated routes use `Authorization: Bearer <token>`. Mount prefix: `/vehicleapi`.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/vehicleapi/maintenance-requests` | List authorized maintenance requests |
| `GET` | `/vehicleapi/maintenance-requests/:id` | View one request |
| `POST` | `/vehicleapi/maintenance-requests` | Create a request (`status` starts `Open`) |
| `PATCH` | `/vehicleapi/maintenance-requests/:id/status` | Update status (`Open`, `In Progress`, `Completed`) |
| `GET` | `/vehicleapi/vehicles/:id/maintenance` | Maintenance history for a vehicle |

POST body: `{ "vehicle_id", "description", "issue_id?" }`. Mismatched issue/vehicle is `409`.

## Conventions

- Flat JSON responses. Errors: `{ "message": "..." }`.
- `400` missing description/invalid status, `401` unauthenticated, `403` wrong role or area, `404` missing vehicle/issue/request.
