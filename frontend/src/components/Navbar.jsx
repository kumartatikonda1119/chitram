import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Film,
  LogOut,
  Home,
  Compass,
  Clapperboard,
  Search,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Explore", path: "/explore" },
  { label: "Search", path: "/search" },
  { label: "Recommend", path: "/recommend" },
];

const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const mobileTabItems = [
    { label: "Home", path: "/", icon: Home },
    { label: "Explore", path: "/explore", icon: Compass },
    { label: "Search", path: "/search", icon: Search },
    { label: "Recommend", path: "/recommend", icon: Clapperboard },
    { label: "You", path: user ? "/profile" : "/login", icon: User },
  ];

  const handleLogout = () => {
    logout();
  };

  const isActiveTab = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass w-full">
        <div className="container mx-auto px-4 md:px-6 max-w-full">
          <div className="flex items-center justify-between h-16">
            <Link to="/" onClick={scrollTop} className="flex items-center gap-2 group">
              <Film className="h-7 w-7 text-primary transition-transform group-hover:rotate-12" />
              <span className="text-2xl font-display font-bold text-primary">
                Chitram
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={scrollTop}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                    location.pathname === item.path
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={scrollTop}
                    className="hidden md:inline-flex p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                    title={user.username}
                  >
                    <User className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={scrollTop}
                  className="hidden md:inline-flex px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="grid grid-cols-5 h-16 px-1">
          {mobileTabItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveTab(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={scrollTop}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
