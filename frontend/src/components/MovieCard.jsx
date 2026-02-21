import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { GENRES, LANGUAGES } from "@/lib/types";
import { Link } from "react-router-dom";
const MovieCard = ({ movie, index = 0 }) => {
  const genreNames = movie.genre_ids
    .map((id) => GENRES.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .slice(0, 2);

  const languageName =
    LANGUAGES.find((l) => l.code === movie.original_language?.toLowerCase())
      ?.name || movie.original_language?.toUpperCase();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link to={`/movie/${movie.id}`} className="group block">
        <div className="relative overflow-hidden rounded-xl bg-card shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02]">
          <div className="aspect-[2/3] bg-secondary relative overflow-hidden">
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl text-muted-foreground/30">🎬</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10" />
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              <Star className="h-3 w-3 fill-current" />
              {movie.vote_average.toFixed(1)}
            </div>
          </div>

          <div className="p-4 space-y-2">
            <h3 className="text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {movie.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {movie.release_date?.split("-")[0]} • {languageName}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {genreNames.map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-secondary text-secondary-foreground"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
export default MovieCard;
