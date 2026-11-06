# API Reference

**Status:** Feature 16 on `feature/16-email-notifications-and-pickup-instructions`.

Authenticated routes use `Authorization: Bearer <token>`. Mount prefix: `/vehicleapi`.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/vehicleapi/areas/:id/instructions` | Load pickup/return instructions for an area |
| `PUT` | `/vehicleapi/areas/:id/instructions` | Create or update an area's instructions |
| `GET` | `/vehicleapi/reservations/:id/notifications` | Notification history for a reservation (newest first) |
| `PATCH` | `/vehicleapi/reservations/:id/status` | Change reservation status (triggers a status-change email when the status actually changes) |
| `POST` | `/vehicleapi/notifications/day-before` | Run the day-before pickup/return job (`system_admin`; body `{ "now": ISO date }` optional for tests) |

A production scheduler should call the day-before job daily. SMTP is not wired; tests inject a mail transport. Set `SMTP_HOST` when a provider is available.

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- `400` missing instruction fields, `401` unauthenticated, `403` outside area or wrong role, `404` area/reservation not found.
