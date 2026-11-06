# Data Model Reference

**Status:** Feature 16 stand-in schema on this branch (replace with Feature 1 / Area / Reservation models when those land).

## Tables

### `users`, `sessions`, `areas`, `vehicles`, `reservations`

Stand-in tables so notification tests can run without Features 1–6 merged to `dev`. The `reservations` table in the shared local DB uses `id` (exposed as `reservation_id`) and `requester_id` (exposed as `user_id`).

### `area_instructions`

| Field | Type | Rules |
|-------|------|-------|
| `instruction_id` | INTEGER | Primary key |
| `area_id` | INTEGER | UNIQUE; one instruction record per area |
| `pickup_instructions` | TEXT | NOT NULL |
| `return_instructions` | TEXT | NOT NULL |
| `contact_information` | TEXT | Optional |

### `email_notifications`

| Field | Type | Rules |
|-------|------|-------|
| `notification_id` | INTEGER | Primary key |
| `reservation_id` | INTEGER | FK to reservation |
| `recipient_email` | VARCHAR | Required |
| `notification_type` | VARCHAR | `Status Change` or `Pickup and Return Instructions` |
| `sent_date` | DATETIME | Required; written only after the mailer confirms send |

## Associations

- One area has one instruction record.
- One reservation has many email notifications.
- Day-before emails use the assigned vehicle's `area_id` to load instructions.
