import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Menu, X, Film, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Explore", path: "/explore" },
  { label: "Search", path: "/search" },
  { label: "Recommend", path: "/recommend" },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass w-full">
      <div className="container mx-auto px-4 md:px-6 max-w-full">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
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
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
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
              <>
                <Link
                  to="/login"
                  className="hidden md:inline-flex px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
                >
                  Sign In
                </Link>
              </>
            )}

            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t border-border"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-secondary text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-foreground"
                  >
                    Profile ({user.username})
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium bg-destructive/20 text-destructive"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground text-center"
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
