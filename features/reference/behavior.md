# Behavior & Rules Reference

**Living snapshot** of product rules currently implemented through Feature 4 driver management.

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
| The seed script creates the first admin. An `admin` or `area_admin` can later set one role. | `npm run seed:admin` sets the first `admin`. `PUT /vehicles/users/:id/role` writes only `role`. | Feature 1, Feature 2 |
| A session lasts 24 hours and is reused when the same user signs in again before it expires. | JWT `expiresIn: 86400` and `sessions.expirationDate`. The token is stored on the session row. | Feature 1 |
| Every authenticated request resolves to one user. | `authenticate` sets `req.user = { id, role }` from the joined `users` row. | Feature 1 |
| Missing bearer token | `401` `{ "message": "Unauthorized! No token provided." }` | Feature 1 |
| Expired or unknown bearer token | `401` `{ "message": "Unauthorized! Invalid or expired token." }` | Feature 1 |
| Non-admin on `requireAdmin` | `403` `{ "message": "Forbidden! Admin access required." }` | Feature 1 |
| Sign-out deletes the server session, then the browser removes `localStorage` key `user` and opens `login`. The **Sign out** button is on the account page. | `POST /vehicles/logout`, then `Utils.removeItem("user")`. | Feature 1, Feature 2 |
| The browser keeps one session under `localStorage` key `user`. | Login writes the success payload with `Utils.setStore`. Axios sends `Authorization: Bearer <token>`. A `401` clears `user` and redirects to `login`. | Feature 1 |
| Anonymous visitors cannot open protected screens. A signed-in visitor cannot stay on `login`. | `router.beforeEach` | Feature 1 |
| Dismissing the Google prompt stays on `login` and does not call the API. | Login catches cancellation before `authServices.googleSignIn`. | Feature 1 |
| Home shows the first name and the role, and offers **My account**. A signed-in user also sees the menu. | `Home.vue`, `MenuBar.vue` | Feature 1, Feature 2, Feature 3 |
| Signed-in users see centered **Trips**, **Fleet**, and **Management** menus, with profile on the right. **Management** (admin) lists **Drivers**, **Areas**, **Vehicles**, **Destinations**, then **Users** (when `role` is `admin` or `area_admin`). | `MenuBar.vue` | Feature 2–6 |
| Areas are one shared catalogue. Every signed-in user sees every area, sorted by name. Only an admin sees **+ New area**, **Edit area**, and **Delete area**, and only an admin can create, edit, or delete. | `GET /areaapi/areas`, `area.routes.js`, `areaList.vue` | Feature 6 |
| Create and edit use required `name`. A name already in the list blocks submit. Length failures come from the API and show in a `v-alert`. | `areaList.vue`, `area.validation.js` | Feature 6 |
| Vehicles are listed oldest first. The screen columns are make, model, year, VIN, purchase date, color, passenger capacity, license plate number, license plate expiration, area, and actions. | `GET /fleets/vehicles` order `createdAt` ASC | Feature 3 |
| Create and edit use the same ten fields. **Area** is a dropdown filled from `GET /areaapi/areas` (each area's `name`), same as drivers. The button label is **+ New vehicle**. | `VehicleList.vue`, `VehicleForm.vue`, `areaServices.js` | Feature 3, Feature 6 |
| An empty create shows the field's required message and does not call the API. An empty edit shows **All fields must be filled.** and does not call the API. Length, date, and VIN failures come from the API and show in a `v-alert`. | `VehicleForm.vue`, `vehicle.validation.js` | Feature 3 |
| Every signed-in user can list only their own vehicles. Only `role` `admin` can create, edit, or delete, and only their own rows. | `vehicle.routes.js`, `vehicleAccess.js` | Feature 3 |
| Drivers are one shared catalogue. Every signed-in user sees every driver, sorted by last name then first name. Only `role` `admin` sees **+ New driver**, **Edit driver**, and **Delete driver**, and only an admin can create, edit, or delete. | `GET /driverapi/drivers`, `driver.routes.js`, `driverList.vue` | Feature 4 |
| The driver screen columns are name, last name, driver ID, license state, license expiration, approved date, area, status, and actions. Each row also carries `Last, First` for screen readers. | `driverList.vue` | Feature 4 |
| Create and edit use the same eight required fields. **Area** is a dropdown filled from `GET /areaapi/areas` (each area's `name`). Until that endpoint exists, the list is empty and the area can be typed. | `DriverForm.vue`, `areaServices.js` | Feature 4 |
| A blank field on create or edit shows that field's required message and does not call the API. On create, a driver ID already in the list shows **driver id is in use. Enter a different driver id.** and does not call the API. Length and date failures come from the API and show in a `v-alert`. | `driverList.vue`, `driver.validation.js` | Feature 4 |
| The account page shows email, first name, last name, and role from `GET /vehicles/me`. | `Account.vue` | Feature 2 |
| A signed-in user can change only `fName` and `lName`. `email`, `googleId`, and `role` in the body are ignored. A successful save updates `localStorage` key `user`. | `PUT /vehicles/me` | Feature 2 |
| `fName` and `lName` must be strings. Empty strings are allowed. A missing or non-string name is rejected. | `400` `{ "message": "First and last name must be text." }` | Feature 2 |
| Canceling edit or delete stays on the account page and does not call the API. | `Account.vue` | Feature 2 |
| Deleting the account removes that user and their sessions. The browser then removes `localStorage` key `user` and opens `login`. | `DELETE /vehicles/me` returns `{ "message": "Account deleted." }` | Feature 2 |
| An `admin` or `area_admin` can list every user and set one role: `user`, `admin`, `area_admin`, or `maintenance`. A requestor or maintenance user cannot open that page. | `GET /vehicles/users`, `PUT /vehicles/users/:id/role`, `Users.vue` | Feature 2 |
| A new reservation is owned by the signed-in user, starts as `requested`, and has no vehicle. Body `status`, `requestorUserId`, and `vehicleId` are ignored. | `POST /vehicles/reservations` | Feature 8 |
| The named driver must exist and have `status` `approved`. | `400` `{ "message": "Driver must be on the approved drivers list." }` | Feature 8 |
| The destination must exist. `endAt` must be after `startAt`. `passengerCount` must be an integer ≥ 1. | `400` with the matching message from Feature 8 | Feature 8 |
| A requestor reads and lists only their reservations. Another user's id is `404`, not `403`. An admin lists every reservation. | `GET /vehicles/reservations` | Feature 8 |
| A requestor can update a reservation only while `status` is `requested` and they own it. | `PUT /vehicles/reservations/:id` | Feature 8 |
| **My Requests** lists the caller's reservations, and requestors add or edit them in a dialog. Admins see the list without those actions. | route `requests` | Feature 8 |
| Only an admin may assign a vehicle or mark a request awaiting a vehicle. | `PUT /vehicles/reservations/:id/assignment` + `requireAdmin` | Feature 9 |
| Assigning a free vehicle sets `status` `reserved` and that `vehicleId`. Marking awaiting sets `awaiting_vehicle` and clears `vehicleId`. | Assignment body | Feature 9 |
| A vehicle already `reserved` for an overlapping window cannot be assigned again. Adjacent trips that touch at an endpoint are allowed. | `409` `{ "message": "Vehicle is not available for this time." }` | Feature 9 |
| **Need Vehicle** lists `awaiting_vehicle` rows for admins. Non-admins are sent to `home`. | route `requestServicing` | Feature 9 |
| Every reservation status change emails the requestor once with subject **Reservation status updated**. | `mailer.send` via create/assign | Feature 10 |
| Re-assigning a vehicle without changing `status` does not send another status email. | Assignment when already `reserved` | Feature 10 |
| Admins can send day-before pickup emails for `reserved` trips starting tomorrow (UTC). Each trip is emailed at most once (`preTripEmailSentAt`). | `POST /vehicles/reservations/pre-trip-notices` | Feature 10 |
| **Need Vehicle** includes **Send pickup notices**, which shows `Sent <n> pickup notices.` | `RequestServicing.vue` | Feature 10 |
| Admins can open a Monday-start UTC **Weekly calendar** of overlapping reservations with status and vehicle. Requestors get `403` / are redirected home. | `GET /vehicles/reservations/calendar`, route `calendar` | Feature 11 |
| A requestor (`user` / `requestor`) can create, view, edit, and delete their own vehicle issues. Area/system admins update status only. | `/vehicleapi/issues` | Feature 13 |
| Maintenance, area admin, and system admin may manage maintenance requests for vehicles in their area. | `/vehicleapi/maintenance-requests` | Feature 14 |
| Maintenance, area_admin, and system_admin (`admin`) may view and record mileage and service. Other roles receive `403`. | `/vehicleapi` mileage and service-log routes | Feature 15 |
| Area admins and maintenance users are limited to vehicles in their `area_id`. System admins can access all areas. | `403` for other areas | Feature 15 |
| Mileage requires a date and a non-negative number. Service records require a date and description. Missing vehicle is `404`. | Mileage and service POST validation | Feature 15 |
| Mileage and service history is append-only. Lists show newest records first. | New POSTs create new rows; no edit/delete | Feature 15 |
| A requestor can check out only their own assigned reservation. Checkout requires an assigned vehicle and status `Assigned`. | `POST /vehicleapi/reservations/:id/checkout` | Feature 12 |
| Duplicate checkout is rejected; original checkout time is kept. | `409` | Feature 12 |
| Only an area admin (own area) or system admin can mark a reservation `Returned`. Requestors receive `403`. | `POST /vehicleapi/reservations/:id/return` | Feature 12 |
| Return is allowed only from `Checked Out`. Duplicate return is rejected. | `409` | Feature 12 |
| Requestors can view only their own reservation checkout details. Area admins see reservations whose vehicle is in their area. | `GET .../checkout-return` and `GET .../checkout-status` | Feature 12 |
