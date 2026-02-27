import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Star, ArrowLeft, Calendar, Clock, Loader2, Users } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const EpisodeDetail = () => {
  const { seriesId, seasonNo, episodeNo } = useParams();
  const [episode, setEpisode] = useState(null);
  const [seriesName, setSeriesName] = useState("");
  const [seasonName, setSeasonName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEpisodeDetails();
  }, [seriesId, seasonNo, episodeNo]);

  const fetchEpisodeDetails = async () => {
    try {
      setLoading(true);

      // Fetch season data (contains all episodes + names)
      const seasonRes = await axios.get(
        `${API_BASE_URL}/search/searchSeries/${seriesId}/season/${seasonNo}`,
      );
      const seasonData = seasonRes.data.data;
      setSeasonName(seasonData?.name || `Season ${seasonNo}`);

      // Find the specific episode
      const ep = seasonData?.episodes?.find(
        (e) => e.episode_number === parseInt(episodeNo),
      );
      setEpisode(ep || null);

      // Fetch series name for breadcrumb
      try {
        const seriesRes = await axios.get(
          `${API_BASE_URL}/search/searchSeries/${seriesId}`,
        );
        setSeriesName(seriesRes.data.data?.name || "");
      } catch {
        // skip
      }
    } catch (error) {
      console.error("Error fetching episode details:", error);
      toast.error("Failed to load episode details");
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

  if (!episode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">📺</p>
          <p className="text-muted-foreground">Episode not found</p>
          <Link
            to={`/series/${seriesId}/season/${seasonNo}`}
            className="text-primary hover:underline text-sm mt-2 block"
          >
            Back to Season
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Navbar />
      <div className="pt-20">
        {/* Episode Still / Hero */}
        <div className="relative h-[35vh] md:h-[45vh] bg-secondary overflow-hidden">
          {episode.still_path ? (
            <>
              <img
                src={`https://image.tmdb.org/t/p/original${episode.still_path}`}
                alt={episode.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-8xl opacity-20">📺</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </>
          )}

          {/* Back + Breadcrumb */}
          <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
            <Link
              to={`/series/${seriesId}/season/${seasonNo}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>

        {/* Episode Info */}
        <div className="container mx-auto px-4 md:px-6 -mt-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-3xl"
          >
            {/* Breadcrumb */}
            {seriesName && (
              <div className="text-sm text-muted-foreground">
                <Link
                  to={`/series/${seriesId}`}
                  className="hover:text-primary transition-colors"
                >
                  {seriesName}
                </Link>
                <span className="mx-2">/</span>
                <Link
                  to={`/series/${seriesId}/season/${seasonNo}`}
                  className="hover:text-primary transition-colors"
                >
                  {seasonName}
                </Link>
                <span className="mx-2">/</span>
                <span className="text-foreground font-medium">
                  Episode {episode.episode_number}
                </span>
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              {episode.name}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                S{seasonNo} E{episode.episode_number}
              </span>
              {episode.air_date && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {episode.air_date}
                </span>
              )}
              {episode.runtime > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {episode.runtime} min
                </span>
              )}
              {episode.vote_average > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span className="font-semibold text-foreground">
                    {episode.vote_average.toFixed(1)}
                  </span>
                  <span>/ 10</span>
                </span>
              )}
              {episode.vote_count > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {episode.vote_count} votes
                </span>
              )}
            </div>

            {/* Overview */}
            {episode.overview && (
              <p className="text-muted-foreground leading-relaxed text-base">
                {episode.overview}
              </p>
            )}

            {/* Production Code */}
            {episode.production_code && (
              <p className="text-xs text-muted-foreground">
                Production Code: {episode.production_code}
              </p>
            )}
          </motion.div>
        </div>

        {/* Crew */}
        {episode.crew && episode.crew.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4 md:px-6">
              <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                Crew
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {episode.crew.map((person, i) => (
                  <motion.div
                    key={`crew-${person.id || person.credit_id}-${i}`}
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

        {/* Guest Stars */}
        {episode.guest_stars && episode.guest_stars.length > 0 && (
          <section className="py-12 bg-secondary/30">
            <div className="container mx-auto px-4 md:px-6">
              <h2 className="text-2xl font-display font-bold text-foreground mb-8">
                Guest Stars
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {episode.guest_stars.map((person, i) => (
                  <motion.div
                    key={`guest-${person.id || person.credit_id}-${i}`}
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

export default EpisodeDetail;
