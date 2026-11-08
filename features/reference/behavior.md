# Behavior & Rules Reference

**Living snapshot** of product rules currently in force on this Feature 13 branch.

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Signed-in session required | `401` without a valid Bearer session | FR-001 |
| Issue type and description required | `400` if missing or invalid type | FR-015, FR-007 |
| New issues start as `Open` | Set on create; reporting does not resolve the issue | FR-019 |
| Reporting does not mark a reservation Returned | Checkout/return fields are not changed | FR-018 |
| Requestor cannot use another user's reservation | `403` | FR-014 |
| Area admins see issues for vehicles in their `area_id` | List/filter and `403` on GET outside area | FR-009 |
| System admins see all issues | No area filter | FR-010 |
| Only area/system admins update status | Requestor `403` | FR-011 |
| Supported statuses | `Open`, `In Progress`, `Resolved` | FR-012 |
