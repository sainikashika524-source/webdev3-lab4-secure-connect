# Lab 4 — Secure Connect and Communication Platform

Signup/login with bcrypt + JWT, protected routes, role-based access control, a per-user Notes API, real-time Socket.IO chat, and EventEmitter-driven logging. Uses only Node.js, Express, jsonwebtoken, bcrypt, dotenv, Socket.IO and MongoDB (Mongoose).

## Run

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env  — then set JWT_SECRET
npm start                   # http://localhost:5000
```

Open `http://localhost:5000` in two browser tabs for the chat demo (log in with two different accounts).

## Project structure

```
config/db.js                  Mongoose connection
models/User.js                User schema, bcrypt pre-save hook, comparePassword, password hidden
models/Note.js                Note schema with owner reference
controllers/                  auth, notes, admin
routes/                       /api/auth, /api/notes, /api/admin
middleware/auth.js            verifyToken (Bearer header or cookie) + authorize(...roles)
middleware/errorHandler.js    404 + centralized error handler
events/appEvents.js           EventEmitter + listeners (user/note/chat events)
socket/chat.js                Socket.IO: JWT handshake auth, rooms, messages, typing
public/index.html             Browser chat client
app.js / server.js            Express app / HTTP + Socket.IO bootstrap
```

## Endpoints

| Method | URL | Access |
|---|---|---|
| POST | `/api/auth/signup` | Public — `{ username, email, password }` |
| POST | `/api/auth/login` | Public — `{ email, password }` → `{ message, token }` (+ httpOnly cookie) |
| POST | `/api/auth/logout` | Clears the cookie |
| GET | `/api/auth/me` | Logged in |
| GET / POST | `/api/notes` | Logged in — own notes only |
| GET / PUT / DELETE | `/api/notes/:id` | Logged in — owner (or admin) |
| GET | `/api/admin/users` | **admin** role only |
| GET | `/api/admin/stats` | **admin** role only |

Send the token as `Authorization: Bearer <token>` **or** a `Cookie: token=<token>` header.

### Socket.IO events

| Direction | Event | Payload |
|---|---|---|
| client → server | `chatMessage` | `"text"` (optional ack callback) |
| client → server | `joinRoom` | `"roomName"` |
| client → server | `typing` | — |
| server → client | `chatMessage` | `{ room, username, text, at }` |
| server → client | `system` | join/leave notices |
| server → client | `typing` | `username` |

The socket connection is rejected unless the handshake carries a valid JWT (`io({ auth: { token } })` or the cookie). Users auto-join `#general`.

## Postman test sequence

1. `POST /api/auth/signup` `{ "username": "victor", "email": "victor@example.com", "password": "123456" }` → 201 `User registered`
2. `POST /api/auth/login` same email/password → `Login successful` + token
3. `GET /api/notes` with no token → **403** `No token provided`
4. `POST /api/notes` with token, `{ "title": "My First Note", "content": "This is my first note of web dev -III" }` → 201
5. `GET /api/notes` with token → array of your notes
6. `GET /api/admin/users` as a normal user → 403 (RBAC). Sign up with the `ADMIN_EMAIL` from `.env` to get an admin account.

## Security notes

- Passwords hashed with bcrypt (salt rounds from `.env`); password field is `select: false` and stripped from JSON.
- Login gives the same error for wrong email and wrong password (no user enumeration).
- `role` is never read from the signup body — only `ADMIN_EMAIL` becomes admin, so users can't promote themselves.
- `verifyToken` re-checks that the user still exists; expired vs invalid tokens get distinct messages.
- Notes queries always filter by `owner`, so one user can never read/edit/delete another user's notes (returns 404).
- Chat messages are trimmed and length-capped; the browser client escapes HTML to block XSS.
- Basic security headers set; JSON body size limited.

## Event-driven features

Controllers emit `user:registered`, `user:login`, `auth:failed`, `note:created`, `note:updated`, `note:deleted`, `chat:message`; listeners in `events/appEvents.js` log them. Sample server console:

```
User connected: 2gsC_twINn-tBrJPAAAB (victor)
2gsC_twINn-tBrJPAAAB joined room general
[general] victor: Hey team, backend is ready
[general] rohan: Testing chat now...
```
