# Graphics-based Password Authentication System

A full-stack graphical password authentication system with **4 authentication methods**, built with React 19 + Vite (frontend) and FastAPI + SQLAlchemy (backend).

## Authentication Methods

| #   | Method                      | Concept                                                                                      |
| --- | --------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | **Cued Click Points (CCP)** | User clicks one point on each of 3–6 sequential images; each click determines the next image |
| 2   | **PassFaces (Recognition)** | User picks their secret images from grids of decoys over multiple rounds                     |
| 3   | **Grid Draw (Pattern)**     | User draws a path on an 8×8 grid overlaid on their image                                     |
| 4   | **Pure Click-Point**        | User clicks 3–5 precise points on a single static image                                      |

---

## User Review Required

> [!IMPORTANT]
> **4 Auth Methods in One App** — Each method will have its own registration & login flow, selectable from a central dashboard. The user picks their preferred method when creating their account.

> [!WARNING]
> **PassFaces requires a face/image pool** — 50 IMAGES present in the FFHQ_DATASET, use any of the 5 images and there will be four rounds in total, each round consists of multiple images and one of them would be (one of the images which user selected during the registration)

> [!IMPORTANT]
> **SQLite is used** — This is a development/demo database. For production, you'd swap the connection string to PostgreSQL.

---

## Project Structure

```
SE_PROJECT/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry, CORS, static mounts
│   │   ├── config.py            # Settings (SECRET_KEY, DB URL, etc.)
│   │   ├── database.py          # SQLAlchemy engine, session, Base
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── security.py          # JWT creation/verification, SHA-256 utils
│   │   ├── auth_utils.py        # Grid-snap hashing, Euclidean distance, normalization
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── ccp.py           # /api/ccp/register, /api/ccp/login
│   │       ├── passfaces.py     # /api/passfaces/register, /api/passfaces/login, /api/passfaces/pool
│   │       ├── grid_draw.py     # /api/grid-draw/register, /api/grid-draw/login
│   │       └── click_point.py   # /api/click-point/register, /api/click-point/login
│   ├── static/
│   │   ├── uploads/             # User-uploaded images (UUID filenames)
│   │   └── passfaces/           # Pool of face/avatar images for PassFaces
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx              # Router setup
│   │   ├── index.css            # Global design system
│   │   ├── api/
│   │   │   └── axios.js         # Axios instance with interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # JWT token state management
│   │   ├── pages/
│   │   │   ├── Landing.jsx       # Hero page with method selection
│   │   │   ├── Dashboard.jsx     # Post-login dashboard
│   │   │   ├── ccp/
│   │   │   │   ├── CCPRegister.jsx
│   │   │   │   └── CCPLogin.jsx
│   │   │   ├── passfaces/
│   │   │   │   ├── PassFacesRegister.jsx
│   │   │   │   └── PassFacesLogin.jsx
│   │   │   ├── grid-draw/
│   │   │   │   ├── GridDrawRegister.jsx
│   │   │   │   └── GridDrawLogin.jsx
│   │   │   └── click-point/
│   │   │       ├── ClickPointRegister.jsx
│   │   │       └── ClickPointLogin.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── MethodCard.jsx    # Card UI for each auth method
│   │   │   ├── CanvasClickArea.jsx  # Reusable Canvas component
│   │   │   ├── GridOverlay.jsx   # 8×8 grid overlay for Grid Draw
│   │   │   ├── PassFaceGrid.jsx  # 3×3 image selection grid
│   │   │   └── ProtectedRoute.jsx
│   │   └── utils/
│   │       ├── normalize.js      # Coordinate normalization helpers
│   │       └── lockout.js        # Brute-force lockout logic
│   ├── package.json
│   ├── vite.config.js
│   └── .env
└── README.md
```

---

## Proposed Changes

### Component 1: Backend Core

#### [NEW] `backend/requirements.txt`

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.35
python-jose[cryptography]==3.3.0
python-multipart==0.0.12
pydantic==2.9.0
pydantic-settings==2.5.0
python-dotenv==1.0.1
aiofiles==24.1.0
```

#### [NEW] `backend/.env`

- `SECRET_KEY` — random 64-char hex string
- `DATABASE_URL` — `sqlite:///./graphauth.db`
- `ACCESS_TOKEN_EXPIRE_MINUTES` — `60`

#### [NEW] `backend/app/config.py`

- Pydantic `Settings` class reading from `.env`
- Exports singleton `settings` object

#### [NEW] `backend/app/database.py`

- SQLAlchemy engine with `connect_args={"check_same_thread": False}` for SQLite
- `SessionLocal` factory
- `Base` declarative base
- `get_db` dependency generator

#### [NEW] `backend/app/models.py`

SQLAlchemy models:

**`User`** table:
| Column | Type | Notes |
|--------|------|-------|
| `id` | Integer PK | Auto-increment |
| `email` | String(100) | Unique, indexed |
| `auth_method` | String(20) | `ccp`, `passfaces`, `grid_draw`, `click_point` |
| `image_path` | String(255) | Path to uploaded image (nullable for passfaces) |
| `click_hash` | Text | SHA-256 hash of grid-snapped coordinates |
| `click_data` | Text | JSON string of normalized coordinates (encrypted) |
| `tolerance` | Float | Default 0.05 (5%) |
| `passface_ids` | Text | JSON array of selected face image IDs (passfaces only) |
| `grid_pattern` | Text | JSON array of grid node sequence (grid_draw only) |
| `pattern_hash` | Text | SHA-256 hash of grid pattern |
| `created_at` | DateTime | Auto-set |

#### [NEW] `backend/app/schemas.py`

Pydantic models for:

- `UserRegisterCCP` — email, image (file), clicks (list of {x, y})
- `UserLoginCCP` — email, clicks
- `UserRegisterPassFaces` — email, selected_face_ids (list of ints)
- `UserLoginPassFaces` — email, selected_face_ids per round
- `UserRegisterGridDraw` — email, image (file), pattern (list of node indices)
- `UserLoginGridDraw` — email, pattern
- `UserRegisterClickPoint` — email, image (file), clicks (list of {x, y})
- `UserLoginClickPoint` — email, clicks
- `TokenResponse` — access_token, token_type
- `UserResponse` — id, email, auth_method

#### [NEW] `backend/app/security.py`

- `create_access_token(data, expires_delta)` — JWT with `python-jose`
- `verify_token(token)` — decode and validate
- `get_current_user(token)` — FastAPI dependency

#### [NEW] `backend/app/auth_utils.py`

Core security algorithms:

- `normalize_coords(clicks, img_width, img_height)` → list of (x_norm, y_norm) in [0,1]
- `grid_snap(x, y, grid_size=20)` → snaps to nearest grid cell center (5% cells = 20×20 grid)
- `hash_click_pattern(snapped_coords)` → SHA-256 hex digest
- `euclidean_distance(p1, p2)` → float
- `verify_click_pattern(stored_coords, input_coords, tolerance=0.05)` → bool (fallback)
- `verify_dual(stored_hash, stored_coords, input_coords, tolerance)` → bool
  - Primary: compare grid-snap hashes
  - Fallback: Euclidean distance within tolerance for each point
- `hash_pattern(node_sequence)` → SHA-256 hex for grid_draw
- `verify_passfaces(stored_ids, submitted_ids)` → bool (exact match per round)

---

### Component 2: Backend Routes

#### [NEW] `backend/app/routes/ccp.py`

- `POST /api/ccp/register` — multipart: email, image file, clicks JSON
  - Save image with UUID filename → `static/uploads/`
  - Normalize clicks → grid-snap → hash → store user
- `POST /api/ccp/login` — JSON: email, clicks
  - Fetch user → dual-verify → return JWT or 401
- `GET /api/ccp/image/{email}` — serve user's image

#### [NEW] `backend/app/routes/passfaces.py`

- `GET /api/passfaces/pool` — return list of all available face images with IDs
- `POST /api/passfaces/register` — JSON: email, selected_face_ids (5 images)
  - Hash IDs → store user
- `POST /api/passfaces/challenge/{email}` — generate 4 rounds of 9-image grids (1 correct + 8 decoys each)
- `POST /api/passfaces/login` — JSON: email, round_selections
  - Verify all rounds match → return JWT or 401

#### [NEW] `backend/app/routes/grid_draw.py`

- `POST /api/grid-draw/register` — multipart: email, image, pattern (node index sequence)
  - Store image, hash pattern
- `POST /api/grid-draw/login` — JSON: email, pattern
  - Compare hashed patterns → JWT or 401
- `GET /api/grid-draw/image/{email}` — serve user's image

#### [NEW] `backend/app/routes/click_point.py`

- `POST /api/click-point/register` — multipart: email, image, clicks JSON
  - Same normalization + dual-hash logic as CCP
- `POST /api/click-point/login` — JSON: email, clicks
  - Dual-verify → JWT or 401
- `GET /api/click-point/image/{email}` — serve user's image

#### [NEW] `backend/app/main.py`

- Create FastAPI app with metadata
- CORS middleware (allow frontend origin)
- Mount `static/` directory
- Include all 4 routers
- On startup: create DB tables, ensure static dirs exist

---

### Component 3: Frontend Core

#### [NEW] `frontend/` — Vite React 19 project

- Initialize with `npx -y create-vite@latest ./ -- --template react`
- Install: `axios`, `react-router-dom`

#### [NEW] `frontend/src/index.css`

Design system with:

- Dark theme with deep navy/purple gradient backgrounds
- Glassmorphism card effects (backdrop-blur, semi-transparent)
- CSS custom properties for colors, spacing, typography
- Google Font: **Inter** for body, **Outfit** for headings
- Smooth transitions and hover animations
- Responsive breakpoints

#### [NEW] `frontend/src/api/axios.js`

- Axios instance with `baseURL: http://localhost:8000`
- Request interceptor to attach JWT from localStorage
- Response interceptor for 401 handling

#### [NEW] `frontend/src/context/AuthContext.jsx`

- React Context for auth state (token, user, isAuthenticated)
- `login(token)`, `logout()` methods
- Persist token in localStorage

#### [NEW] `frontend/src/App.jsx`

- React Router v6 with routes for:
  - `/` → Landing page
  - `/ccp/register`, `/ccp/login`
  - `/passfaces/register`, `/passfaces/login`
  - `/grid-draw/register`, `/grid-draw/login`
  - `/click-point/register`, `/click-point/login`
  - `/dashboard` → Protected route

---

### Component 4: Frontend — Reusable Components

#### [NEW] `frontend/src/components/CanvasClickArea.jsx`

- HTML5 Canvas component
- Props: `imageSrc`, `onClicksChange`, `maxClicks`, `existingClicks`, `readOnly`
- Draws loaded image scaled to canvas
- On click: records normalized coordinates, draws red circle marker with pulse animation
- Supports undo last click
- Returns normalized `[{x, y}]` array

#### [NEW] `frontend/src/components/GridOverlay.jsx`

- Canvas overlay rendering an 8×8 grid of nodes
- On node click/drag: highlights node, builds path sequence
- Visual: glowing dots at nodes, animated connecting lines
- Props: `imageSrc`, `onPatternChange`, `gridSize`

#### [NEW] `frontend/src/components/PassFaceGrid.jsx`

- 3×3 grid of face images for each challenge round
- Click handler with selection highlight (green border glow)
- Props: `images`, `onSelect`, `roundNumber`

#### [NEW] `frontend/src/components/Navbar.jsx`

- Glassmorphism navbar with logo, navigation links, auth status
- Animated mobile hamburger menu

#### [NEW] `frontend/src/components/MethodCard.jsx`

- Card with icon, title, description, and CTA button
- Hover: scale + glow effect
- Used on Landing page to present the 4 methods

#### [NEW] `frontend/src/components/ProtectedRoute.jsx`

- Checks AuthContext, redirects to `/` if not authenticated

---

### Component 5: Frontend — Pages

#### [NEW] Landing page (`pages/Landing.jsx`)

- Hero section with animated gradient background
- Title: "Graphical Password Authentication"
- 4 MethodCards in a responsive grid
- Each card links to register/login for that method

#### [NEW] CCP pages (`pages/ccp/CCPRegister.jsx`, `CCPLogin.jsx`)

- **Register**: Email input → image upload → CanvasClickArea (3–6 clicks) → confirm → submit
- **Login**: Email input → fetch image → CanvasClickArea → submit → JWT stored
- Step-by-step wizard UI with progress indicator

#### [NEW] PassFaces pages (`pages/passfaces/PassFacesRegister.jsx`, `PassFacesLogin.jsx`)

- **Register**: Email → browse pool of 50 images → select 5 → confirm
- **Login**: Email → 4 rounds of 3×3 grids → select correct face per round

#### [NEW] Grid Draw pages (`pages/grid-draw/GridDrawRegister.jsx`, `GridDrawLogin.jsx`)

- **Register**: Email → upload image → draw pattern on GridOverlay → confirm
- **Login**: Email → fetch image → draw pattern → verify

#### [NEW] Click-Point pages (`pages/click-point/ClickPointRegister.jsx`, `ClickPointLogin.jsx`)

- **Register**: Email → upload image → click 3–5 precise points → confirm
- **Login**: Email → fetch image → click points → verify

#### [NEW] Dashboard (`pages/Dashboard.jsx`)

- Protected page showing: "Welcome, {email}!"
- Auth method badge, session info
- Logout button

---

### Component 6: Utility Files

#### [NEW] `frontend/src/utils/normalize.js`

- `normalizeCoords(x, y, canvasWidth, canvasHeight)` → `{x: 0-1, y: 0-1}`
- `denormalizeCoords(normX, normY, canvasWidth, canvasHeight)` → `{x, y}` pixels

#### [NEW] `frontend/src/utils/lockout.js`

- `checkLockout(email)` → returns `{locked, remainingTime}`
- `recordFailedAttempt(email)` — increments counter in localStorage
- `resetAttempts(email)` — clears counter on success
- Lockout after 5 failed attempts for 5 minutes

---

## Open Questions

> [!IMPORTANT]
> **PassFaces image pool** — I'll generate ~50 unique avatar/face-like images using the image generation tool. These serve as the selectable pool. Is this acceptable, or would you prefer to supply your own image set?

> [!NOTE]
> **Number of PassFaces rounds** — I've set it to 4 rounds (select 1 correct out of 9 each round = 4 out of 5 total secret images tested). This gives a 1/6561 chance of guessing. Sound good?

---

## Verification Plan

### Automated Tests

1. **Backend starts**: `cd backend && uvicorn app.main:app --reload` — no errors
2. **Frontend starts**: `cd frontend && npm run dev` — no errors
3. **Browser tests** (using browser subagent):
   - Register with each of the 4 methods
   - Login with each of the 4 methods
   - Verify JWT is stored and dashboard is accessible
   - Verify lockout after 5 failed attempts

### Manual Verification

- Visual inspection of UI responsiveness and animations
- Cross-method registration/login flows
- Error handling for wrong clicks, wrong faces, wrong patterns
