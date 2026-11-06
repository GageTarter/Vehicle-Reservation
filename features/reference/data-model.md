# Data Model Reference

**Status:** Feature 15 stand-in schema on this branch (replace with Vehicle Management models when that feature lands).

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER | Primary key |
| `googleId` | STRING | NOT NULL, unique |
| `fName` / `lName` / `email` | STRING | Required |
| `role` | STRING | `requestor`, `maintenance`, `area_admin`, `system_admin` |
| `area_id` | INTEGER | Nullable; used for maintenance and area_admin scoping |

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `token` | STRING | Session bearer token |
| `email` | STRING | |
| `expirationDate` | DATE | |
| `userId` | INTEGER | FK to `users.id` |

### `vehicles` (stand-in)

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER | Primary key (maps to vehicle identity until Vehicle Management) |
| `name` | STRING | NOT NULL |
| `area_id` | INTEGER | NOT NULL; used for access control |

### `mileage_logs`

| Field | Type | Rules |
|-------|------|-------|
| `mileage_log_id` | INTEGER | Primary key |
| `vehicle_id` | INTEGER | FK to `vehicles.id`; NOT NULL |
| `date_recorded` | DATE | NOT NULL |
| `current_mileage` | INTEGER | NOT NULL; non-negative |

### `service_logs`

| Field | Type | Rules |
|-------|------|-------|
| `service_log_id` | INTEGER | Primary key |
| `vehicle_id` | INTEGER | FK to `vehicles.id`; NOT NULL |
| `service_date` | DATE | NOT NULL |
| `service_performed` | TEXT | NOT NULL |

## Associations

- A vehicle has many mileage logs; each mileage log belongs to one vehicle.
- A vehicle has many service logs; each service log belongs to one vehicle.
- Access follows the vehicle's `area_id` for maintenance and area administrators; system administrators see all areas.
