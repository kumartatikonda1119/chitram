# Chitram

Chitram is an advanced, full-stack cinema and TV show discovery platform. It goes beyond simple TMDB search by offering a highly personalized, AI-driven recommendation engine that learns from user interactions, supports natural language semantic search, and provides deep dives into movie, series, season, episode, and cast details.

## Author

**Kumar Tatikonda**

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Advanced Recommendation Engine](#advanced-recommendation-engine)
- [Project Structure](#project-structure)
- [TMDB API Integration](#tmdb-api-integration)
- [How Users Can Use Chitram](#how-users-can-use-chitram)
- [Environment Variables](#environment-variables)
- [Run Locally](#run-locally)
- [API Endpoints](#api-endpoints)
- [Deployment Notes](#deployment-notes)
- [Future Improvements](#future-improvements)

---

## Overview

Chitram is built for real movie lovers, offering features like:

- Discover trending, classics, and regional/language-specific curated sections.
- Search movies, TV series, actors, and directors using standard text or **Natural Language (AI Semantic Search)**.
- Deep, rich detail pages for Movies, Series, Seasons, Episodes, and Actors (including trailers and cast filmographies).
- Direct high-quality image downloading directly from galleries (bypassing CORS via backend proxy).
- A powerful tracking system that silently builds a user profile (Top Genres, Languages, Actors, Directors) to power a multi-source recommendation engine.
- Manage favorites, create custom lists, and share public lists through direct links.

The app uses **TMDB** as its media data source and adds user-specific features through a custom backend with authentication and persistence.

---

## Core Features

### 1) Smart Discovery & AI Search
- **AI Semantic Search:** Powered by `ai.service.js`, allowing users to search using natural language.
- **Explore Sections:** Trending, classics, now playing, upcoming, language-based, and genre-based sections.
- **Infinite Scrolling:** Seamless endless scrolling on recommendation and explore feeds.

### 2) Deep Media Experience
- Full support for **Movies** and **TV Series** (down to Season and Episode levels).
- **Actor/Director Profiles:** View complete filmographies and popularity metrics.
- **Direct Image Downloads:** Users can download high-res posters and backdrops directly to their device.
- Embedded trailers, similar media, and cast/crew lists.

### 3) Advanced Recommendations & Tracking
- **Interaction Tracking:** The backend silently tracks actions (`view_movie`, `view_series`, `add_favorite`, `search`, `view_person`) to build a dynamic preference profile.
- **Redis Caching:** Lightning-fast response times using Redis to cache TMDB responses, user profiles, and generated recommendations.

### 4) Authentication & User Management
- Secure JWT-based Authentication (Register, Login, Google OAuth).
- Forgot Password flow with OTP verification (powered by Resend via `mail.service.js`).
- Custom Favorites and Public/Private Lists with shareable links.

### 5) Responsive UX
- Mobile-first responsive design
- Bottom tab navigation on mobile (YouTube-style pattern)

---

## Tech Stack

### Frontend
- React 18 + Vite
- React Router
- Tailwind CSS + shadcn/ui + Radix UI
- Framer Motion (for micro-animations)
- Axios & TanStack Query

### Backend
- Node.js + Express
- MongoDB + Mongoose (Database & User/Interaction Models)
- Redis (Caching & Session speedups)
- JWT & bcryptjs (Security)
- Docker & Docker Compose (Containerization)

### External Services
- TMDB (The Movie Database) API
- Resend (Transactional Emails)
- Google OAuth 2.0
- AI Provider (for Semantic Search generation)

---

## Advanced Recommendation Engine

Chitram features a completely custom, multi-source recommendation pipeline built internally (`recommendation.service.js`). Instead of relying on generic TMDB filters, it ranks media by merging multiple strategies:

1. **Direct Filmography Pulls (Highest Priority):** Fetches the complete movie history of the user's top 5 favorite Actors/Directors.
2. **TMDB Deep Analysis:** Pulls TMDB's internal recommendations for the user's top 5 favorited or listed movies.
3. **Language-Specific Discovery:** Runs genre-based discovery queries strictly locked to the user's preferred viewing languages (e.g., Telugu, Hindi, English).
4. **Global Fallback:** A broad net for highly-rated movies in preferred genres.

All sources are merged, deduplicated, and ranked using a custom scoring algorithm that applies bonuses for matching the user's primary language and actor preferences, ensuring regional cinema fans don't get flooded with generic Hollywood results.

---

## Project Structure

```text
Chitram/
├── backend/
│   ├── controllers/ (auth, favourite, interaction, list, recommendation, search)
│   ├── middleware/  (auth.js, cache.js)
│   ├── models/      (User, List, ListItem, Favourite, Interaction)
│   ├── routes/      (API Routing)
│   ├── services/    (ai, interaction, mail, recommendation, redis)
│   ├── .env
│   └── server.js
│
├── frontend/
│   ├── public/      (_redirects, robots.txt)
│   ├── src/
│   │   ├── components/ (MovieCard, Navbar, Footer, etc.)
│   │   ├── contexts/   (AuthContext)
│   │   ├── hooks/      (useTracker)
│   │   ├── pages/      (Explore, Profile, Detail pages, Search, Auth)
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
│
├── compose.yaml     (Docker orchestration)
├── .env             (Root env for Docker build args)
└── README.md
```

---

## TMDB API Integration

Chitram backend consumes TMDB endpoints heavily, particularly in `search.controller.js` and `recommendation.service.js`.

### What is used from TMDB

- Movie, TV Series, Season, and Episode search/details
- Person search and Actor details + credits
- Director filmography extraction
- Discover by genre/language
- Trending/Top rated/Now playing/Upcoming feeds
- Movie details by ID with appended `credits`, `videos`, and `similar`
- Multi-source fallback recommendations

### Required key

Set `API_KEY` in backend environment variables (TMDB API key).
Get your key from: https://www.themoviedb.org/settings/api

---

## How Users Can Use Chitram

### For visitors
1. Open homepage and explore sections
2. Search for movies or people (standard or Semantic AI search)
3. Open media details, watch trailers, and download posters

### For registered users
1. Create an account and login
2. Add movies/series to favorites
3. Build a personalized recommendation profile automatically as you browse
4. Create custom lists and add media to them
5. Mark lists as public to enable link sharing
6. Share list link so friends can view your custom collections

---

## Environment Variables

The project uses a clean environment variable setup:

### 1) Root (`/.env`)
Used by Docker Compose to pass build arguments to the frontend container.
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_PUBLIC_APP_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

### 2) Backend (`/backend/.env`)
Contains all secure keys and database strings.
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=redis://redis:6379
JWT_SECRET=your_jwt_secret
API_KEY=your_tmdb_api_key
FRONTEND_URL=http://localhost:8080
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_your_resend_api_key
SMTP_FROM="Chitram <no-reply@your-domain.com>"
SHOW_DEV_OTP=false
ALLOW_DEV_OTP_LOG=false
```

### 3) Frontend Production (`/frontend/.env.production`)
*Optional:* Only required if you are building the frontend manually (e.g., Vercel, Netlify) outside of the provided Docker setup.

### Resend Email Setup

1. Add your sending domain in Resend.
2. Add every DKIM, SPF/MX, and SPF/TXT record shown by Resend to your DNS provider.
3. Wait until the domain status is **Verified**.
4. Use an address on that verified domain in `SMTP_FROM`.
5. Run `npm run verify:email --prefix backend` to verify SMTP authentication.

SMTP authentication alone does not verify the sender domain. Resend rejects OTP emails until the domain's DNS records are verified.

---

## Run Locally

### Docker (Recommended, one command)

Chitram is fully containerized (Frontend, Backend, and Redis).
Make sure Docker Desktop is running. Configure `backend/.env`, then copy the root `.env.example` to `.env` and set your Google OAuth client ID.

```bash
docker compose up --build -d
```

- **Frontend:** `http://localhost:8080`
- **Backend API:** `http://localhost:5000`
- Stop the app: `docker compose down`

### Native Development (Hot Reload)

If you prefer to run without Docker (requires Node.js, MongoDB, and Redis installed locally):

#### 1) Clone repository
```bash
git clone <your-repo-url>
cd Chitram
```

#### 2) Install dependencies
```bash
npm install
npm run install:apps
```

#### 3) Configure environment variables
- Add backend `.env` with MongoDB, Redis, JWT, and TMDB keys.
- Ensure the root `.env` has the correct API and frontend URLs.

#### 4) Start both applications
```bash
npm run dev
```

Frontend default: `http://localhost:8080`

---

## API Endpoints

Base URL: `/api`

### Auth
- `POST /auth/register`
- `POST /auth/verify-register-otp`
- `POST /auth/resend-register-otp`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/forgot-password/request-otp`
- `POST /auth/forgot-password/reset`

### Recommendations & Tracking
- `POST /interact`
- `GET /recommend/personalized`
- `GET /recommend/recently-viewed`

### Favorites (Protected)
- `POST /favourite/addFavorite`
- `DELETE /favourite/removeFavorite/:movieId`
- `GET /favourite/getFavorites`

### Lists
- `GET /lists` (Protected)
- `POST /lists` (Protected)
- `POST /lists/:listId/movie` (Protected)
- `GET /lists/:listId` (Protected)
- `PATCH /lists/:listId/visibility` (Protected)
- `DELETE /lists/:listId` (Protected)
- `GET /lists/public/:listId` (Public)

### Search & Media Proxy
- `GET /search/exploreMovies`
- `GET /search/searchMovie`
- `GET /search/searchPerson`
- `GET /search/searchActor`
- `GET /search/searchDirector`
- `GET /search/searchMovieByGenre`
- `GET /search/searchMovie/:id`
- `GET /search/download-image` (Bypasses CORS for direct downloads)

---

## Deployment Notes

- Frontend is configured for static hosting.
- Public list links are generated using frontend env var: `VITE_PUBLIC_APP_URL`
- If hosting has strict path handling, ensure SPA fallback is enabled (`/_redirects` already exists in `frontend/public`).

---

## Future Improvements

- Better list collaboration features
- Pagination for long lists
- Better caching for TMDB responses
- Improved analytics and recommendation personalization
- End-to-end tests for critical user flows

---

If you use this project, please star the repository and share feedback.
