# API Reference

**Status:** Feature 1 on `features/1-google-auth`.

Auth routes are mounted at `/vehicles`. The starter health check stays at `/api/health`.

## Endpoints

| Method | Path | Auth | Purpose | Introduced |
|--------|------|------|---------|------------|
| `POST` | `/vehicles/auth/google` | No | Verify a Google ID token, create or reuse the user, return the session payload | Feature 1 |
| `POST` | `/vehicles/logout` | Yes | Invalidate the current session token | Feature 1 |
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

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.
- `requireAdmin` rejects a non-admin with `403` and `{ "message": "Forbidden! Admin access required." }`.
