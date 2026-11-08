# Behavior & Rules Reference

**Living snapshot** of product rules currently implemented on `features/2-user-management`.

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
| Sign-out deletes the server session, then the browser removes `localStorage` key `user` and opens `login`. The **Sign out** button is on the account page. | `POST /vehicles/logout`, then `Utils.removeItem("user")`. | Feature 1, Feature 2 |
| The browser keeps one session under `localStorage` key `user`. | Login writes the success payload with `Utils.setStore`. Axios sends `Authorization: Bearer <token>`. A `401` clears `user` and redirects to `login`. | Feature 1 |
| Anonymous visitors cannot open protected screens. A signed-in visitor cannot stay on `login`. | `router.beforeEach` | Feature 1 |
| Dismissing the Google prompt stays on `login` and does not call the API. | Login catches cancellation before `authServices.googleSignIn`. | Feature 1 |
| Home shows the first name and the role, and offers **My account**. There is no `MenuBar`. | `Home.vue` | Feature 1, Feature 2 |
| The account page shows email, first name, last name, and role from `GET /vehicles/me`. | `Account.vue` | Feature 2 |
| A signed-in user can change only `fName` and `lName`. `email`, `googleId`, and `role` in the body are ignored. A successful save updates `localStorage` key `user`. | `PUT /vehicles/me` | Feature 2 |
| `fName` and `lName` must be strings. Empty strings are allowed. A missing or non-string name is rejected. | `400` `{ "message": "First and last name must be text." }` | Feature 2 |
| Canceling edit or delete stays on the account page and does not call the API. | `Account.vue` | Feature 2 |
| Deleting the account removes that user and their sessions. The browser then removes `localStorage` key `user` and opens `login`. | `DELETE /vehicles/me` returns `{ "message": "Account deleted." }` | Feature 2 |
| A requestor can check out only their own assigned reservation. Checkout requires an assigned vehicle and status `Assigned`. | `POST /vehicleapi/reservations/:id/checkout` | Feature 12 |
| Duplicate checkout is rejected; original checkout time is kept. | `409` | Feature 12 |
| Only an area admin (own area) or system admin can mark a reservation `Returned`. Requestors receive `403`. | `POST /vehicleapi/reservations/:id/return` | Feature 12 |
| Return is allowed only from `Checked Out`. Duplicate return is rejected. | `409` | Feature 12 |
| Requestors can view only their own reservation checkout details. Area admins see reservations whose vehicle is in their area. | `GET .../checkout-return` and `GET .../checkout-status` | Feature 12 |
