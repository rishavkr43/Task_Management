# Task Management Application

A production-ready full-stack Task Management Application built as part of a 24-Hour Full Stack Developer Technical Assessment.

---

## 🔗 Live URLs

| Service | URL |
|---------|-----|
| **Frontend** | https://task-management-3yzf.vercel.app |
| **Backend API** | https://task-management-alpha-peach-74.vercel.app/api |

---

## 📁 Repository

GitHub: https://github.com/rishavkr43/Task_Management

---

## 🏗️ Architecture Overview

```
Task_Management/
├── backend/               # Node.js + Express REST API
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── middleware/
│   │   └── auth.js        # JWT authentication middleware
│   ├── models/
│   │   ├── User.js        # User schema (email, hashed password)
│   │   └── Task.js        # Task schema (title, encrypted desc, status, userId)
│   ├── routes/
│   │   ├── auth.js        # Register, Login, Logout, Me
│   │   └── tasks.js       # CRUD + pagination + search + filter
│   ├── utils/
│   │   └── encryption.js  # AES encryption/decryption (CryptoJS)
│   ├── server.js          # Express app entry point
│   └── vercel.json        # Vercel serverless deployment config
│
└── frontend/              # React SPA
    └── src/
        ├── context/
        │   └── AuthContext.js    # Global auth state
        ├── components/
        │   └── ProtectedRoute.js # Guards private routes
        └── pages/
            ├── Login.js
            ├── Register.js
            └── Dashboard.js     # Task CRUD, search, filter, pagination
```

### Request Flow

```
User Browser
    │
    ▼
React Frontend (Vercel)
    │  HTTPS + credentials: include (cookie)
    ▼
Express Backend (Vercel Serverless)
    │  JWT verified from HTTP-only cookie
    ▼
MongoDB Atlas
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, React Router v6, Context API |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (via Mongoose) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Security | CryptoJS (AES-256), HTTP-only cookies |
| Deployment | Vercel (frontend + backend) |

---

## 🔐 Security Implementation

| Feature | Implementation |
|---------|----------------|
| Password hashing | `bcryptjs` with salt rounds of 10 |
| Auth tokens | JWT signed with `JWT_SECRET`, stored in **HTTP-only cookie** |
| Cookie flags | `HttpOnly: true`, `Secure: true` (production), `SameSite: none` (cross-domain) |
| Payload encryption | Task descriptions encrypted at rest using **AES-256** (`CryptoJS`) |
| Authorization | Every task query scoped to `userId` from verified JWT — users cannot access other users' tasks |
| Input validation | Server-side validation on all endpoints with structured error responses |
| Env variables | All secrets in environment variables — never hardcoded |
| NoSQL injection | Mongoose ODM parameterizes all queries by default |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### Backend

```bash
cd backend
npm install
```

Create `.env.example`:
```env
MONGODB_URI=
JWT_SECRET=
PORT=
NODE_ENV=
ENCRYPTION_KEY=
FRONTEND_URL=
```

```bash
npm run dev       # starts with nodemon on port 5000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
CI=false
```

```bash
npm start         # starts on port 3000
```

---

## 🚀 Deployment

Both services are deployed on **Vercel**.

### Backend (Vercel Serverless)
- `backend/vercel.json` configures `@vercel/node` to route all requests through `server.js`
- Set the following in Vercel Dashboard → Environment Variables:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | 32+ character secret key |
| `ENCRYPTION_KEY` | 32 character encryption key |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Your frontend Vercel URL |

### Frontend (Vercel)
- Standard React (CRA) deployment
- Set in Vercel Dashboard → Environment Variables:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://<backend>.vercel.app/api` |
| `CI` | `false` |

---

## 📡 API Documentation

### Base URL
```
https://task-management-alpha-peach-74.vercel.app/api
```

All protected routes require the JWT cookie (set automatically on login).

---

### Auth Routes

#### `POST /api/auth/register`
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

---

#### `POST /api/auth/login`
Login and receive JWT cookie.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "64abc123...",
    "email": "user@example.com"
  }
}
```
> Sets `token` as an HTTP-only cookie.

---

#### `POST /api/auth/logout`
Clear the auth cookie.

**Response `200`:**
```json
{ "success": true, "message": "Logout successful" }
```

---

#### `GET /api/auth/me` 🔒
Get current authenticated user.

**Response `200`:**
```json
{
  "success": true,
  "user": { "id": "64abc123...", "email": "user@example.com" }
}
```

---

### Task Routes (all protected 🔒)

#### `GET /api/tasks`
Get tasks with pagination, search, and filter.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Tasks per page |
| `status` | string | — | Filter: `pending`, `in-progress`, `completed` |
| `search` | string | — | Search by title (case-insensitive) |

**Response `200`:**
```json
{
  "success": true,
  "tasks": [
    {
      "_id": "64abc...",
      "title": "Fix login bug",
      "description": "Check token expiry logic",
      "status": "in-progress",
      "createdAt": "2026-02-26T03:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalTasks": 25,
    "limit": 10
  }
}
```

---

#### `POST /api/tasks`
Create a new task.

**Request:**
```json
{
  "title": "Fix login bug",
  "description": "Check token expiry logic",
  "status": "pending"
}
```
**Response `201`:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": { "_id": "64abc...", "title": "Fix login bug", ... }
}
```
> Description is **AES-encrypted** at rest in the database before storing.

---

#### `GET /api/tasks/:id`
Get a single task by ID.

**Response `200`:**
```json
{
  "success": true,
  "task": { "_id": "64abc...", "title": "...", "description": "...", "status": "..." }
}
```

---

#### `PUT /api/tasks/:id`
Update a task.

**Request:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "completed"
}
```
**Response `200`:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "task": { ... }
}
```

---

#### `DELETE /api/tasks/:id`
Delete a task.

**Response `200`:**
```json
{ "success": true, "message": "Task deleted successfully" }
```

---

### Error Responses

All errors follow a consistent structure:

| Status | Scenario | Example message |
|--------|----------|-----------------|
| `400` | Validation error | `"Title is required"` |
| `401` | No/invalid token | `"Access denied. No token provided."` |
| `404` | Resource not found | `"Task not found"` |
| `500` | Server error | `"Server error while creating task"` |

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

---
## 🚀 Scalability Notes

### Already Implemented
| Technique | Where |
|-----------|-------|
| **In-memory TTL cache** | `GET /api/v1/tasks` cached per-user for 60 s; invalidated on create / update / delete |
| **MongoDB compound indexes** | `{ userId, status }` + text index on `title` |
| **Pagination on all list endpoints** | Avoids full-collection scans |
| **Serverless deployment** | Vercel auto-scales horizontally under traffic spikes |

### Path to Production Scale

Keep everything in your README up to line 375 (the last ---). Then replace everything after line 375 with this:
<br>

Load Balancer (e.g. AWS ALB / Nginx)
|
API Node 1 API Node 2 API Node 3 <- horizontal replicas
| | |
+---------------+-----------+
|
Redis (shared cache) <- swap utils/cache.js for ioredis
|
MongoDB Atlas <- read replicas + connection pooling
(primary + 2 replicas)
**Key scaling levers:**
1. **Redis** — `utils/cache.js` has a drop-in interface; swap `get/set/del` for `ioredis` calls and the cache works across all nodes.
2. **Load balancing** — JWTs are stateless (HTTP-only cookie); no sticky sessions needed.
3. **Microservices** — Auth and Tasks can be split into separate deployments when load justifies it.
4. **Message queue (BullMQ / SQS)** — offload heavy ops (email, bulk exports) to background workers.
5. **Rate limiting** — add `express-rate-limit` middleware on auth routes to prevent brute-force.
6. **Docker + Kubernetes** — containerise each service; each gets its own `Dockerfile` and K8s `Deployment`.

---

## ✅ Assessment Requirements Checklist

| Requirement | Status |
|-------------|--------|
| User Registration & Login | ✅ |
| JWT-based authentication | ✅ |
| HTTP-only cookie token storage | ✅ |
| Password hashing (bcrypt) | ✅ |
| Role-based access (user vs admin) | ✅ |
| Admin routes (list users/tasks, change roles, delete) | ✅ |
| CRUD APIs for tasks | ✅ |
| API versioning (`/api/v1/`) | ✅ |
| Swagger UI (`/api/docs`) | ✅ |
| User-scoped task access | ✅ |
| Input validation & error handling | ✅ |
| Secure cookie flags (HttpOnly, Secure) | ✅ |
| AES payload encryption (task description) | ✅ |
| NoSQL injection prevention | ✅ |
| In-memory caching (task list, per-user TTL) | ✅ |
| Pagination | ✅ |
| Filter by status | ✅ |
| Search by title | ✅ |
| Protected frontend routes | ✅ |
| Deployed & publicly accessible | ✅ |
| Environment variables (no hardcoding) | ✅ |
| README with setup & architecture | ✅ |
| API documentation (Swagger UI) | ✅ |
| Scalability notes | ✅ |