import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Star,
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  Users,
  Layers,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const SeasonDetail = () => {
  const { seriesId, seasonNo } = useParams();
  const [season, setSeason] = useState(null);
  const [seriesName, setSeriesName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeasonDetails();
  }, [seriesId, seasonNo]);

  const fetchSeasonDetails = async () => {
    try {
      setLoading(true);

      // Fetch season details
      const seasonRes = await axios.get(
        `${API_BASE_URL}/search/searchSeries/${seriesId}/season/${seasonNo}`,
      );
      setSeason(seasonRes.data.data);

      // Fetch series name for breadcrumb
      try {
        const seriesRes = await axios.get(
          `${API_BASE_URL}/search/searchSeries/${seriesId}`,
        );
        setSeriesName(seriesRes.data.data?.name || "");
      } catch {
        // If series fetch fails, just skip the name
      }
    } catch (error) {
      console.error("Error fetching season details:", error);
      toast.error("Failed to load season details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">📺</p>
          <p className="text-muted-foreground">Season not found</p>
          <Link
            to={`/series/${seriesId}`}
            className="text-primary hover:underline text-sm mt-2 block"
          >
            Back to Series
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Navbar />
      <div className="pt-20">
        {/* Header */}
        <div className="relative bg-secondary overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 py-10">
            {/* Back button & breadcrumb */}
            <div className="flex items-center gap-3 mb-8">
              <Link
                to={`/series/${seriesId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm text-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              {seriesName && (
                <span className="text-sm text-muted-foreground">
                  <Link
                    to={`/series/${seriesId}`}
                    className="hover:text-primary transition-colors"
                  >
                    {seriesName}
                  </Link>
                  <span className="mx-2">/</span>
                  <span className="text-foreground font-medium">
                    {season.name}
                  </span>
                </span>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Season poster */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-48 md:w-56 aspect-[2/3] rounded-2xl bg-card border border-border shadow-lg overflow-hidden flex-shrink-0"
              >
                {season.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${season.poster_path}`}
                    alt={season.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Layers className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 space-y-4"
              >
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  {season.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {season.air_date && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {season.air_date}
                    </span>
                  )}
                  {season.episodes && (
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="h-4 w-4" />
                      {season.episodes.length} Episode
                      {season.episodes.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {season.vote_average > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-primary fill-primary" />
                      {season.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>

                {season.overview && (
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    {season.overview}
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Episodes */}
        {season.episodes && season.episodes.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4 md:px-6">
              <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                Episodes
              </h2>
              <div className="space-y-4">
                {season.episodes.map((episode, i) => (
                  <motion.div
                    key={episode.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={`/series/${seriesId}/season/${seasonNo}/episode/${episode.episode_number}`}
                      className="group block"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all">
                        {/* Episode still */}
                        <div className="w-full sm:w-48 md:w-56 aspect-video rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                          {episode.still_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                              alt={episode.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-2xl">📺</span>
                            </div>
                          )}
                        </div>

                        {/* Episode info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                <span className="text-muted-foreground font-normal mr-2">
                                  E{episode.episode_number}
                                </span>
                                {episode.name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {episode.air_date && (
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {episode.air_date}
                                  </span>
                                )}
                                {episode.runtime > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {episode.runtime} min
                                  </span>
                                )}
                                {episode.vote_average > 0 && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Star className="h-3 w-3 text-primary fill-primary" />
                                    {episode.vote_average.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0" />
                          </div>

                          {episode.overview && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {episode.overview}
                            </p>
                          )}

                          {/* Guest stars preview */}
                          {episode.guest_stars &&
                            episode.guest_stars.length > 0 && (
                              <div className="flex items-center gap-2 mt-3">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {episode.guest_stars
                                    .slice(0, 3)
                                    .map((g) => g.name)
                                    .join(", ")}
                                  {episode.guest_stars.length > 3 &&
                                    ` +${episode.guest_stars.length - 3} more`}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Crew */}
        {season.credits?.crew && season.credits.crew.length > 0 && (
          <section className="py-12 bg-secondary/30">
            <div className="container mx-auto px-4 md:px-6">
              <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                Season Crew
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {season.credits.crew.slice(0, 12).map((person, i) => (
                  <motion.div
                    key={`crew-${person.id}-${i}`}
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
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Users className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {person.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {person.job}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Cast */}
        {season.credits?.cast && season.credits.cast.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4 md:px-6">
              <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                Season Cast
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {season.credits.cast.slice(0, 18).map((person, i) => (
                  <motion.div
                    key={`cast-${person.id}-${i}`}
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
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SeasonDetail;
