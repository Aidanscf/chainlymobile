# Chainly Mobile — Complete Backend API Spec

> **Audience:** Backend agent / engineer implementing a server compatible with the Chainly mobile client.
> **Source of truth:** Inferred from live client call sites under `src/`. Machine-readable twin: `docs/openapi.yaml`.
> **Date:** 2026-09-02

---

## 0. How to use this doc

1. Implement endpoints in the **priority order** in §18.
2. Match **exact JSON key names** (client mixes camelCase and snake_case by domain — do not “normalize” keys).
3. Honor **client-generated UUIDs** on create (offline-first / outbox).
4. Return **JSON** with `Content-Type: application/json` on success.
5. On error return non-2xx with a useful body string/JSON; client surfaces `[status] statusText - body`.

---

## 1. Base URL & environment

| Client env var | Role |
|----------------|------|
| `EXPO_PUBLIC_PROXY_BASE_URL` | Preferred full API root (e.g. `https://api.example.com`) |
| `EXPO_PUBLIC_BASE_URL` | Fallback API root |
| `EXPO_PUBLIC_HOST` | Host-only; client may prepend `https://` |

All paths below are relative to that root (e.g. `POST {BASE}/api/auth/login`).

---

## 2. Authentication & headers

### 2.1 Headers the client always sends (`apiFetch`)

| Header | Value |
|--------|--------|
| `Content-Type` | `application/json` |
| `x-chainly-user-id` | Authenticated user UUID **or** device user id |
| `x-chainly-device-user-id` | Device id (only when account auth is active) |
| `Authorization` | `Bearer <accessToken>` when signed in with a valid UUID `user.id` |

### 2.2 Auth model

- Login / signup / WebView token return `{ jwt, user }`.
- Client stores `accessToken = jwt`, optional `refreshToken`, `user: { id, email }`.
- JWT should be a Bearer token identifying the user.
- Prefer UUID for `user.id` (client UUID-gates account sync).

### 2.3 Suggested error codes

| Status | When |
|--------|------|
| 400 | Validation / bad body |
| 401 | Missing/invalid JWT |
| 403 | Authenticated but not allowed |
| 404 | Resource missing |
| 409 | Conflict (duplicate id, already friends, etc.) |
| 500 | Server error |

---

## 3. Auth

### `POST /api/auth/signup`

**Auth:** none

**Request**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "password": "string (required, client min 6)"
}
```

**Response `200`**
```json
{
  "jwt": "string (required)",
  "refreshToken": "string (optional)",
  "user": {
    "id": "uuid (strongly recommended)",
    "email": "string (required)",
    "name": "string (optional)"
  }
}
```

---

### `POST /api/auth/login`

**Auth:** none

**Request**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response `200`:** same shape as signup (`jwt` + `user.email` required).

---

### `GET /api/auth/token`

**Auth:** session/cookie from web account flow (WebView). Not via `apiFetch`.

**Response `200`:** same `{ jwt, user }` shape.

**Related (web):** redirect/callback success path may use `/api/auth/expo-web-success` and postMessage `{ type: "AUTH_SUCCESS", jwt, user }` to the app.

---

## 4. Profile

### `GET /api/profile`

**Auth:** Bearer required for sync

**Response `200`**
```json
{
  "profile": {
    "userProfile": {},
    "notificationPrefs": {},
    "bikeInfo": {},
    "appearance": {}
  },
  "updatedAt": "ISO-8601 string"
}
```

Bags are opaque objects the client merges locally.

---

### `PUT /api/profile`

**Auth:** Bearer

**Request**
```json
{
  "userProfile": {},
  "notificationPrefs": {},
  "bikeInfo": {},
  "appearance": {},
  "syncMeta": {
    "profileUpdatedAt": "ISO-8601"
  }
}
```

**Response `200`**
```json
{ "updatedAt": "ISO-8601" }
```

---

### `POST /api/profile`

**Auth:** preferred (onboarding; best-effort)

**Request**
```json
{
  "userProfile": {},
  "bikeInfo": {},
  "notificationPrefs": {},
  "profile": {
    "email": "string",
    "name": "string"
  }
}
```

**Response:** any 2xx; body ignored.

---

## 5. Bikes

### Shared bike object (server → client)

Prefer **snake_case** on read:

```json
{
  "id": "uuid",
  "name": "string",
  "bike_type": "string",
  "type": "string",
  "image_url": "string|null",
  "health_score": 0,
  "wheel_size": "string|null",
  "wheel_config": "string|null",
  "hub_driver": "string|null",
  "brake_mount": "string|null",
  "rotor_size": 0,
  "drivetrain_speed": 0,
  "suspension_travel_front": 0,
  "suspension_travel_rear": 0,
  "is_tubeless": true,
  "brake_pad_compound": "string|null",
  "brake_fluid_type": "string|null",
  "brand": "string|null",
  "model": "string|null",
  "model_year": 2024,
  "frame_size": "string|null",
  "purchase_date": "YYYY-MM-DD|null",
  "purchase_year": 2024,
  "serial_number": "string|null"
}
```

Client maps: `bike_type` → UI `type`, `image_url` → UI `image`, `health_score` / `healthScore`.

### Component object
```json
{
  "id": "uuid",
  "bike_id": "uuid",
  "component_type": "string",
  "name": "string|null",
  "wear_percent": 0,
  "install_date": "ISO-8601",
  "came_with_bike": true
}
```

### Maintenance event object
```json
{
  "id": "uuid",
  "bike_id": "uuid",
  "action": "string",
  "type": "string",
  "performed_at": "ISO-8601",
  "note": "string|null",
  "meta": {}
}
```

---

### `GET /api/bikes`

**Response `200`:** `{ "bikes": [ /* Bike */ ] }`  
Empty `bikes: []` → client will **not** overwrite local garage.

---

### `POST /api/bikes`

Simple create (outbox / quick add).

**Request**
```json
{
  "id": "uuid (client-generated, required)",
  "name": "string",
  "type": "string"
}
```

**Response:** `201` any JSON ok (body ignored).

---

### `POST /api/bikes/create`

Rich create from Add Bike wizard / pending creates.

**Request**
```json
{
  "bike": {
    "id": "uuid",
    "name": "string",
    "type": "string",
    "bike_type": "string",
    "wheel_size": "string|null",
    "wheel_config": "string",
    "hub_driver": "string|null",
    "brake_mount": "string|null",
    "rotor_size": "number|null",
    "drivetrain_speed": "number|null",
    "suspension_travel_front": "number|null",
    "suspension_travel_rear": "number|null",
    "image_url": "string|null",
    "brand": "string|null",
    "model": "string|null",
    "model_year": "number|null",
    "frame_size": "string|null",
    "purchase_date": "YYYY-MM-DD|null",
    "purchase_year": "number|null",
    "serial_number": "string|null",
    "is_tubeless": true
  },
  "components": [
    {
      "component_type": "string",
      "name": "string|null",
      "wear_percent": 0,
      "install_date": "ISO-8601",
      "came_with_bike": true
    }
  ]
}
```

**Idempotency:** if `bike.id` already exists for this user, treat as upsert / 200.

**Response:** `201`/`200` any JSON ok.

---

### `GET /api/bikes/{bikeId}`

**Response `200`**
```json
{
  "bike": { /* Bike */ },
  "components": [ /* Component */ ],
  "maintenanceEvents": [ /* MaintenanceEvent */ ]
}
```

---

### `PUT /api/bikes/{bikeId}`

Partial patch (**snake_case** fields):

```json
{
  "wheel_size": "string|null",
  "hub_driver": "string|null",
  "brake_mount": "string|null",
  "rotor_size": "number|null",
  "drivetrain_speed": "number|null",
  "suspension_travel_front": "number|null",
  "suspension_travel_rear": "number|null",
  "is_tubeless": true,
  "brake_pad_compound": "string|null",
  "brake_fluid_type": "string|null",
  "wheel_config": "string|null",
  "purchase_date": "YYYY-MM-DD|null",
  "purchase_year": "number|null",
  "serial_number": "string|null",
  "name": "string",
  "image_url": "string|null"
}
```

**Response:** 2xx, body ignored.

---

### `DELETE /api/bikes/{bikeId}`

**Response:** `204` or `200`.

---

### `POST /api/bikes/{bikeId}/components`

**Request**
```json
{
  "component_type": "string (required)",
  "name": "string|null"
}
```

**Response:** 2xx, body ignored. Prefer upsert by `(bikeId, component_type)`.

---

### `POST /api/bikes/{bikeId}/maintenance-log`

**Request**
```json
{
  "type": "string (required)",
  "performedAt": "ISO-8601 (required)",
  "note": "string|null",
  "meta": {}
}
```

**Known `type` values**
- `tire_pressure_check`
- `tire_sealant_topup`
- `brake_pads_replace`
- `brake_bleed`
- `tire_replace_front`
- `tire_replace_rear`
- `chain_replace`
- `drivetrain_service`
- `fork_lower_service`
- `shock_air_can_service`
- `suspension_full_service`

**Response `200`:** same hydrate shape as `GET /api/bikes/{bikeId}`:
```json
{
  "bike": {},
  "components": [],
  "maintenanceEvents": []
}
```

Server should apply wear side-effects and return updated canonical state.

---

## 6. Presets (suspension)

### Preset object (server → client, snake_case)

```json
{
  "id": "uuid",
  "bike_id": "uuid",
  "name": "string",
  "notes": "string|null",
  "terrain_tag": "string|null",
  "weather_tag": "string|null",
  "fork_settings": {
    "psi": 0,
    "reboundClicks": 0,
    "compressionClicks": 0
  },
  "shock_settings": {
    "psi": 0,
    "reboundClicks": 0,
    "compressionClicks": 0
  },
  "created_at": "ISO-8601",
  "last_used_at": "ISO-8601|null"
}
```

### `GET /api/bikes/{bikeId}/presets`

**Response:** `{ "presets": [ /* Preset */ ] }`

### `POST /api/bikes/{bikeId}/presets`

**Request (camelCase from client)**
```json
{
  "id": "uuid",
  "bikeId": "uuid",
  "name": "string",
  "notes": "string|null",
  "terrainTag": "string|null",
  "weatherTag": "string|null",
  "forkSettings": { "psi": 0, "reboundClicks": 0, "compressionClicks": 0 },
  "shockSettings": { "psi": 0, "reboundClicks": 0, "compressionClicks": 0 },
  "lastUsedAt": "ISO-8601|null"
}
```

Accept client `id` (idempotent upsert).

### `PUT /api/presets/{presetId}`

Partial camelCase: any of `lastUsedAt`, `name`, `notes`, `terrainTag`, `weatherTag`, settings objects.

### `DELETE /api/presets/{presetId}`

**Response:** `204` / `200`.

---

## 7. Rides

### Ride object (list / store — prefer snake_case)

```json
{
  "id": "uuid",
  "bike_id": "uuid",
  "distance": 0,
  "distance_km": 0,
  "elevation_gain": 0,
  "elevation_gain_m": 0,
  "descent_m": 0,
  "duration_min": 0,
  "moving_time_sec": 0,
  "terrain_tag": "string|null",
  "weather_tag": "string|null",
  "source": "manual|strava|...",
  "ride_at": "ISO-8601",
  "meta": {
    "title": "string",
    "intensityLevel": "string",
    "notes": "string|null",
    "terrainType": "string",
    "distanceKm": 0,
    "elevationGainM": 0
  },
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

Uncategorized UI also reads: `meta.title`, `distance_km`, `elevation_gain_m`, `ride_at`.

---

### `GET /api/rides`

**Response:** `{ "rides": [ /* Ride */ ] }`

### `GET /api/rides?uncategorized=true`

Return rides missing categorization / `rideFocus`.

**Response:** `{ "rides": [ /* Ride */ ] }`

---

### `POST /api/rides`

**Request (camelCase; dual distance fields common)**
```json
{
  "id": "uuid",
  "bikeId": "uuid",
  "source": "manual",
  "rideAt": "ISO-8601 or date string",
  "durationMin": "number|null",
  "distance": "number|null",
  "distanceKm": "number|null",
  "elevationGain": "number|null",
  "elevationGainM": "number|null",
  "descentM": "number|null",
  "movingTimeSec": "number|null",
  "terrainTag": "string|null",
  "weatherTag": "string|null",
  "meta": {}
}
```

**Response `201`**
```json
{
  "ride": { "id": "uuid" }
}
```
Client requires an `id` (on `ride` or top-level).

---

### `PATCH /api/rides/{rideId}`

Categorize ride (leagues / Strava review).

**Request**
```json
{
  "rideFocus": "flow | tech | climb"
}
```

**Response `200`**
```json
{
  "rideId": "uuid",
  "characterUpdate": {
    "badge": "string",
    "ridingType": "string",
    "overallScore": 0
  }
}
```

---

### `DELETE /api/rides/{rideId}`

**Response:** `204` / `200`.

---

## 8. Workorders (service records)

### Workorder object (snake_case)

```json
{
  "id": "uuid",
  "bike_id": "uuid",
  "title": "string",
  "service_date": "YYYY-MM-DD",
  "image_url": "string",
  "created_at": "ISO-8601",
  "ai_status": "pending|running|completed|failed|null",
  "ai_summary": {},
  "ai_summary_text": "string|null",
  "ai_confidence": 0,
  "ai_created_at": "ISO-8601|null",
  "ai_error": "string|null",
  "pending": false
}
```

### `GET /api/bikes/{bikeId}/workorders?limit=50`

**Response:** `{ "workorders": [ /* Workorder */ ] }`

### `POST /api/bikes/{bikeId}/workorders`

**Request (camelCase)**
```json
{
  "id": "uuid",
  "title": "string",
  "serviceDate": "YYYY-MM-DD",
  "imageUrl": "string"
}
```

### `POST /api/workorders/analyze`

**Request (snake_case)**
```json
{
  "bike_id": "uuid",
  "workorder_id": "uuid",
  "image_url": "string"
}
```

**Response `200`**
```json
{
  "summary": {},
  "summary_text": "string",
  "confidence": 0.0
}
```

Persist AI fields on the workorder.

### `DELETE /api/workorders/{workorderId}`

**Response:** `204` / `200`.

---

## 9. Strava integration

Server holds Strava OAuth tokens per user. Mobile uses deep link `chainly://strava/callback`.

### `GET /api/strava/status`

**Response `200`**
```json
{
  "connected": true,
  "clientId": "string (Strava app client id for OAuth UI)",
  "athlete": {
    "username": "string",
    "displayName": "string"
  },
  "lastSyncAt": "ISO-8601|null",
  "lastError": "string|null",
  "lastErrorAt": "ISO-8601|null"
}
```

### `POST /api/strava/exchange`

**Request:** `{ "code": "oauth_authorization_code" }`

Exchange code for tokens; store against user.

### `POST /api/strava/sync`

Pull recent activities into `/api/rides` (source `strava`). Body none.

### `POST /api/strava/disconnect`

Revoke/delete stored tokens. Body none.

---

## 10. Friends / social

All snake_case. Auth required.

### `GET /api/friends/me`

**Response**
```json
{
  "friend_code": "string",
  "pending_incoming_count": 0,
  "incoming_requests": [
    { "id": "uuid", "requester_name": "string" }
  ],
  "outgoing_requests": [
    { "id": "uuid", "addressee_name": "string" }
  ]
}
```

### `GET /api/friends/list`

**Response**
```json
{
  "friends": [
    {
      "id": "uuid",
      "display_name": "string",
      "avatar_url": "string|null",
      "league_tier": "string|null",
      "league_rank": 0,
      "overall_score": 0,
      "stat_tree_summary": {},
      "bike_health_score": 0
    }
  ]
}
```

### `GET /api/friends/profile?user_id={uuid}`

**Response**
```json
{
  "profile": {
    "id": "uuid",
    "display_name": "string",
    "avatar_url": "string|null",
    "league_tier": "string|null",
    "league_rank": 0,
    "overall_score": 0,
    "bike_health_score": 0,
    "stat_tree": {}
  }
}
```

### `POST /api/friends/request`

**Request:** `{ "friend_code": "string" }`

**Response:** `{ "status": "pending" | "already_friends" | "already_pending" | "accepted" | "not_found" | "self" }`

### `POST /api/friends/request/respond`

**Request:** `{ "request_id": "uuid", "action": "accept" | "decline" }`

**Response:** `{ "status": "accepted" | "declined" | ... }`

### `POST /api/friends/nudge`

**Request:** `{ "friend_user_id": "uuid" }`

**Response:** `{ "status": "sent" | "failed_no_token" | ... }`  
(Push notification to friend if token exists.)

---

## 11. AI jobs (async)

Generic job runner used by suspension baseline, media analyzer, photo mechanic, gear recommender, trip planner.

### `POST /api/ai/job`

**Request**
```json
{
  "type": "string",
  "input": {}
}
```

**Response `200`**
```json
{
  "job": {
    "id": "uuid",
    "status": "queued|running|completed|failed",
    "progress": 0,
    "result": null
  },
  "cached": false
}
```

If work is instant, return `status: "completed"` with `result` immediately.

### `GET /api/ai/job/{jobId}`

**Response**
```json
{
  "job": {
    "id": "uuid",
    "status": "completed|failed|running|queued",
    "progress": 0,
    "result": {},
    "error": "string|null"
  }
}
```

Client polls until `completed` or `failed`.

### Known job `type` values

| type | `input` (as sent) | `result` expected |
|------|-------------------|-------------------|
| `suspension_baseline` | `{ weightKg, ridingStyle, terrainBias[], skillLevel, conditions, bikeTravelFrontMm, bikeTravelRearMm, forkName, shockName }` | `{ forkSettings, shockSettings }` each with `psi`, `reboundClicks`, `compressionClicks` |
| `media_analyzer` | `{ mediaUri, mediaType, ridingType, options, previousOverallScore }` | analyzer payload incl. `shareCardData.badge`, `ridingType`, `overallScore` |
| `photo_mechanic` | `{ imageUri, useSample }` | diagnosis session object |
| `gear_recommender` | `{ wizard, bikeProfile, riderCharacter, userProfile, bikeInfo, currentPart, standards }` | gear results (client normalizes) |
| `trip_planner` | planner wizard payload | plan JSON |

---

## 12. Mechanic (sync AI)

### `POST /api/ai/mechanic/triage`

**Request**
```json
{
  "issue_text": "string",
  "bike_profile": {
    "bike_id": "uuid",
    "bike_name": "string",
    "bike_type": "string",
    "wheel_size": "string|null",
    "hub_driver": "string|null",
    "brake_mount": "string|null",
    "rotor_size": "number|null",
    "drivetrain_speed": "number|null",
    "suspension_travel_front": "number|null",
    "suspension_travel_rear": "number|null",
    "is_tubeless": true,
    "brake_pad_compound": "string|null",
    "brake_fluid_type": "string|null",
    "brake_brand": "string|null",
    "brand": "string|null",
    "model": "string|null",
    "model_year": "number|null",
    "frame_size": "string|null"
  }
}
```

`bike_profile` may be `null`.

**Response**
```json
{
  "triage": {
    "follow_up_questions_needed": true,
    "follow_up_questions": [
      {
        "id": "q1",
        "question": "string",
        "type": "yes_no | select",
        "options": ["A", "B"]
      }
    ]
  }
}
```

---

### `POST /api/ai/mechanic/diagnose`

**Request**
```json
{
  "issue_text": "string",
  "answers": { "q1": "yes" },
  "bike_profile": {}
}
```

**Response**
```json
{
  "diagnosis": {
    "diagnosisTitle": "string",
    "confidence": 0.0,
    "summary": "string",
    "warnings": ["string"],
    "fixSteps": ["string"],
    "system_area": "string|null"
  }
}
```

---

## 13. Gear recommendations

### `POST /api/gear/recommendations/refresh`

**Request (camelCase)**
```json
{
  "bikeProfile": {
    "name": "string",
    "brand": "string",
    "model": "string",
    "modelYear": 2024,
    "discipline": "string",
    "wheelSize": "string",
    "hubDriver": "string",
    "drivetrainSpeed": 12,
    "brakeMount": "string",
    "rotorSizeFront": 180,
    "rotorSizeRear": 180,
    "isTubeless": true,
    "compatibilityProfile": {}
  },
  "riderProfile": {
    "skillLevel": "string",
    "ridingStylePreferences": [],
    "primaryDiscipline": "string",
    "budgetRange": "string",
    "upgradeGoals": [],
    "brandPreferences": [],
    "brandAvoid": []
  },
  "preferences": {
    "budgetMin": 0,
    "budgetMax": 0,
    "brandsPreferred": [],
    "brandsAvoid": [],
    "priority": "value"
  },
  "unknowns": ["string"],
  "region": "string",
  "currency": "CAD | USD",
  "context": { "intent": "recommendations_refresh" }
}
```

**Response**
```json
{
  "recommendedGear": [
    {
      "gearId": "string",
      "brand": "string",
      "model": "string",
      "title": "string",
      "category": "string",
      "keySpecs": [],
      "whyRecommended": [],
      "bestFor": [],
      "imageUrl": "string",
      "estimatedPrice": { "min": 0, "max": 0, "currency": "CAD" },
      "bikeFit": {
        "fitConfidence": 0,
        "compatibleBecause": [],
        "fitChecks": [],
        "incompatibilityRisks": []
      },
      "pros": [],
      "cons": [],
      "requiredExtras": []
    }
  ],
  "notes": ["string"]
}
```

---

## 14. Riding logs & goals

> List GETs currently use raw `fetch` (may omit Bearer if not same-origin). Prefer requiring auth and ensure mobile base URL is set so `apiFetch`-style headers can be added later. Implement auth the same as other endpoints.

### `GET /api/riding-goals`

**Response**
```json
{
  "personalBests": {
    "jump": 0,
    "drop": 0
  },
  "goals": {
    "jump": [
      { "threshold_value": 0, "completed": false }
    ],
    "drop": [
      { "threshold_value": 0, "completed": false }
    ]
  }
}
```

### `GET /api/riding-logs`

**Response**
```json
{
  "logs": [
    {
      "id": "uuid",
      "type": "jump | drop",
      "status": "pending | measured | failed",
      "measured_value": 0,
      "confidence": 0,
      "created_at": "ISO-8601",
      "image_url": "string",
      "bike_id": "uuid|null"
    }
  ]
}
```

### `POST /api/riding-logs`

**Request**
```json
{
  "type": "jump | drop",
  "image_url": "string",
  "bike_id": "uuid|null",
  "status": "pending",
  "marker_a_x": 0,
  "marker_a_y": 0,
  "marker_b_x": 0,
  "marker_b_y": 0
}
```

**Response:** `{ "log": { "id": "uuid" } }` — `log.id` required.

### `POST /api/riding-logs/analyze`

**Request**
```json
{
  "riding_log_id": "uuid",
  "type": "jump | drop",
  "image_url": "string",
  "wheel": { "wheel_size_label": "string" },
  "markers": {
    "a": { "x": 0, "y": 0 },
    "b": { "x": 0, "y": 0 }
  }
}
```

**Response**
```json
{
  "type": "jump | drop",
  "value_ft": 0,
  "confidence": 0,
  "notes": "string|null",
  "status": "measured | failed"
}
```

Update the log row accordingly.

---

## 15. Analytics events

### `POST /api/events`

**Auth:** optional (device id or Bearer)

**Request**
```json
{
  "type": "string",
  "payload": {}
}
```

**Response:** `200` `{ "ok": true }` (body ignored by client).

**Known event types**
- `ui.bike.deleted`, `ui.bike.added`, `ui.bike.created`, `ui.bike.spec_updated`
- `ui.component.updated`
- `ui.ride.created`
- `wear.local_applied`
- `ui.workorder.created`, `ui.workorder.analyze_clicked`, `ui.workorder.analyze_success`, `ui.workorder.analyze_failed`, `ui.workorder.deleted`

---

## 16. Naming conventions (critical)

| Domain | Request casing | Response casing |
|--------|----------------|-----------------|
| Auth | camel | camel (`jwt`, `user`) |
| Profile | camel | camel |
| Bikes create/update | **snake** on bike fields | snake |
| Rides create | **camel** | list often **snake**; uncategorized also `distance_km` |
| Ride categorize | camel (`rideFocus`) | camel (`characterUpdate`) |
| Presets write | camel | read snake |
| Friends | snake | snake |
| Workorders create | camel | read snake |
| Workorders analyze | snake | snake |
| Mechanic | snake | snake |
| Gear refresh | camel | camel |
| Riding logs | snake | snake / `value_ft` |

**Do not** force one casing style globally — mirror the tables above.

---

## 17. Offline / idempotency rules

1. Client often creates resources offline with a UUID `id`, then syncs via outbox.
2. `POST` with an existing id for the same user → upsert / return success (not 409 unless truly conflicting ownership).
3. Outbox ops include: create/update/delete bike, create ride, delete ride, presets CRUD, profile save, upsert component, create workorder.
4. Empty `GET /api/bikes` → `{ bikes: [] }` must mean “no bikes”, but client currently skips overwrite when empty — prefer returning real list always after first sync.

---

## 18. Implementation priority

### P0 — app boots & core garage
1. `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/token`
2. `GET|PUT|POST /api/profile`
3. `GET|POST /api/bikes`, `POST /api/bikes/create`, `GET|PUT|DELETE /api/bikes/{id}`
4. `POST /api/bikes/{id}/components`, `POST /api/bikes/{id}/maintenance-log`
5. `GET|POST /api/rides`, `DELETE /api/rides/{id}`
6. `POST /api/events`

### P1 — suspension & Strava
7. Presets CRUD
8. Strava status / exchange / sync / disconnect
9. `GET /api/rides?uncategorized=true`, `PATCH /api/rides/{id}`
10. `POST /api/ai/job` + `GET /api/ai/job/{id}` (`suspension_baseline` minimum)

### P2 — social & service
11. Friends suite
12. Workorders suite + analyze

### P3 — AI features
13. Mechanic triage/diagnose
14. Gear recommendations refresh
15. Riding logs + goals
16. Remaining AI job types (`media_analyzer`, `photo_mechanic`, `gear_recommender`, `trip_planner`)

---

## 19. Suggested data model (minimal)

```
users (id uuid PK, email unique, password_hash, name, friend_code unique, created_at)
profiles (user_id PK FK, user_profile jsonb, notification_prefs jsonb, bike_info jsonb, appearance jsonb, updated_at)
bikes (id uuid PK, user_id FK, ...snake fields..., created_at, updated_at)
components (id uuid PK, bike_id FK, component_type, name, wear_percent, ...)
maintenance_events (id uuid PK, bike_id FK, type/action, performed_at, note, meta jsonb)
presets (id uuid PK, bike_id FK, name, notes, terrain_tag, weather_tag, fork_settings jsonb, shock_settings jsonb, last_used_at)
rides (id uuid PK, user_id FK, bike_id FK, source, ride_at, distance_km, elevation_gain_m, ..., meta jsonb, ride_focus)
workorders (id uuid PK, bike_id FK, title, service_date, image_url, ai_* fields)
friendships / friend_requests
strava_connections (user_id PK, access_token, refresh_token, athlete jsonb, last_sync_at, last_error)
ai_jobs (id uuid PK, user_id FK, type, status, progress, input jsonb, result jsonb, error)
riding_logs / riding_goals
events (id, user_id nullable, device_user_id, type, payload jsonb, created_at)
```

---

## 20. CORS & mobile notes

- Allow mobile / Expo origins in CORS if browser-based.
- Accept `Authorization` and custom `x-chainly-*` headers.
- HTTPS in production.
- Image URLs for workorders / riding logs may be remote (upload pipeline is separate: `/_create/api/upload/*` is **not** part of this product API).

---

## 21. Quick smoke checklist

```bash
# Auth
curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"t@example.com","password":"secret1"}'

# Login
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"t@example.com","password":"secret1"}' | jq -r .jwt)

# Bikes
curl -s "$BASE/api/bikes" -H "Authorization: Bearer $TOKEN" -H "x-chainly-user-id: <user-uuid>"

# Create bike
curl -s -X POST "$BASE/api/bikes/create" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -H "x-chainly-user-id: <user-uuid>" \
  -d '{"bike":{"id":"00000000-0000-4000-8000-000000000001","name":"Trail","type":"Trail","bike_type":"Trail"},"components":[]}'
```

---

## 22. Endpoint inventory

| Method | Path |
|--------|------|
| POST | `/api/auth/signup` |
| POST | `/api/auth/login` |
| GET | `/api/auth/token` |
| GET, PUT, POST | `/api/profile` |
| GET, POST | `/api/bikes` |
| POST | `/api/bikes/create` |
| GET, PUT, DELETE | `/api/bikes/{bikeId}` |
| POST | `/api/bikes/{bikeId}/components` |
| POST | `/api/bikes/{bikeId}/maintenance-log` |
| GET, POST | `/api/bikes/{bikeId}/presets` |
| GET, POST | `/api/bikes/{bikeId}/workorders` |
| PUT, DELETE | `/api/presets/{presetId}` |
| GET, POST | `/api/rides` |
| GET | `/api/rides?uncategorized=true` |
| PATCH, DELETE | `/api/rides/{rideId}` |
| POST | `/api/workorders/analyze` |
| DELETE | `/api/workorders/{workorderId}` |
| GET | `/api/strava/status` |
| POST | `/api/strava/exchange` |
| POST | `/api/strava/sync` |
| POST | `/api/strava/disconnect` |
| GET | `/api/friends/me` |
| GET | `/api/friends/list` |
| GET | `/api/friends/profile` |
| POST | `/api/friends/request` |
| POST | `/api/friends/request/respond` |
| POST | `/api/friends/nudge` |
| POST | `/api/ai/job` |
| GET | `/api/ai/job/{jobId}` |
| POST | `/api/ai/mechanic/triage` |
| POST | `/api/ai/mechanic/diagnose` |
| POST | `/api/gear/recommendations/refresh` |
| GET | `/api/riding-goals` |
| GET, POST | `/api/riding-logs` |
| POST | `/api/riding-logs/analyze` |
| POST | `/api/events` |

---

**Also see:** `docs/openapi.yaml` for a machine-readable subset. Prefer this Markdown when shapes conflict — it mirrors the live client.
