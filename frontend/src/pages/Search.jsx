import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MovieCard from "@/components/MovieCard";
import SeriesCard from "@/components/SeriesCard";
import { GENRES, LANGUAGES } from "@/lib/types";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  Loader2,
  Sparkles,
  Film,
  Tv,
  User,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "/api/search") ||
  "http://localhost:5000/api/search";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("movie");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedLang, setSelectedLang] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState([]);
  const [personResults, setPersonResults] = useState([]);
  const [seriesResults, setSeriesResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState("popularity_desc");

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [aiInfo, setAiInfo] = useState(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);
  const navigate = useNavigate();

  const searchTypes = [
    { id: "movie", label: "Movie" },
    { id: "tv", label: "TV Shows/ Web Series" },
    { id: "person", label: "Person" },
    { id: "genre", label: "Genre" },
  ];

  const sortOptions = [
    { value: "popularity_desc", label: "Popularity ↓" },
    { value: "rating_desc", label: "Rating ↓" },
    { value: "date_desc", label: "Newest" },
    { value: "date_asc", label: "Oldest" },
    { value: "title_asc", label: "Title A-Z" },
  ];

  const sortResults = (items) => {
    const sorted = [...items];

    switch (sortBy) {
      case "rating_desc":
        return sorted.sort(
          (a, b) => (b.vote_average || 0) - (a.vote_average || 0),
        );
      case "date_desc":
        return sorted.sort(
          (a, b) =>
            new Date(b.release_date || b.first_air_date || 0).getTime() -
            new Date(a.release_date || a.first_air_date || 0).getTime(),
        );
      case "date_asc":
        return sorted.sort(
          (a, b) =>
            new Date(a.release_date || a.first_air_date || 0).getTime() -
            new Date(b.release_date || b.first_air_date || 0).getTime(),
        );
      case "title_asc":
        return sorted.sort((a, b) =>
          (a.title || a.name || "").localeCompare(b.title || b.name || ""),
        );
      case "popularity_desc":
      default:
        return sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }
  };

  // Autocomplete: fetch suggestions as user types
  const fetchSuggestions = useCallback(async (value) => {
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setSuggestionsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/autocomplete`, {
        params: { q: value.trim() },
        signal: abortControllerRef.current.signal,
      });
      const items = response.data.suggestions || [];
      setSuggestions(items);
      setShowSuggestions(items.length > 0);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      if (!axios.isCancel(error)) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce autocomplete
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);

    if (suggestion.type === "movie") {
      navigate(`/movie/${suggestion.id}`);
    } else if (suggestion.type === "tv") {
      navigate(`/series/${suggestion.id}`);
    } else if (suggestion.type === "person") {
      const role = suggestion.department === "Directing" ? "director" : "actor";
      navigate(`/person/${suggestion.id}?role=${role}`);
    }
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
      } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        return;
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === "Enter" && selectedSuggestionIndex < 0) {
      setShowSuggestions(false);
      handleSearch();
    }
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async () => {
    if (!query && !selectedGenre) return;

    // Cancel any pending autocomplete requests
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    setLoading(true);
    setHasSearched(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setAiInfo(null);

    try {
      if (searchType === "genre") {
        const params = { id: selectedGenre };
        if (selectedLang) params.lang = selectedLang;

        const response = await axios.get(`${API_BASE_URL}/searchMovieByGenre`, {
          params,
        });
        setResults(response.data.data || []);
        setPersonResults([]);
        setSeriesResults([]);
      } else {
        // Use smart search for all text queries
        const response = await axios.post(`${API_BASE_URL}/smart`, {
          query,
          type: searchType,
        });

        const data = response.data.data || [];
        const ai = response.data.ai || null;

        setAiInfo(ai);

        if (searchType === "person" || ai?.searchType === "person") {
          setPersonResults(data);
          setResults([]);
          setSeriesResults([]);
        } else if (searchType === "tv" || ai?.searchType === "tv") {
          setSeriesResults(data);
          setResults([]);
          setPersonResults([]);
        } else {
          setResults(data);
          setPersonResults([]);
          setSeriesResults([]);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setPersonResults([]);
      setSeriesResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchType === "genre" && selectedGenre) {
      handleSearch();
    }
  }, [selectedGenre, selectedLang]);

  const getTypeIcon = (type) => {
    switch (type) {
      case "movie":
        return <Film className="h-3 w-3" />;
      case "tv":
        return <Tv className="h-3 w-3" />;
      case "person":
        return <User className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case "movie":
        return "bg-blue-500/20 text-blue-400";
      case "tv":
        return "bg-purple-500/20 text-purple-400";
      case "person":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

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
              Search <span className="text-primary">Cinema</span>
            </h1>
            <p className="text-muted-foreground mt-3">
              Describe any movie, character, or scene — Chitram understands
              what you mean.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    // Slight delay to allow clicks on suggestions to register
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder={
                    searchType === "movie"
                      ? 'Try "movie about dreams inside dreams"...'
                      : searchType === "tv"
                        ? 'Try "show about chemistry teacher"...'
                        : searchType === "person"
                          ? "Search for a person..."
                          : "Select a genre below..."
                  }
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-2xl glass text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      ref={suggestionsRef}
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 left-0 right-0 mt-2 rounded-2xl glass border border-border shadow-2xl overflow-hidden"
                    >
                      {suggestions.map((item, index) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => handleSuggestionClick(item)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            index === selectedSuggestionIndex
                              ? "bg-primary/15 text-foreground"
                              : "hover:bg-secondary/80 text-foreground"
                          } ${index < suggestions.length - 1 ? "border-b border-border/50" : ""}`}
                        >
                          {/* Poster thumbnail */}
                          <div className="w-10 h-14 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                            {item.poster ? (
                              <img
                                src={item.poster}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                {item.type === "person" ? "👤" : "🎬"}
                              </div>
                            )}
                          </div>

                          {/* Title and metadata */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.type === "person"
                                ? item.department
                                : item.year || "Unknown year"}
                            </p>
                          </div>

                          {/* Type badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${getTypeBadgeColor(item.type)}`}
                          >
                            {getTypeIcon(item.type)}
                            {item.type}
                          </span>
                        </button>
                      ))}

                      {suggestionsLoading && (
                        <div className="flex items-center justify-center py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => {
                  setShowSuggestions(false);
                  handleSearch();
                }}
                disabled={loading}
                className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                <span className="hidden sm:inline">Search</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-3 sm:p-4 rounded-2xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground border border-border"
                title="Toggle filters"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            </div>
          </motion.div>

          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
            {searchTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setSearchType(type.id);
                  setResults([]);
                  setPersonResults([]);
                  setSeriesResults([]);
                  setHasSearched(false);
                  setAiInfo(null);
                }}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${searchType === type.id ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-8 p-6 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Filters
                </h3>
                <button
                  onClick={() => {
                    setSelectedGenre(null);
                    setSelectedLang(null);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Genre</p>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => (
                    <button
                      key={g.id}
                      onClick={() =>
                        setSelectedGenre(selectedGenre === g.id ? null : g.id)
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedGenre === g.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Language</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() =>
                        setSelectedLang(selectedLang === l.code ? null : l.code)
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedLang === l.code ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {(selectedGenre || selectedLang) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedGenre && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  {GENRES.find((g) => g.id === selectedGenre)?.name}
                  <button onClick={() => setSelectedGenre(null)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedLang && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  {LANGUAGES.find((l) => l.code === selectedLang)?.name}
                  <button onClick={() => setSelectedLang(null)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* AI info badge */}
          {aiInfo && aiInfo.intent === "description" && !loading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">
                AI understood your query and searched for:{" "}
                <strong>{aiInfo.rewrittenQueries.join(", ")}</strong>
              </span>
            </motion.div>
          )}

          {loading && (
            <div className="flex flex-col justify-center items-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              {aiInfo === null && query && searchType !== "genre" && (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Understanding your query...
                </p>
              )}
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  {results.length} results found
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">
                    Sort by:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {sortResults(results).map((movie, i) => (
                  <MovieCard key={movie.id} movie={movie} index={i} />
                ))}
              </div>
            </>
          )}

          {!loading && seriesResults.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">
                  {seriesResults.length} results found
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">
                    Sort by:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {sortResults(seriesResults).map((series, i) => (
                  <SeriesCard key={series.id} series={series} index={i} />
                ))}
              </div>
            </>
          )}

          {!loading && personResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {personResults.map((person, i) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Link
                    to={`/person/${person.id}?role=${person.known_for_department === "Directing" ? "director" : "actor"}`}
                    className="group block"
                  >
                    <div className="relative overflow-hidden rounded-xl bg-card shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02]">
                      <div className="aspect-[2/3] bg-secondary relative overflow-hidden">
                        {person.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                            alt={person.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl text-muted-foreground/30">
                              👤
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10" />
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {person.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {person.known_for_department || "Actor"}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {!loading &&
            hasSearched &&
            results.length === 0 &&
            personResults.length === 0 &&
            seriesResults.length === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🎬</p>
                <p className="text-muted-foreground text-lg">
                  No results found. Try a different search.
                </p>
              </div>
            )}

          {!loading && !hasSearched && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                Start searching for movies, TV shows or people, or browse by
                genre.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};
export default SearchPage;
