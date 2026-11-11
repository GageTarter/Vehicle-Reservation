# API Reference

**Status:** Feature 11 on `feature-11-weekly-reservation-calendar`. Features 1, 2, 8, 9, and 10 remain.

Auth routes are mounted at `/vehicles`. The starter health check stays at `/api/health`.

## Endpoints

| Method | Path | Auth | Purpose | Introduced |
|--------|------|------|---------|------------|
| `POST` | `/vehicles/auth/google` | No | Verify a Google ID token, create or reuse the user, return the session payload | Feature 1 |
| `POST` | `/vehicles/logout` | Yes | Invalidate the current session token | Feature 1 |
| `GET` | `/vehicles/me` | Yes | Return the signed-in user's account | Feature 2 |
| `PUT` | `/vehicles/me` | Yes | Update `fName` and `lName` for the signed-in user | Feature 2 |
| `DELETE` | `/vehicles/me` | Yes | Delete the signed-in user and that user's sessions | Feature 2 |
| `GET` | `/vehicles/reservations` | Yes | List own reservations, or every reservation when `role` is `admin`. Optional `?status=` filter | Feature 8, Feature 9 |
| `POST` | `/vehicles/reservations` | Yes | Create a request with `status` `requested` and `vehicleId` null | Feature 8 |
| `GET` | `/vehicles/reservations/:id` | Yes | Fetch one reservation the caller may read | Feature 8 |
| `PUT` | `/vehicles/reservations/:id` | Yes | Update a `requested` reservation owned by the caller | Feature 8 |
| `PUT` | `/vehicles/reservations/:id/assignment` | Yes + admin | Assign a vehicle (`reserved`) or mark awaiting (`vehicleId` null) | Feature 9 |
| `POST` | `/vehicles/reservations/pre-trip-notices` | Yes + admin | Send day-before pickup instruction emails | Feature 10 |
| `GET` | `/vehicles/reservations/calendar` | Yes + admin | Reservations overlapping a Monday-start UTC week (`weekStart`) | Feature 11 |
| `GET` | `/vehicles/drivers` | Yes | Approved drivers (`status` `approved`) | Feature 8 |
| `GET` | `/vehicles/destinations` | Yes | Destinations for the request form | Feature 8 |
| `GET` | `/api/health` | No | Process health check | Starter |

### `POST /vehicles/auth/google`

Request:

```json
{ "idToken": "<google-id-token>" }
```

Any `role` in the body is ignored. A new account is always `user`.

Success (flat JSON):

```json
{
  "userId": 1,
  "email": "jane@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "user",
  "token": "<jwt>"
}
```

| Status | When |
|--------|------|
| `201` | First verified sign-in created the user and a session |
| `200` | Existing Google subject signed in and a session was created or reused |
| `401` | Missing, invalid, wrong-audience, or expired ID token, or `email_verified` is not `true`. Body: `{ "message": "Google sign-in failed." }` |

### `POST /vehicles/logout`

Header: `Authorization: Bearer <token>`.

| Status | When |
|--------|------|
| `200` | Session row for that token was deleted. Body: `{ "message": "Signed out." }` |
| `401` | Missing token: `{ "message": "Unauthorized! No token provided." }`. Expired or unknown token: `{ "message": "Unauthorized! Invalid or expired token." }` |

### `GET /vehicles/me`

Header: `Authorization: Bearer <token>`. The user id comes from the session, not from the URL.

Success (`200`):

```json
{
  "userId": 1,
  "email": "jane@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "user"
}
```

The body does not include `token` or `googleId`.

### `PUT /vehicles/me`

Header: `Authorization: Bearer <token>`.

Request:

```json
{ "fName": "Janet", "lName": "Doe" }
```

`email`, `googleId`, and `role` in the body are ignored. `fName` and `lName` must be strings and may be empty.

Success (`200`): the same shape as `GET /vehicles/me`, with the stored names.

| Status | When |
|--------|------|
| `400` | `fName` or `lName` is missing or not a string. Body: `{ "message": "First and last name must be text." }` |
| `401` | Missing token: `{ "message": "Unauthorized! No token provided." }`. Expired or unknown token: `{ "message": "Unauthorized! Invalid or expired token." }` |

### `DELETE /vehicles/me`

Header: `Authorization: Bearer <token>`.

| Status | When |
|--------|------|
| `200` | That user and every session for that user are deleted. Body: `{ "message": "Account deleted." }` |
| `401` | Missing, expired, or unknown token, using the same messages as `GET /vehicles/me` |

### `POST /vehicles/reservations` and `PUT /vehicles/reservations/:id`

Header: `Authorization: Bearer <token>`. Create ignores `status`, `requestorUserId`, and `vehicleId`. Update is allowed only for the owner while `status` is `requested`.

Request:

```json
{
  "driverId": 4,
  "destinationId": 2,
  "startAt": "2026-11-20T14:00:00.000Z",
  "endAt": "2026-11-22T18:00:00.000Z",
  "passengerCount": 12,
  "partyName": "Women's Soccer",
  "noteType": "general",
  "noteText": "Need a 15-passenger van"
}
```

| Status | When |
|--------|------|
| `201` | Created. `status` is `requested` and `vehicleId` is null. |
| `200` | Updated owned `requested` row. |
| `400` | Driver is missing or not approved, destination is missing, end is not after start, passenger count is below 1, or the row is no longer `requested`. |
| `401` | Missing or invalid session. |
| `404` | Update target is missing or belongs to someone else. `{ "message": "Reservation with id=<id> not found." }` |
## Fleet vehicles

Mounted at `/fleets`. Every route requires `Authorization: Bearer <token>`. A vehicle belongs to the signed-in user. Another user's id returns `404`. Create, update, and delete also require `role` `admin`.

JSON fields: `make`, `model`, `year`, `vin`, `purchaseDate`, `color`, `passengerCapacity`, `licensePlateNo`, `licensePlateExp`, `area`. Responses also include `id`. `userId` is not returned. The stored `name` is `${year} ${make} ${model}` and is not a request field.

### `GET /fleets/vehicles`

| Status | When |
|--------|------|
| `200` | That user's vehicles, oldest `createdAt` first |
| `401` | Missing, expired, or unknown token |

### `POST /fleets/vehicles`

| Status | When |
|--------|------|
| `201` | Created. Body is the vehicle JSON |
| `400` | A required field is blank, too long, not a valid date, or the VIN fails the check. A duplicate year, make, and model for that user returns `{ "message": "A vehicle with that year, make, and model already exists." }` |
| `401` | Missing, expired, or unknown token |
| `403` | Signed-in role is not `admin`. Body: `{ "message": "Forbidden! Admin access required." }` |

### `PUT /fleets/vehicles/:id`

| Status | When |
|--------|------|
| `200` | `{ "message": "vehicle was updated successfully." }` |
| `400` | `vehicleId` is not a number, a field is blank (`All fields must be filled.`), or a length, date, or VIN rule fails. Year must be exactly 4 digits. VIN must be exactly 17 characters and valid |
| `401` | Missing, expired, or unknown token |
| `403` | Signed-in role is not `admin`. Body: `{ "message": "Forbidden! Admin access required." }` |
| `404` | `{ "message": "Vehicle with id=${id} not found." }` |

### `DELETE /fleets/vehicles/:id`

| Status | When |
|--------|------|
| `204` | Deleted. Empty body |
| `400` | `{ "message": "vehicleId must be a number." }` |
| `401` | Missing, expired, or unknown token |
| `403` | Signed-in role is not `admin`. Body: `{ "message": "Forbidden! Admin access required." }` |
| `404` | `{ "message": "Vehicle with id=${id} not found." }` |

### `PUT /vehicles/reservations/:id/assignment`

Header: `Authorization: Bearer <token>`. Admin only.

Assign body: `{ "vehicleId": 7 }`. Awaiting body: `{ "vehicleId": null }`.

| Status | When |
|--------|------|
| `200` | Status/vehicle updated |
| `400` | `vehicleId` missing from the body, or not a number/`null` |
| `401` | Missing or invalid session |
| `403` | Authenticated non-admin |
| `404` | Reservation or vehicle not found |
| `409` | `{ "message": "Vehicle is not available for this time." }` — overlapping `reserved` trip |

### `POST /vehicles/reservations/pre-trip-notices`

Header: `Authorization: Bearer <token>`. Admin only. Optional body `{ "now": "<ISO datetime>" }` for tests.

| Status | When |
|--------|------|
| `200` | `{ "sent": <n> }` — pickup emails sent for `reserved` trips starting tomorrow (UTC) that have not been emailed yet |
| `401` | Missing or invalid session |
| `403` | Authenticated non-admin |

Creating a reservation or changing its status also sends **Reservation status updated** through `backend/app/services/mailer.js`. Re-assignment that leaves `status` unchanged does not send another status email.

### `GET /vehicles/reservations/calendar`

Header: `Authorization: Bearer <token>`. Admin only. Query: `weekStart=YYYY-MM-DD` (must be a Monday, UTC week).

| Status | When |
|--------|------|
| `200` | Array of reservations overlapping `[weekStart, weekStart+7days)` |
| `400` | Missing or non-Monday `weekStart`: `{ "message": "weekStart must be a Monday (YYYY-MM-DD)." }` |
| `401` | Missing or invalid session |
| `403` | Authenticated non-admin |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
- `requireAdmin` rejects a non-admin with `403` and `{ "message": "Forbidden! Admin access required." }`.

## Vehicle issues

Mounted at `/vehicleapi` (also `/api/vehicleapi` for the kit frontend). Every route requires `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/vehicleapi/issues` | List issues the caller may access |
| `GET` | `/vehicleapi/issues/:id` | View one issue |
| `POST` | `/vehicleapi/issues` | Report an issue |
| `PATCH` | `/vehicleapi/issues/:id` | Requestor edits their own issue |
| `PATCH` | `/vehicleapi/issues/:id/status` | Admin updates status (`Open`, `In Progress`, `Resolved`) |
| `DELETE` | `/vehicleapi/issues/:id` | Requestor deletes their own issue |
| `GET` | `/vehicleapi/vehicles/:id/issues` | Issue history for a vehicle |

## Vehicle maintenance

Mounted at `/vehicleapi`. Every route requires `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/vehicleapi/maintenance-requests` | List authorized maintenance requests |
| `GET` | `/vehicleapi/maintenance-requests/:id` | View one request |
| `POST` | `/vehicleapi/maintenance-requests` | Create a request (`status` starts `Open`) |
| `PATCH` | `/vehicleapi/maintenance-requests/:id/status` | Update status (`Open`, `In Progress`, `Completed`) |
| `GET` | `/vehicleapi/vehicles/:id/maintenance` | Maintenance history for a vehicle |

## Vehicle mileage and service logs

Mounted at `/vehicleapi` (also `/api/vehicleapi` for the kit frontend). Every route requires `Authorization: Bearer <token>`. Maintenance users, area administrators, and system administrators (`admin`) may access records they are permitted to manage.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/vehicleapi/vehicles/:id/mileage` | List mileage records for a vehicle (newest first) |
| `POST` | `/vehicleapi/vehicles/:id/mileage` | Record current mileage |
| `GET` | `/vehicleapi/vehicles/:id/service-logs` | List service records for a vehicle (newest first) |
| `POST` | `/vehicleapi/vehicles/:id/service-logs` | Record a vehicle service |
| `GET` | `/vehicleapi/mileage-logs/:id` | View one mileage record |
| `GET` | `/vehicleapi/service-logs/:id` | View one service record |

### `POST /vehicleapi/vehicles/:id/mileage`

Request: `{ "date_recorded": "2026-11-05", "current_mileage": 45200 }`  
Success `201`: `{ "message": "Mileage record created successfully.", "mileage_log": { ... } }`

### `POST /vehicleapi/vehicles/:id/service-logs`

Request: `{ "service_date": "2026-11-05", "service_performed": "Oil change and tire rotation" }`  
Success `201`: `{ "message": "Service record created successfully.", "service_log": { ... } }`
