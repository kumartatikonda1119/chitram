import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { notificationAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";
import { Bell, MessageSquare, UserPlus, Check, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchNotifications();
  }, [user, navigate]);

  const fetchNotifications = async (pageNumber = 1) => {
    try {
      setLoading(pageNumber === 1);
      const res = await notificationAPI.getAll(pageNumber);
      if (pageNumber === 1) {
        setNotifications(res.data.notifications);
      } else {
        setNotifications((prev) => [...prev, ...res.data.notifications]);
      }
      setHasMore(res.data.page < res.data.totalPages);
      setPage(pageNumber);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await notificationAPI.markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    // Navigate to appropriate page
    if (notification.type === "follow") {
      navigate(`/profile/${notification.sender.username}`);
    } else if (notification.type === "post_reply") {
      navigate(`/community`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "follow":
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case "post_reply":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const getNotificationText = (notification) => {
    const senderName = notification.sender.username;
    switch (notification.type) {
      case "follow":
        return (
          <span>
            <span className="font-semibold text-foreground">{senderName}</span>{" "}
            started following you.
          </span>
        );
      case "post_reply":
        return (
          <span>
            <span className="font-semibold text-foreground">{senderName}</span>{" "}
            replied to your discussion.
          </span>
        );
      default:
        return (
          <span>
            <span className="font-semibold text-foreground">{senderName}</span>{" "}
            interacted with you.
          </span>
        );
    }
  };

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Notifications" noindex />
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Bell className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-display font-bold">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors bg-secondary rounded-lg"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification, idx) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleNotificationClick(notification)}
                className={`relative flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  notification.isRead
                    ? "bg-card border-border hover:border-primary/30"
                    : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                }`}
              >
                {!notification.isRead && (
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-12 bg-primary rounded-r-full" />
                )}

                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage
                      src={notification.sender.avatar}
                      alt={notification.sender.username}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {notification.sender.username?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-[15px] leading-snug text-muted-foreground">
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </motion.div>
            ))}

            {hasMore && (
              <div className="pt-6 flex justify-center">
                <button
                  onClick={() => fetchNotifications(page + 1)}
                  className="px-6 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-24 bg-card rounded-2xl border border-border">
            <div className="w-16 h-16 mx-auto mb-4 bg-secondary rounded-full flex items-center justify-center">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No notifications yet
            </h3>
            <p className="text-muted-foreground">
              When someone interacts with you, it will show up here.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;
