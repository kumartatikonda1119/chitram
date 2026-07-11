import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Edit3,
  Trash2,
  Loader2,
  MessageSquare,
  User,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const StarRating = ({ rating, onRate, interactive = false, size = "md" }) => {
  const [hover, setHover] = useState(0);
  const starSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <Star
            className={`${starSize} ${
              star <= (hover || rating)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

const ReviewCard = ({ review, isOwn, onEdit, onDelete }) => {
  const author = review.userId;
  const date = new Date(review.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-5 rounded-2xl border transition-all ${isOwn ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {author?.avatar ? (
            <img
              src={author.avatar}
              alt={author.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            {author?.isPublic ? (
              <Link
                to={`/user/${author.username}`}
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                {author?.username || "Unknown"}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {author?.username || "Unknown"}
              </span>
            )}
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          {isOwn && (
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => onEdit(review)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                title="Edit review"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(review._id)}
                className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                title="Delete review"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
        {review.content}
      </p>
    </motion.div>
  );
};

const ReviewSection = ({ targetId, targetType, targetTitle, targetPoster }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalReviews, setTotalReviews] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Write/edit state
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [formRating, setFormRating] = useState(0);
  const [formContent, setFormContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [targetId, targetType, page]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/reviews/content/${targetType}/${targetId}?page=${page}`,
        { headers: getAuthHeaders() },
      );
      setReviews(res.data.reviews || []);
      setTotalReviews(res.data.totalReviews || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (formRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!formContent.trim()) {
      toast.error("Please write your review");
      return;
    }

    setSubmitting(true);
    try {
      if (editingReview) {
        await axios.put(
          `${API_BASE_URL}/reviews/${editingReview._id}`,
          { rating: formRating, content: formContent },
          { headers: getAuthHeaders() },
        );
        toast.success("Review updated!");
      } else {
        await axios.post(
          `${API_BASE_URL}/reviews`,
          {
            targetId,
            targetType,
            rating: formRating,
            content: formContent,
            targetTitle: targetTitle || "",
            targetPoster: targetPoster || "",
          },
          { headers: getAuthHeaders() },
        );
        toast.success("Review posted!");
      }

      setShowForm(false);
      setEditingReview(null);
      setFormRating(0);
      setFormContent("");
      fetchReviews();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to submit review",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setFormRating(review.rating);
    setFormContent(review.content);
    setShowForm(true);
  };

  const handleDelete = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/reviews/${reviewId}`, {
        headers: getAuthHeaders(),
      });
      toast.success("Review deleted");
      fetchReviews();
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const hasOwnReview = reviews.some((r) => r.isOwn);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Community Reviews
            {totalReviews > 0 && (
              <span className="text-base font-normal text-muted-foreground ml-1">
                ({totalReviews})
              </span>
            )}
          </h2>

          {user && !hasOwnReview && !showForm && (
            <button
              onClick={() => {
                setEditingReview(null);
                setFormRating(0);
                setFormContent("");
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Edit3 className="h-4 w-4" />
              Write a Review
            </button>
          )}
        </div>

        {/* Write/Edit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {editingReview ? "Edit Your Review" : "Write Your Review"}
                </h3>

                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Your Rating
                  </label>
                  <StarRating
                    rating={formRating}
                    onRate={setFormRating}
                    interactive
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Your Review
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="What did you think? Share your thoughts..."
                    rows={4}
                    maxLength={5000}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {formContent.length}/5000
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {editingReview ? "Update" : "Post Review"}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingReview(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {reviews.map((review) => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  isOwn={review.isOwn}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No reviews yet. Be the first to share your thoughts!
            </p>
            {user && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                <Edit3 className="h-4 w-4" />
                Write a Review
              </button>
            )}
            {!user && (
              <Link
                to="/login"
                className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                Login to Write a Review
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewSection;
