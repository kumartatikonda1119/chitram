import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MovieCard from "@/components/MovieCard";
import { GENRES, LANGUAGES } from "@/lib/types";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  Loader2,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/search";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("movie");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedLang, setSelectedLang] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState([]);
  const [personResults, setPersonResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchTypes = [
    { id: "movie", label: "Movie" },
    { id: "person", label: "Person" },
    { id: "genre", label: "Genre" },
  ];

  const handleSearch = async () => {
    if (!query && !selectedGenre) return;

    setLoading(true);
    setHasSearched(true);

    try {
      if (searchType === "movie") {
        const params = { movie: query };
        if (selectedLang) params.lang = selectedLang;

        const response = await axios.get(`${API_BASE_URL}/searchMovie`, {
          params,
        });
        setResults(response.data.data || []);
        setPersonResults([]);
      } else if (searchType === "person") {
        const response = await axios.get(`${API_BASE_URL}/searchPerson`, {
          params: { name: query },
        });
        setPersonResults(response.data.data || []);
        setResults([]);
      } else if (searchType === "genre") {
        const params = { id: selectedGenre };
        if (selectedLang) params.lang = selectedLang;

        const response = await axios.get(`${API_BASE_URL}/searchMovieByGenre`, {
          params,
        });
        setResults(response.data.data || []);
        setPersonResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setPersonResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchType === "genre" && selectedGenre) {
      handleSearch();
    }
  }, [selectedGenre, selectedLang]);

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
              Search <span className="text-primary">Cinema</span>
            </h1>
            <p className="text-muted-foreground mt-3">
              Find movies by name or explore by genre.
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
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder={searchType === "movie" ? "Search for a movie..." : searchType === "person" ? "Search for a person..." : "Select a genre below..."}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-2xl glass text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <SearchIcon className="h-5 w-5" />
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
                  setHasSearched(false);
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

          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {results.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} index={i} />
              ))}
            </div>
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
                            <span className="text-4xl text-muted-foreground/30">👤</span>
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

          {!loading && hasSearched && results.length === 0 && personResults.length === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🎬</p>
                <p className="text-muted-foreground text-lg">
                  No results found. Try a different search.
                </p>
              </div>
            )}

          {!loading && !hasSearched && (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-muted-foreground text-lg">
                Start searching for movies or people, or browse by genre.
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
