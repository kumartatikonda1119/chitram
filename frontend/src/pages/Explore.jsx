import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MovieCard from "@/components/MovieCard";
import { Award, Clock, Flame, Loader2, Star, TrendingUp } from "lucide-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '/api/search') || "http://localhost:5000/api/search";

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
  const [featuredSectionId, setFeaturedSectionId] = useState("trending");
  const featuredLoadRef = useRef(null);

  const sections = useMemo(() => EXPLORE_SECTIONS, []);
  const featuredSection = useMemo(
    () =>
      sections.find((section) => section.id === featuredSectionId) ||
      sections[0],
    [featuredSectionId, sections],
  );
  const featuredState = sectionData[featuredSection.id] || {
    movies: [],
    page: 0,
    totalPages: 1,
    loading: false,
    loadingMore: false,
    error: null,
  };

  const fetchSection = async (sectionId, page = 1, append = false) => {
    setSectionData((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        loading: !append,
        loadingMore: append,
        error: null,
      },
    }));

    try {
      const response = await axios.get(`${API_BASE_URL}/exploreMovies`, {
        params: { section: sectionId, page },
      });

      const payload = response.data || {};
      const incomingMovies = payload.data || [];
      const totalPages = payload.totalPages || 1;

      setSectionData((prev) => {
        const oldMovies = append ? prev[sectionId].movies : [];
        const uniqueById = new Map();
        [...oldMovies, ...incomingMovies].forEach((movie) => {
          uniqueById.set(movie.id, movie);
        });

        return {
          ...prev,
          [sectionId]: {
            ...prev[sectionId],
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
      setSectionData((prev) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          loading: false,
          loadingMore: false,
          error: "Failed to load section",
        },
      }));
    }
  };

  const handleViewMore = async (sectionId) => {
    const section = sectionData[sectionId];
    if (!section || section.loadingMore || section.page >= section.totalPages) {
      return;
    }

    await fetchSection(sectionId, section.page + 1, true);
  };

  useEffect(() => {
    sections.forEach((section) => {
      fetchSection(section.id, 1, false);
    });
  }, [sections]);

  useEffect(() => {
    if (featuredState.movies.length === 0 && !featuredState.loading) {
      fetchSection(featuredSection.id, 1, false);
    }
  }, [featuredSection.id]);

  useEffect(() => {
    const target = featuredLoadRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const hasMore = featuredState.page < featuredState.totalPages;
        if (
          entry.isIntersecting &&
          hasMore &&
          !featuredState.loading &&
          !featuredState.loadingMore
        ) {
          fetchSection(featuredSection.id, featuredState.page + 1, true);
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [
    featuredSection.id,
    featuredState.page,
    featuredState.totalPages,
    featuredState.loading,
    featuredState.loadingMore,
  ]);

  return (
    <div className="min-h-screen bg-background">
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

            {featuredState.loading && (
              <div className="flex justify-center items-center py-14">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!featuredState.loading && featuredState.error && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{featuredState.error}</p>
              </div>
            )}

            {!featuredState.loading &&
              !featuredState.error &&
              featuredState.movies.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {featuredState.movies.map((movie, index) => (
                      <MovieCard
                        key={`featured-${featuredSection.id}-${movie.id}`}
                        movie={movie}
                        index={index}
                      />
                    ))}
                  </div>

                  <div
                    ref={featuredLoadRef}
                    className="h-10 flex items-center justify-center mt-6"
                  >
                    {featuredState.loadingMore && (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    )}
                  </div>
                </>
              )}

            {!featuredState.loading &&
              !featuredState.error &&
              featuredState.movies.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No movies found.</p>
                </div>
              )}
          </section>

          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-foreground">
              More To Explore
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Scroll through curated sections and dive deeper.
            </p>
          </div>

          <div className="space-y-12">
            {sections
              .filter((section) => section.id !== featuredSection.id)
              .map((section) => {
                const state = sectionData[section.id];
                const canViewMore = state.page < state.totalPages;

                return (
                  <section key={section.id}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-display font-bold text-foreground">
                          {section.title}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {section.subtitle}
                        </p>
                      </div>
                    </div>

                    {state.loading && (
                      <div className="flex justify-center items-center py-14">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}

                    {!state.loading && state.error && (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">{state.error}</p>
                      </div>
                    )}

                    {!state.loading &&
                      !state.error &&
                      state.movies.length > 0 && (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                            {state.movies.map((movie, index) => (
                              <MovieCard
                                key={`${section.id}-${movie.id}`}
                                movie={movie}
                                index={index}
                              />
                            ))}
                          </div>

                          {(canViewMore || state.loadingMore) && (
                            <div className="flex justify-center mt-8">
                              <button
                                onClick={() => handleViewMore(section.id)}
                                disabled={state.loadingMore}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-70 transition-opacity"
                              >
                                {state.loadingMore ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading more
                                  </>
                                ) : (
                                  "View More"
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )}

                    {!state.loading &&
                      !state.error &&
                      state.movies.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">
                            No movies found.
                          </p>
                        </div>
                      )}
                  </section>
                );
              })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
export default Explore;
