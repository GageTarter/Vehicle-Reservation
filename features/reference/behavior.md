# Behavior & Rules Reference

**Living snapshot** of product rules currently implemented on `features/1-google-auth`.

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes / payloads |
| [data-model.md](./data-model.md) | Tables / columns |
| **This file** | Ownership, sort, validation, UI rules |

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Sign-in is a Google ID token only. The app does not collect or store a password. | `POST /vehicles/auth/google` verifies the token with audience `GOOGLE_CLIENT_ID` and issuer `https://accounts.google.com` or `accounts.google.com`. | Feature 1 |
| `email_verified` must be `true` or the sign-in is rejected and no user row is created. | `401` `{ "message": "Google sign-in failed." }` | Feature 1 |
| The first verified `sub` creates a `user`. Later sign-ins for that `sub` reuse the account. | `201` on create, `200` on return. A repeated `sub` is not a duplicate-email `400`. | Feature 1 |
| Self-service sign-in cannot choose a role. | Request `role` is ignored. New rows are `user`. | Feature 1 |
| Admin accounts come from `backend/app/scripts/seed-admin.js` (`npm run seed:admin`). | Seed sets `role` to `admin` for a known `googleId`. There is no promote endpoint. | Feature 1 |
| A session lasts 24 hours and is reused when the same user signs in again before it expires. | JWT `expiresIn: 86400` and `sessions.expirationDate`. The token is stored on the session row. | Feature 1 |
| Every authenticated request resolves to one user. | `authenticate` sets `req.user = { id, role }` from the joined `users` row. | Feature 1 |
| Missing bearer token | `401` `{ "message": "Unauthorized! No token provided." }` | Feature 1 |
| Expired or unknown bearer token | `401` `{ "message": "Unauthorized! Invalid or expired token." }` | Feature 1 |
| Non-admin on `requireAdmin` | `403` `{ "message": "Forbidden! Admin access required." }` | Feature 1 |
| Sign-out deletes the server session, then the browser removes `localStorage` key `user` and opens `login`. | `POST /vehicles/logout`, then `Utils.removeItem("user")`. | Feature 1 |
| The browser keeps one session under `localStorage` key `user`. | Login writes the success payload with `Utils.setStore`. Axios sends `Authorization: Bearer <token>`. A `401` clears `user` and redirects to `login`. | Feature 1 |
| Anonymous visitors cannot open protected screens. A signed-in visitor cannot stay on `login`. | `router.beforeEach` | Feature 1 |
| Dismissing the Google prompt stays on `login` and does not call the API. | Login catches cancellation before `authServices.googleSignIn`. | Feature 1 |
| Home shows the first name and the role, and offers **Sign out**. Feature 1 has no `MenuBar`. | `Home.vue`, `Login.vue` | Feature 1 |
