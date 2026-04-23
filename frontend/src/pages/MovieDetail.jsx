import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GENRES, LANGUAGES } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Film,
  MapPin,
  Building2,
  Volume2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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
  const [activeTab, setActiveTab] = useState("cast");
  const [crewData, setCrewData] = useState({});
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [ottProviders, setOttProviders] = useState(null);
  const [activeBackdropIndex, setActiveBackdropIndex] = useState(0);

  const handleAuthError = (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.error("Session expired. Please login again.");
      navigate("/login");
      return true;
    }
    return false;
  };

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
      const response = await axios.get(
        `${API_BASE_URL}/search/searchMovie/${id}`,
      );
      setMovie(response.data.data);
      setActiveBackdropIndex(0);

      try {
        const ottResponse = await axios.get(
          `${API_BASE_URL}/search/getOTTProvider/${id}`,
        );
        setOttProviders(ottResponse.data?.indiaProviders || null);
      } catch {
        setOttProviders(null);
      }

      // Extract trailer URL from videos - with flexible matching
      if (
        response.data.data.videos?.results &&
        response.data.data.videos.results.length > 0
      ) {
        // First try: exact match for Trailer type on YouTube
        let trailerFound = response.data.data.videos.results.find(
          (v) => v.type === "Trailer" && v.site === "YouTube",
        );

        // Fallback: any YouTube video with "Trailer" in name (case insensitive)
        if (!trailerFound) {
          trailerFound = response.data.data.videos.results.find(
            (v) =>
              v.site === "YouTube" && v.name?.toLowerCase().includes("trailer"),
          );
        }

        // Fallback: just get any YouTube video
        if (!trailerFound) {
          trailerFound = response.data.data.videos.results.find(
            (v) => v.site === "YouTube",
          );
        }

        if (trailerFound) {
          setTrailerUrl(`https://www.youtube.com/embed/${trailerFound.key}`);
        } else {
          console.log(
            "No YouTube videos found. Available videos:",
            response.data.data.videos.results,
          );
        }
      } else {
        console.log("No videos in response for movie:", id);
      }

      // Fetch crew details for cast and crew members in parallel
      if (response.data.data.credits) {
        const crewMap = {};
        const fetchPromises = [];

        // Collect all people to fetch (crew + cast)
        const allPeople = [
          ...(response.data.data.credits.crew || []),
          ...(response.data.data.credits.cast || []),
        ];

        // Create promises for all fetches
        allPeople.forEach((person) => {
          if (!crewMap[person.id]) {
            fetchPromises.push(
              axios
                .get(`${API_BASE_URL}/search/searchActor?actorid=${person.id}`)
                .then((res) => {
                  if (res.data.data?.profile_path) {
                    crewMap[person.id] = res.data.data.profile_path;
                  }
                })
                .catch((err) => {
                  console.error(
                    `Error fetching person details for ${person.id}:`,
                    err,
                  );
                }),
            );
          }
        });

        // Wait for all fetches to complete
        if (fetchPromises.length > 0) {
          await Promise.all(fetchPromises);
        }

        setCrewData(crewMap);
      }
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
      if (!token) return;
      const response = await axios.get(
        `${API_BASE_URL}/favourite/getFavorites`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const favorites = response.data.favorites;
      setIsFavorite(favorites.some((fav) => fav.movieId === parseInt(id)));
    } catch (error) {
      if (handleAuthError(error)) return;
      console.error("Error checking favorites:", error);
    }
  };

  const fetchUserLists = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/lists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLists(response.data || []);
    } catch (error) {
      if (handleAuthError(error)) return;
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
      if (!token) {
        toast.error("Please login to add favorites");
        navigate("/login");
        return;
      }
      if (isFavorite) {
        await axios.delete(`${API_BASE_URL}/favourite/removeFavorite/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        await axios.post(
          `${API_BASE_URL}/favourite/addFavorite`,
          { movieId: parseInt(id) },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setIsFavorite(true);
        toast.success("Added to favorites!");
      }
    } catch (error) {
      if (handleAuthError(error)) return;
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
      if (!token) {
        toast.error("Please login to create lists");
        navigate("/login");
        return;
      }
      await axios.post(
        `${API_BASE_URL}/lists/${selectedList._id}/movie`,
        { movieId: parseInt(id) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success(`Added to "${selectedList.name}"!`);
      setShowListModal(false);
      setSelectedList(null); // Reset selection
    } catch (error) {
      if (handleAuthError(error)) return;
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
      if (!token) {
        toast.error("Please login to create lists");
        navigate("/login");
        return;
      }
      const response = await axios.post(
        `${API_BASE_URL}/lists`,
        { name: newListName.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setLists([...lists, response.data]);
      setNewListName("");
      toast.success("List created!");
    } catch (error) {
      if (handleAuthError(error)) return;
      console.error("Error creating list:", error);
      toast.error(error.response?.data?.error || "Failed to create list");
    }
  };

  const getDirector = () => {
    if (!movie.credits?.crew) return null;
    return movie.credits.crew.find((c) => c.job === "Director");
  };

  const getProducers = () => {
    if (!movie.credits?.crew) return [];
    return movie.credits.crew.filter((c) => c.job === "Producer").slice(0, 5);
  };

  const getWriters = () => {
    if (!movie.credits?.crew) return [];
    return movie.credits.crew
      .filter((c) => c.department === "Writing")
      .slice(0, 5);
  };

  const getComposers = () => {
    if (!movie.credits?.crew) return [];
    return movie.credits.crew
      .filter((c) => c.job === "Original Music Composer")
      .slice(0, 3);
  };

  const getVisibleTabsCount = () => {
    let count = 0;
    if (movie.credits?.cast?.length > 0) count++;
    if (
      movie.credits?.crew?.length > 0 ||
      getProducers().length > 0 ||
      getWriters().length > 0 ||
      getComposers().length > 0
    )
      count++;
    if (trailerUrl) count++;
    if (movie.images?.backdrops?.some((b) => b?.file_path)) count++;
    return count;
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
  const galleryBackdrops = (movie.images?.backdrops || [])
    .filter((b) => b?.file_path)
    .sort(
      (a, b) =>
        (b.vote_count || 0) - (a.vote_count || 0) ||
        (b.vote_average || 0) - (a.vote_average || 0),
    )
    .slice(0, 24);
  const activeBackdrop =
    galleryBackdrops.length > 0
      ? galleryBackdrops[
          Math.min(activeBackdropIndex, galleryBackdrops.length - 1)
        ]
      : null;

  const handleShare = () => {
    const shareUrl = window.location.href;
    const shareText = `Check out "${movie.title}" on Chitram! 🎬\n\nDo you want to make your own list? Visit https://chitram.onrender.com`;
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: `${shareText}\n${shareUrl}`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Navbar />
      <div className="pt-20">
        <div className="relative h-[40vh] md:h-[50vh] bg-secondary overflow-hidden">
          {movie.backdrop_path ? (
            <>
              <img
                src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                alt={movie.title}
                className="w-full h-full object-cover object-[center_22%] md:object-[center_18%]"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 text-sm">
                {getDirector() && (
                  <div className="flex items-start gap-3">
                    <Film className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Director
                      </p>
                      <Link
                        to={`/person/${getDirector().id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {getDirector().name}
                      </Link>
                    </div>
                  </div>
                )}
                {movie.origin_country && movie.origin_country.length > 0 && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Country
                      </p>
                      <p className="font-medium text-foreground">
                        {movie.origin_country.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                {movie.production_companies &&
                  movie.production_companies.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">
                          Production
                        </p>
                        <p className="font-medium text-foreground">
                          {movie.production_companies
                            .slice(0, 2)
                            .map((p) => p.name)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                {movie.status && (
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 text-primary text-xs font-bold mt-0.5">
                      •
                    </span>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Status
                      </p>
                      <p className="font-medium text-foreground">
                        {movie.status}
                      </p>
                    </div>
                  </div>
                )}
                {movie.spoken_languages &&
                  movie.spoken_languages.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Volume2 className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">
                          Languages
                        </p>
                        <p className="font-medium text-foreground">
                          {movie.spoken_languages
                            .slice(0, 2)
                            .map((l) => l.english_name)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                {movie.overview}
              </p>

              {ottProviders && (
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Streaming In India
                    </p>
                    {ottProviders.link && (
                      <a
                        href={ottProviders.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        View All
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: "flatrate", label: "Stream" },
                      { key: "rent", label: "Rent" },
                      { key: "buy", label: "Buy" },
                    ].map(({ key, label }) =>
                      ottProviders[key]?.length > 0 ? (
                        <div key={key}>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                            {label}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {ottProviders[key].slice(0, 6).map((provider) => (
                              <span
                                key={`${key}-${provider.provider_id}`}
                                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium"
                              >
                                {provider.logo_path && (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                                    alt={provider.provider_name}
                                    className="w-4 h-4 rounded-sm object-cover"
                                  />
                                )}
                                {provider.provider_name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              )}

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

        {(movie.credits?.cast?.length > 0 ||
          movie.credits?.crew?.length > 0 ||
          trailerUrl ||
          getProducers().length > 0 ||
          getWriters().length > 0 ||
          getComposers().length > 0) && (
          <section className="py-16">
            <div className="container mx-auto px-4 md:px-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList
                  className={`grid w-full max-w-md ${
                    getVisibleTabsCount() === 4
                      ? "grid-cols-4"
                      : getVisibleTabsCount() === 3
                        ? "grid-cols-3"
                        : getVisibleTabsCount() === 2
                          ? "grid-cols-2"
                          : "grid-cols-1"
                  }`}
                >
                  {movie.credits?.cast?.length > 0 && (
                    <TabsTrigger value="cast">Cast</TabsTrigger>
                  )}
                  {(movie.credits?.crew?.length > 0 ||
                    getProducers().length > 0 ||
                    getWriters().length > 0 ||
                    getComposers().length > 0) && (
                    <TabsTrigger value="crew">Crew</TabsTrigger>
                  )}
                  {galleryBackdrops.length > 0 && (
                    <TabsTrigger value="gallery">Gallery</TabsTrigger>
                  )}
                  {trailerUrl && (
                    <TabsTrigger value="trailer">Videos</TabsTrigger>
                  )}
                </TabsList>

                {movie.credits?.cast?.length > 0 && (
                  <TabsContent value="cast" className="mt-8">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                      Cast
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                      {movie.credits.cast.slice(0, 18).map((person, i) => (
                        <motion.div
                          key={person.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Link
                            to={`/person/${person.id}`}
                            className="group block"
                          >
                            <div className="aspect-[2/3] rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary/30 transition-all">
                              {person.profile_path ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                                  alt={person.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <Users className="h-12 w-12 text-muted-foreground" />
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
                  </TabsContent>
                )}

                {(movie.credits?.crew?.length > 0 ||
                  getProducers().length > 0 ||
                  getWriters().length > 0 ||
                  getComposers().length > 0) && (
                  <TabsContent value="crew" className="mt-8">
                    <div className="space-y-12">
                      {getDirector() && (
                        <div>
                          <h3 className="text-lg font-display font-bold text-foreground mb-6">
                            Director
                          </h3>
                          <Link
                            to={`/person/${getDirector().id}`}
                            className="group inline-block"
                          >
                            <div className="aspect-[2/3] w-40 rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary/30 transition-all">
                              {crewData[getDirector().id] ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w500${crewData[getDirector().id]}`}
                                  alt={getDirector().name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <Users className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <p className="mt-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {getDirector().name}
                            </p>
                          </Link>
                        </div>
                      )}

                      {getProducers().length > 0 && (
                        <div>
                          <h3 className="text-lg font-display font-bold text-foreground mb-6">
                            Producers
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                            {getProducers().map((producer, i) => (
                              <motion.div
                                key={producer.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Link
                                  to={`/person/${producer.id}`}
                                  className="group block"
                                >
                                  <div className="aspect-[2/3] rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary/30 transition-all">
                                    {crewData[producer.id] ? (
                                      <img
                                        src={`https://image.tmdb.org/t/p/w500${crewData[producer.id]}`}
                                        alt={producer.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-muted">
                                        <Users className="h-12 w-12 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <p className="mt-2 text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                    {producer.name}
                                  </p>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {getWriters().length > 0 && (
                        <div>
                          <h3 className="text-lg font-display font-bold text-foreground mb-6">
                            Writers
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                            {getWriters().map((writer, i) => (
                              <motion.div
                                key={writer.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Link
                                  to={`/person/${writer.id}`}
                                  className="group block"
                                >
                                  <div className="aspect-[2/3] rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary/30 transition-all">
                                    {crewData[writer.id] ? (
                                      <img
                                        src={`https://image.tmdb.org/t/p/w500${crewData[writer.id]}`}
                                        alt={writer.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-muted">
                                        <Users className="h-12 w-12 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <p className="mt-2 text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                    {writer.name}
                                  </p>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {getComposers().length > 0 && (
                        <div>
                          <h3 className="text-lg font-display font-bold text-foreground mb-6">
                            Composers
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                            {getComposers().map((composer, i) => (
                              <motion.div
                                key={composer.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Link
                                  to={`/person/${composer.id}`}
                                  className="group block"
                                >
                                  <div className="aspect-[2/3] rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary/30 transition-all">
                                    {crewData[composer.id] ? (
                                      <img
                                        src={`https://image.tmdb.org/t/p/w500${crewData[composer.id]}`}
                                        alt={composer.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-muted">
                                        <Users className="h-12 w-12 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <p className="mt-2 text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                    {composer.name}
                                  </p>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}

                {trailerUrl && (
                  <TabsContent value="trailer" className="mt-8">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                      Related Videos
                    </h2>
                    <div className="w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                      <iframe
                        className="w-full h-full"
                        src={trailerUrl}
                        title={`${movie.title} Video`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </TabsContent>
                )}

                {galleryBackdrops.length > 0 && (
                  <TabsContent value="gallery" className="mt-8">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-6">
                      Visual Gallery
                    </h2>

                    <div className="relative h-[36vh] sm:h-[44vh] lg:h-[52vh] max-h-[620px] min-h-[220px] rounded-2xl overflow-hidden border border-border bg-card">
                      <img
                        src={`https://image.tmdb.org/t/p/original${activeBackdrop.file_path}`}
                        alt={`${movie.title} backdrop ${activeBackdropIndex + 1}`}
                        className="w-full h-full object-contain bg-black/30"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                      {galleryBackdrops.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setActiveBackdropIndex((prev) =>
                                prev === 0
                                  ? galleryBackdrops.length - 1
                                  : prev - 1,
                              )
                            }
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              setActiveBackdropIndex((prev) =>
                                prev === galleryBackdrops.length - 1
                                  ? 0
                                  : prev + 1,
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                            aria-label="Next image"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                      {galleryBackdrops.map((image, index) => (
                        <button
                          key={`${image.file_path}-${index}`}
                          onClick={() => setActiveBackdropIndex(index)}
                          className={`relative w-32 md:w-40 aspect-video rounded-xl overflow-hidden border transition-all shrink-0 ${
                            index === activeBackdropIndex
                              ? "border-primary ring-2 ring-primary/40"
                              : "border-border"
                          }`}
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w500${image.file_path}`}
                            alt={`Backdrop ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
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
