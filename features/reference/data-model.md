# Data Model Reference

**Status:** Feature 8 adds `drivers`, `destinations`, and `reservations`. Feature 1 tables `users` and `sessions` remain. Feature 2 adds no columns.

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

### `drivers`

Minimum table until Feature 4. Feature 8 uses it to require an approved driver.

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required |
| `status` | STRING(32) | Required; `approved` may be selected on a request |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

### `destinations`

Minimum table until Feature 5.

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

### `reservations`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `requestorUserId` | INTEGER FK | Required; `users.id`; set from the session |
| `partyName` | STRING(100) | Nullable |
| `driverId` | INTEGER FK | Required; `drivers.id` |
| `destinationId` | INTEGER FK | Required; `destinations.id` |
| `startAt` | DATE | Required |
| `endAt` | DATE | Required; after `startAt` |
| `passengerCount` | INTEGER | Required; ≥ 1 |
| `noteType` | STRING(50) | Nullable |
| `noteText` | STRING(2000) | Nullable |
| `status` | STRING(32) | Required; Feature 8 writes `requested` |
| `vehicleId` | INTEGER | Nullable; no foreign key until Feature 3 |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

## Associations (Feature 8)

- `User hasMany Reservation` on `requestorUserId`
- `Reservation belongsTo User` on `requestorUserId`
- `Driver hasMany Reservation` on `driverId`
- `Reservation belongsTo Driver` on `driverId`
- `Destination hasMany Reservation` on `destinationId`
- `Reservation belongsTo Destination` on `destinationId`
