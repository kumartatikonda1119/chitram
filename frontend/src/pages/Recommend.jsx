import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GENRES, LANGUAGES } from "@/lib/types";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Star,
  Clock,
  Film,
  Grid3X3,
  Users,
} from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { useAuth } from "@/contexts/AuthContext";
import { recommendationAPI } from "@/lib/api";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "/api/search") ||
  "http://localhost:5000/api/search";

const Recommend = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("personalized");

  // Personalized recommendations state
  const [personalizedRecs, setPersonalizedRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsPage, setRecsPage] = useState(1);
  const [recsTotalPages, setRecsTotalPages] = useState(1);

  // Recently viewed state
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  // Genre search state
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch personalized recommendations
  const fetchPersonalized = useCallback(
    async (page = 1) => {
      if (!user) return;
      try {
        setRecsLoading(true);
        const response = await recommendationAPI.getPersonalized(page);
        const payload = response.data || {};
        const movies = payload.results || payload.data || [];
        setPersonalizedRecs((prev) => {
          if (page === 1) return movies;
          const uniqueById = new Map();
          [...prev, ...movies].forEach((m) => {
            if (m && m.id) uniqueById.set(m.id, m);
          });
          return Array.from(uniqueById.values());
        });
        setRecsTotalPages(payload.total_pages || payload.totalPages || 1);
        setRecsPage(page);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error.message);
      } finally {
        setRecsLoading(false);
      }
    },
    [user],
  );

  // Fetch recently viewed
  const fetchRecentlyViewed = useCallback(async () => {
    if (!user) return;
    try {
      setRecentLoading(true);
      const response = await recommendationAPI.getRecentlyViewed(20);
      const movies = response.data?.results || response.data?.data || [];
      setRecentlyViewed(movies);
    } catch (error) {
      console.error("Failed to fetch recently viewed:", error.message);
    } finally {
      setRecentLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === "personalized") {
      fetchPersonalized(1);
    }
    if (user && activeTab === "recent") {
      fetchRecentlyViewed();
    }
  }, [user, activeTab, fetchPersonalized, fetchRecentlyViewed]);

  // Genre search handler
  const handleGetRecommendations = async () => {
    if (!selectedGenre) return;

    setLoading(true);
    setShowResults(true);

    try {
      const params = { id: selectedGenre };
      if (selectedLanguage) {
        params.lang = selectedLanguage;
      }

      const response = await axios.get(`${API_BASE_URL}/searchMovieByGenre`, {
        params,
      });

      setRecommendations(response.data.data || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  // Sign-in prompt for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="p-10 rounded-3xl bg-card border border-border text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Get Personalized Recommendations
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Sign in to get movie recommendations tailored to your taste,
              browse recently viewed titles, and discover movies by genre.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20"
            >
              Sign In to Continue
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const tabs = [
    {
      id: "personalized",
      label: "Recommended For You",
      icon: Star,
    },
    {
      id: "recent",
      label: "Recently Viewed",
      icon: Clock,
    },
    {
      id: "genre",
      label: "Recommend by Genre",
      icon: Grid3X3,
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Navbar />
      <div className="pt-24 pb-24 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-secondary-foreground mb-4">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by Chitram
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              What Should You <span className="text-primary">Watch</span>?
            </h1>
            <p className="text-muted-foreground">
              Personalized picks based on your taste, or explore by genre.
            </p>
          </motion.div>

          {/* ─── Tab Navigation ─── */}
          <div className="flex gap-2 mb-8 justify-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─── Tab: Recommended For You ─── */}
          {activeTab === "personalized" && (
            <motion.div
              key="personalized"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Personalized Recs */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Star className="h-6 w-6 text-primary" />
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      Recommended For You ⭐
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Based on what you watch and search
                    </p>
                  </div>
                </div>

                {recsLoading && personalizedRecs.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : personalizedRecs.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                      {personalizedRecs.map((movie, i) => (
                        <MovieCard key={movie.id} movie={movie} index={i} />
                      ))}
                    </div>
                    {recsPage < recsTotalPages && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => fetchPersonalized(recsPage + 1)}
                          disabled={recsLoading}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          {recsLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Load More"
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 rounded-2xl bg-card border border-border">
                    <Film className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Start exploring movies to get personalized
                      recommendations!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── Tab: Recently Viewed ─── */}
          {activeTab === "recent" && (
            <motion.div
              key="recent"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <Clock className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground">
                    Recently Viewed
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Jump back into what you were exploring
                  </p>
                </div>
              </div>

              {recentLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : recentlyViewed.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {recentlyViewed.map((movie, i) => (
                    <MovieCard key={movie.id} movie={movie} index={i} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 rounded-2xl bg-card border border-border">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No recently viewed movies yet. Start exploring!
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Tab: Search by Genre ─── */}
          {activeTab === "genre" && (
            <motion.div
              key="genre"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="max-w-2xl mx-auto mb-10">
                <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                  Pick your genre
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {GENRES.map((g) => (
                    <button
                      key={g.id}
                      onClick={() =>
                        setSelectedGenre(selectedGenre === g.id ? null : g.id)
                      }
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                        selectedGenre === g.id
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "bg-secondary text-secondary-foreground hover:bg-muted"
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-w-2xl mx-auto mb-10">
                <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                  Choose your language (optional)
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() =>
                        setSelectedLanguage(
                          selectedLanguage === l.code ? null : l.code,
                        )
                      }
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                        selectedLanguage === l.code
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "bg-secondary text-secondary-foreground hover:bg-muted"
                      }`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center mb-16">
                <button
                  onClick={handleGetRecommendations}
                  disabled={!selectedGenre || loading}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Finding Movies...
                    </>
                  ) : (
                    <>
                      Get Recommendations
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {loading && (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              )}

              {!loading && showResults && recommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">
                    Your{" "}
                    <span className="text-primary">Recommendations</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {recommendations.map((movie, i) => (
                      <MovieCard key={movie.id} movie={movie} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}

              {!loading && showResults && recommendations.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-4xl mb-4">🎬</p>
                  <p className="text-muted-foreground text-lg">
                    No recommendations found. Try different preferences.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Recommend;
