import {
  Film,
  Heart,
  Mail,
  ExternalLink,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 w-full overflow-x-hidden">
      <div className="container mx-auto px-4 md:px-6 py-10 max-w-full">
        {/* Top: Brand row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            <span className="text-xl font-display font-bold text-primary">
              Chitram
            </span>
            <span className="text-sm text-muted-foreground ml-2 hidden sm:inline">
              — Your personal cinema companion
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="mailto:kumartatikonda1119@gmail.com"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              kumartatikonda1119@gmail.com
            </a>
            <a
              href="https://kumarr.me"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              kumarr.me
            </a>
          </div>
        </div>

        {/* Links grid — compact 5 columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-4">
          {/* Search */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-foreground">Search</h4>
            <div className="space-y-1.5">
              <Link to="/search" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Search Movies
              </Link>
              <Link to="/search" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Search Web Series
              </Link>
              <Link to="/search" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Search Person
              </Link>
              <Link to="/search" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Search by Genre
              </Link>
            </div>
          </div>

          {/* Explore */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-foreground">Explore</h4>
            <div className="space-y-1.5">
              <Link to="/explore" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Trending
              </Link>
              <Link to="/explore" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Top Rated
              </Link>
              <Link to="/explore" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Now Playing
              </Link>
              <Link to="/explore" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Upcoming
              </Link>
            </div>
          </div>

          {/* Recommend */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-foreground">Recommend</h4>
            <div className="space-y-1.5">
              <Link to="/recommend" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Recommended For You
              </Link>
              <Link to="/recommend" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Recently Viewed
              </Link>
              <Link to="/recommend" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Recommend by Genre
              </Link>
            </div>
          </div>

          {/* Community */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-foreground">Community</h4>
            <div className="space-y-1.5">
              <Link to="/community" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Discussions
              </Link>
              <Link to="/community" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Reviews
              </Link>
              <Link to="/community" className="block text-[13px] text-muted-foreground hover:text-primary transition-colors">
                Feed
              </Link>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-foreground">Info</h4>
            <div className="space-y-1.5">
              <Link to="/about" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary transition-colors">
                <Info className="h-3.5 w-3.5" />
                About
              </Link>
              <Link to="/privacy-policy" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-primary transition-colors">
                <ShieldCheck className="h-3.5 w-3.5" />
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-5 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © 2026 Chitram. Made with{" "}
            <Heart className="inline h-3 w-3 text-primary" /> for cinema lovers.
          </p>
          <p className="text-xs text-muted-foreground">
            Made by{" "}
            <a
              href="https://kumarr.me"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Kumar Tatikonda
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
