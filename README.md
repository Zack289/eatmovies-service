# eatMovies

A full-stack movie & TV series discovery platform. Browse and search without an
account; sign in to favorite, mark watched, wishlist, and contribute your own
recommendations. Includes a protected admin dashboard for user and content
moderation.

Built with the **MERN** stack in TypeScript throughout.

---

## 1. Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router
**Backend:** Node.js, Express, TypeScript
**Database:** MongoDB + Mongoose
**Auth:** JWT (bcrypt password hashing)
**Images:** Cloudinary (via a swappable upload abstraction)

## 2. Folder Structure

```text
eatmovies/
├── frontend/          React + TypeScript client
│   └── src/
│       ├── components/   Reusable UI (MediaCard, Navbar, modals, etc.)
│       ├── pages/         Route-level views, including pages/admin/
│       ├── layouts/       RootLayout (navbar + footer + auth modal)
│       ├── hooks/         useMedia, useSearch, useInteraction, useDebounce
│       ├── services/      Axios-based API layer (one file per resource)
│       ├── contexts/      Auth, Theme, Toast
│       ├── types/         Shared TypeScript types
│       ├── constants/     Genre / country / industry lists
│       └── routes/        AppRoutes.tsx
│
├── service/           Express + TypeScript API
│   └── src/
│       ├── controllers/   Route handlers
│       ├── models/        User, Media, Interaction (Mongoose schemas)
│       ├── routes/        Express routers
│       ├── middleware/    auth, adminAuth, errorHandler
│       ├── services/      mediaService, recommendationService, externalMediaService
│       ├── config/        db.ts, cloudinary.ts
│       ├── seed/          seedData.ts + seed.ts (dev-only demo content)
│       └── server.ts
│
└── README.md
```

## 3. Installation

Requires Node.js 18+ and a MongoDB connection (local or Atlas).

```bash
git clone <this-repo>
cd eatmovies
```

### 3.1 Backend setup

```bash
cd service
cp .env.example .env     # fill in the values below
npm install
```

Fill in `service/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=              # your MongoDB connection string
JWT_SECRET=                # any long random string
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

TMDB_API_KEY=

ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_NAME=
```

Cloudinary is used for poster image uploads. Create a free account at
cloudinary.com and copy the three values from your dashboard. If you leave
these blank, the rest of the app still works — poster uploads will return a
clear error until they're configured.

TMDB is used only by the seed script to attach real movie/TV poster art to
the ~45 seeded titles, instead of random placeholder images. Get a free key
at themoviedb.org/settings/api and paste it in as `TMDB_API_KEY`. If you
leave it blank, seeding still works fine — it just falls back to
placeholder posters for the demo titles. This has no effect on posters for
content people add themselves through the app, which always come from
Cloudinary.

### 3.2 Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
```

`frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## 4. Seeding the Database

The seed script clears existing media/interactions, inserts ~45 real,
recognizable movies and series (Marvel, Hollywood, Bollywood, South Indian
cinema, Korean, Japanese/anime, British), and bootstraps an admin account
from `ADMIN_EMAIL` / `ADMIN_PASSWORD` if they're set in `service/.env`. If
`TMDB_API_KEY` is set, it also looks up and attaches each title's real
poster art from TMDB (falling back to a placeholder per-title if no close
match is found, so a partial match never breaks the seed run).

```bash
cd service
npm run seed
```

If `ADMIN_EMAIL` / `ADMIN_PASSWORD` are left blank, the script creates a
demo admin instead: `curator@eatmovies.demo` / `changeme123`. Change this
password immediately if you use it beyond local development.

## 5. Running Development Servers

In two terminals:

```bash
# Terminal 1
cd service && npm run dev      # API on http://localhost:5000

# Terminal 2
cd frontend && npm run dev     # App on http://localhost:5173
```

## 6. Production Build

```bash
# Backend
cd service && npm run build && npm start

# Frontend
cd frontend && npm run build   # outputs static files to frontend/dist
```

Serve `frontend/dist` with any static host (Vercel, Netlify, Nginx, etc.)
and point `VITE_API_URL` at your deployed API's `/api` base URL.

## 7. API Structure

All routes are prefixed with `/api`.

| Area | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me` |
| Media | `GET /media`, `GET /media/:id`, `GET /media/search`, `GET /media/recommendations`, `POST /media`, `PUT /media/:id`, `DELETE /media/:id` |
| Interactions | `POST /interactions/:mediaId/:kind`, `GET /interactions/:mediaId/state`, `GET /interactions/mine/:kind` |
| User content | `GET /users/me/media` |
| Uploads | `POST /uploads/poster` |
| Admin | `GET /admin/stats`, `GET|PUT|DELETE /admin/users*`, `GET|PUT|DELETE /admin/media*` |

Media list/search endpoints accept `type`, `genre`, `country`, `industry`,
`search`, `sort` (`recent` \| `trending` \| `az`), `page`, and `limit` query
params, and are freely composable, e.g.:

```
GET /api/media?type=series&genre=anime&country=Japan&sort=trending
```

## 8. Authentication & Authorization

- Passwords are hashed with bcrypt; plain-text passwords are never stored.
- Login/register return a JWT, stored client-side and sent as
  `Authorization: Bearer <token>` on every authenticated request.
- `requireAuth` middleware protects any endpoint that needs a logged-in
  user; `requireAdmin` additionally verifies `role === "admin"` — enforced
  entirely on the backend, so hiding the admin UI is not what makes it
  secure.
- Content ownership (edit/delete) is checked server-side against the
  authenticated user's ID, not trusted from the request body.

## 9. Recommendation Engine

`service/src/services/recommendationService.ts` builds a lightweight taste
profile from a user's favorites/watched/wishlist history (genres,
industries, countries, media type) and scores unseen titles with explicit,
explainable weights, blended with popularity and recency. Anonymous
visitors and brand-new users fall back to a popularity-ranked list. It's
isolated behind two functions so it can be swapped for a more
sophisticated engine later without touching any calling code.

## 10. Notes on Scope

This is a complete, working implementation of the core product: public
browsing, live search, composable filters, movie/series details, auth,
favorites/watched/wishlist, add/edit/delete of user-submitted content with
owner-only enforcement, a "My Movies & Series" tab with See More past five
items, dark/light theming, and an admin dashboard for users and content
moderation. Seed data and the external-provider abstraction
(`externalMediaService.ts`) are intentionally minimal — extend them as
needed for a real deployment.
