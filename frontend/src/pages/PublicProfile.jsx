import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import {
  User,
  Star,
  MessageSquare,
  List,
  Calendar,
  Lock,
  Loader2,
  Film,
  UserPlus,
  UserCheck,
  Clock,
  Users,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const PostsTab = ({
  profileUser,
  userPosts,
  setUserPosts,
  postsLoading,
  setPostsLoading,
}) => {
  useEffect(() => {
    if (profileUser?.id && userPosts.length === 0) {
      fetchPosts();
    }
  }, [profileUser?.id]);

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/posts/user/${profileUser.id}`,
      );
      setUserPosts(res.data.posts || []);
    } catch {
      /* ignore */
    } finally {
      setPostsLoading(false);
    }
  };

  if (postsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (userPosts.length === 0) {
    return (
      <div className="text-center py-20">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No posts yet.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="space-y-4">
        {userPosts.map((post, i) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 rounded-2xl bg-card border border-border"
          >
            <span className="text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mt-2">
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
    </motion.div>
  );
};

const PublicProfile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("reviews");
  const [followStatus, setFollowStatus] = useState("none");
  const [followLoading, setFollowLoading] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/profile/${username}`);
      setProfile(res.data);
      setIsPrivate(false);
      // Fetch reviews after profile loads
      fetchUserReviews(res.data.user.id);
    } catch (error) {
      if (error.response?.status === 403) {
        setIsPrivate(true);
        setProfile({
          user: error.response.data.user,
        });
      } else {
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async (userId) => {
    try {
      setReviewsLoading(true);
      const res = await axios.get(`${API_BASE_URL}/reviews/user/${userId}`);
      setReviews(res.data.reviews || []);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Check follow status after profile loads (must be before early returns for hooks ordering)
  const profileUser = profile?.user;
  const stats = profile?.stats;
  const userLists = profile?.lists;

  useEffect(() => {
    if (currentUser && profileUser?.id && currentUser.id !== profileUser.id) {
      const token = localStorage.getItem("token");
      axios
        .get(`${API_BASE_URL}/follow/status/${profileUser.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setFollowStatus(res.data.status || "none"))
        .catch(() => {});
    }
  }, [currentUser, profileUser?.id]);

  const handleFollow = async () => {
    if (!currentUser) return toast.error("Sign in to follow users");
    try {
      setFollowLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/follow/${profileUser.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setFollowStatus(res.data.status);
      toast.success(
        res.data.status === "pending"
          ? "Follow request sent!"
          : `You are now following ${profileUser.username}`,
      );
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to follow");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    try {
      setFollowLoading(true);
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/follow/${profileUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowStatus("none");
      toast.success("Unfollowed");
    } catch (error) {
      toast.error("Failed to unfollow");
    } finally {
      setFollowLoading(false);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <User className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground">
            User Not Found
          </h2>
          <p className="text-muted-foreground mt-2">
            The profile you're looking for doesn't exist.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          {profile.user?.avatar ? (
            <img
              src={profile.user.avatar}
              alt={profile.user.username}
              className="w-20 h-20 rounded-full object-cover shadow-lg mb-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <h2 className="text-xl font-semibold text-foreground">
            {profile.user?.username || "User"}
          </h2>
          <p className="text-muted-foreground mt-2 mb-4">
            This profile is private.
          </p>
          {/* Follow button for private profiles */}
          {currentUser && currentUser.id !== profile.user?.id && (
            <div>
              {followStatus === "none" && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {followLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Follow
                </button>
              )}
              {followStatus === "pending" && (
                <button
                  onClick={handleUnfollow}
                  disabled={followLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 transition-all"
                >
                  <Clock className="h-4 w-4" />
                  Requested
                </button>
              )}
              {followStatus === "accepted" && (
                <button
                  onClick={handleUnfollow}
                  disabled={followLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 transition-all"
                >
                  <UserCheck className="h-4 w-4" />
                  Following
                </button>
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }


  const joinDate = new Date(profileUser.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <SEO
        title={`${profileUser.username}'s Profile`}
        description={profileUser.bio || `Check out ${profileUser.username}'s profile on Chitram — their watchlists, reviews, and community activity.`}
        image={profileUser.avatar || undefined}
        canonical={`/user/${username}`}
        type="profile"
      />
      <Navbar />
      <div className="pt-24 pb-24 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-10"
          >
            {profileUser.avatar ? (
              <img
                src={profileUser.avatar}
                alt={profileUser.username}
                className="w-20 h-20 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold text-foreground">
                {profileUser.username}
              </h1>
              {profileUser.bio && (
                <p className="text-muted-foreground text-sm mt-1 max-w-lg">
                  {profileUser.bio}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {joinDate}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {stats.reviewCount} reviews
                </span>
                {stats.averageRating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {stats.averageRating} avg
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {stats.followerCount || 0} followers
                </span>
                <span className="text-muted-foreground">
                  {stats.followingCount || 0} following
                </span>
              </div>
            </div>

            {/* Follow button */}
            {currentUser && currentUser.id !== profileUser.id && (
              <div className="mt-4 md:mt-0">
                {followStatus === "accepted" ? (
                  <button
                    onClick={handleUnfollow}
                    disabled={followLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <UserCheck className="h-4 w-4" />
                    Following
                  </button>
                ) : followStatus === "pending" ? (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-secondary text-muted-foreground cursor-not-allowed"
                  >
                    <Clock className="h-4 w-4" />
                    Requested
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab("reviews")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === "reviews" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
            >
              <MessageSquare className="h-4 w-4" />
              Reviews ({stats.reviewCount})
            </button>
            <button
              onClick={() => setActiveTab("lists")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === "lists" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
            >
              <List className="h-4 w-4" />
              Lists ({userLists?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === "posts" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
            >
              <FileText className="h-4 w-4" />
              Posts
            </button>
          </div>

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {reviewsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((review, i) => (
                    <motion.div
                      key={review._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={`/${review.targetType === "movie" ? "movie" : "series"}/${review.targetId}`}
                        className="group block p-5 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
                      >
                        <div className="flex gap-4">
                          {review.targetPoster ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w200${review.targetPoster}`}
                              alt={review.targetTitle}
                              className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-24 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                              <Film className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {review.targetTitle || "Unknown Title"}
                            </h3>
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
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
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No reviews written yet.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Lists Tab */}
          {activeTab === "lists" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {userLists && userLists.length > 0 ? (
                <div className="space-y-4">
                  {userLists.map((list, i) => (
                    <motion.div
                      key={list._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={`/list/${list._id}`}
                        className="block p-5 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
                      >
                        <h3 className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                          {list.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created{" "}
                          {new Date(list.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                          })}
                        </p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No public lists yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Posts Tab */}
          {activeTab === "posts" && (
            <PostsTab
              profileUser={profileUser}
              userPosts={userPosts}
              setUserPosts={setUserPosts}
              postsLoading={postsLoading}
              setPostsLoading={setPostsLoading}
            />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PublicProfile;
