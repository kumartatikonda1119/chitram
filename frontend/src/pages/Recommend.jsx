import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GENRES, LANGUAGES } from "@/lib/types";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "/api/search") ||
  "http://localhost:5000/api/search";

const Recommend = () => {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleGetRecommendations = async () => {
    if (!selectedGenre) {
      return;
    }

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

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-secondary-foreground mb-4">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by Chitram
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              What Should You <span className="text-primary">Watch</span>?
            </h1>
            <p className="text-muted-foreground">
              Tell us your preferences, and we'll find the perfect movie for
              you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto mb-10"
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto mb-10"
          >
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
          </motion.div>

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
                Your <span className="text-primary">Recommendations</span>
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
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Recommend;
