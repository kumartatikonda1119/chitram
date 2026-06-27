# Chitram

Chitram is a full-stack cinema discovery platform where users can explore movies, search by multiple filters, view cast and crew details, save favorites, create custom movie lists, and share public lists with others.

## Author

**Kumar Tatikonda**

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
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

Chitram helps movie lovers:

- Discover trending and curated movie sections
- Search movies, people, and genres
- Get rich movie detail pages (cast, crew, trailer videos, similar movies)
- Manage favorites and personal lists
- Share public lists through a direct link

The app uses **TMDB** as its movie data source and adds user-specific features through a custom backend with authentication and persistence.

---

## Core Features

### 1) Discovery & Search

- Explore sections: trending, classics, now playing, upcoming, language and genre-based sections
- Search by movie name, person name, and genre
- Language filters and sorting support in UI

### 2) Movie Detail Experience

- Poster, backdrop, runtime, release date, language, ratings, votes
- Cast and crew tabs
- Embedded trailer/videos tab
- Similar movies section

### 3) Authentication

- Register/Login
- JWT-based protected APIs
- Forgot password endpoint

### 4) Favorites

- Add/remove favorite movies for logged-in users
- Fetch personalized favorites list

### 5) Custom Lists + Sharing

- Create/delete personal lists
- Add movies to a list
- Toggle list visibility (private/public)
- Public lists can be shared as links and viewed via list detail page

### 6) Responsive UX

- Mobile-first responsive design
- Bottom tab navigation on mobile (YouTube-style pattern)

---

## Tech Stack

### Frontend

- React 18 + Vite
- React Router
- Tailwind CSS + shadcn/ui + Radix UI
- Framer Motion
- Axios
- TanStack Query

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs
- CORS + dotenv

### External Data Provider

- TMDB (The Movie Database) API

---

## Project Structure

```text
Chitram/
├── backend/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── favourite.controller.js
│   │   ├── list.controller.js
│   │   └── search.controller.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── favourite.model.js
│   │   ├── list.model.js
│   │   ├── listItem.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── auth.route.js
│   │   ├── favourite.route.js
│   │   ├── list.route.js
│   │   └── search.route.js
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   ├── _redirects
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## TMDB API Integration

Chitram backend consumes TMDB endpoints in `search.controller.js`.

### What is used from TMDB

- Movie search
- Person search
- Actor details + credits
- Director filmography extraction
- Discover by genre/language
- Trending/Top rated/Now playing/Upcoming feeds
- Movie details by ID with appended `credits`, `videos`, and `similar`

### Required key

Set `API_KEY` in backend environment variables (TMDB API key).

Get your key from: https://www.themoviedb.org/settings/api

---

## How Users Can Use Chitram

### For visitors

1. Open homepage and explore sections
2. Search for movies or people
3. Open movie details and trailers

### For registered users

1. Create an account and login
2. Add movies to favorites
3. Create custom lists
4. Add movies to lists
5. Mark list as public to enable link sharing
6. Share list link so friends can view list detail page

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
API_KEY=your_tmdb_api_key
FRONTEND_URL=http://localhost:5173,https://your-frontend-domain.com
RENDER_EXTERNAL_URL=https://your-backend-domain.onrender.com
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_your_resend_api_key
SMTP_FROM="Chitram <no-reply@your-verified-domain.com>"
SHOW_DEV_OTP=false
ALLOW_DEV_OTP_LOG=false
```

### Frontend (`frontend/.env.production` and/or `frontend/.env`)

```env
VITE_API_BASE_URL=https://your-backend-domain.onrender.com/api
VITE_PUBLIC_APP_URL=https://your-frontend-domain.com
```

> `VITE_PUBLIC_APP_URL` is used while generating share links for public lists.

Copy `backend/.env.example` and `frontend/.env.example` as starting points. Never
commit real `.env` files.

### Resend email setup

1. Add your sending domain in Resend.
2. Add every DKIM, SPF/MX, and SPF/TXT record shown by Resend to your DNS provider.
3. Wait until the domain status is **Verified**.
4. Use an address on that verified domain in `SMTP_FROM`.
5. Run `npm run verify:email --prefix backend` to verify SMTP authentication.

SMTP authentication alone does not verify the sender domain. Resend rejects OTP
emails until the domain's DNS records are verified.

---

## Run Locally

### Docker (recommended, one command)

Docker Desktop must be running. Configure `backend/.env`, then copy the root
`.env.example` to `.env` and set the Google OAuth web client ID used by Vite.

```bash
docker compose up --build
```

Open `http://localhost:8080`. The API is exposed on `http://localhost:5000`.
Stop everything with `docker compose down`.

### Native development (hot reload)

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

- Add backend `.env` with MongoDB, JWT, and TMDB key
- Add frontend `.env` (or `.env.production`) with backend API URL and public app URL

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

### Search / TMDB Proxy

- `GET /search/exploreMovies`
- `GET /search/searchMovie`
- `GET /search/searchPerson`
- `GET /search/searchActor`
- `GET /search/searchDirector`
- `GET /search/searchMovieByGenre`
- `GET /search/searchMovie/:id`

---

## Deployment Notes

- Frontend is configured for static hosting.
- Public list links are generated using frontend env var:
  - `VITE_PUBLIC_APP_URL`
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
