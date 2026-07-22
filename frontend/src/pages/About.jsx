import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Code2,
  Mail,
  ExternalLink,
  Film,
} from "lucide-react";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            About Chitram.
          </h1>

          {/* Intro */}
          <p className="text-muted-foreground mt-6 leading-relaxed">
            Chitram is a movie discovery and community platform. This project
            was created by me,{" "}
            <a
              href="https://kumarr.me"
              target="_blank"
              rel="noreferrer"
              className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
            >
              Kumar Tatikonda
            </a>
            , to provide a modern, beautiful way to explore, organize, and
            discuss cinema.
          </p>

          {/* Motivation */}
          <p className="text-muted-foreground mt-5 leading-relaxed">
            As a movie enthusiast, I was tired of jumping between multiple
            websites just to search for a movie, check ratings, find where to
            stream it, and read reviews. I wanted a single platform where I
            could do all of that — and more. Chitram brings together AI‑powered
            search, personalized recommendations, curated watchlists, and a
            vibrant community where you can discuss your favorite films, share
            reviews, and connect with fellow cinema lovers. The name "Chitram"
            itself means "movie" in Telugu, reflecting my love for both cinema
            and my culture.
          </p>

          {/* Server Infrastructure callout */}
          <div className="mt-8 p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                Server Infrastructure
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This application is built as a full‑stack MERN (MongoDB, Express,
              React, Node.js) project with AI‑powered search using Google Gemini,
              Redis caching for blazing‑fast responses, and TMDB integration for
              comprehensive movie data. It operates on independent, self‑hosted
              infrastructure to ensure fast and real‑time responses.
            </p>
          </div>

          {/* Features highlight */}
          <div className="mt-6 p-5 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Film className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                What Chitram Offers
              </h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside leading-relaxed">
              <li>AI‑powered natural language movie search</li>
              <li>Personalized recommendations based on your taste</li>
              <li>Comprehensive movie and web series details</li>
              <li>Create and share custom watchlists and playlists</li>
              <li>Community discussions, reviews, and social features</li>
              <li>Dark and light mode for comfortable viewing</li>
            </ul>
          </div>

          {/* Divider */}
          <div className="border-t border-border my-10" />

          {/* Contact & Support */}
          <h2 className="text-xl font-bold text-foreground mb-3">
            Contact & Support
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            If you encounter any issues, have feature requests, or just want to
            connect, feel free to reach out:
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

export default About;
