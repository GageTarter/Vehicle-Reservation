# Data Model Reference

**Status:** Feature 1 tables `users` and `sessions`. Feature 2 adds no columns. Feature 3 adds `vehicles`.

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

### `vehicles`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `userId` | INTEGER FK | Required, references `users.id`, `ON DELETE CASCADE` |
| `name` | STRING(100) | Required. Set to `${year} ${make} ${model}`. Unique with `userId` |
| `make` | STRING(100) | Required |
| `model` | STRING(100) | Required |
| `year` | STRING(100) | Required. Create: 1–4 digits. Edit: exactly 4 digits |
| `vin` | STRING(17) | Required. Create: at most 17 characters and a valid VIN. Edit: exactly 17 characters and a valid VIN |
| `purchaseDate` | STRING(10) | Required. Stored as typed (`M/D/YY` or `YYYY-M-D`) after a calendar check |
| `color` | STRING(100) | Required |
| `passengerCapacity` | INTEGER | Required. 0–9999 |
| `licensePlateNo` | STRING(7) | Required |
| `licensePlateExp` | STRING(10) | Required. Same date rules as `purchaseDate` |
| `area` | STRING(100) | Required typed string |
| `createdAt` | DATE | Sequelize timestamp. List order |
| `updatedAt` | DATE | Sequelize timestamp |

## Associations

- `User hasMany Session` on `userId`
- `Session belongsTo User` on `userId`
- `User hasMany Vehicle` on `userId`, `onDelete: CASCADE`
- `Vehicle belongsTo User` on `userId`

Wired in `backend/app/models/index.js`.

Deleting a user in Feature 2 also deletes every `sessions` row for that user. `googleId`, `email`, and `role` are not updated by Feature 2. Deleting a user also deletes that user's vehicles.

### `vehicle_issues`

| Field | Type | Rules |
|-------|------|-------|
| `issue_id` | INTEGER | Primary key |
| `vehicle_id` | INTEGER | NOT NULL; references `vehicles.id` |
| `reservation_id` | INTEGER | Nullable |
| `reported_by` | INTEGER | NOT NULL |
| `issue_type` | VARCHAR | NOT NULL |
| `description` | TEXT | NOT NULL |
| `reported_date` | DATETIME | NOT NULL |
| `status` | VARCHAR | NOT NULL, default `Open` |

### `maintenance_requests`

| Field | Type | Rules |
|-------|------|-------|
| `maintenance_request_id` | INTEGER | Primary key |
| `vehicle_id` | INTEGER | NOT NULL |
| `issue_id` | INTEGER | Nullable |
| `description` | TEXT | NOT NULL |
| `status` | VARCHAR | NOT NULL, default `Open` |
