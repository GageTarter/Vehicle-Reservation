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
| `GET` | `/vehicleapi/reservations/:id/checkout-return` | Yes | View checkout and return information for one reservation | Feature 12 |
| `POST` | `/vehicleapi/reservations/:id/checkout` | Requestor (own reservation) | Record vehicle checkout | Feature 12 |
| `POST` | `/vehicleapi/reservations/:id/return` | Area admin / system admin | Mark a checked-out vehicle as returned | Feature 12 |
| `GET` | `/vehicleapi/reservations/checkout-status` | Area admin / system admin | List reservations and checkout/return statuses | Feature 12 |
| `GET` | `/vehicleapi/reservations/:id/checkout-return` | Yes | View checkout and return information | Feature 12 |
| `POST` | `/vehicleapi/reservations/:id/checkout` | Requestor (own reservation) | Record vehicle checkout | Feature 12 |
| `POST` | `/vehicleapi/reservations/:id/return` | Area admin / system admin | Mark a checked-out vehicle as returned | Feature 12 |
| `GET` | `/vehicleapi/reservations/checkout-status` | Area admin / system admin | List reservations and checkout/return statuses | Feature 12 |

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

### Feature 12 checkout and return

Success checkout (`200`): `{ "message": "Vehicle checkout recorded successfully.", "reservation": { "reservation_id", "status": "Checked Out", "checkout_datetime", "return_datetime": null, ... } }`

Success return (`200`): `{ "message": "Vehicle return recorded successfully.", "reservation": { ..., "status": "Returned", "return_datetime" } }`

Invalid status transition or duplicate checkout/return is `409`. Another user's reservation is `403`. Missing reservation is `404`.

### Feature 12 checkout and return

Checkout and return timestamps are set by the server. Duplicate checkout/return and checkout without a vehicle return `409`. A requestor marking return returns `403`.

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
- `requireAdmin` rejects a non-admin with `403` and `{ "message": "Forbidden! Admin access required." }`.
