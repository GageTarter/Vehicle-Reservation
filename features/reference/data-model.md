# Data Model Reference

**Status:** Feature 1 tables `users` and `sessions`. Feature 2 adds no columns.

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

No password column.

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `token` | STRING(512) | Required; JWT stored server-side |
| `email` | STRING | Required |
| `expirationDate` | DATE | Required; 24 hours after creation |
| `userId` | INTEGER FK | Required, references `users.id` |

## Associations

- `User hasMany Session` on `userId`
- `Session belongsTo User` on `userId`

Wired in `backend/app/models/index.js`.

Deleting a user in Feature 2 also deletes every `sessions` row for that user. `googleId`, `email`, and `role` are not updated by Feature 2.
