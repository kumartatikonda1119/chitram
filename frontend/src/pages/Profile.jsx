import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Heart, List, Share2, Plus, Trash2, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const APP_BASE_URL = (
  import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin
).replace(/\/$/, "");

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [lists, setLists] = useState([]);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [activeTab, setActiveTab] = useState("favorites");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    setLoading(true);
    await Promise.all([fetchFavorites(), fetchLists()]);
    setLoading(false);
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_BASE_URL}/favourite/getFavorites`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const favs = response.data.favorites || [];
      setFavorites(favs);

      if (favs.length === 0) {
        setFavoriteMovies([]);
        return;
      }

      // Fetch movie details for each favorite
      const moviePromises = favs.map(async (fav) => {
        try {
          const movieRes = await axios.get(
            `${API_BASE_URL}/search/searchMovie/${fav.movieId}`,
          );
          return movieRes.data.data;
        } catch (error) {
          console.error(`Error fetching movie ${fav.movieId}:`, error);
          return null;
        }
      });

      const movies = await Promise.all(moviePromises);
      setFavoriteMovies(movies.filter(Boolean));
    } catch (error) {
      console.error("Error fetching favorites:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to load favorites");
    }
  };

  const fetchLists = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_BASE_URL}/lists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userLists = response.data || [];

      if (userLists.length === 0) {
        setLists([]);
        return;
      }

      // Fetch movies for each list
      const listsWithMovies = await Promise.all(
        userLists.map(async (list) => {
          try {
            const moviesRes = await axios.get(
              `${API_BASE_URL}/lists/${list._id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            const movieIds = moviesRes.data || [];

            if (movieIds.length === 0) {
              return { ...list, movies: [] };
            }

            // Fetch movie details
            const movieDetails = await Promise.all(
              movieIds.map(async (item) => {
                try {
                  const movieRes = await axios.get(
                    `${API_BASE_URL}/search/searchMovie/${item.movieId}`,
                  );
                  return movieRes.data.data;
                } catch (error) {
                  console.error(`Error fetching movie ${item.movieId}:`, error);
                  return null;
                }
              }),
            );

            return {
              ...list,
              movies: movieDetails.filter(Boolean),
            };
          } catch (error) {
            console.error(`Error fetching list ${list._id} movies:`, error);
            return { ...list, movies: [] };
          }
        }),
      );

      setLists(listsWithMovies);
    } catch (error) {
      console.error("Error fetching lists:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to load lists");
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/lists`,
        { name: newListName.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setLists([...lists, { ...response.data, movies: [] }]);
      setNewListName("");
      setShowNewList(false);
      toast.success("List created!");
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error(error.response?.data?.error || "Failed to create list");
    }
  };

  const handleDeleteList = async (listId) => {
    if (!confirm("Are you sure you want to delete this list?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/lists/${listId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLists(lists.filter((l) => l._id !== listId));
      toast.success("List deleted");
    } catch (error) {
      console.error("Error deleting list:", error);
      toast.error("Failed to delete list");
    }
  };

  const handleShareList = (list) => {
    const moviesList =
      list.movies?.map((m, i) => `${i + 1}) ${m.title}`).join("\n") ||
      "No movies yet";
    const listUrl = `${APP_BASE_URL}/#/list/${list._id}`;
    const text = `These are my 🎬 ${list.name} on Chitram:\n${moviesList}\n\nOpen this list: ${listUrl}\n\nDo you want to make your own list? Visit ${APP_BASE_URL}`;

    if (navigator.share) {
      navigator.share({
        title: list.name,
        text,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("List copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Navbar />
      <div className="pt-24 pb-24 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12"
          >
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold text-foreground">
                {user?.username || "Movie Lover"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {favoriteMovies.length} favorites • {lists.length} lists
              </p>
            </div>
          </motion.div>

          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === "favorites" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
            >
              <Heart className="h-4 w-4" />
              Favorites
            </button>
            <button
              onClick={() => setActiveTab("lists")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === "lists" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
            >
              <List className="h-4 w-4" />
              My Lists
            </button>
          </div>

          {activeTab === "favorites" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {favoriteMovies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                  {favoriteMovies.map((movie, i) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link to={`/movie/${movie.id}`} className="group block">
                        <div className="aspect-[2/3] rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary/30 transition-all">
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-4xl">🎬</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {movie.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ⭐ {movie.vote_average?.toFixed(1) || "N/A"}
                        </p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No favorites yet. Start exploring!
                  </p>
                  <Link
                    to="/search"
                    className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                  >
                    Explore Movies
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "lists" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <button
                onClick={() => setShowNewList(!showNewList)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create New List
              </button>

              <AnimatePresence>
                {showNewList && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2 max-w-md"
                  >
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="List name..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                      autoFocus
                    />
                    <button
                      onClick={handleCreateList}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                    >
                      Create
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                {lists.length > 0 ? (
                  lists.map((list, i) => (
                    <motion.div
                      key={list._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Link
                            to={`/list/${list._id}`}
                            className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {list.name}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-1">
                            {list.movies?.length || 0} movies
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShareList(list)}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="Share list"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteList(list._id)}
                            className="p-2 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                            title="Delete list"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {list.movies && list.movies.length > 0 ? (
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                          {list.movies.map((movie) => (
                            <Link
                              key={movie.id}
                              to={`/movie/${movie.id}`}
                              className="flex-shrink-0 group"
                            >
                              <div className="w-24 aspect-[2/3] rounded-lg bg-secondary overflow-hidden group-hover:ring-2 ring-primary transition-all">
                                {movie.poster_path ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-2xl">🎬</span>
                                  </div>
                                )}
                              </div>
                              <p className="mt-1.5 text-xs text-foreground line-clamp-1 w-24 group-hover:text-primary transition-colors">
                                {movie.title}
                              </p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No movies yet. Search and add movies to this list!
                        </p>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No lists yet. Create your first list!
                    </p>
                    <button
                      onClick={() => setShowNewList(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Create List
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
