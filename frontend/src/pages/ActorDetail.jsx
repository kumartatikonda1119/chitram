import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MovieCard from "@/components/MovieCard";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Award,
  Loader2,
  TrendingUp,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/search";

const ActorDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [person, setPerson] = useState(null);
  const [directorMovies, setDirectorMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState("popularity_desc");
  const role = searchParams.get("role");
  const isDirectorMode = role === "director";

  useEffect(() => {
    const fetchPersonDetails = async () => {
      try {
        setLoading(true);
        const personResponse = await axios.get(`${API_BASE_URL}/searchActor`, {
          params: { actorid: id },
        });
        setPerson(personResponse.data.data);

        if (isDirectorMode) {
          const directorResponse = await axios.get(
            `${API_BASE_URL}/searchDirector`,
            {
              params: { directorid: id },
            },
          );
          setDirectorMovies(directorResponse.data || []);
          setActiveTab("crew");
        } else {
          setDirectorMovies([]);
        }
      } catch (error) {
        console.error("Error fetching person details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPersonDetails();
    }
  }, [id, isDirectorMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">👤</p>
          <p className="text-muted-foreground">Person not found</p>
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

  // Get movies from movie_credits
  const allMovies = person.movie_credits?.cast || [];
  const allCrew = person.movie_credits?.crew || [];

  const sortMovies = (movies) => {
    const sorted = [...movies];

    switch (sortBy) {
      case "rating_desc":
        return sorted.sort(
          (a, b) => (b.vote_average || 0) - (a.vote_average || 0),
        );
      case "date_desc":
        return sorted.sort(
          (a, b) =>
            new Date(b.release_date || 0).getTime() -
            new Date(a.release_date || 0).getTime(),
        );
      case "date_asc":
        return sorted.sort(
          (a, b) =>
            new Date(a.release_date || 0).getTime() -
            new Date(b.release_date || 0).getTime(),
        );
      case "title_asc":
        return sorted.sort((a, b) =>
          (a.title || "").localeCompare(b.title || ""),
        );
      case "popularity_desc":
      default:
        return sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }
  };

  // Deduplicate and filter cast movies
  const castMoviesMap = new Map();
  allMovies.forEach((movie) => {
    if (movie.poster_path) {
      castMoviesMap.set(movie.id, movie);
    }
  });
  const castMovies = sortMovies(Array.from(castMoviesMap.values()));

  // Deduplicate and filter crew movies
  const crewMoviesMap = new Map();
  (isDirectorMode ? directorMovies : allCrew).forEach((movie) => {
    if (movie.poster_path) {
      crewMoviesMap.set(movie.id, movie);
    }
  });
  const crewMovies = sortMovies(Array.from(crewMoviesMap.values()));

  // Combine all unique movies for "All" tab
  const allMoviesMap = new Map();
  [...allMovies, ...(isDirectorMode ? directorMovies : allCrew)].forEach(
    (movie) => {
    if (movie.poster_path) {
      allMoviesMap.set(movie.id, movie);
    }
    },
  );
  const allUniqueMovies = sortMovies(Array.from(allMoviesMap.values()));

  const displayMovies =
    activeTab === "acting"
      ? castMovies
      : activeTab === "crew"
        ? crewMovies
        : allUniqueMovies;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        {/* Hero Section */}
        <div className="relative h-[40vh] md:h-[50vh] bg-secondary overflow-hidden">
          {person.profile_path ? (
            <>
              <img
                src={`https://image.tmdb.org/t/p/original${person.profile_path}`}
                alt={person.name}
                className="w-full h-full object-cover object-top blur-2xl scale-110 opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl opacity-20">👤</span>
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

        {/* Main Content */}
        <div className="container mx-auto px-4 md:px-6 -mt-32 relative z-10">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Image */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0"
            >
              <div className="w-48 md:w-64 aspect-[2/3] rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
                {person.profile_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">👤</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Person Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 space-y-5"
            >
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">
                {person.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {person.known_for_department && (
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">
                      {isDirectorMode ? "Director" : person.known_for_department}
                    </span>
                  </span>
                )}
                {person.birthday && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {new Date(person.birthday).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
                {person.place_of_birth && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {person.place_of_birth}
                  </span>
                )}
                {person.popularity && (
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4" />
                    {person.popularity.toFixed(0)} popularity
                  </span>
                )}
              </div>

              {person.biography && (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold text-foreground">
                    Biography
                  </h2>
                  <p className="text-muted-foreground leading-relaxed max-w-3xl">
                    {person.biography}
                  </p>
                </div>
              )}

              {person.also_known_as && person.also_known_as.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Also Known As
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {person.also_known_as.slice(0, 5).map((name, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Filmography Section */}
        {displayMovies.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Filmography
                </h2>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="popularity_desc">Sort: Popularity</option>
                    <option value="rating_desc">Sort: Rating</option>
                    <option value="date_desc">Sort: Newest</option>
                    <option value="date_asc">Sort: Oldest</option>
                    <option value="title_asc">Sort: Title A-Z</option>
                  </select>

                  {/* Tabs */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setActiveTab("all");
                        setShowAll(false);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        activeTab === "all"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-muted"
                      }`}
                    >
                      All ({allUniqueMovies.length})
                    </button>
                    {castMovies.length > 0 && (
                      <button
                        onClick={() => {
                          setActiveTab("acting");
                          setShowAll(false);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          activeTab === "acting"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-muted"
                        }`}
                      >
                        Acting ({castMovies.length})
                      </button>
                    )}
                    {crewMovies.length > 0 && (
                      <button
                        onClick={() => {
                          setActiveTab("crew");
                          setShowAll(false);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          activeTab === "crew"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-muted"
                        }`}
                      >
                        {isDirectorMode
                          ? `Directed (${crewMovies.length})`
                          : `Crew (${crewMovies.length})`}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {(showAll ? displayMovies : displayMovies.slice(0, 24)).map(
                  (movie, i) => (
                    <MovieCard key={movie.id} movie={movie} index={i} />
                  ),
                )}
              </div>

              {displayMovies.length > 24 && (
                <div className="mt-8 text-center space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Showing{" "}
                    {showAll
                      ? displayMovies.length
                      : Math.min(24, displayMovies.length)}{" "}
                    of {displayMovies.length}{" "}
                    {activeTab === "all"
                      ? "movies"
                      : activeTab === "acting"
                        ? "acting credits"
                        : isDirectorMode
                          ? "directed movies"
                          : "crew credits"}
                  </p>
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    {showAll ? "Show Less" : "View All Movies"}
                    <svg
                      className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ActorDetail;
