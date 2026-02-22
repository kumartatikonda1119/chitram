import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GENRES, LANGUAGES } from "@/lib/types";
import {
  Star,
  Heart,
  Plus,
  Share2,
  ArrowLeft,
  Calendar,
  Globe,
  Users,
  Clock,
  Play,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  useEffect(() => {
    fetchMovieDetails();
  }, [id]);

  useEffect(() => {
    if (user) {
      checkIfFavorite();
      fetchUserLists();
    }
  }, [user, id]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/search/searchMovie/${id}`);
      setMovie(response.data.data);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      toast.error("Failed to load movie details");
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/favourite/getFavorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const favorites = response.data.favorites;
      setIsFavorite(favorites.some((fav) => fav.movieId === parseInt(id)));
    } catch (error) {
      console.error("Error checking favorites:", error);
    }
  };

  const fetchUserLists = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/lists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLists(response.data || []);
    } catch (error) {
      console.error("Error fetching lists:", error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please login to add favorites");
      navigate("/login");
      return;
    }

    setLoadingFavorite(true);
    try {
      const token = localStorage.getItem("token");
      if (isFavorite) {
        await axios.delete(`${API_BASE_URL}/favourite/remove/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        await axios.post(
          `${API_BASE_URL}/favourite/add`,
          { movieId: parseInt(id) },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setIsFavorite(true);
        toast.success("Added to favorites!");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error(error.response?.data?.error || "Failed to update favorites");
    } finally {
      setLoadingFavorite(false);
    }
  };

  const toggleListModal = () => {
    setShowListModal(!showListModal);
    if (showListModal) {
      // If closing the modal, reset selection
      setSelectedList(null);
    }
  };

  const handleAddToList = async () => {
    if (!user) {
      toast.error("Please login to create lists");
      navigate("/login");
      return;
    }

    if (!selectedList) {
      toast.error("Please select a list first");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/lists/${selectedList._id}/movie`,
        { movieId: parseInt(id) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(`Added to "${selectedList.name}"!`);
      setShowListModal(false);
      setSelectedList(null); // Reset selection
    } catch (error) {
      console.error("Error adding to list:", error);
      toast.error(error.response?.data?.error || "Failed to add to list");
    }
  };

  const handleCreateList = async () => {
    if (!user) {
      toast.error("Please login to create lists");
      navigate("/login");
      return;
    }

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
        }
      );
      setLists([...lists, response.data]);
      setNewListName("");
      toast.success("List created!");
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error(error.response?.data?.error || "Failed to create list");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🎬</p>
          <p className="text-muted-foreground">Movie not found</p>
          <Link
            to="/explore"
            className="text-primary hover:underline text-sm mt-2 block"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const genreNames = movie.genres?.map((g) => g.name) || [];

  const handleShare = () => {
    const shareUrl = window.location.href;
    const shareText = `Check out "${movie.title}" on Chitram! 🎬`;
    if (navigator.share) {
      navigator.share({ title: movie.title, text: shareText, url: shareUrl });
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <div className="relative h-[40vh] md:h-[50vh] bg-secondary overflow-hidden">
          {movie.backdrop_path ? (
            <>
              <img
                src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl opacity-20">🎬</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </>
          )}
          <div className="absolute top-6 left-6 z-10">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 -mt-32 relative z-10">
          <div className="flex flex-col md:flex-row gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0"
            >
              <div className="w-48 md:w-64 aspect-[2/3] rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">🎬</span>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 space-y-5"
            >
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="text-lg italic text-muted-foreground">
                  "{movie.tagline}"
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span className="font-semibold text-foreground">
                    {movie.vote_average?.toFixed(1) || "N/A"}
                  </span>
                  <span>/ 10</span>
                </span>
                {movie.release_date && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {movie.release_date}
                  </span>
                )}
                {movie.runtime && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {movie.runtime} min
                  </span>
                )}
                {movie.original_language && (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-4 w-4" />
                    {LANGUAGES.find(
                      (l) => l.code === movie.original_language?.toLowerCase(),
                    )?.name || movie.original_language.toUpperCase()}
                  </span>
                )}
                {movie.vote_count && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {movie.vote_count.toLocaleString()} votes
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {genreNames.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                {movie.overview}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleToggleFavorite}
                  disabled={loadingFavorite}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${isFavorite ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
                >
                  <Heart
                    className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                  />
                  {loadingFavorite
                    ? "Loading..."
                    : isFavorite
                      ? "Favorited"
                      : "Add to Favorites"}
                </button>
                <button
                  onClick={toggleListModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add to List
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-all"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>

              {showListModal && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-card border border-border max-w-sm"
                >
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    {user ? "Add to List" : "Login to create lists"}
                  </h3>
                  {user ? (
                    <>
                      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                        {lists.length > 0 ? (
                          lists.map((list) => (
                            <button
                              key={list._id}
                              onClick={() => setSelectedList(list)}
                              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                                selectedList?._id === list._id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-secondary-foreground hover:bg-muted"
                              }`}
                            >
                              {list.name}
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            No lists yet. Create one below!
                          </p>
                        )}
                      </div>
                      {selectedList && (
                        <button
                          onClick={handleAddToList}
                          className="w-full mb-4 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          Add to "{selectedList.name}"
                        </button>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          placeholder="New list name..."
                          className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleCreateList()
                          }
                        />
                        <button
                          onClick={handleCreateList}
                          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                        >
                          Create
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Sign in to create and manage your movie lists
                      </p>
                      <Link
                        to="/login"
                        className="inline-flex px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                      >
                        Sign In
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4 md:px-6">
              <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                Cast
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {movie.credits.cast.slice(0, 12).map((person, i) => (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/person/${person.id}`} className="group block">
                      <div className="aspect-[2/3] rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary/30 transition-all">
                        {person.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="h-12 w-12 text-muted" />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {person.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {person.character}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {movie.similar?.results && movie.similar.results.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4 md:px-6">
              <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                Similar Movies
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {movie.similar.results.slice(0, 12).map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link to={`/movie/${m.id}`} className="group block">
                      <div className="aspect-[2/3] rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary/30 transition-all">
                        {m.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                            alt={m.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-3xl">🎬</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {m.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.release_date?.split("-")[0]}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
};
export default MovieDetail;
