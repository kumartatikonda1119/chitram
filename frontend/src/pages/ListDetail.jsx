import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Globe, Loader2, Trash2, Lock } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const ListDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [listName, setListName] = useState("");
  const [movies, setMovies] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [removingMovieId, setRemovingMovieId] = useState(null);

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        let movieItems = [];

        if (token) {
          try {
            const [itemsResponse, listsResponse] = await Promise.all([
              axios.get(`${API_BASE_URL}/lists/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
              axios.get(`${API_BASE_URL}/lists`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
            ]);

            movieItems = itemsResponse.data || [];
            const ownList = (listsResponse.data || []).find(
              (l) => l._id === id,
            );
            setListName(ownList?.name || "My List");
            setCanManage(true);
          } catch {
            // Fall back to public view when list doesn't belong to current user.
            const response = await axios.get(
              `${API_BASE_URL}/lists/public/${id}`,
            );
            const sharedList = response.data?.list;
            movieItems = response.data?.movies || [];
            setListName(sharedList?.name || "Shared List");
            setCanManage(false);
          }
        } else {
          const response = await axios.get(
            `${API_BASE_URL}/lists/public/${id}`,
          );
          const sharedList = response.data?.list;
          movieItems = response.data?.movies || [];
          setListName(sharedList?.name || "Shared List");
          setCanManage(false);
        }

        if (movieItems.length === 0) {
          setMovies([]);
          return;
        }

        const movieDetails = await Promise.all(
          movieItems.map(async (item) => {
            try {
              const movieRes = await axios.get(
                `${API_BASE_URL}/search/searchMovie/${item.movieId}`,
              );
              return movieRes.data?.data || null;
            } catch {
              return null;
            }
          }),
        );

        setMovies(movieDetails.filter(Boolean));
      } catch (error) {
        if (error.response?.status === 404) {
          toast.error("List not found");
        } else {
          toast.error("Failed to load shared list");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [id]);

  const handleRemoveMovie = async (movieId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to manage your list");
      return;
    }

    try {
      setRemovingMovieId(movieId);
      await axios.delete(`${API_BASE_URL}/lists/${id}/movie/${movieId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMovies((prev) => prev.filter((movie) => movie.id !== movieId));
      toast.success("Movie removed from list");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to remove movie");
    } finally {
      setRemovingMovieId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-24 md:pb-16 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Navbar />
      <div className="pt-24 pb-24 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              {canManage ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  Your List
                </>
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  Shared List
                </>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">
              {listName}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {movies.length} movie{movies.length !== 1 ? "s" : ""}
            </p>
          </motion.div>

          {movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
              {movies.map((movie, i) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/movie/${movie.id}`} className="group block">
                    <div className="relative aspect-[2/3] rounded-xl bg-card border border-border overflow-hidden group-hover:border-primary/30 transition-all">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">🎬</span>
                        </div>
                      )}

                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveMovie(movie.id);
                          }}
                          disabled={removingMovieId === movie.id}
                          className="absolute top-2 right-2 p-2 rounded-full bg-background/85 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-60"
                          title="Remove from list"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {movie.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {movie.release_date?.split("-")[0] || "N/A"}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 rounded-2xl bg-card border border-border">
              <p className="text-muted-foreground">
                No movies in this list yet.
              </p>
              <Link
                to="/"
                className="inline-flex mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                Go to Home
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ListDetail;
