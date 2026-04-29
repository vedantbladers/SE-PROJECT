# Project Info

## Overview

This project is a graphical password authentication system with four methods:

- CCP (Cued Click Points)
- PassFaces (recognition-based)
- Grid Draw (pattern-based)
- Click-Point (single-image precise clicks)

Users can register multiple methods for the same email and authenticate with any of them. After login, the dashboard lists all registered methods and allows deleting any method.

## QUICK NOTE :-

Requirements.txt file will be in the backend folder. Use a venv and then install it.
Input while register/login would be : 1) Email 2) One of the four methods.
Only valid email address is acceptable (input string should include @).
Now, for every method a unique id will be generated and stored in the db along with other details such that we can fetch the corresponding info while authenticating for login.
Each user once logged in via one of the four methods, can also opt to go to home and then access the other methods (no need to login again just redirected to the password phase).
Use sqlite3 in the backend to view the current status of the contents of the database.
There is also an option for user to delete the method and reset it once again.
If anyone wants to check the apis, use postman or swagger.
DB used here is normal SQLITE, a lightweight model.
I have attached one file (image.png) in that you see how our database looks.
Number of wrong attempts would be 5 & after that cooldown/lockout of 5 mins.

## Tech Stack

- Backend: FastAPI + SQLAlchemy + SQLite
- Auth: JWT with python-jose
- Frontend: React (Vite)
- HTTP: Axios
- Styling: Custom CSS theme (light, natural palette) + CSS variables

## Detailed Tech Usage

### FastAPI

- Provides the REST API framework, routing, request parsing, and response serialization.
- Uses dependency injection for DB sessions and authentication (see `Depends`).
- Serves static assets (uploaded images and passfaces pool) via `StaticFiles`.

### Pydantic (and pydantic-settings)

- Used for request/response models in [backend/app/schemas.py](backend/app/schemas.py).
- Ensures strict input validation and clear API contracts (types, required fields).
- Normalizes data types for click coordinates and patterns before use.
- `pydantic-settings` loads environment variables into a typed settings object in [backend/app/config.py](backend/app/config.py).

### SQLAlchemy ORM

- Defines the `User` model and maps it to the `users` table in [backend/app/models.py](backend/app/models.py).
- Handles DB sessions via `SessionLocal` in [backend/app/database.py](backend/app/database.py).
- ORM queries are used to:
  - Look up users by `(email, auth_method)`.
  - Insert new method records per user.
  - Delete method records from the dashboard.

### SQLite

- Local development database stored in [backend/graphauth.db](backend/graphauth.db).
- Stores all method-specific authentication data.
- Uniqueness is enforced on `(email, auth_method)` to allow multiple methods per email.

### JWT (python-jose)

- JWTs are created in [backend/app/security.py](backend/app/security.py).
- `sub` claim holds the email, and `method` holds the auth method used to log in.
- Tokens are verified on protected endpoints to determine the current user.

### File Uploads (python-multipart + aiofiles)

- `python-multipart` handles multipart form uploads (images + JSON fields).
- Uploaded images are saved under `static/uploads/` and served via `/static`.
- PassFaces pool images are stored in `static/passfaces/`.

### React (Vite)

- Vite provides fast dev server, HMR, and build tooling.
- React components are organized by method pages and shared components.

### Axios

- Centralized API client in [frontend/src/api/axios.js](frontend/src/api/axios.js).
- Attaches JWT in the `Authorization` header.
- Handles global 401 responses to log the user out.

### Auth Context

- [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx) stores
  the token and user metadata (email + auth method).
- Used to hide email inputs when already signed in.
- Persists session in `localStorage`.

### UI and Theme

- Design system in [frontend/src/index.css](frontend/src/index.css).
- Uses CSS variables for colors, spacing, and typography.
- Light theme with warm, natural palette and glass card styling.

## Backend Architecture

- App entry: [backend/app/main.py](backend/app/main.py)
- Models: [backend/app/models.py](backend/app/models.py)
- Database: [backend/app/database.py](backend/app/database.py)
- Auth/JWT: [backend/app/security.py](backend/app/security.py)
- Routes:
  - CCP: [backend/app/routes/ccp.py](backend/app/routes/ccp.py)
  - PassFaces: [backend/app/routes/passfaces.py](backend/app/routes/passfaces.py)
  - Grid Draw: [backend/app/routes/grid_draw.py](backend/app/routes/grid_draw.py)
  - Click-Point: [backend/app/routes/click_point.py](backend/app/routes/click_point.py)

### Data Model

Table: users

- email (string)
- auth_method (ccp, passfaces, grid_draw, click_point)
- image_path (for CCP, Grid Draw, Click-Point)
- click_hash, click_data, tolerance (click methods)
- passface_ids (PassFaces)
- grid_pattern, pattern_hash (Grid Draw)

Uniqueness is per (email, auth_method), so one email can register multiple methods.

### Backend Flow

1. Register endpoint validates payload and stores method-specific data.
2. Login endpoint verifies the input against stored data.
3. JWT is issued with subject = email and method = auth_method.
4. Authenticated endpoints use the JWT to identify the user.

### Key API Endpoints

- Register:
  - POST /api/ccp/register (multipart)
  - POST /api/passfaces/register (json)
  - POST /api/grid-draw/register (multipart)
  - POST /api/click-point/register (multipart)
- Login:
  - POST /api/ccp/login
  - POST /api/passfaces/login
  - POST /api/grid-draw/login
  - POST /api/click-point/login
- Assets:
  - GET /api/ccp/image/{email}
  - GET /api/grid-draw/image/{email}
  - GET /api/click-point/image/{email}
  - GET /api/passfaces/pool
- User methods:
  - GET /api/methods
  - DELETE /api/methods/{method}

## Frontend Architecture

- App entry: [frontend/src/main.jsx](frontend/src/main.jsx)
- Routes: [frontend/src/App.jsx](frontend/src/App.jsx)
- Auth context: [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx)
- API client: [frontend/src/api/axios.js](frontend/src/api/axios.js)
- Theme: [frontend/src/index.css](frontend/src/index.css)

### Frontend Flow

1. Register pages collect email (or use signed-in email) and method inputs.
2. Login pages fetch challenges (images or face grids) and submit verification.
3. On success, JWT + user data are stored in local storage.
4. Dashboard shows active session details and registered methods.
5. Deleting a method calls the API and updates the list.

## Authentication Methods (How They Work)

### CCP (Cued Click Points)

- Register: upload an image, click 3-6 points in order.
- The clicks are normalized and hashed; the image is stored on disk.
- Login: the same points must be clicked in order.

### PassFaces

- Register: select 4-5 faces from a pool.
- Stored list of selected face IDs.
- Login: 4 rounds, each round shows 1 correct + 8 decoys.

### Grid Draw

- Register: upload an image, draw a grid pattern of 4+ nodes.
- Pattern sequence is hashed and stored.
- Login: redraw the pattern.

### Click-Point

- Register: upload an image, click 3-5 precise points.
- Stored as normalized coordinates + hash.
- Login: repeat the points in order.

## How to Run (From Scratch)

### Backend

1. Install dependencies:
   - cd backend
   - /home/vedant/WEBDEV/COLLEGE/SE_PROJECT/.venv/bin/python -m pip install -r requirements.txt
2. Start server:
   - /home/vedant/WEBDEV/COLLEGE/SE_PROJECT/.venv/bin/python -m uvicorn app.main:app --reload

### Frontend

1. Install dependencies:
   - cd frontend
   - npm install
2. Start server:
   - npm run dev

## Viewing the Dataset

The SQLite database is at:

- [backend/graphauth.db](backend/graphauth.db)

Example (SQLite shell):

- sqlite3 backend/graphauth.db
- .tables
- SELECT id, email, auth_method, created_at FROM users;

## End-to-End User Journey

1. User picks a method and registers.
2. Backend stores method data and issues a token on login.
3. Frontend saves the token and shows the dashboard.
4. User can add more methods or delete existing ones.
5. Logout clears session and requires email again for login/register.
