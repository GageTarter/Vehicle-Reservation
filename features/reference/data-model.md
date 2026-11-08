# Data Model Reference

**Status:** Feature 1 tables `users` and `sessions`. Feature 2 adds no columns. Feature 12 adds stand-in `vehicles` and `reservations` (including checkout/return timestamps).

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `googleId` | STRING | Required, unique; Google `sub` |
| `fName` | STRING | Required; from `given_name` at sign-in; may be `""`. Feature 2 may replace it |
| `lName` | STRING | Required; from `family_name` at sign-in; may be `""`. Feature 2 may replace it |
| `email` | STRING | Required, unique; from the verified token |
| `role` | STRING(20) | Required; `user` or `admin`; default `user` |

No password column. Feature 12 also uses `area_id` (nullable) and roles `requestor`, `area_admin`, and `system_admin` on stand-in rows.

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING(512) | Required; JWT stored server-side |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours after creation |
| `userId` | INTEGER FK | Required, references `users.id` |

### `vehicles` (Feature 12 stand-in)

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required |
| `area_id` | INTEGER | Required; used for area-admin scoping |

### `reservations` (Feature 12)

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Exposed as `reservation_id` |
| `requester_id` | INTEGER | Required; requestor `users.id` |
| `vehicle_id` | INTEGER | Nullable until assigned |
| `status` | VARCHAR | `Requested`, `Awaiting Vehicle`, `Assigned`, `Checked Out`, `Returned` |
| `start_datetime` / `end_datetime` | DATETIME | Nullable |
| `checkout_datetime` | DATETIME | Nullable; set on checkout |
| `return_datetime` | DATETIME | Nullable; set on return |

## Associations

- `User hasMany Session` on `userId`
- `Session belongsTo User` on `userId`

Wired in `backend/app/models/index.js`.

Deleting a user in Feature 2 also deletes every `sessions` row for that user. `googleId`, `email`, and `role` are not updated by Feature 2.

### `vehicles` (Feature 12 stand-in)

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Stand-in until Vehicle Management |
| `name` | STRING | Required |
| `area_id` | INTEGER | Required; used for area-admin access |

### `reservations` (Feature 12)

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Exposed as `reservation_id` |
| `requester_id` | INTEGER | FK to `users.id` |
| `vehicle_id` | INTEGER | Nullable until assigned |
| `status` | VARCHAR | `Requested`, `Awaiting Vehicle`, `Assigned`, `Checked Out`, `Returned` |
| `start_datetime` / `end_datetime` | DATETIME | Nullable on this stand-in |
| `checkout_datetime` | DATETIME | Nullable; set on checkout |
| `return_datetime` | DATETIME | Nullable; set on return |
