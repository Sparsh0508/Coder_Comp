# Coder_Comp

```
battle-coding/
│
├── client/                 → React frontend
├── server/                 → Main backend API
├── code-runner/            → Isolated execution service
├── infra/                  → Docker + deployment configs
├── docs/                   → API docs & architecture notes
└── README.md
```
```
server/
│
├── src/
│   ├── config/
│   │   ├── db.js
│   │   ├── redis.js
│   │   └── logger.js   ✅ (NEW)
│
│   ├── modules/
│   │   ├── auth/
│   │   ├── match/
│   │   ├── submission/
│   │   ├── wallet/
│   │   └── leaderboard/
│
│   ├── middlewares/
│   │   ├── error.middleware.js
│   │   └── requestLogger.middleware.js  ✅ (NEW)
│
│   ├── sockets/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── logs/                ✅ (NEW)
│   ├── error.log
│   └── combined.log
│
├── Dockerfile
└── package.json

```

```
match/
│
├── match.routes.js
├── match.controller.js
├── match.service.js
├── match.validation.js
├── match.constants.js
└── match.socket.js      ← (real-time logic)

```