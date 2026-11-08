# Data Model Reference

**Status:** Feature 13 stand-in schema on this branch.

## Tables

### `vehicle_issues`

| Field | Type | Rules |
|-------|------|-------|
| `issue_id` | INTEGER | Primary key |
| `vehicle_id` | INTEGER | NOT NULL |
| `reservation_id` | INTEGER | Nullable |
| `reported_by` | INTEGER | NOT NULL |
| `issue_type` | VARCHAR | NOT NULL |
| `description` | TEXT | NOT NULL |
| `reported_date` | DATETIME | NOT NULL |
| `status` | VARCHAR | NOT NULL, default `Open` |

Stand-in `users`, `sessions`, `vehicles`, and `reservations` tables support this feature until those models merge from earlier features.

## Associations

- A vehicle has many issues; each issue belongs to one vehicle.
- A reservation may have many issues; each issue may belong to one reservation.
- A user can report many issues.
