# Feature: Vehicle Management

**Feature ID:** 3
**Branch pattern:** `feature/3-vehicle-management`
**Status:** Ready
**Created:** 2026-10-28
**Input:** vehicles created and managed by the user currently signed in
**Depends on:** [Feature 1 — User Authentication](feature-1-user-authentification.md)
**Related:** [features/reference/api.md](./reference/api.md), [features/reference/data-model.md](./reference/data-model.md), [features/reference/behavior.md](./reference/behavior.md)


---

  

## User Stories

  

### US-3.1: View created vehicles
**As a** Authorized User  
**I want to** view the list of created vehicles  
**So that** I can keep track of which vehicles the software knows about


**Priority:** P1  
**Independent test:** Display all created vehicles  
**Acceptance scenarios:** see ### US-3.1 under Acceptance Criteria

  

### US-3.2: Edit existing vehicles
**As a** Authorized User
**I want to** be able to edit the values of any created vehicle  
**So that** I can change the values, such as the vehicle make, model, and year, of any created vehicle, to be different than what was inputted on creation

  

**Priority:** P1  
**Independent test:** Edit the existing vehicles  
**Acceptance scenarios:** see ### US-3.2 under Acceptance Criteria

  

### US-3.3: Delete existing vehicles
**As a** Authorized User  
**I want to** delete any of the existing vehicles
**So that** I can no longer see or include them in the vehicle list

  

**Priority:** P1  
**Independent test:** Delete any existing vehicle and clear its data 
**Acceptance scenarios:** see ### US-3.3 under Acceptance Criteria



### US-3.4: Add new vehicles
**As a** Authorized user
**I want to** add a new vehicle
**So that** I can create a new vehicle and change its values



**Priority:** P1
**Indepentent test:** Create a new vehicle
**Acceptance scenarios:** see ### US-3.4 under Acceptance Criteria
  

---

  

## Requirements

  

## Functional Requirements

  

-- **FR-001:** User must fill all fields, including the make, model, year, vin, purchase date, color, passenger capacity, license plate number, license plate expiration, and area.
-- **FR-002:** Created vehicles must be stored for each fleet so that users can view and manage vehicles whenever they are signed in.
-- **FR-003:** Created vehicles must be accessible only to and by all authorized users.
-- **FR-004:** User must fill all fields when making edits to an existing vehicle.
-- **FR-005:** Edited information must be updated in the affected vehicle when a user makes a change.
-- **FR-006:** vehicle must be completely erased when the delete option is selected by the user.
-- **FR-007:** Created vehicles must be listed in added order.

  

---

  

## Assumptions

  

- Feature 1 auth and session handling MUST be merged to `dev` before implementing this feature.
  

## Edge Cases

- Empty or whitespace-only vehicle data fields → `400`.
- `make`, `model`, `color`, or `area` longer than 100 characters → `400`.
- `year` longer than 4 digits → `400`.
- `vin` longer than 17 characters → `400`.
- `purchaseDate` or `licensePlateExpiration` that is not a valid date → `400`.
- `passengerCapacity` that is longer than 4 digits → `400`.
- `licensePlateNo` that is longer than 7 digits → `400`.
- Invalid `vin` → `400`.




## Success Criteria

- **SC-001**: Every Gherkin scenario has at least one automated test before merge.
- **SC-002**: Signed-in user can create, view, edit, and delete vehicles on one screen without being able to access other fleets' private vehicles.
- **SC-003**: `npm test` passes for vehicle API and dashboard vehicles-view behavior.

  

---

  

## Key Entities

  

-- **Vehicle** named group belonging to one fleet (from Feature 4).
-- **Fleet** owns many vehicles (from Feature 1).
-- **User** able to log in to fleet and manage vehicles (from Feature 6).

  

---

  

## Acceptance Criteria (Gherkin)

  

### US-3.4 — Add a vehicle

  

#### Scenario: User creates a new vehicle

*   **Given** I am signed in on the dashboard
*   **When** I click **+ New vehicle**
*   **And** I enter vehicle make `Nissan`
*   **And** I enter vehicle model `Pathfinder`
*   **And** I enter vehicle year `2014`
*   **And** I enter vehicle vin `1M2AR13Y8HM088054`
*   **And** I enter vehicle purchase date `07/11/24`
*   **And** I enter vehicle color `White`
*   **And** I enter vehicle passenger capacity `6`
*   **And** I enter vehicle license plate number `DWD947`
*   **And** I enter vehicle license plate expiration `2026-8-14`
*   **And** I enter vehicle area `Athletics`
*   **Then** the API returns `201` with an vehicle object containing `make`, `model`, `year`, `vin`, `purchaseDate`, `color`, `passengerCapacity`, `licensePlateNo`, `licensePlateExp`, and `area`
*   **And** `2014 Nissan Pathfinder` appears in the vehicles view
*   **And** the add-vehicle dialog closes



#### Scenario: User creates a vehicle with an empty make

*   **Given** I am signed in on the dashboard
*   **When** I open the new vehicle dialog
*   **And** I leave the make field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"vehicle make is required."**
*   **And** no API request is sent
  

#### Scenario: User creates a vehicle with an empty model

*   **Given** I am signed in on the dashboard
*   **When** I open the new vehicle dialog
*   **And** I leave the model field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"vehicle model is required."**
*   **And** no API request is sent
  

#### Scenario: User creates a vehicle with an empty year

*   **Given** I am signed in on the dashboard
*   **When** I open the new vehicle dialog
*   **And** I leave the year field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"vehicle year is required."**
*   **And** no API request is sent
  

#### Scenario: User creates a vehicle with an empty vin

*   **Given** I am signed in on the dashboard
*   **When** I open the new vehicle dialog
*   **And** I leave the vin field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"vehicle vin is required."**
*   **And** no API request is sent
  

#### Scenario: User creates a vehicle with an empty purchase date

*   **Given** I am signed in on the dashboard
*   **When** I open the new vehicle dialog
*   **And** I leave the purchase date field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"vehicle purchase date is required."**
*   **And** no API request is sent
  

#### Scenario: User creates a vehicle with an empty color

*   **Given** I am signed in on the dashboard
*   **When** I open the new vehicle dialog
*   **And** I leave the color field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"vehicle color is required."**
*   **And** no API request is sent
  

#### Scenario: User creates a vehicle with an empty passenger capacity

*   **Given** I am signed in on the dashboard
*   **When** I open the new vehicle dialog
*   **And** I leave the passenger capacity field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"vehicle passenger capacity is required."**
*   **And** no API request is sent
  

#### Scenario: User creates a vehicle with an empty license plate number

*   **Given** I am signed in on the dashboard
*   **When** I open the new vehicle dialog
*   **And** I leave the license plate number field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"vehicle license plate number is required."**
*   **And** no API request is sent
  

#### Scenario: User creates a vehicle with an empty license plate expiration

*   **Given** I am signed in on the dashboard
*   **When** I open the new vehicle dialog
*   **And** I leave the license plate expiration field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"vehicle license plate expiration is required."**
*   **And** no API request is sent
  

#### Scenario: User creates a vehicle with an empty area

*   **Given** I am signed in on the dashboard
*   **When** I open the new vehicle dialog
*   **And** I leave the area field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"vehicle area is required."**
*   **And** no API request is sent
  

#### Scenario: User creates an vehicle with a make that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle make longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "vehicle make must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`
  

#### Scenario: User creates an vehicle with a model that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle model longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "vehicle model must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`
  

#### Scenario: User creates an vehicle with a year that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle year longer than 4 digits
*   **Then** the API returns `400` with `{ "message": "vehicle year must be 4 digits or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`
  

#### Scenario: User creates an vehicle with a vin that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle vin longer than 17 characters
*   **Then** the API returns `400` with `{ "message": "vehicle vin must be 17 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`
  

#### Scenario: User creates an vehicle with an invalid vin

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle vin that is invalid
*   **Then** the API returns `400` with `{ "message": "vehicle vin is invalid." }`
*   **And** the error is displayed in a `<v-alert type="error">`
  

#### Scenario: User creates an vehicle with a purchase date that is not a valid date

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle purchase date that is not a valid date
*   **Then** the API returns `400` with `{ "message": "vehicle purchase date must be a valid date." }`
*   **And** the error is displayed in a `<v-alert type="error">`
  

#### Scenario: User creates an vehicle with a color that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle color longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "vehicle color must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`
  

#### Scenario: User creates an vehicle with a passenger capacity that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle passenger capacity longer than 4 digits
*   **Then** the API returns `400` with `{ "message": "vehicle passenger capacity must be 4 digits or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`
  

#### Scenario: User creates an vehicle with a license plate number that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle license plate number longer than 7 digits
*   **Then** the API returns `400` with `{ "message": "vehicle license plate number must be 7 digits or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`
  

#### Scenario: User creates an vehicle with a license plate expiration that is not a valid date

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle license plate expiration that is not a valid date
*   **Then** the API returns `400` with `{ "message": "vehicle license plate expiration must be a valid date." }`
*   **And** the error is displayed in a `<v-alert type="error">`
  

#### Scenario: User creates an vehicle with an area that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle area longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "vehicle area must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`


---
  

### US-3.1: — Browse the vehicle list

  

#### Scenario: User views existing vehicles

*   **Given** I am signed in on the dashboard as an authorized user
*   **When** I open the vehicles list
*   **Then** vehicles are displayed in created order
  

#### Scenario: User has no existing vehicles

*   **Given** I am signed in on the dashboard
*   **When** I open the vehicles list
*   **Then** no vehicles should be displayed

  

### US-3.2: — Correct a vehicle's information

  

#### Scenario: User edits a vehicle's information
*   **Given** I am signed in on the dashboard
*   **When** I click **Edit vehicle** on an existing vehicle
*   **And** I change any of the original values
*   **And** I confirm the dialog
*   **Then** the API returns `200` with `{ "message": "vehicle was updated successfully." }`
*   **And** the vehicle is visible with updated information in the vehicles view
*   **And** the edit-vehicle dialog closes

  

#### Scenario: User edits a vehicle with any empty information area

*   **Given** I am signed in on the dashboard
*   **When** I open the edit vehicle dialog
*   **And** I leave a field empty or whitespace only
*   **And** I attempt to confirm
*   **Then** inline validation blocks the request
*   **And** I see the message **"All fields must be filled."**
*   **And** no API request is sent

  

#### Scenario: User edits a vehicle with a name that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle name longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "vehicle name must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`



#### Scenario: User edits a vehicle with a model that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle model longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "vehicle model must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

  

#### Scenario: User edits a vehicle with a year that is too long or too short

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle year longer or shorter than 4 digits
*   **Then** the API returns `400` with `{ "message": "vehicle year must be 4 digits." }`
*   **And** the error is displayed in a `<v-alert type="error">`

  

#### Scenario: User edits a vehicle with a vin that is too long or too short

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle vin longer or shorter than 17 characters
*   **Then** the API returns `400` with `{ "message": "vehicle vin must be 17 characters exactly." }`
*   **And** the error is displayed in a `<v-alert type="error">`

  

#### Scenario: User edits a vehicle with a purchase date that is not a valid date

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle purchase date that is not a valid date
*   **Then** the API returns `400` with `{ "message": "vehicle purchase date must be a valid date." }`
*   **And** the error is displayed in a `<v-alert type="error">`

  

#### Scenario: User edits a vehicle with a color that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle color longer than 100 characters
*   **Then** the API returns `400` with `{ "message": "vehicle color must be 100 characters or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

  

#### Scenario: User edits a vehicle with a passenger capacity that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle passenger capacity longer than 4 digits
*   **Then** the API returns `400` with `{ "message": "vehicle passenger capacity must be 4 digits or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

  

#### Scenario: User edits a vehicle with a license plate number that is too long

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle license plate number longer than 7 digits
*   **Then** the API returns `400` with `{ "message": "vehicle license plate number must be 7 digits or fewer." }`
*   **And** the error is displayed in a `<v-alert type="error">`

  

#### Scenario: User edits a vehicle with a license plate expiration that is not a valid date

*   **Given** I am signed in on the dashboard
*   **When** I submit an vehicle license plate expiration that is not a valid date
*   **Then** the API returns `400` with `{ "message": "vehicle license plate expiration must be a valid date." }`
*   **And** the error is displayed in a `<v-alert type="error">`
  


### US-3.3: Remove a vehicle

  

#### Scenario: User removes an vehicle

*   **Given** I am signed in
*   **And** there exists a vehicle named `2014 Nissan Pathfinder`
*   **When** I click the delete icon on the `2014 Nissan Pathfinder` row
*   **And** I confirm the delete dialog
*   **Then** the API returns `200` or `204`
*   **And** the vehicle is removed from the vehicles view

  

---

  

## Data Model Requirements



### `vehicles` table

| Field | Type | Rules |

|-------|------|-------|

| `id` | INTEGER | PK, auto-increment |
| `userId` | INTEGER | Required, FK → `users.id`, `ON DELETE CASCADE` |
| `name` | STRING(100) | Required; unique per (`userId`, `name`); stored and displayed as typed |
| `make` | STRING(100) | Required; stored and displayed as typed |
| `model` | STRING(100) | Required; stored and displayed as typed |
| `year` | STRING(100) | Required; stored and displayed as typed |
| `vin` | STRING(17) | Required; stored and displayed as typed |
| `purchaseDate` | DATE(10) | Required; stored and displayed as typed |
| `color` | STRING(100) | Required; stored and displayed as typed |
| `passengerCapacity` | INT(4) | Required; stored and displayed as typed |
| `licensePlateNo` | STRING(7) | Required; stored and displayed as typed |
| `licensePlateExp` | DATE(10) | Required; stored and displayed as typed |
| `createdAt` | DATE | Sequelize timestamp |
| `updatedAt` | DATE | Sequelize timestamp |

  

### Associations

  

| Association | Rule |

|-------------|------|

| `User` hasMany `vehicle` | `foreignKey` `userId` required; `ON DELETE CASCADE` |

| `vehicle` belongsTo `User` | `userId` set from `req.user.id` on create — never from the client body |

| Unique | Composite unique (`userId`, `name`) as specified in the table above |

  

JSON property names match these columns (`make`, `model`, `year`, `vin`, `purchaseDate`, `color`, `passengerCapacity`, `licensePlateNo`, `licensePlateExp`, `userId`). Sequelize may also return `createdAt` / `updatedAt`; Gherkin does not require the client to display them.

  

  

---

  

## Data Ownership & Isolation

  

Each user owns their catalogue `vehicles` exclusively. List, create, update, and delete are scoped to the signed-in user (Feature 1 session).

  

| Rule | Requirement |

|------|-------------|

| **Read scope** | `GET fleets/vehicles` returns only rows where `userId = req.user.id`, ordered by `createdAt` ASC (**FR-007**) |
| **Write scope** | `PUT` / `DELETE fleets/vehicles/:id` succeed only when the row matches `id` **and** `userId = req.user.id` |
| **Create scope** | `POST fleets/vehicles` sets `userId` from `req.user.id`; ignore any client-supplied `userId` |
| **Cross-user access** | Another user’s vehicle (or unknown `id`) → `404` with `{ "message": "…" }` (not `403`) |
| **UI scope** | `vehicleList.vue` renders only the array returned for the signed-in user; do not mix in other users’ rows |
| **Implementation** | Shared owner lookup in `backend/app/authorization/` (for example `getAccessiblevehicleOrNull`); do not copy `userId` filters by hand in every controller action |
  

Unauthenticated requests to these endpoints → `401`.

  

---

  

## API Requirements

  

Mount prefix is `/fleets` (existing `vehicle.routes.js`). Paths and JSON fields match the running course app (`make`, `model`, `year`, `vin`, `purchaseDate`, `color`, `passengerCapacity`, `licensePlateNo`, `licensePlateExp`). Auth is **Yes** on every row this feature uses (**FR-003**). Do not add query filters, extra fields, or a `{ success, data }` envelope.

  

| Method | Endpoint | Auth | Purpose |

|--------|----------|------|---------|

| `GET` | `/fleets/vehicles` | Yes | List the user's vehicles, `name` ASC |
| `POST` | `/fleets/vehicles` | Yes | Create a vehicle owned by the user |
| `PUT` | `/fleets/vehicles/:id` | Yes | Update a vehicle |
| `DELETE` | `/fleets/vehicles/:id` | Yes | Delete a vehicle |
  

Trailing slashes already present on some Express routes are equivalent to the paths above.

  

**Create request body:**

```json

{

  "make": "Nissan",

  "model": "Pathfinder",
  
  "year": "2014",
  
  "vin": "1M2AR13Y8HM088054",
  
  "purchaseDate": "07/11/24",
  
  "color": "White",
  
  "passengerCapacity": 6,
  
  "licensePlateNo": "DWD947",
  
  "licensePlateExp": "2026-8-14",
  
}

```

  

**Create success** (`201`):

```json

{

  "make": "Nissan",

  "model": "Pathfinder",
  
  "year": "2014",
  
  "vin": "1M2AR13Y8HM088054",
  
  "purchaseDate": "07/11/24",
  
  "color": "White",
  
  "passengerCapacity": 6,
  
  "licensePlateNo": "DWD947",
  
  "licensePlateExp": "2026-8-14",
  
}

```

  

`make`, `model`, `year`, `vin`, `purchaseDate`, `color`, `passengerCapacity`, `licensePlateNo` and `licensePlateExp` are stored and returned as typed.

  

**Update request body:** same nine fields (`make`, `model`, `year`, `vin`, `purchaseDate`, `color`, `passengerCapacity`, `licensePlateNo` `licensePlateExp`).

  

**Update success** (`200`):

```json

{ "message": "vehicle was updated successfully." }

```

  

**Delete success:** `200` or `204` (Gherkin allows either). A `200` body may include a message; clients must treat either status as success.

  

**List success** (`200`): JSON array of vehicle objects (same fields as create). Empty catalogue → `[]`.

  

**Inline-blocked create/edit** (empty or whitespace-only name, start date, or end date): the UI does not send a request. If the API is called anyway, respond `400`.

  

**Quoted validation errors** (`400`): `{ "message": "…" }` with the Gherkin strings:

  

| Condition | `message` |

|-----------|-----------|

| `make` longer than 100 characters | `vehicle make must be 100 characters or fewer.` |

| `model` longer than 100 characters | `vehicle model must be 100 characters or fewer.` |

| `year` longer than 4 digits | `vehicle year must be 4 digits or fewer.` |

| `vin` longer than 17 characters | `vehicle vin must be 17 characters or fewer.` |

| Invalid `vin` | `vehicle vin is invalid.` |

| `purchaseDate` is not a valid date | `vehicle purchase date must be a valid date.` |

| `color` longer than 100 characters | `vehicle color must be 100 characters or fewer.` |

| `passengerCapacity` longer than 4 digits | `vehicle passenger capacity must be 4 digits or fewer.` |

| `licensePlateNo` longer than 7 digits | `vehicle license plate number must be 7 digits or fewer.` |

| `licensePlateExp` is not a valid date | `vehicle license plate expiration must be a valid date.` |

  

**Other errors:** `{ "message": "Human-readable explanation." }`  

**Not found / not owned:** `404` (do not use `403`).  

**Invalid `vehicleId`:** `400` (Edge Cases).  

**Unauthenticated:** `401`.

  

`GET /fleets/vehicles/:id` and `DELETE /fleets/vehicles` (delete-all) exist in the starter routes; this feature does not specify or test them.

  

---

  

## Screen Requirements

  

### [View: vehicles] — route name `vehicles` (`/vehicles`)

  

Existing view: `frontend/src/views/vehicleList.vue`. Client calls: `frontend/src/services/vehicleServices.js` (`GET`/`POST`/`PUT`/`DELETE` `vehicles`). Align labels and validation with Gherkin; keep this route, view, and service.

  

*   Heading: **vehicles**

*   Purpose: signed-in user creates, lists chronologically, edits, and deletes the vehicles on this one screen (**SC-002**)

*   Primary action: **+ New vehicle** (`oc-cta`) — opens the add dialog (US-3.4)

*   Table columns: **Make**, **Model**, **Year**, **VIN**, **Purchase Date**, **Color**, **Passenger Capacity**, **License Plate Number**, **License Plate Expiration**, plus row actions

*   Rows show `make`, `model`, `year`, `vin`, `purchaseDate`, `color`, `passengerCapacity`, `licensePlateNo`, and `licensePlateExp` as stored

*   Row action **Edit vehicle** — opens the edit dialog with that row’s values (US-3.2)

*   Row action: delete icon — opens a confirm-delete dialog (US-3.3). Icon-only control needs an accessible name (for example `aria-label="Delete vehicle"`)

*   **Empty state:** no vehicle rows (US-3.1 “User has no existing vehicles”)

*   **Loading:** in-progress list request (`:loading` or equivalent); do not treat loading as an empty catalogue

*   **Error:** API failures and quoted `400` messages in `<v-alert type="error">` (Gherkin)

  

**Add dialog**

*   Opened by **+ New vehicle**

*   Fields: make, model, year, vin, purchase date, color, passengerCapacity, license plate number, and license plate expiration (all required — **FR-001**)

*   Confirm creates via `POST`; on `201` the dialog closes and `2014 Nissan Pathfinder` (or the typed name) appears in the table

*   Cancel / dismiss closes without a request

  

**Edit dialog**

*   Opened by **Edit vehicle**

*   Same nine fields, prefilled (**FR-004**)

*   Confirm updates via `PUT`; on `200` the dialog closes and the table shows the new values (**FR-005**)

  

**Delete dialog**

*   Opened from the row delete icon

*   Confirm calls `DELETE`; on `200` or `204` the row is gone (**FR-006**)

  

**Inline validation** (no API request) — exact copy from Gherkin:

  

| Field empty or whitespace | Message |

|---------------------------|---------|

| `make` longer than 100 characters | `vehicle make must be 100 characters or fewer.` |

| `model` longer than 100 characters | `vehicle model must be 100 characters or fewer.` |

| `year` longer than 4 digits | `vehicle year must be 4 digits or fewer.` |

| `vin` longer than 17 characters | `vehicle vin must be 17 characters or fewer.` |

| Invalid `vin` | `vehicle vin is invalid.` |

| `purchaseDate` is not a valid date | `vehicle purchase date must be a valid date.` |

| `color` longer than 100 characters | `vehicle color must be 100 characters or fewer.` |

| `passengerCapacity` longer than 4 digits | `vehicle passenger capacity must be 4 digits or fewer.` |

| `licensePlateNo` longer than 7 digits | `vehicle license plate number must be 7 digits or fewer.` |

| `licensePlateExp` is not a valid date | `vehicle license plate expiration must be a valid date.` |

  

**App chrome**

*   `MenuBar` already has **vehicles** (`:to="{ name: 'vehicles' }"`) when a user is signed in — keep it. Gherkin “open the vehicles menu” is this control.

*   This feature does not add or change Login / courses / profile chrome.

  

---

  

## Test Coverage Map

  

Each scenario above must map to at least one automated test. Story IDs follow the Gherkin headings in this file (`### US-3.n`). `it("…")` titles must match the **Scenario** column exactly.

  

If another Feature already added the same scenario titles in these files, extend those files — do not duplicate `it` names.

  

| Story | Scenario | Test file | Test name |

|-------|----------|-----------|-----------|

| US-3.4 | User creates a new vehicle | `backend/tests/vehicles.test.js` | `User creates a new vehicle` |

| US-3.4 | User creates a new vehicle | `frontend/tests/vehicleList.test.js` | `User creates a new vehicle` |

|| US-3.4 | User creates a vehicle with an empty make | `frontend/tests/vehicleList.test.js` | `User creates a vehicle with an empty make` |

| US-3.4 | User creates a vehicle with an empty model | `frontend/tests/vehicleList.test.js` | `User creates a vehicle with an empty model` |

| US-3.4 | User creates a vehicle with an empty year | `frontend/tests/vehicleList.test.js` | `User creates a vehicle with an empty year` |

| US-3.4 | User creates a vehicle with an empty vin | `frontend/tests/vehicleList.test.js` | `User creates a vehicle with an empty vin` |

| US-3.4 | User creates a vehicle with an empty purchase date | `frontend/tests/vehicleList.test.js` | `User creates a vehicle with an empty purchase date` |

| US-3.4 | User creates a vehicle with an empty color | `frontend/tests/vehicleList.test.js` | `User creates a vehicle with an empty color` |

| US-3.4 | User creates a vehicle with an empty passenger capacity | `frontend/tests/vehicleList.test.js` | `User creates a vehicle with an empty passenger capacity` |

| US-3.4 | User creates a vehicle with an empty license plate number | `frontend/tests/vehicleList.test.js` | `User creates a vehicle with an empty license plate number` |

| US-3.4 | User creates a vehicle with an empty license plate expiration | `frontend/tests/vehicleList.test.js` | `User creates a vehicle with an empty license plate expiration` |

| US-3.4 | User creates an vehicle with a make that is too long | `backend/tests/vehicles.test.js` | `User creates an vehicle with a make that is too long` |

| US-3.4 | User creates an vehicle with a make that is too long | `frontend/tests/vehicleList.test.js` | `User creates an vehicle with a make that is too long` |

| US-3.4 | User creates an vehicle with a model that is too long | `backend/tests/vehicles.test.js` | `User creates an vehicle with a model that is too long` |

| US-3.4 | User creates an vehicle with a model that is too long | `frontend/tests/vehicleList.test.js` | `User creates an vehicle with a model that is too long` |

| US-3.4 | User creates an vehicle with a year that is too long | `backend/tests/vehicles.test.js` | `User creates an vehicle with a year that is too long` |

| US-3.4 | User creates an vehicle with a year that is too long | `frontend/tests/vehicleList.test.js` | `User creates an vehicle with a year that is too long` |

| US-3.4 | User creates an vehicle with a vin that is too long | `backend/tests/vehicles.test.js` | `User creates an vehicle with a vin that is too long` |

| US-3.4 | User creates an vehicle with a vin that is too long | `frontend/tests/vehicleList.test.js` | `User creates an vehicle with a vin that is too long` |

| US-3.4 | User creates an vehicle with an invalid vin | `backend/tests/vehicles.test.js` | `User creates an vehicle with an invalid vin` |

| US-3.4 | User creates an vehicle with an invalid vin | `frontend/tests/vehicleList.test.js` | `User creates an vehicle with an invalid vin` |

| US-3.4 | User creates an vehicle with a purchase date that is not a valid date | `backend/tests/vehicles.test.js` | `User creates an vehicle with a purchase date that is not a valid date` |

| US-3.4 | User creates an vehicle with a purchase date that is not a valid date | `frontend/tests/vehicleList.test.js` | `User creates an vehicle with a purchase date that is not a valid date` |

| US-3.4 | User creates an vehicle with a color that is too long | `backend/tests/vehicles.test.js` | `User creates an vehicle with a color that is too long` |

| US-3.4 | User creates an vehicle with a color that is too long | `frontend/tests/vehicleList.test.js` | `User creates an vehicle with a color that is too long` |

| US-3.4 | User creates an vehicle with a passenger capacity that is too long | `backend/tests/vehicles.test.js` | `User creates an vehicle with a passenger capacity that is too long` |

| US-3.4 | User creates an vehicle with a passenger capacity that is too long | `frontend/tests/vehicleList.test.js` | `User creates an vehicle with a passenger capacity that is too long` |

| US-3.4 | User creates an vehicle with a license plate number that is too long | `backend/tests/vehicles.test.js` | `User creates an vehicle with a license plate number that is too long` |

| US-3.4 | User creates an vehicle with a license plate number that is too long | `frontend/tests/vehicleList.test.js` | `User creates an vehicle with a license plate number that is too long` |

| US-3.4 | User creates an vehicle with a license plate expiration that is not a valid date | `backend/tests/vehicles.test.js` | `User creates an vehicle with a license plate expiration that is not a valid date` |

| US-3.4 | User creates an vehicle with a license plate expiration that is not a valid date | `frontend/tests/vehicleList.test.js` | `User creates an vehicle with a license plate expiration that is not a valid date` |

| US-3.1 | User views existing vehicles | `backend/tests/vehicles.test.js` | `User views existing vehicles` |

| US-3.1 | User views existing vehicles | `frontend/tests/vehicleList.test.js` | `User views existing vehicles` |

| US-3.1 | User has no existing vehicles | `backend/tests/vehicles.test.js` | `User has no existing vehicles` |

| US-3.1 | User has no existing vehicles | `frontend/tests/vehicleList.test.js` | `User has no existing vehicles` |

| US-3.2 | User edits an vehicle's information | `backend/tests/vehicles.test.js` | `User edits an vehicle's information` |

| US-3.2 | User edits an vehicle's information | `frontend/tests/vehicleList.test.js` | `User edits an vehicle's information` |

| US-3.2 | User edits an vehicle with an empty name | `frontend/tests/vehicleList.test.js` | `User edits an vehicle with an empty name` |

| US-3.2 | User edits an vehicle with an empty start date | `frontend/tests/vehicleList.test.js` | `User edits an vehicle with an empty start date` |

| US-3.2 | User edits an vehicle with an empty end date | `frontend/tests/vehicleList.test.js` | `User edits an vehicle with an empty end date` |

| US-3.2 | User edits an vehicle with a name that is too long | `backend/tests/vehicles.test.js` | `User edits an vehicle with a name that is too long` |

| US-3.2 | User edits an vehicle with a name that is too long | `frontend/tests/vehicleList.test.js` | `User edits an vehicle with a name that is too long` |

| US-3.2 | User edits an vehicle with a non-date start date | `backend/tests/vehicles.test.js` | `User edits an vehicle with a non-date start date` |

| US-3.2 | User edits an vehicle with a non-date start date | `frontend/tests/vehicleList.test.js` | `User edits an vehicle with a non-date start date` |

| US-3.2 | User edits an vehicle with a non-date end date | `backend/tests/vehicles.test.js` | `User edits an vehicle with a non-date end date` |

| US-3.2 | User edits an vehicle with a non-date end date | `frontend/tests/vehicleList.test.js` | `User edits an vehicle with a non-date end date` |

| US-3.3 | User removes an vehicle | `backend/tests/vehicles.test.js` | `User removes an vehicle` |

| US-3.3 | User removes an vehicle | `frontend/tests/vehicleList.test.js` | `User removes an vehicle` |

  
  

---

  

## Definition of Done

  

*   [ ] Backend and frontend implemented per this spec (**FR-001**–**FR-007** satisfied)

*   [ ] **Success Criteria (SC-001**–**SC-003)** met

*   [ ] All mapped tests pass (`npm test`)

*   [ ] Test Coverage Map complete

*   [ ] `features/reference/data-model.md` updated (if schema changed)

*   [ ] `features/reference/api.md` updated (if API changed)

*   [ ] `features/reference/behavior.md` updated (if product rules changed)

  

---

  

## Out of Scope

  

*   Sign-in, registration, and session issuance ([Feature 1](./feature-1-user-authentification.md))

*   Attaching vehicles to courses, course steps, or `fleetvehicle` quantity/unit on a course ([later course features](./feature-list.md))

*   `GET /fleets/vehicles/:id` and `DELETE /fleets/vehicles` (delete-all) — starter routes; not in this feature’s Gherkin

*   Profile / log out ([Feature 6](./feature-list.md))

*   course PDF export, published-course browsing, and any other capability not in **FR-001**–**FR-007**

*   Multi-user sharing of a catalogue, admin override, or i18n
