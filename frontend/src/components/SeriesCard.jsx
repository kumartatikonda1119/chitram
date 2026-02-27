import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { LANGUAGES } from "@/lib/types";
import { Link } from "react-router-dom";

const TV_GENRES = [
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10763, name: "News" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10766, name: "Soap" },
  { id: 10767, name: "Talk" },
  { id: 10768, name: "War & Politics" },
  { id: 37, name: "Western" },
];

const SeriesCard = ({ series, index = 0 }) => {
  const genreNames = (series.genre_ids || [])
    .map((id) => TV_GENRES.find((g) => g.id === id)?.name)
    .filter(Boolean)
    .slice(0, 2);

  const languageName =
    LANGUAGES.find((l) => l.code === series.original_language?.toLowerCase())
      ?.name || series.original_language?.toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link to={`/series/${series.id}`} className="group block">
        <div className="relative overflow-hidden rounded-xl bg-card shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-[1.02]">
          <div className="aspect-[2/3] bg-secondary relative overflow-hidden">
            {series.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
                alt={series.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl text-muted-foreground/30">📺</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10" />
            {series.vote_average > 0 && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                <Star className="h-3 w-3 fill-current" />
                {series.vote_average.toFixed(1)}
              </div>
            )}
          </div>

          <div className="p-4 space-y-2">
            <h3 className="text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {series.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {series.first_air_date?.split("-")[0]} • {languageName}
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

export default SeriesCard;
