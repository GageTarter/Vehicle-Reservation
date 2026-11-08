# Data Model Reference

**Status:** Feature 14 stand-in schema on this branch.

## `maintenance_requests`

| Field | Type | Rules |
|-------|------|-------|
| `maintenance_request_id` | INTEGER | Primary key |
| `vehicle_id` | INTEGER | NOT NULL |
| `issue_id` | INTEGER | Nullable |
| `description` | TEXT | NOT NULL |
| `status` | VARCHAR | NOT NULL, default `Open` |

Stand-in `users`, `sessions`, `vehicles`, and `vehicle_issues` support this feature.

## Associations

- A vehicle has many maintenance requests.
- A maintenance request may belong to one vehicle issue.
