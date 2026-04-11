# CodeCamp Arena

CodeCamp Arena is a production-structured realtime two-player coding competition platform. Two authenticated players are matched into a live room, solve the same problem, run sample tests, submit against hidden tests, and the first correct submission wins. Ratings update on every completed duel.

## Stack

- Frontend: React + Vite + Tailwind CSS + Monaco Editor
- Backend: Node.js + Express + Socket.IO
- Database: MongoDB + Mongoose
- Auth: JWT in HTTP-only cookies + bcrypt password hashing
- Code execution: Judge0 API integration

## Folder structure

```text
client/
  src/
    components/
    context/
    hooks/
    pages/
    services/
server/
  controllers/
  middleware/
  models/
  routes/
  sockets/
  utils/
```

## Features

- Signup, login, logout, protected routes, cookie-based auth
- Socket.IO matchmaking queue with `joinQueue`, `matchFound`, `startMatch`, `codeUpdate`, `submissionResult`, `matchEnd`
- Split-screen coding UI with Monaco editor, language selection, countdown timer, and realtime opponent panel
- Mongo-backed problem bank with starter code, sample tests, and hidden tests
- Run and submit flows backed by Judge0
- Automatic winner selection and ELO-style leaderboard updates

## Local setup

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

Copy the examples and update the values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Required backend values:

- `MONGODB_URI`: Mongo database connection string
- `JWT_SECRET`: long random signing secret
- `JUDGE0_URL`: Judge0 API base URL
- `JUDGE0_API_KEY`: optional auth token if your Judge0 deployment requires one

### 3. Seed sample problems

```bash
cd server
npm run seed
```

### 4. Start the app

In one terminal:

```bash
cd server
npm run dev
```

In a second terminal:

```bash
cd client
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:8080`

## API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/match/find`
- `POST /api/match/leave`
- `GET /api/match/:matchId`
- `GET /api/problem/random`
- `POST /api/submission/run`
- `POST /api/submission/submit`
- `GET /api/leaderboard`

## Docker

A lightweight compose setup is included for local containers.

```bash
docker compose up --build
```

Make sure your `server/.env` contains a reachable `JUDGE0_URL`, since Judge0 is configured as an external service in this repo.
