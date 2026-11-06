# API Reference

**Status:** Feature 15 on `feature/15-vehicle-mileage-and-service-log-management` — mileage and service log endpoints.

API mount path for this feature is `/vehicleapi` (see `backend/server.js`). Authenticated routes use `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/vehicleapi/vehicles/:id/mileage` | List mileage records for a vehicle (newest first) |
| `POST` | `/vehicleapi/vehicles/:id/mileage` | Record current mileage |
| `GET` | `/vehicleapi/vehicles/:id/service-logs` | List service records for a vehicle (newest first) |
| `POST` | `/vehicleapi/vehicles/:id/service-logs` | Record a vehicle service |
| `GET` | `/vehicleapi/mileage-logs/:id` | View one mileage record |
| `GET` | `/vehicleapi/service-logs/:id` | View one service record |

### POST `/vehicleapi/vehicles/:id/mileage`

Request: `{ "date_recorded": "2026-11-05", "current_mileage": 45200 }`  
Success `201`: `{ "message": "Mileage record created successfully.", "mileage_log": { ... } }`

### POST `/vehicleapi/vehicles/:id/service-logs`

Request: `{ "service_date": "2026-11-05", "service_performed": "Oil change and tire rotation" }`  
Success `201`: `{ "message": "Service record created successfully.", "service_log": { ... } }`

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
- `400` invalid/missing fields, `401` unauthenticated, `403` outside area or wrong role, `404` vehicle or record not found.
