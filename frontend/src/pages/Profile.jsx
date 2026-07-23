import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import {
  Heart,
  List,
  Share2,
  Plus,
  Trash2,
  User,
  Loader2,
  LogOut,
  MessageSquare,
  Star,
  Settings,
  Globe,
  Lock,
  Save,
  ExternalLink,
  Film,
  Edit3,
  FileText,
  UserPlus,
  UserCheck,
  Users,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const APP_BASE_URL = (
  import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin
).replace(/\/$/, "");

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [lists, setLists] = useState([]);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [activeTab, setActiveTab] = useState("favorites");
  const [loading, setLoading] = useState(true);
  const [removingFavoriteId, setRemovingFavoriteId] = useState(null);

  // Profile settings state
  const [profileData, setProfileData] = useState(null);
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editContent, setEditContent] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Posts state
  const [myPosts, setMyPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Follow state
  const [followRequests, setFollowRequests] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followDataLoading, setFollowDataLoading] = useState(false);
  const [followDataLoaded, setFollowDataLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchUserData();
  }, [user, navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchUserData = async () => {
    setLoading(true);
    await Promise.all([fetchFavorites(), fetchLists(), fetchProfile()]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/profile/me`, {
        headers: getAuthHeaders(),
      });
      setProfileData(res.data);
      setBio(res.data.user?.bio || "");
      setIsPublic(res.data.user?.isPublic ?? true);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_BASE_URL}/favourite/getFavorites`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const favs = response.data.favorites || [];
      setFavorites(favs);

      if (favs.length === 0) {
        setFavoriteMovies([]);
        return;
      }

      // Fetch movie details for each favorite
      const moviePromises = favs.map(async (fav) => {
        try {
          const movieRes = await axios.get(
            `${API_BASE_URL}/search/searchMovie/${fav.movieId}`,
          );
          return movieRes.data.data;
        } catch (error) {
          console.error(`Error fetching movie ${fav.movieId}:`, error);
          return null;
        }
      });

      const movies = await Promise.all(moviePromises);
      setFavoriteMovies(movies.filter(Boolean));
    } catch (error) {
      console.error("Error fetching favorites:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to load favorites");
    }
  };

  const fetchLists = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_BASE_URL}/lists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userLists = response.data || [];

      if (userLists.length === 0) {
        setLists([]);
        return;
      }

      // Fetch movies for each list
      const listsWithMovies = await Promise.all(
        userLists.map(async (list) => {
          try {
            const moviesRes = await axios.get(
              `${API_BASE_URL}/lists/${list._id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            const movieIds = moviesRes.data || [];

            if (movieIds.length === 0) {
              return { ...list, movies: [] };
            }

            // Fetch movie details
            const movieDetails = await Promise.all(
              movieIds.map(async (item) => {
                try {
                  const movieRes = await axios.get(
                    `${API_BASE_URL}/search/searchMovie/${item.movieId}`,
                  );
                  return movieRes.data.data;
                } catch (error) {
                  console.error(`Error fetching movie ${item.movieId}:`, error);
                  return null;
                }
              }),
            );

            return {
              ...list,
              movies: movieDetails.filter(Boolean),
            };
          } catch (error) {
            console.error(`Error fetching list ${list._id} movies:`, error);
            return { ...list, movies: [] };
          }
        }),
      );

      setLists(listsWithMovies);
    } catch (error) {
      console.error("Error fetching lists:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.error || "Failed to load lists");
    }
  };

  const fetchReviews = async () => {
    if (!user?.id) return;
    try {
      setReviewsLoading(true);
      const res = await axios.get(`${API_BASE_URL}/reviews/user/${user.id}`, {
        headers: getAuthHeaders(),
      });
      setReviews(res.data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/profile/me`,
        { bio, isPublic },
        { headers: getAuthHeaders() },
      );
      // Update local storage
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      savedUser.isPublic = isPublic;
      savedUser.bio = bio;
      localStorage.setItem("user", JSON.stringify(savedUser));
      toast.success("Profile updated!");
      setShowSettings(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/lists`,
        { name: newListName.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setLists([...lists, { ...response.data, movies: [] }]);
      setNewListName("");
      setShowNewList(false);
      toast.success("List created!");
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error(error.response?.data?.error || "Failed to create list");
    }
  };

  const handleDeleteList = async (listId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/lists/${listId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLists(lists.filter((l) => l._id !== listId));
      toast.success("List deleted");
    } catch (error) {
      console.error("Error deleting list:", error);
      toast.error("Failed to delete list");
    }
  };

  const handleRemoveFavorite = async (movieId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to manage favorites");
        return;
      }

      setRemovingFavoriteId(movieId);
      await axios.delete(
        `${API_BASE_URL}/favourite/removeFavorite/${movieId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setFavorites((prev) => prev.filter((fav) => fav.movieId !== movieId));
      setFavoriteMovies((prev) => prev.filter((movie) => movie.id !== movieId));
      toast.success("Removed from favorites");
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error(error.response?.data?.error || "Failed to remove favorite");
    } finally {
      setRemovingFavoriteId(null);
    }
  };

  const handleShareList = (list) => {
    const moviesList =
      list.movies?.map((m, i) => `${i + 1}) ${m.title}`).join("\n") ||
      "No movies yet";
    const listUrl = `${APP_BASE_URL}/#/list/${list._id}`;
    const text = `These are my 🎬 ${list.name} on Chitram:\n${moviesList}\n\nOpen this list: ${listUrl}\n\nDo you want to make your own list? Visit ${APP_BASE_URL}`;

    if (navigator.share) {
      navigator.share({
        title: list.name,
        text,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("List copied to clipboard!");
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditContent(review.content);
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;
    setEditSubmitting(true);
    try {
      await axios.put(
        `${API_BASE_URL}/reviews/${editingReview._id}`,
        { rating: editRating, content: editContent },
        { headers: getAuthHeaders() },
      );
      toast.success("Review updated!");
      setEditingReview(null);
      fetchReviews();
    } catch (error) {
      toast.error("Failed to update review");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Delete this review?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/reviews/${reviewId}`, {
        headers: getAuthHeaders(),
      });
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Load reviews when tab switches to reviews
  useEffect(() => {
    if (activeTab === "reviews" && reviews.length === 0) {
      fetchReviews();
    }
    if (activeTab === "posts" && myPosts.length === 0) {
      fetchMyPosts();
    }
  }, [activeTab]);

  const fetchMyPosts = async () => {
    try {
      setPostsLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/posts/user/${user?.id || profileData?.user?.id}`,
        { headers: getAuthHeaders() },
      );
      setMyPosts(res.data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`${API_BASE_URL}/posts/${postId}`, {
        headers: getAuthHeaders(),
      });
      setMyPosts(myPosts.filter((p) => p._id !== postId));
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const fetchFollowData = async () => {
    try {
      setFollowDataLoading(true);
      const userId = user?.id;
      if (!userId) return;
      const [reqRes, followersRes, followingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/follow/requests`, { headers: getAuthHeaders() }).catch(() => ({ data: { requests: [] } })),
        axios.get(`${API_BASE_URL}/follow/followers/${userId}`).catch(() => ({ data: { followers: [] } })),
        axios.get(`${API_BASE_URL}/follow/following/${userId}`).catch(() => ({ data: { following: [] } })),
      ]);
      setFollowRequests(reqRes.data.requests || []);
      setFollowers(followersRes.data.followers || []);
      setFollowing(followingRes.data.following || []);
      setFollowDataLoaded(true);
    } catch (error) {
      console.error("Error fetching follow data:", error);
    } finally {
      setFollowDataLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/follow/requests/${requestId}/accept`,
        {},
        { headers: getAuthHeaders() },
      );
      setFollowRequests(followRequests.filter((r) => r.id !== requestId));
      toast.success("Follow request accepted");
      // Refresh followers count
      fetchFollowData();
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/follow/requests/${requestId}/reject`,
        { headers: getAuthHeaders() },
      );
      setFollowRequests(followRequests.filter((r) => r.id !== requestId));
      toast.success("Follow request rejected");
    } catch {
      toast.error("Failed to reject request");
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await axios.delete(`${API_BASE_URL}/follow/${userId}`, {
        headers: getAuthHeaders(),
      });
      setFollowing(following.filter((f) => f.id !== userId));
      toast.success("Unfollowed");
    } catch {
      toast.error("Failed to unfollow");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <SEO title="My Profile" noindex />
      <Navbar />
      <div className="pt-24 pb-24 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8"
          >
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold text-foreground">
                {user?.username || "Movie Lover"}
              </h1>
              {profileData?.user?.bio && (
                <p className="text-muted-foreground text-sm mt-1">
                  {profileData.user.bio}
                </p>
              )}
              <p className="text-muted-foreground text-sm mt-1">
                {favoriteMovies.length} favorites • {lists.length} lists
                {profileData?.stats?.reviewCount > 0 &&
                  ` • ${profileData.stats.reviewCount} reviews`}
                {` • ${profileData?.stats?.followerCount || 0} followers • ${profileData?.stats?.followingCount || 0} following`}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </button>
                {isPublic && (
                  <Link
                    to={`/user/${user?.username}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Public Profile
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="md:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>

          {/* Profile Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-8"
              >
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Profile Settings
                  </h3>

                  {/* Public/Private Toggle */}
                  <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-background border border-border">
                    <div className="flex items-center gap-3">
                      {isPublic ? (
                        <Globe className="h-5 w-5 text-green-500" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {isPublic ? "Public Profile" : "Private Profile"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isPublic
                            ? "Anyone can view your profile, reviews, and public lists"
                            : "Only you can see your profile and activity"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPublic(!isPublic)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? "bg-primary" : "bg-muted"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                  </div>

                  {/* Bio */}
                  <div className="mb-4">
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell the world about your movie taste..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {bio.length}/500
                    </p>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === "favorites" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
            >
              <Heart className="h-4 w-4" />
              Favorites
            </button>
            <button
              onClick={() => setActiveTab("lists")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === "lists" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
            >
              <List className="h-4 w-4" />
              My Lists
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === "reviews" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
            >
              <MessageSquare className="h-4 w-4" />
              Reviews
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === "posts" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
            >
              <FileText className="h-4 w-4" />
              Posts
            </button>
            <button
              onClick={() => { setActiveTab("network"); if (!followDataLoaded) fetchFollowData(); }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === "network" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
            >
              <Users className="h-4 w-4" />
              Network
            </button>
          </div>

          {activeTab === "favorites" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {favoriteMovies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                  {favoriteMovies.map((movie, i) => (
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

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleRemoveFavorite(movie.id);
                            }}
                            disabled={removingFavoriteId === movie.id}
                            className="absolute top-2 right-2 p-2 rounded-full bg-background/85 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-60"
                            title="Remove from favorites"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-2 text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {movie.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ⭐ {movie.vote_average?.toFixed(1) || "N/A"}
                        </p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No favorites yet. Start exploring!
                  </p>
                  <Link
                    to="/search"
                    className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                  >
                    Explore Movies
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "lists" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <button
                onClick={() => setShowNewList(!showNewList)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create New List
              </button>

              <AnimatePresence>
                {showNewList && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex gap-2 max-w-md"
                  >
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="List name..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateList()
                      }
                      autoFocus
                    />
                    <button
                      onClick={handleCreateList}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                    >
                      Create
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                {lists.length > 0 ? (
                  lists.map((list, i) => (
                    <motion.div
                      key={list._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Link
                            to={`/list/${list._id}`}
                            className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {list.name}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-1">
                            {list.movies?.length || 0} movies
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`/list/${list._id}`}
                            className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
                            title="View full list"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleShareList(list)}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="Share list"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteList(list._id)}
                            className="p-2 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                            title="Delete list"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {list.movies && list.movies.length > 0 ? (
                        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                          {list.movies.map((movie) => (
                            <Link
                              key={movie.id}
                              to={`/movie/${movie.id}`}
                              className="flex-shrink-0 group"
                            >
                              <div className="w-24 aspect-[2/3] rounded-lg bg-secondary overflow-hidden group-hover:ring-2 ring-primary transition-all">
                                {movie.poster_path ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-2xl">🎬</span>
                                  </div>
                                )}
                              </div>
                              <p className="mt-1.5 text-xs text-foreground line-clamp-1 w-24 group-hover:text-primary transition-colors">
                                {movie.title}
                              </p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No movies yet. Search and add movies to this list!
                        </p>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No lists yet. Create your first list!
                    </p>
                    <button
                      onClick={() => setShowNewList(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Create List
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {reviewsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review, i) => (
                    <motion.div
                      key={review._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-5 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
                    >
                      {editingReview?._id === review._id ? (
                        /* Edit Mode */
                        <div>
                          <div className="mb-3">
                            <label className="text-xs text-muted-foreground mb-1 block">
                              Rating
                            </label>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setEditRating(star)}
                                  className="cursor-pointer hover:scale-110 transition-transform"
                                >
                                  <Star
                                    className={`h-5 w-5 ${star <= editRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            maxLength={5000}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-3"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateReview}
                              disabled={editSubmitting}
                              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-60"
                            >
                              {editSubmitting ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingReview(null)}
                              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div className="flex gap-4">
                          <Link
                            to={`/${review.targetType === "movie" ? "movie" : "series"}/${review.targetId}`}
                            className="flex-shrink-0"
                          >
                            {review.targetPoster ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w200${review.targetPoster}`}
                                alt={review.targetTitle}
                                className="w-16 h-24 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-16 h-24 rounded-lg bg-secondary flex items-center justify-center">
                                <Film className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <Link
                                  to={`/${review.targetType === "movie" ? "movie" : "series"}/${review.targetId}`}
                                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                                >
                                  {review.targetTitle || "Unknown Title"}
                                </Link>
                                <div className="flex items-center gap-1 mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-3.5 w-3.5 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditReview(review)}
                                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteReview(review._id)
                                  }
                                  className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-3 mt-2">
                              {review.content}
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-2">
                              {new Date(review.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No reviews yet. Watch a movie and share your thoughts!
                  </p>
                  <Link
                    to="/search"
                    className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                  >
                    Explore Movies
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "posts" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {postsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : myPosts.length > 0 ? (
                <div className="space-y-4">
                  {myPosts.map((post, i) => (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-5 rounded-2xl bg-card border border-border"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>
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
                              <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                                {m.title}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No posts yet. Head over to Community to share your thoughts!
                  </p>
                  <Link
                    to="/community"
                    className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                  >
                    Go to Community
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "network" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {followDataLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Follow Requests (only for private profiles) */}
                  {!isPublic && followRequests.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-primary" />
                        Follow Requests ({followRequests.length})
                      </h3>
                      <div className="space-y-3">
                        {followRequests.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border"
                          >
                            <Link
                              to={`/user/${req.username}`}
                              className="flex items-center gap-3"
                            >
                              {req.avatar ? (
                                <img
                                  src={req.avatar}
                                  alt={req.username}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                                {req.username}
                              </span>
                            </Link>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAcceptRequest(req.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(req.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Followers */}
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Followers ({followers.length})
                    </h3>
                    {followers.length > 0 ? (
                      <div className="space-y-3">
                        {followers.map((f) => (
                          <Link
                            key={f.id}
                            to={`/user/${f.username}`}
                            className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
                          >
                            {f.avatar ? (
                              <img
                                src={f.avatar}
                                alt={f.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                              {f.username}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4">
                        No followers yet.
                      </p>
                    )}
                  </div>

                  {/* Following */}
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-primary" />
                      Following ({following.length})
                    </h3>
                    {following.length > 0 ? (
                      <div className="space-y-3">
                        {following.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border"
                          >
                            <Link
                              to={`/user/${f.username}`}
                              className="flex items-center gap-3"
                            >
                              {f.avatar ? (
                                <img
                                  src={f.avatar}
                                  alt={f.username}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                                {f.username}
                              </span>
                            </Link>
                            <button
                              onClick={(e) => { e.preventDefault(); handleUnfollow(f.id); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            >
                              Unfollow
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4">
                        Not following anyone yet. Discover people in the{" "}
                        <Link to="/community" className="text-primary hover:underline">
                          Community
                        </Link>
                        .
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
