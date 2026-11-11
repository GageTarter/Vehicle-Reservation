# API Reference

**Status:** Feature 2 on `features/2-user-management`. Feature 1 auth routes remain.

Auth routes are mounted at `/vehicles`. The starter health check stays at `/api/health`.

## Endpoints

| Method | Path | Auth | Purpose | Introduced |
|--------|------|------|---------|------------|
| `POST` | `/vehicles/auth/google` | No | Verify a Google ID token, create or reuse the user, return the session payload | Feature 1 |
| `POST` | `/vehicles/logout` | Yes | Invalidate the current session token | Feature 1 |
| `GET` | `/vehicles/me` | Yes | Return the signed-in user's account | Feature 2 |
| `PUT` | `/vehicles/me` | Yes | Update `fName` and `lName` for the signed-in user | Feature 2 |
| `DELETE` | `/vehicles/me` | Yes | Delete the signed-in user and that user's sessions | Feature 2 |
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
