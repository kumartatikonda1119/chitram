import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Film,
  Brain,
  Heart,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[100dvh] flex items-start justify-center overflow-hidden w-full max-w-full bg-gradient-to-b from-secondary/50 via-background to-background">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden w-full max-w-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Film strip decorative elements */}
      <div
        className="hidden md:block absolute left-0 top-0 h-full w-12 opacity-5 bg-repeat-y"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='64' viewBox='0 0 48 64' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='48' height='64' fill='%23fff'/%3E%3Crect x='4' y='4' width='8' height='8' rx='2' fill='%23000'/%3E%3Crect x='36' y='4' width='8' height='8' rx='2' fill='%23000'/%3E%3Crect x='4' y='52' width='8' height='8' rx='2' fill='%23000'/%3E%3Crect x='36' y='52' width='8' height='8' rx='2' fill='%23000'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="hidden md:block absolute right-0 top-0 h-full w-12 opacity-5 bg-repeat-y"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='64' viewBox='0 0 48 64' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='48' height='64' fill='%23fff'/%3E%3Crect x='4' y='4' width='8' height='8' rx='2' fill='%23000'/%3E%3Crect x='36' y='4' width='8' height='8' rx='2' fill='%23000'/%3E%3Crect x='4' y='52' width='8' height='8' rx='2' fill='%23000'/%3E%3Crect x='36' y='52' width='8' height='8' rx='2' fill='%23000'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center pt-24 pb-16 max-w-full w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto space-y-4 md:space-y-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              If you love cinema, this is your temple
            </span>
          </motion.div>

          {/* Main Title */}
          <div className="space-y-2">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-tight"
            >
              <span className="text-primary">Chitram</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-foreground/80"
            >
              Understand the <span className="text-primary">Art</span> and{" "}
              <span className="text-primary">Science</span> of Storytelling
            </motion.p>
          </div>

          {/* Philosophy */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            <span className="text-sm sm:text-base opacity-75">
              Learn the 24 crafts of filmmaking. Understand why cinema moves
              you. Discover what makes films immortal.
            </span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2"
          >
            <Link
              to="/explore"
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            >
              <Film className="h-5 w-5" />
              Explore Cinema
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-card border border-border text-foreground font-semibold hover:bg-secondary transition-colors"
            >
              Join the Journey
            </Link>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="pt-6 sm:pt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-3xl mx-auto"
          >
            {[
              {
                icon: Film,
                title: "24 Crafts",
                desc: "Every department that makes cinema magical",
              },
              {
                icon: Brain,
                title: "Film Science",
                desc: "What happens in your brain during a movie",
              },
              {
                icon: Heart,
                title: "Pure Passion",
                desc: "Built by cinephiles, for cinephiles",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1, duration: 0.5 }}
                className="p-3 sm:p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm"
              >
                <item.icon className="h-5 sm:h-6 w-5 sm:w-6 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground text-xs sm:text-sm mb-1">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator - positioned relative to section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-xs font-medium">Scroll to explore</span>
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
