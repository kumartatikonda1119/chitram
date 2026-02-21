import { Film, Heart } from "lucide-react";
import { Link } from "react-router-dom";
const Footer = () => {
    return (<footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Film className="h-6 w-6 text-primary"/>
              <span className="text-xl font-display font-bold text-primary">Chitram</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your personal cinema companion. Discover, organize, and share the movies you love with the world.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Explore</h4>
            <div className="space-y-2">
              {["Trending", "Top Rated", "Genres", "Languages"].map((link) => (<Link key={link} to="/explore" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link}
                </Link>))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Account</h4>
            <div className="space-y-2">
              {["Sign In", "Register", "Profile", "My Lists"].map((link) => (<Link key={link} to={link === "Sign In" ? "/login" : link === "Register" ? "/register" : "/profile"} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link}
                </Link>))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Chitram. Made with <Heart className="inline h-3 w-3 text-primary"/> for cinema lovers.
          </p>
          <p className="text-xs text-muted-foreground">Powered by TMDB API</p>
        </div>
      </div>
    </footer>);
};
export default Footer;
