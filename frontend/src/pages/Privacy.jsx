import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  Mail,
  ExternalLink,
} from "lucide-react";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Privacy Policy" 
        description="Read Chitram's Privacy Policy. Learn how we securely handle your account data, movie interactions, and community content while respecting your privacy." 
        canonical="/privacy-policy"
      />
      <div className="container mx-auto px-4 md:px-6 pt-10 pb-20 max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          BACK TO HOME
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-2">
            Privacy Policy.
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Last Updated: 22 July 2026
          </p>

          {/* Main callout */}
          <div className="mt-8 p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h3 className="text-base font-bold text-emerald-400">
                Your Privacy Matters
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We take your privacy seriously. Your personal data is handled
              securely and is <strong className="text-foreground">never</strong>{" "}
              shared with or sold to third parties.
            </p>
          </div>

          {/* How data is handled */}
          <h2 className="text-xl font-bold text-foreground mt-10 mb-4">
            How Your Data is Handled
          </h2>

          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <strong className="text-foreground text-sm">
                  Account Data:
                </strong>{" "}
                <span className="text-sm text-muted-foreground leading-relaxed">
                  When you register, we store your name, email, and a securely
                  hashed password in our database. We{" "}
                  <strong className="text-foreground">never</strong> store
                  plain‑text passwords. If you sign in with Google, we only
                  receive your name and email from Google's OAuth service.
                </span>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <strong className="text-foreground text-sm">
                  Movie Interactions:
                </strong>{" "}
                <span className="text-sm text-muted-foreground leading-relaxed">
                  Your favorites, watchlists, and viewing history are stored to
                  provide personalized recommendations tailored to your taste.
                  This data is tied to your account and is not shared with
                  anyone.
                </span>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <strong className="text-foreground text-sm">
                  Community Content:
                </strong>{" "}
                <span className="text-sm text-muted-foreground leading-relaxed">
                  Discussions, reviews, and comments you post in the Community
                  section are public and visible to other users. Your username
                  and profile picture are displayed alongside your contributions.
                </span>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <strong className="text-foreground text-sm">
                  Third‑Party Services:
                </strong>{" "}
                <span className="text-sm text-muted-foreground leading-relaxed">
                  We use the TMDB API for movie and series data, and Google
                  OAuth for social sign‑in. We have completely removed all
                  third‑party tracking, ad networks, and analytics that could
                  compromise your privacy. No cookies are used for advertising
                  purposes.
                </span>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <div>
                <strong className="text-foreground text-sm">
                  Data Deletion:
                </strong>{" "}
                <span className="text-sm text-muted-foreground leading-relaxed">
                  If you wish to have your account and all associated data
                  deleted, you can contact me directly. I will process the
                  request and permanently remove your data from the servers.
                </span>
              </div>
            </li>
          </ul>

          {/* Divider */}
          <div className="border-t border-border my-10" />

          {/* Contact */}
          <h2 className="text-xl font-bold text-foreground mb-3">Contact</h2>
          <p className="text-sm text-muted-foreground mb-4">
            If you have any questions or concerns regarding this Privacy Policy,
            please contact me:
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:kumartatikonda1119@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
            >
              <Mail className="h-4 w-4" />
              kumartatikonda1119@gmail.com
            </a>
            <a
              href="https://kumarr.me"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              kumarr.me
            </a>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
