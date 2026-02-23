import {
  Film,
  Heart,
  Instagram,
  Linkedin,
  Github,
  Globe,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/kumar_tatikonda/",
    icon: Instagram,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/kumarTatikonda",
    icon: Linkedin,
  },
  {
    name: "GitHub",
    href: "https://github.com/kumartatikonda1119",
    icon: Github,
  },
  {
    name: "Portfolio",
    href: "https://kumarr.me",
    icon: Globe,
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 w-full overflow-x-hidden">
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Film className="h-6 w-6 text-primary" />
              <span className="text-xl font-display font-bold text-primary">
                Chitram
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your personal cinema companion. Discover, organize, and share the
              movies you love with the world.
            </p>

            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold text-foreground">
                Contact Links
              </h4>
              <a
                href="mailto:kumartatikonda1119@gmail.com"
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                kumartatikonda1119@gmail.com
              </a>
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.name}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Explore</h4>
            <div className="space-y-2">
              {["Trending", "Top Rated", "Genres", "Languages"].map((link) => (
                <Link
                  key={link}
                  to="/explore"
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Account</h4>
            <div className="space-y-2">
              {["Sign In", "Register", "Profile", "My Lists"].map((link) => (
                <Link
                  key={link}
                  to={
                    link === "Sign In"
                      ? "/login"
                      : link === "Register"
                        ? "/register"
                        : "/profile"
                  }
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Chitram. Made with{" "}
            <Heart className="inline h-3 w-3 text-primary" /> for cinema lovers.
          </p>
          <p className="text-xs text-muted-foreground">Powered by TMDB API</p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
