# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on this Feature 14 branch.

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Signed-in session required | `401` | FR-001 |
| Maintenance, area_admin, and system_admin may manage requests | Other roles `403` | FR-002, FR-015 |
| Area scoping uses the vehicle's `area_id` | Maintenance and area admins only see their area | FR-010, FR-015 |
| New requests start as `Open` | Set on create | FR-007 |
| Description and existing vehicle required | `400` / `404` | FR-006, FR-012 |
| Optional issue must belong to the same vehicle | `409` if mismatched | FR-013 |
| Statuses | `Open`, `In Progress`, `Completed` | FR-009 |
