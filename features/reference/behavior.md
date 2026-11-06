# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on this Feature 15 branch.

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Signed-in session required | `401` without a valid Bearer session | FR-001 |
| Maintenance, area_admin, and system_admin may view/record mileage and service | Other roles `403` | FR-002, FR-009, FR-016 |
| Area admins and maintenance users are limited to vehicles in their `area_id` | `403` for other areas | FR-013, FR-016 |
| System admins can access all areas | No area filter | FR-014 |
| Mileage must be a non-negative number with a date | `400` if missing or negative | FR-005, FR-007 |
| Service records require a date and description | `400` if missing | FR-011 |
| Vehicle must exist before saving | `404` | FR-006, FR-012 |
| History is append-only | New POSTs create new rows; no edit/delete | Assumptions |
| Lists show newest records first | Order by date then id DESC | Edge cases |
| Empty vehicle history shows an empty state | Empty array / empty UI message | Edge cases |
