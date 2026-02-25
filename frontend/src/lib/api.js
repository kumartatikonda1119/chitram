import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if not already on login/register
      if (
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/register")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/profile"),
};

// Favorite APIs
export const favoriteAPI = {
  add: (movieId) => api.post("/favourite/addFavorite", { movieId }),
  remove: (movieId) => api.delete(`/favourite/removeFavorite/${movieId}`),
  getAll: () => api.get("/favourite/getFavorites"),
};

// List APIs
export const listAPI = {
  create: (name) => api.post("/lists", { name }),
  getAll: () => api.get("/lists"),
  getMovies: (listId) => api.get(`/lists/${listId}`),
  getPublic: (listId) => api.get(`/lists/public/${listId}`),
  addMovie: (listId, movieId) =>
    api.post(`/lists/${listId}/movie`, { movieId }),
  setVisibility: (listId, isPublic) =>
    api.patch(`/lists/${listId}/visibility`, { isPublic }),
  delete: (listId) => api.delete(`/lists/${listId}`),
};

// Search APIs (existing TMDB)
export const searchAPI = {
  searchMovie: (id) => api.get(`/search/searchMovie/${id}`),
  searchMovies: (query) => api.get(`/search/search?query=${query}`),
};

export default api;
