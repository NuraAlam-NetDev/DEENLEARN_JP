# Deenlearn

Islamic learning platform. MERN monorepo.

```
deenlearn/
├── client/   React + Vite + React Router + Tailwind
└── server/   Node + Express + Mongoose (MongoDB Atlas)
```

## Setup

```bash
npm install                                   # installs both workspaces
cp server/.env.example server/.env            # then fill in MONGODB_URI
cp client/.env.example client/.env
npm run dev                                   # server :5000 + client :5173
```

Health check: http://localhost:5000/api/health
