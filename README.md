# MyTube — Frontend

Next.js client for MyTube — a YouTube-like video platform (watch, search, channels, playlists, auth).

**Production:** [https://mytube-two-phi.vercel.app](https://mytube-two-phi.vercel.app)  
**API:** [https://mytube-server-c4a65cdf5921.herokuapp.com](https://mytube-server-c4a65cdf5921.herokuapp.com)

---

## Features

- Home feed, search, subscriptions, watch page
- Channels (create / edit / upload / playlists)
- Auth: email+password and Google OAuth
- Redux Toolkit + redux-persist
- Cookie-based API auth (`withCredentials`)
- UI translations helper (`/api/translate` Next route)
- Sass styling, React Hook Form, toast notifications

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Sass |
| State | Redux Toolkit, redux-persist |
| HTTP | Axios |
| Deploy | Vercel |

---

## Project Structure

| Path | Role |
|------|------|
| `src/app/` | App Router pages & layouts |
| `src/common/components/` | Shared UI |
| `src/lib/api/` | Axios clients & API helpers |
| `src/store/` | Redux slices / operations |
| `src/providers/` | App providers |
| `src/utils/` | Helpers (translate, dates, …) |
| `src/styles/` | Global styles |

---

## Prerequisites

- Node.js 20+
- Running MyTube backend (`mytube-backend`) for local API

---

## Environment Variables

Create a `.env` in the project root (gitignored via `.env*`):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL for Axios (no trailing slash) |
| `NEXT_PUBLIC_SERVER_API_URL` | Backend base URL for Google OAuth redirect |
| `TRANSLATE_API_KEY` | Key for Next.js `/api/translate` (server-only) |

Both `NEXT_PUBLIC_*` values must point to the **same** backend:

**Local**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SERVER_API_URL=http://localhost:4000
TRANSLATE_API_KEY=your_key
```

**Vercel (Production)**

```env
NEXT_PUBLIC_API_URL=https://mytube-server-c4a65cdf5921.herokuapp.com
NEXT_PUBLIC_SERVER_API_URL=https://mytube-server-c4a65cdf5921.herokuapp.com
TRANSLATE_API_KEY=your_key
```

Notes:

- `NEXT_PUBLIC_*` are embedded at **build** time — after changing them on Vercel, redeploy.
- On Vercel, use type **Config** (not Secret) for `NEXT_PUBLIC_*`.
- Keep `TRANSLATE_API_KEY` as a **Secret**.

---

## Getting Started

```bash
git clone <repo-url>
cd mytube
npm install
# create .env (see above)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Make sure the backend is running on `http://localhost:4000` (`npm run start:dev` in `mytube-backend`).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |

---

## Main Routes

| Path | Description |
|------|-------------|
| `/` | Home |
| `/search` | Search videos / playlists |
| `/watch/[id]` | Watch video |
| `/subscriptions` | Subscriptions feed |
| `/channels`, `/channels/create` | Channel list / create |
| `/channels/[handle]` | Channel page, edit, upload, playlists |
| `/auth/login`, `/auth/register` | Auth |

---

## Auth flow (Google)

1. Frontend opens  
   `{NEXT_PUBLIC_SERVER_API_URL}/api/google?origin={window.location.origin}`
2. Backend handles Google OAuth and sets auth cookies
3. Browser redirects back to the frontend `origin`

Backend must allow the frontend origin in CORS (`FRONTEND_URL` / `FRONTEND_URL_PROD`) and Google Console must list the correct redirect URI on the API host.

---

## Deployment (Vercel)

1. Import the GitHub repo in Vercel
2. Set Environment Variables (Production):
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SERVER_API_URL`
   - `TRANSLATE_API_KEY`
3. Deploy (framework preset: Next.js)

Production site: [https://mytube-two-phi.vercel.app](https://mytube-two-phi.vercel.app)

---

## Related Repository

Backend: **[mytube-backend](https://github.com/ydovzhyk/mytube-backend)**

---

## License

Private / educational project.
