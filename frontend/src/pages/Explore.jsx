import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTracker } from "@/hooks/useTracker";
import { useAuth } from "@/contexts/AuthContext";
import { recommendationAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MovieCard from "@/components/MovieCard";
import { Award, Clock, Flame, Loader2, Star, TrendingUp } from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "/api/search") ||
  "http://localhost:5000/api/search";

const EXPLORE_SECTIONS = [
  {
    id: "trending",
    title: "Trending Now",
    subtitle: "What everyone is watching today",
    icon: Flame,
  },
  {
    id: "classics",
    title: "All-Time Classics",
    subtitle: "Legendary films that stood the test of time",
    icon: Clock,
  },
  {
    id: "now_playing",
    title: "Now Playing",
    subtitle: "Currently running in theatres",
    icon: TrendingUp,
  },
  {
    id: "upcoming",
    title: "Upcoming",
    subtitle: "Coming soon to screens",
    icon: Star,
  },
  {
    id: "popular_telugu",
    title: "Popular Telugu",
    subtitle: "Popular Telugu movies right now",
    icon: TrendingUp,
  },
  {
    id: "popular_hindi",
    title: "Popular Hindi",
    subtitle: "Popular Hindi movies right now",
    icon: TrendingUp,
  },
  {
    id: "action",
    title: "Action Movies",
    subtitle: "Fast, intense, and high energy",
    icon: TrendingUp,
  },
  {
    id: "thriller",
    title: "Thriller Movies",
    subtitle: "Suspenseful and edge-of-seat stories",
    icon: TrendingUp,
  },
  {
    id: "top_rated",
    title: "All-Time Highest Rated",
    subtitle: "Highest rated films on TMDB",
    icon: Award,
  },
];

// Sections that should NOT trigger explore_section tracking (they're noise for recommendations)
const NOISE_SECTIONS = new Set(["recommended", "recently_viewed", "trending"]);

const createInitialState = () => {
  const state = {};
  EXPLORE_SECTIONS.forEach((section) => {
    state[section.id] = {
      movies: [],
      page: 0,
      totalPages: 1,
      loading: false,
      loadingMore: false,
      error: null,
    };
  });
  return state;
};

const Explore = () => {
  const [sectionData, setSectionData] = useState(createInitialState);
  const { user } = useAuth();

  // Update initial active tab based on auth state
  const [featuredSectionId, setFeaturedSectionId] = useState(
    user ? "recommended" : "trending",
  );
  const featuredLoadRef = useRef(null);
  const { track } = useTracker();

  const sections = useMemo(() => {
    if (!user) return EXPLORE_SECTIONS;

    return [
      {
        id: "recommended",
        title: "Recommended For You ⭐",
        subtitle: "Based on what you watch and search",
        icon: Star,
      },
      EXPLORE_SECTIONS.find((s) => s.id === "trending"),
      {
        id: "recently_viewed",
        title: "Recently Viewed",
        subtitle: "Jump back into what you were exploring",
        icon: Clock,
      },
      ...EXPLORE_SECTIONS.filter((s) => s.id !== "trending"),
    ];
  }, [user]);

  const featuredSection = useMemo(
    () =>
      sections.find((section) => section.id === featuredSectionId) ||
      sections[0],
    [featuredSectionId, sections],
  );

  const featuredState = sectionData[featuredSection.id] || {};
  const safeFeaturedState = {
    movies: [],
    page: 0,
    totalPages: 1,
    loading: false,
    loadingMore: false,
    error: null,
    ...featuredState,
  };

  const fetchSection = useCallback(
    async (sectionId, page = 1, append = false) => {
      setSectionData((prev) => {
        const currentSection = prev[sectionId] || {
          movies: [],
          page: 0,
          totalPages: 1,
        };
        return {
          ...prev,
          [sectionId]: {
            ...currentSection,
            loading: !append,
            loadingMore: append,
            error: null,
          },
        };
      });

      try {
        let response;
        if (sectionId === "recommended") {
          response = await recommendationAPI.getPersonalized(page);
        } else if (sectionId === "recently_viewed") {
          response = await recommendationAPI.getRecentlyViewed(20);
        } else {
          response = await axios.get(`${API_BASE_URL}/exploreMovies`, {
            params: { section: sectionId, page },
          });
        }

        const payload = response.data || {};
        const incomingMovies = payload.results || payload.data || [];
        const totalPages = payload.total_pages || payload.totalPages || 1;

        setSectionData((prev) => {
          const currentSection = prev[sectionId] || { movies: [] };
          const oldMovies = append ? currentSection.movies : [];
          const uniqueById = new Map();
          [...oldMovies, ...incomingMovies].forEach((movie) => {
            if (movie && movie.id) {
              uniqueById.set(movie.id, movie);
            }
          });

          return {
            ...prev,
            [sectionId]: {
              ...(prev[sectionId] || {}),
              movies: Array.from(uniqueById.values()),
              page,
              totalPages,
              loading: false,
              loadingMore: false,
              error: null,
            },
          };
        });
      } catch (error) {
        console.error(`Failed to fetch section ${sectionId}:`, error.message);
        setSectionData((prev) => ({
          ...prev,
          [sectionId]: {
            ...(prev[sectionId] || {}),
            movies: prev[sectionId]?.movies || [],
            loading: false,
            loadingMore: false,
            error: "Failed to load section",
          },
        }));
      }
    },
    [],
  );

  const handleViewMore = async (sectionId) => {
    const section = sectionData[sectionId];
    if (
      !section ||
      section.loadingMore ||
      section.page >= section.totalPages
    ) {
      return;
    }

    await fetchSection(sectionId, section.page + 1, true);
  };

  // Only fetch the initial active tab on mount — not all sections
  useEffect(() => {
    fetchSection(featuredSectionId, 1, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch section data when switching tabs (lazy loading)
  useEffect(() => {
    const current = sectionData[featuredSection.id];
    // Only fetch if this section hasn't been loaded yet
    if (!current || (current.movies.length === 0 && !current.loading && !current.error)) {
      fetchSection(featuredSection.id, 1, false);
    }
  }, [featuredSection.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track tab switches — but skip noise sections
  useEffect(() => {
    if (!NOISE_SECTIONS.has(featuredSection.id)) {
      track("explore_section", "genre", featuredSection.id, {
        section: featuredSection.title,
      });
    }
  }, [featuredSection.id, track]);

  useEffect(() => {
    const target = featuredLoadRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const hasMore = safeFeaturedState.page < safeFeaturedState.totalPages;
        if (
          entry.isIntersecting &&
          hasMore &&
          !safeFeaturedState.loading &&
          !safeFeaturedState.loadingMore
        ) {
          fetchSection(featuredSection.id, safeFeaturedState.page + 1, true);
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [
    featuredSection.id,
    safeFeaturedState.page,
    safeFeaturedState.totalPages,
    safeFeaturedState.loading,
    safeFeaturedState.loadingMore,
  ]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              Explore <span className="text-primary">Cinema</span>
            </h1>
            <p className="text-muted-foreground mt-3">
              Trending now, all-time classics, and top-rated legends — crafted
              for real movie lovers.
            </p>
          </motion.div>

          <div className="flex gap-2 mb-10 overflow-x-auto scrollbar-hide pb-2">
            {sections.map((section) => {
              const Icon = section.icon || TrendingUp;
              const isActive = featuredSection.id === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setFeaturedSectionId(section.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.title}
                </button>
              );
            })}
          </div>

          <section className="mb-14">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  {featuredSection.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {featuredSection.subtitle}
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {safeFeaturedState.loading && safeFeaturedState.movies.length === 0 ? (
                <div className="flex justify-center items-center py-14">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : safeFeaturedState.error &&
                safeFeaturedState.movies.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <p className="text-red-500 mb-4">
                    {safeFeaturedState.error}
                  </p>
                  <button
                    onClick={() => fetchSection(featuredSection.id)}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    Try Again
                  </button>
                </motion.div>
              ) : safeFeaturedState.movies.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {safeFeaturedState.movies.map((movie, index) => (
                      <MovieCard
                        key={`featured-${featuredSection.id}-${movie.id}`}
                        movie={movie}
                        index={index}
                      />
                    ))}
                  </div>

                  {safeFeaturedState.loadingMore && (
                    <div className="col-span-full flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}

                  {safeFeaturedState.page <
                    safeFeaturedState.totalPages && (
                    <div ref={featuredLoadRef} className="h-20 w-full" />
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No movies found.</p>
                </div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};
export default Explore;
