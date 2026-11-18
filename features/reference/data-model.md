# Data Model Reference

**Status:** Feature 10 adds `reservations.preTripEmailSentAt`. Feature 1–3 and 8–9 tables remain.

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `googleId` | STRING | Required, unique; Google `sub` |
| `fName` | STRING | Required; from `given_name` at sign-in; may be `""`. Feature 2 may replace it |
| `lName` | STRING | Required; from `family_name` at sign-in; may be `""`. Feature 2 may replace it |
| `email` | STRING | Required, unique; from the verified token |
| `role` | STRING(20) | Required. One of `user`, `admin`, `area_admin`, `maintenance`. Google sign-in defaults to `user`. Feature 2 changes it only through `PUT /vehicles/users/:id/role` |

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
| `area_id` | INTEGER | Nullable; used for kit area-scoped access |
| `createdAt` | DATE | Sequelize timestamp. List order |
| `updatedAt` | DATE | Sequelize timestamp |

### `drivers`

Shared catalogue. No `userId` and no association with `users`.

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required |
| `lastName` | STRING(100) | Required. List order, then `name` |
| `driverID` | STRING(100) | Required. Trimmed text such as `CMSC-1113-01`. Not unique in the database. The add dialog blocks a `driverID` already in the loaded list |
| `licenseState` | STRING(100) | Required |
| `licenseExp` | DATEONLY | Required. Calendar-checked, stored as `YYYY-MM-DD` |
| `approvedDate` | DATEONLY | Required. Same rules as `licenseExp` |
| `area` | STRING(100) | Required |
| `status` | STRING(100) | Required. Feature 8 lists a driver on a request only when this is `approved` |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

## Associations

- `User hasMany Session` on `userId`
- `Session belongsTo User` on `userId`
- `User hasMany Vehicle` on `userId`, `onDelete: CASCADE`
- `Vehicle belongsTo User` on `userId`

Wired in `backend/app/models/index.js`.

Deleting a user in Feature 2 also deletes every `sessions` row for that user. `googleId`, `email`, and `role` are not updated by Feature 2.

### `destinations`

Shared catalogue. No `userId`. Feature 5 extends the Feature 8 stub. Feature 8 still lists `{ id, name }` from `GET /vehicles/destinations`.

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required. Unique |
| `addressLine1` | STRING(100) | Required |
| `addressLine2` | STRING(100) | Optional; blank stores `null` |
| `city` | STRING(100) | Required |
| `state` | STRING(100) | Required |
| `zip` | STRING(5) | Required; exactly 5 digits |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

### `areas`

Shared catalogue. No `userId`. Feature 6.

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING(100) | Required. Unique. At most 100 characters |
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
| `checkout_datetime` | DATE | Nullable; set when the requestor checks out (Feature 12) |
| `return_datetime` | DATE | Nullable; set when an admin confirms return (Feature 12) |
| `preTripEmailSentAt` | DATE | Nullable; set when the day-before pickup email is sent (Feature 10) |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

## Associations (Feature 8)

- `User hasMany Reservation` on `requestorUserId`
- `Reservation belongsTo User` on `requestorUserId`
- `Driver hasMany Reservation` on `driverId`
- `Reservation belongsTo Driver` on `driverId`
- `Destination hasMany Reservation` on `destinationId`
- `Reservation belongsTo Destination` on `destinationId`
Deleting a user also deletes that user's vehicles.

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

### `mileage_logs`

| Field | Type | Rules |
|-------|------|-------|
| `mileage_log_id` | INTEGER | Primary key |
| `vehicle_id` | INTEGER | FK to `vehicles.id`; NOT NULL |
| `date_recorded` | DATE | NOT NULL |
| `current_mileage` | INTEGER | NOT NULL; non-negative |

### `service_logs`

| Field | Type | Rules |
|-------|------|-------|
| `service_log_id` | INTEGER | Primary key |
| `vehicle_id` | INTEGER | FK to `vehicles.id`; NOT NULL |
| `service_date` | DATE | NOT NULL |
| `service_performed` | TEXT | NOT NULL |

A vehicle has many mileage logs and many service logs. Each log belongs to one vehicle.
