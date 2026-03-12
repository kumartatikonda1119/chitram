import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LANGUAGES } from "@/lib/types";
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
  Tv,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const SeriesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [series, setSeries] = useState(null);
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
    fetchSeriesDetails();
  }, [id]);

  useEffect(() => {
    if (user) {
      checkIfFavorite();
      fetchUserLists();
    }
  }, [user, id]);

  const fetchSeriesDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/search/searchSeries/${id}`,
      );
      setSeries(response.data.data);

      if (
        response.data.data.videos?.results &&
        response.data.data.videos.results.length > 0
      ) {
        let trailerFound = response.data.data.videos.results.find(
          (v) => v.type === "Trailer" && v.site === "YouTube",
        );
        if (!trailerFound) {
          trailerFound = response.data.data.videos.results.find(
            (v) =>
              v.site === "YouTube" && v.name?.toLowerCase().includes("trailer"),
          );
        }
        if (!trailerFound) {
          trailerFound = response.data.data.videos.results.find(
            (v) => v.site === "YouTube",
          );
        }
        if (trailerFound) {
          setTrailerUrl(`https://www.youtube.com/embed/${trailerFound.key}`);
        }
      }

      // Fetch profile images for cast & crew
      if (response.data.data.credits) {
        const crewMap = {};
        const fetchPromises = [];
        const allPeople = [
          ...(response.data.data.credits.crew || []),
          ...(response.data.data.credits.cast || []),
        ];

        allPeople.forEach((person) => {
          if (!crewMap[person.id] && !person.profile_path) {
            fetchPromises.push(
              axios
                .get(`${API_BASE_URL}/search/searchActor?actorid=${person.id}`)
                .then((res) => {
                  if (res.data.data?.profile_path) {
                    crewMap[person.id] = res.data.data.profile_path;
                  }
                })
                .catch(() => {}),
            );
          }
        });

        if (fetchPromises.length > 0) {
          await Promise.all(fetchPromises);
        }
        setCrewData(crewMap);
      }
    } catch (error) {
      console.error("Error fetching series details:", error);
      toast.error("Failed to load series details");
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
        { headers: { Authorization: `Bearer ${token}` } },
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
        headers: { Authorization: `Bearer ${token}` },
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
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        await axios.post(
          `${API_BASE_URL}/favourite/addFavorite`,
          { movieId: parseInt(id) },
          { headers: { Authorization: `Bearer ${token}` } },
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
    if (showListModal) setSelectedList(null);
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
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`Added to "${selectedList.name}"!`);
      setShowListModal(false);
      setSelectedList(null);
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
        { headers: { Authorization: `Bearer ${token}` } },
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

  const getCreators = () => {
    return series.created_by || [];
  };

  const getProducers = () => {
    if (!series.credits?.crew) return [];
    return series.credits.crew
      .filter(
        (c) =>
          c.job === "Producer" ||
          c.job === "Executive Producer" ||
          c.job === "Co-Producer",
      )
      .slice(0, 8);
  };

  const getWriters = () => {
    if (!series.credits?.crew) return [];
    return series.credits.crew
      .filter((c) => c.department === "Writing")
      .slice(0, 5);
  };

  const getDirectors = () => {
    if (!series.credits?.crew) return [];
    return series.credits.crew
      .filter((c) => c.department === "Directing")
      .slice(0, 5);
  };

  const getVisibleTabsCount = () => {
    let count = 0;
    if (series.credits?.cast?.length > 0) count++;
    if (
      series.credits?.crew?.length > 0 ||
      getProducers().length > 0 ||
      getWriters().length > 0
    )
      count++;
    if (series.seasons?.length > 0) count++;
    if (trailerUrl) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">📺</p>
          <p className="text-muted-foreground">Series not found</p>
          <Link
            to="/search"
            className="text-primary hover:underline text-sm mt-2 block"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const genreNames = series.genres?.map((g) => g.name) || [];

  const handleShare = () => {
    const shareUrl = window.location.href;
    const shareText = `Check out "${series.name}" on Chitram! 📺\n\nDo you want to make your own list? Visit https://chitram.onrender.com`;
    if (navigator.share) {
      navigator.share({
        title: series.name,
        text: `${shareText}\n${shareUrl}`,
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
        {/* Backdrop */}
        <div className="relative h-[40vh] md:h-[50vh] bg-secondary overflow-hidden">
          {series.backdrop_path ? (
            <>
              <img
                src={`https://image.tmdb.org/t/p/original${series.backdrop_path}`}
                alt={series.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl opacity-20">📺</span>
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

        {/* Main Info */}
        <div className="container mx-auto px-4 md:px-6 -mt-32 relative z-10">
          <div className="flex flex-col md:flex-row gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0"
            >
              <div className="w-48 md:w-64 aspect-[2/3] rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
                {series.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
                    alt={series.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">📺</span>
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
                {series.name}
              </h1>
              {series.tagline && (
                <p className="text-lg italic text-muted-foreground">
                  "{series.tagline}"
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span className="font-semibold text-foreground">
                    {series.vote_average?.toFixed(1) || "N/A"}
                  </span>
                  <span>/ 10</span>
                </span>
                {series.first_air_date && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {series.first_air_date}
                    {series.last_air_date &&
                      series.last_air_date !== series.first_air_date &&
                      ` — ${series.last_air_date}`}
                  </span>
                )}
                {series.episode_run_time &&
                  series.episode_run_time.length > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {series.episode_run_time[0]} min/ep
                    </span>
                  )}
                {series.original_language && (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-4 w-4" />
                    {LANGUAGES.find(
                      (l) => l.code === series.original_language?.toLowerCase(),
                    )?.name || series.original_language.toUpperCase()}
                  </span>
                )}
                {series.vote_count > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {series.vote_count.toLocaleString()} votes
                  </span>
                )}
              </div>

              {/* Genres */}
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

              {/* Details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 text-sm">
                {series.number_of_seasons > 0 && (
                  <div className="flex items-start gap-3">
                    <Layers className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Seasons / Episodes
                      </p>
                      <p className="font-medium text-foreground">
                        {series.number_of_seasons} Season
                        {series.number_of_seasons !== 1 ? "s" : ""} •{" "}
                        {series.number_of_episodes} Episode
                        {series.number_of_episodes !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                )}
                {series.type && (
                  <div className="flex items-start gap-3">
                    <Tv className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Type
                      </p>
                      <p className="font-medium text-foreground">
                        {series.type}
                      </p>
                    </div>
                  </div>
                )}
                {series.origin_country && series.origin_country.length > 0 && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Origin Country
                      </p>
                      <p className="font-medium text-foreground">
                        {series.origin_country.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                {series.status && (
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 text-primary text-xs font-bold mt-0.5">
                      •
                    </span>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Status
                      </p>
                      <p className="font-medium text-foreground">
                        {series.status}
                      </p>
                    </div>
                  </div>
                )}
                {series.networks && series.networks.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Play className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        Network
                      </p>
                      <div className="flex items-center gap-2">
                        {series.networks.map((n) => (
                          <span
                            key={n.id}
                            className="font-medium text-foreground"
                          >
                            {n.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {series.production_companies &&
                  series.production_companies.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">
                          Production
                        </p>
                        <p className="font-medium text-foreground">
                          {series.production_companies
                            .slice(0, 3)
                            .map((p) => p.name)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                {series.spoken_languages &&
                  series.spoken_languages.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Volume2 className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide">
                          Languages
                        </p>
                        <p className="font-medium text-foreground">
                          {series.spoken_languages
                            .map((l) => l.english_name)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                {series.in_production !== undefined && (
                  <div className="flex items-start gap-3">
                    <Film className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        In Production
                      </p>
                      <p className="font-medium text-foreground">
                        {series.in_production ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Overview */}
              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                {series.overview}
              </p>

              {/* Homepage link */}
              {series.homepage && (
                <a
                  href={series.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary text-sm hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Official Website
                </a>
              )}

              {/* Last Episode */}
              {series.last_episode_to_air && (
                <div className="p-4 rounded-xl bg-card border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Last Episode
                  </p>
                  <p className="font-semibold text-foreground">
                    S{series.last_episode_to_air.season_number}E
                    {series.last_episode_to_air.episode_number} —{" "}
                    {series.last_episode_to_air.name}
                  </p>
                  {series.last_episode_to_air.air_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Aired: {series.last_episode_to_air.air_date}
                      {series.last_episode_to_air.runtime &&
                        ` • ${series.last_episode_to_air.runtime} min`}
                    </p>
                  )}
                  {series.last_episode_to_air.overview && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {series.last_episode_to_air.overview}
                    </p>
                  )}
                </div>
              )}

              {/* Next Episode */}
              {series.next_episode_to_air && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-xs text-primary uppercase tracking-wide mb-2">
                    Next Episode
                  </p>
                  <p className="font-semibold text-foreground">
                    S{series.next_episode_to_air.season_number}E
                    {series.next_episode_to_air.episode_number} —{" "}
                    {series.next_episode_to_air.name}
                  </p>
                  {series.next_episode_to_air.air_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Airs: {series.next_episode_to_air.air_date}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons — Only on Series Detail */}
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

              {/* List Modal */}
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
                        Sign in to create and manage your lists
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

        {/* Tabs Section: Cast, Crew, Seasons, Videos */}
        {(series.credits?.cast?.length > 0 ||
          series.credits?.crew?.length > 0 ||
          series.seasons?.length > 0 ||
          trailerUrl) && (
          <section className="py-16">
            <div className="container mx-auto px-4 md:px-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList
                  className={`grid w-full max-w-lg ${
                    getVisibleTabsCount() === 4
                      ? "grid-cols-4"
                      : getVisibleTabsCount() === 3
                        ? "grid-cols-3"
                        : getVisibleTabsCount() === 2
                          ? "grid-cols-2"
                          : "grid-cols-1"
                  }`}
                >
                  {series.credits?.cast?.length > 0 && (
                    <TabsTrigger value="cast">Cast</TabsTrigger>
                  )}
                  {(series.credits?.crew?.length > 0 ||
                    getProducers().length > 0 ||
                    getWriters().length > 0) && (
                    <TabsTrigger value="crew">Crew</TabsTrigger>
                  )}
                  {series.seasons?.length > 0 && (
                    <TabsTrigger value="seasons">Seasons</TabsTrigger>
                  )}
                  {trailerUrl && (
                    <TabsTrigger value="trailer">Videos</TabsTrigger>
                  )}
                </TabsList>

                {/* Cast Tab */}
                {series.credits?.cast?.length > 0 && (
                  <TabsContent value="cast" className="mt-8">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                      Cast
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                      {series.credits.cast.slice(0, 18).map((person, i) => (
                        <motion.div
                          key={`${person.id}-${i}`}
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
                              ) : crewData[person.id] ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w500${crewData[person.id]}`}
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

                {/* Crew Tab */}
                {(series.credits?.crew?.length > 0 ||
                  getProducers().length > 0 ||
                  getWriters().length > 0) && (
                  <TabsContent value="crew" className="mt-8">
                    <div className="space-y-12">
                      {getCreators().length > 0 && (
                        <div>
                          <h3 className="text-lg font-display font-bold text-foreground mb-6">
                            Created By
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                            {getCreators().map((person, i) => (
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
                                    ) : crewData[person.id] ? (
                                      <img
                                        src={`https://image.tmdb.org/t/p/w500${crewData[person.id]}`}
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
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {getDirectors().length > 0 && (
                        <div>
                          <h3 className="text-lg font-display font-bold text-foreground mb-6">
                            Directors
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                            {getDirectors().map((person, i) => (
                              <motion.div
                                key={`dir-${person.id}-${i}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Link
                                  to={`/person/${person.id}`}
                                  className="group block"
                                >
                                  <div className="aspect-[2/3] rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary/30 transition-all">
                                    {crewData[person.id] ? (
                                      <img
                                        src={`https://image.tmdb.org/t/p/w500${crewData[person.id]}`}
                                        alt={person.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : person.profile_path ? (
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
                                  <p className="text-xs text-muted-foreground">
                                    {person.job}
                                  </p>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
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
                                key={`prod-${producer.id}-${i}`}
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
                                    ) : producer.profile_path ? (
                                      <img
                                        src={`https://image.tmdb.org/t/p/w500${producer.profile_path}`}
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
                                  <p className="text-xs text-muted-foreground">
                                    {producer.job}
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
                                key={`writer-${writer.id}-${i}`}
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
                                    ) : writer.profile_path ? (
                                      <img
                                        src={`https://image.tmdb.org/t/p/w500${writer.profile_path}`}
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
                    </div>
                  </TabsContent>
                )}

                {/* Seasons Tab */}
                {series.seasons?.length > 0 && (
                  <TabsContent value="seasons" className="mt-8">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                      Seasons
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {series.seasons.map((season, i) => (
                        <motion.div
                          key={season.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Link
                            to={`/series/${id}/season/${season.season_number}`}
                            className="group block"
                          >
                            <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all">
                              <div className="w-24 md:w-32 aspect-[2/3] rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                                {season.poster_path ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w300${season.poster_path}`}
                                    alt={season.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Layers className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {season.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  {season.air_date && (
                                    <span>{season.air_date.split("-")[0]}</span>
                                  )}
                                  <span>•</span>
                                  <span>
                                    {season.episode_count} Episode
                                    {season.episode_count !== 1 ? "s" : ""}
                                  </span>
                                  {season.vote_average > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="inline-flex items-center gap-0.5">
                                        <Star className="h-3 w-3 text-primary fill-primary" />
                                        {season.vote_average.toFixed(1)}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {season.overview && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                                    {season.overview}
                                  </p>
                                )}
                                <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
                                  View Episodes
                                  <ChevronRight className="h-3 w-3" />
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {/* Videos Tab */}
                {trailerUrl && (
                  <TabsContent value="trailer" className="mt-8">
                    <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                      Related Videos
                    </h2>
                    <div className="w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                      <iframe
                        className="w-full h-full"
                        src={trailerUrl}
                        title={`${series.name} Video`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </section>
        )}

        {/* Similar Series */}
        {series.similar?.results && series.similar.results.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4 md:px-6">
              <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                Similar Series
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {series.similar.results.slice(0, 12).map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link to={`/series/${m.id}`} className="group block">
                      <div className="aspect-[2/3] rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary/30 transition-all">
                        {m.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                            alt={m.name || m.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-3xl">📺</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {m.name || m.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.first_air_date?.split("-")[0]}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recommendations */}
        {series.recommendations?.results &&
          series.recommendations.results.length > 0 && (
            <section className="py-16">
              <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                  Recommendations
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                  {series.recommendations.results.slice(0, 12).map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link to={`/series/${m.id}`} className="group block">
                        <div className="aspect-[2/3] rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary/30 transition-all">
                          {m.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                              alt={m.name || m.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-3xl">📺</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {m.name || m.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.first_air_date?.split("-")[0]}
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

export default SeriesDetail;
