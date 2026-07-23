import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import {
  Users,
  MessageSquare,
  Star,
  Heart,
  List,
  UserPlus,
  Loader2,
  Film,
  TrendingUp,
  Rss,
  User,
  Send,
  X,
  Search,
  Trash2,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
};

/* ─── Movie Search Popover for tagging ─── */
const MovieTagger = ({ taggedMovies, setTaggedMovies }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const searchMovies = async (q) => {
    if (!q.trim()) return setResults([]);
    setSearching(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/search/autocomplete?q=${encodeURIComponent(q)}`,
      );
      setResults(res.data.suggestions.filter(s => s.type === "movie" || s.type === "tv").slice(0, 8));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInput = (e) => {
    setQuery(e.target.value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchMovies(e.target.value), 400);
  };

  const addMovie = (movie) => {
    if (taggedMovies.length >= 5) {
      toast.error("Max 5 movies/series can be tagged");
      return;
    }
    if (taggedMovies.find((m) => m.tmdbId === String(movie.id))) return;
    setTaggedMovies([
      ...taggedMovies,
      {
        tmdbId: String(movie.id),
        title: movie.title,
        type: movie.type,
        poster: movie.poster ? movie.poster.replace("https://image.tmdb.org/t/p/w92", "") : "",
      },
    ]);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <div>
      {/* Tagged movies chips */}
      {taggedMovies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {taggedMovies.map((m) => (
            <span
              key={m.tmdbId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
            >
              <Film className="h-3 w-3" />
              {m.title}
              <button
                onClick={() =>
                  setTaggedMovies(
                    taggedMovies.filter((t) => t.tmdbId !== m.tmdbId),
                  )
                }
                className="text-primary/60 hover:text-primary ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
        >
          <Film className="h-3.5 w-3.5" />
          Tag a movie or series
        </button>
      ) : (
        <div className="relative">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={handleInput}
              placeholder="Search movies & series..."
              autoFocus
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={() => {
                setOpen(false);
                setQuery("");
                setResults([]);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Results dropdown */}
          {(results.length > 0 || searching) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
              {searching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : (
                results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => addMovie(r)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-secondary transition-colors text-left"
                  >
                    {r.poster ? (
                      <img
                        src={r.poster}
                        alt={r.title}
                        className="w-8 h-12 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-12 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                        <Film className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {r.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.year} • {r.type === "tv" ? "Series" : "Movie"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Discussion Post Card (with inline comments like LinkedIn) ─── */
const DiscussionCard = ({ post, currentUserId, onDelete, onRefresh }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await axios.get(
        `${API_BASE_URL}/posts/${post._id}/comments`,
      );
      setComments(res.data.comments || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      setSubmitting(true);
      const res = await axios.post(
        `${API_BASE_URL}/posts/${post._id}/comments`,
        { content: newComment.trim() },
        { headers: getAuthHeaders() },
      );
      setComments([...comments, res.data]);
      setNewComment("");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API_BASE_URL}/posts/comments/${commentId}`, {
        headers: getAuthHeaders(),
      });
      setComments(comments.filter((c) => c._id !== commentId));
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-card border border-border hover:border-primary/15 transition-all"
    >
      <div className="flex gap-4">
        <Link to={`/user/${post.userId?.username}`} className="flex-shrink-0">
          {post.userId?.avatar ? (
            <img
              src={post.userId.avatar}
              alt={post.userId.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                to={`/user/${post.userId?.username}`}
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                {post.userId?.username}
              </Link>
              <span className="text-xs text-muted-foreground/60">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
            {currentUserId === post.userId?._id && (
              <button
                onClick={() => onDelete(post._id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>

          {/* Tagged movies */}
          {post.taggedMovies?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.taggedMovies.map((m) => (
                <Link
                  key={m.tmdbId}
                  to={`/${m.type === "tv" ? "series" : "movie"}/${m.tmdbId}`}
                  className="inline-flex items-center gap-2 p-2 rounded-xl bg-background border border-border hover:border-primary/20 transition-all group"
                >
                  {m.poster ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${m.poster}`}
                      alt={m.title}
                      className="w-8 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-12 rounded bg-secondary flex items-center justify-center">
                      <Film className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 max-w-[120px]">
                    {m.title}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Reply/Comment toggle */}
          <button
            onClick={toggleComments}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {post.commentCount || comments.length || 0} Replies
          </button>

          {/* Inline comments section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-border/50"
              >
                {loadingComments ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {comments.length > 0 && (
                      <div className="space-y-3 mb-3">
                        {comments.map((c) => (
                          <div
                            key={c._id}
                            className="flex gap-3"
                          >
                            <Link to={`/user/${c.userId?.username}`} className="flex-shrink-0">
                              {c.userId?.avatar ? (
                                <img
                                  src={c.userId.avatar}
                                  alt={c.userId.username}
                                  className="w-7 h-7 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-3.5 w-3.5 text-primary" />
                                </div>
                              )}
                            </Link>
                            <div className="flex-1 min-w-0">
                              <div className="px-3 py-2 rounded-xl bg-secondary/50">
                                <div className="flex items-center justify-between">
                                  <Link
                                    to={`/user/${c.userId?.username}`}
                                    className="text-xs font-semibold text-foreground hover:text-primary transition-colors"
                                  >
                                    {c.userId?.username}
                                  </Link>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground/50">
                                      {formatTimeAgo(c.createdAt)}
                                    </span>
                                    {currentUserId === c.userId?._id && (
                                      <button
                                        onClick={() => handleDeleteComment(c._id)}
                                        className="text-muted-foreground/40 hover:text-destructive transition-colors"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-foreground/80 mt-1 whitespace-pre-wrap">
                                  {c.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add reply input */}
                    {localStorage.getItem("token") && (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment();
                            }
                          }}
                          placeholder="Write a reply..."
                          className="flex-1 bg-secondary/50 text-xs text-foreground placeholder:text-muted-foreground rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <button
                          onClick={handleAddComment}
                          disabled={submitting || !newComment.trim()}
                          className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all"
                        >
                          {submitting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Activity Feed Card ─── */
const ActivityIcon = ({ type }) => {
  const map = {
    review_created: { icon: MessageSquare, color: "text-blue-400" },
    post_created: { icon: FileText, color: "text-indigo-400" },
    list_created: { icon: List, color: "text-green-400" },
    list_updated: { icon: List, color: "text-emerald-400" },
    favorite_added: { icon: Heart, color: "text-pink-400" },
    started_following: { icon: UserPlus, color: "text-violet-400" },
  };
  const { icon: Icon, color } = map[type] || {
    icon: Star,
    color: "text-amber-400",
  };
  return <Icon className={`h-4 w-4 ${color}`} />;
};

const getActivityText = (type, meta) => {
  switch (type) {
    case "review_created":
      return (
        <>
          reviewed{" "}
          <Link
            to={`/${meta?.targetType === "tv" ? "series" : "movie"}/${meta?.targetId}`}
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            {meta?.targetTitle || "a title"}
          </Link>
        </>
      );
    case "post_created":
      return "shared a post";
    case "list_created":
      return (
        <>
          created a new list{" "}
          <span className="font-semibold text-foreground">
            {meta?.listName || "Untitled"}
          </span>
        </>
      );
    case "favorite_added":
      return "added a movie to favorites";
    case "started_following":
      return (
        <>
          started following{" "}
          <Link
            to={`/user/${meta?.targetUsername}`}
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            {meta?.targetUsername || "someone"}
          </Link>
        </>
      );
    default:
      return "did something";
  }
};

const FeedCard = ({ item }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-5 rounded-2xl bg-card border border-border hover:border-primary/15 transition-all"
  >
    <div className="flex gap-4">
      <Link to={`/user/${item.user.username}`} className="flex-shrink-0">
        {item.user.avatar ? (
          <img
            src={item.user.avatar}
            alt={item.user.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <ActivityIcon type={item.type} />
          <Link
            to={`/user/${item.user.username}`}
            className="font-semibold text-foreground hover:text-primary transition-colors"
          >
            {item.user.username}
          </Link>
          <span className="text-muted-foreground">
            {getActivityText(item.type, item.meta)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {formatTimeAgo(item.createdAt)}
        </p>

        {/* Post content preview */}
        {item.type === "post_created" && item.meta?.contentPreview && (
          <p className="text-sm text-foreground/80 mt-2 line-clamp-3 whitespace-pre-wrap">
            {item.meta.contentPreview}
          </p>
        )}

        {/* Post tagged movies */}
        {item.type === "post_created" && item.meta?.taggedMovies?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {item.meta.taggedMovies.map((m) => (
              <Link
                key={m.tmdbId}
                to={`/${m.type === "tv" ? "series" : "movie"}/${m.tmdbId}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Film className="h-3 w-3" />
                {m.title}
              </Link>
            ))}
          </div>
        )}

        {/* Review preview card */}
        {item.type === "review_created" && item.meta?.targetPoster && (
          <Link
            to={`/${item.meta.targetType === "tv" ? "series" : "movie"}/${item.meta.targetId}`}
            className="mt-3 flex gap-3 p-3 rounded-xl bg-background border border-border hover:border-primary/20 transition-all group"
          >
            <img
              src={`https://image.tmdb.org/t/p/w200${item.meta.targetPoster}`}
              alt={item.meta.targetTitle}
              className="w-12 h-[72px] rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {item.meta.targetTitle}
              </p>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3 w-3 ${s <= (item.meta.rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              {item.meta.contentPreview && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {item.meta.contentPreview}
                </p>
              )}
            </div>
          </Link>
        )}
      </div>
    </div>
  </motion.div>
);

/* ─── Trending Review Card ─── */
const TrendingReviewCard = ({ review }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-5 rounded-2xl bg-card border border-border hover:border-primary/15 transition-all"
  >
    <div className="flex gap-4">
      <Link
        to={`/${review.targetType === "tv" ? "series" : "movie"}/${review.targetId}`}
        className="flex-shrink-0"
      >
        {review.targetPoster ? (
          <img
            src={`https://image.tmdb.org/t/p/w200${review.targetPoster}`}
            alt={review.targetTitle}
            className="w-14 h-[84px] rounded-lg object-cover"
          />
        ) : (
          <div className="w-14 h-[84px] rounded-lg bg-secondary flex items-center justify-center">
            <Film className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link
            to={`/user/${review.user.username}`}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            {review.user.username}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(review.createdAt)}
          </span>
        </div>
        <Link
          to={`/${review.targetType === "tv" ? "series" : "movie"}/${review.targetId}`}
          className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
        >
          {review.targetTitle || "Unknown Title"}
        </Link>
        <div className="flex items-center gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-3 w-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
          {review.content}
        </p>
      </div>
    </div>
  </motion.div>
);

/* ─── Main Community Page ─── */
const Community = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("feed");
  const [feed, setFeed] = useState([]);
  const [trendingReviews, setTrendingReviews] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedPage, setFeedPage] = useState(1);
  const [feedTotalPages, setFeedTotalPages] = useState(1);

  // New post state
  const [postContent, setPostContent] = useState("");
  const [taggedMovies, setTaggedMovies] = useState([]);
  const [submittingPost, setSubmittingPost] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (activeTab === "feed") fetchFeed();
    if (activeTab === "discussions") fetchDiscussions();
    if (activeTab === "reviews") fetchTrendingReviews();
  }, [activeTab, user, feedPage]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="p-10 rounded-3xl bg-card border border-border text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Join the Community
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Sign in to start discussions, share your movie opinions, follow film lovers, and be part of the Chitram community.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-primary/20"
            >
              Sign In to Continue
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/community/feed?page=${feedPage}`,
        { headers: getAuthHeaders() },
      );
      setFeed(res.data.feed || []);
      setFeedTotalPages(res.data.totalPages || 1);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/posts`, {
        headers: getAuthHeaders(),
      });
      setDiscussions(res.data.posts || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/community/trending-reviews`,
        { headers: getAuthHeaders() },
      );
      setTrendingReviews(res.data.reviews || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    try {
      setSubmittingPost(true);
      await axios.post(
        `${API_BASE_URL}/posts`,
        { content: postContent.trim(), taggedMovies },
        { headers: getAuthHeaders() },
      );
      toast.success("Post shared!");
      setPostContent("");
      setTaggedMovies([]);
      if (activeTab === "discussions") fetchDiscussions();
      else if (activeTab === "feed") fetchFeed();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create post");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`${API_BASE_URL}/posts/${postId}`, {
        headers: getAuthHeaders(),
      });
      toast.success("Post deleted");
      setDiscussions(discussions.filter((p) => p._id !== postId));
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const tabs = [
    { id: "feed", label: "Feed", icon: Rss, requiresAuth: true },
    { id: "discussions", label: "Discussions", icon: MessageSquare, requiresAuth: true },
    { id: "reviews", label: "Reviews", icon: TrendingUp, requiresAuth: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Community Discussions & Reviews"
        description="Join the Chitram community. Share your thoughts on movies and series, participate in discussions, write reviews, and connect with fellow cinema lovers."
        canonical="/community"
      />
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 mt-16">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Community
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect, discuss, and share your love for cinema
          </p>
        </div>

        {/* Create Post Box */}
        {user && (
          <div className="p-5 rounded-2xl bg-card border border-border mb-6">
            <div className="flex gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share your thoughts on a movie, recommend something to the community..."
                  rows={3}
                  maxLength={2000}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
                />
              </div>
            </div>
            <div className="mt-3">
              <MovieTagger
                taggedMovies={taggedMovies}
                setTaggedMovies={setTaggedMovies}
              />
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
              <span className="text-xs text-muted-foreground">
                {postContent.length}/2000
              </span>
              <button
                onClick={handleCreatePost}
                disabled={submittingPost || !postContent.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {submittingPost ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs
            .filter((t) => !t.requiresAuth || user)
            .map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === t.id ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Feed — activity from people you follow */}
            {activeTab === "feed" && (
              <motion.div
                key="feed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {feed.length > 0 ? (
                  <div className="space-y-4">
                    {feed.map((item, i) => (
                      <FeedCard key={item._id || i} item={item} />
                    ))}

                    {/* Pagination */}
                    {feedTotalPages > 1 && (
                      <div className="flex justify-center gap-2 pt-4">
                        <button
                          onClick={() =>
                            setFeedPage(Math.max(1, feedPage - 1))
                          }
                          disabled={feedPage <= 1}
                          className="px-4 py-2 rounded-xl bg-secondary text-sm disabled:opacity-30"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-muted-foreground">
                          {feedPage} / {feedTotalPages}
                        </span>
                        <button
                          onClick={() =>
                            setFeedPage(
                              Math.min(feedTotalPages, feedPage + 1),
                            )
                          }
                          disabled={feedPage >= feedTotalPages}
                          className="px-4 py-2 rounded-xl bg-secondary text-sm disabled:opacity-30"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Rss className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Your feed is empty
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Follow other users to see their reviews, posts, and
                      activity here.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Discussions — all public posts with replies */}
            {activeTab === "discussions" && (
              <motion.div
                key="discussions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {discussions.length > 0 ? (
                  <div className="space-y-4">
                    {discussions.map((post) => (
                      <DiscussionCard
                        key={post._id}
                        post={post}
                        currentUserId={user?.id}
                        onDelete={handleDeletePost}
                        onRefresh={fetchDiscussions}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <MessageSquare className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No discussions yet
                    </h3>
                    <p className="text-muted-foreground">
                      Be the first to start a discussion!
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Reviews — trending / popular reviews */}
            {activeTab === "reviews" && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {trendingReviews.length > 0 ? (
                  <div className="space-y-4">
                    {trendingReviews.map((review) => (
                      <TrendingReviewCard
                        key={review._id}
                        review={review}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <TrendingUp className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No reviews yet
                    </h3>
                    <p className="text-muted-foreground">
                      Reviews from the community will appear here.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Community;
