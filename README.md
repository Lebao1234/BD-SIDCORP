# QuanLyHTKH

This repository contains a CRM chat application split into two parts:

- `backend/` — Node.js + TypeScript API server with Prisma, authentication, file upload, and real-time chat.
- `frontend/` — React + Vite + TypeScript UI.

## Node version

Use Node.js `v22.15.0` for consistency.

If your team uses `nvm`, you can run:

```bash
nvm use 22.15.0
```

## Setup for the whole repo

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run build
```

To run in development mode:

```bash
npm run dev
```

To start the built backend:

```bash
npm start
```
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

To run in development mode:

```bash
npm run dev
```

## Build both

From the repository root, team members can run:

```bash
cd backend && npm install && npm run prisma:generate && npm run build
cd ../frontend && npm install && npm run build
```

> Note: Backend requires environment variables and database configuration from `backend/.env`. Make sure each team member has the correct `.env` file or a shared sample configuration.
