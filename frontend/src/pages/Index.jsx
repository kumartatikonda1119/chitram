import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CRAFTS_DATA,
  BRAIN_SCIENCE_DATA,
  CINEMA_EVOLUTION_DATA,
  INDIAN_CINEMA_DATA,
  FILM_AWARDS_DATA,
  GENRES_DATA,
  EMPATHY_DATA,
  FANDOM_DATA,
  TECHNIQUES_DATA,
  FUTURE_CINEMA_DATA,
  MORE_FACTS_DATA,
  CINEMA_QUOTES,
} from "@/lib/cinemaData";
import {
  Clapperboard,
  Brain,
  Clock,
  Flag,
  Trophy,
  Film,
  Heart,
  Users,
  Camera,
  Rocket,
  Lightbulb,
  ChevronRight,
  X,
  Quote,
  Sparkles,
  Play,
} from "lucide-react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// Section wrapper component
const Section = ({ children, className = "", gradient = false, id }) => (
  <section
    id={id}
    className={`py-12 sm:py-16 md:py-20 lg:py-28 ${gradient ? "bg-gradient-to-b from-card/30 to-background" : ""} ${className}`}
  >
    <div className="container mx-auto px-4 sm:px-6 md:px-6">{children}</div>
  </section>
);

// Section header component
const SectionHeader = ({
  icon: Icon,
  badge,
  title,
  titleHighlight,
  subtitle,
}) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={fadeInUp}
    className="text-center mb-10 sm:mb-12 md:mb-16"
  >
    {badge && (
      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs sm:text-sm font-medium text-primary mb-4 sm:mb-6">
        {Icon && <Icon className="h-4 w-4" />}
        {badge}
      </div>
    )}
    <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-foreground">
      {title} <span className="text-primary">{titleHighlight}</span>
    </h2>
    {subtitle && (
      <p className="text-muted-foreground mt-3 sm:mt-4 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
        {subtitle}
      </p>
    )}
  </motion.div>
);

const Index = () => {
  const [selectedCraft, setSelectedCraft] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [expandedAward, setExpandedAward] = useState(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      {/* ===== SECTION 1: 24 Crafts of Cinema ===== */}
      <Section id="crafts" gradient>
        <SectionHeader
          icon={Clapperboard}
          badge="The Art of Filmmaking"
          title="The 24 Crafts of"
          titleHighlight="Cinema"
          subtitle="Cinema isn't just actors. It's an orchestra. Every department working in harmony to create magic."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3"
        >
          {CRAFTS_DATA.map((craft, i) => (
            <motion.button
              key={craft.id}
              variants={fadeInUp}
              onClick={() => setSelectedCraft(craft)}
              className="group p-3 sm:p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-left"
            >
              <span className="text-xl sm:text-2xl block mb-2">{craft.icon}</span>
              <h3 className="font-medium text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                {craft.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {craft.shortDesc}
              </p>
            </motion.button>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-muted-foreground mt-8 text-sm"
        >
          Click any craft to learn more about the masters behind cinema
        </motion.p>

        {/* Craft Modal */}
        <AnimatePresence>
          {selectedCraft && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedCraft(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-8 shadow-2xl"
              >
                <button
                  onClick={() => setSelectedCraft(null)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <span className="text-5xl block mb-4">
                  {selectedCraft.icon}
                </span>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {selectedCraft.name}
                </h3>
                <p className="text-primary font-medium mb-4">
                  {selectedCraft.shortDesc}
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {selectedCraft.fullDesc}
                </p>
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    Legends in this craft:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCraft.legends.map((legend) => (
                      <span
                        key={legend}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                      >
                        {legend}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      {/* ===== SECTION 2: Brain Science ===== */}
      <Section id="brain">
        <SectionHeader
          icon={Brain}
          badge="Science of Cinema"
          title="What Happens to Your"
          titleHighlight="Brain?"
          subtitle={BRAIN_SCIENCE_DATA.intro}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {BRAIN_SCIENCE_DATA.effects.map((effect, i) => (
            <motion.div
              key={effect.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-4 sm:p-6 rounded-3xl bg-gradient-to-br ${effect.color} overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors" />
              <div className="relative z-10">
                <span className="text-3xl sm:text-4xl block mb-3 sm:mb-4">{effect.icon}</span>
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                  {effect.chemical}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1 mb-2 sm:mb-3">
                  {effect.title}
                </h3>
                <p className="text-white/80 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">
                  {effect.description}
                </p>
                <div className="pt-2 sm:pt-3 border-t border-white/20">
                  <p className="text-xs text-white/60">
                    <span className="text-white/80 font-medium">
                      Triggered by:
                    </span>{" "}
                    {effect.trigger}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 sm:mt-12 text-center"
        >
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-foreground">
            {BRAIN_SCIENCE_DATA.conclusion}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            That's not childish. That's{" "}
            <span className="text-primary font-medium">human</span>.
          </p>
        </motion.div>
      </Section>

      {/* ===== SECTION 3: Evolution Timeline ===== */}
      <Section id="evolution" gradient>
        <SectionHeader
          icon={Clock}
          badge="130 Years of Magic"
          title="Evolution of"
          titleHighlight="Cinema"
          subtitle="From mechanical illusion to digital universe"
        />

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />

          <div className="space-y-6 sm:space-y-8">
            {CINEMA_EVOLUTION_DATA.map((era, i) => (
              <motion.div
                key={era.year}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                className={`relative flex items-start gap-4 sm:gap-6 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-4 md:left-1/2 w-3 h-3 rounded-full bg-primary -translate-x-1/2 mt-2 ring-4 ring-background" />

                {/* Content */}
                <div
                  className={`ml-12 md:ml-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}
                >
                  <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                    <div
                      className={`flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 ${i % 2 === 0 ? "md:flex-row-reverse" : ""}`}
                    >
                      <span className="text-2xl sm:text-3xl">{era.icon}</span>
                      <span className="text-primary font-bold text-base sm:text-lg">
                        {era.year}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {era.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {era.description}
                    </p>
                    <p className="text-xs text-primary mt-3 font-medium">
                      {era.milestone}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ===== SECTION 4: Indian Cinema Roots ===== */}
      <Section id="indian-cinema">
        <SectionHeader
          icon={Flag}
          badge="Our Heritage"
          title="Indian Cinema"
          titleHighlight="Roots"
          subtitle={INDIAN_CINEMA_DATA.intro}
        />

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-16"
        >
          {INDIAN_CINEMA_DATA.statistics.map((stat) => (
            <div
              key={stat.label}
              className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-center"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm font-medium text-foreground mt-1">
                {stat.label}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stat.desc}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Milestones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {INDIAN_CINEMA_DATA.milestones.map((milestone, i) => (
            <motion.div
              key={milestone.year}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 sm:p-6 rounded-2xl border ${
                milestone.significance === "high"
                  ? "bg-primary/5 border-primary/30"
                  : "bg-card border-border"
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl flex-shrink-0">{milestone.icon}</span>
                <div>
                  <span className="text-primary font-bold text-sm sm:text-base">
                    {milestone.year}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {milestone.event}
                  </p>
                </div>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">
                {milestone.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {milestone.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== SECTION 5: Film Awards ===== */}
      <Section id="awards" gradient>
        <SectionHeader
          icon={Trophy}
          badge="Recognition & Glory"
          title="Highest Film"
          titleHighlight="Awards"
          subtitle="The pinnacles of cinematic recognition"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Global Awards */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
              <span className="text-2xl">🌍</span> Global Awards
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {FILM_AWARDS_DATA.global.map((award) => (
                <motion.div
                  key={award.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="p-4 sm:p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() =>
                    setExpandedAward(
                      expandedAward === award.name ? null : award.name,
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{award.icon}</span>
                      <div>
                        <h4 className="font-semibold text-sm sm:text-base text-foreground">
                          {award.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {award.country} • Since {award.since}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground transition-transform flex-shrink-0 ${
                        expandedAward === award.name ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {expandedAward === award.name && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-border">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                            {award.description}
                          </p>
                          <p className="text-xs">
                            <span className="text-primary font-medium">
                              Why it matters:
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {award.whyItMatters}
                            </span>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Indian Awards */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
              <span className="text-2xl">🇮🇳</span> Indian Awards
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {FILM_AWARDS_DATA.indian.map((award) => (
                <motion.div
                  key={award.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="p-4 sm:p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() =>
                    setExpandedAward(
                      expandedAward === award.name ? null : award.name,
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl flex-shrink-0">{award.icon}</span>
                      <div>
                        <h4 className="font-semibold text-sm sm:text-base text-foreground">
                          {award.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Since {award.since}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        expandedAward === award.name ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {expandedAward === award.name && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-3">
                            {award.description}
                          </p>
                          <p className="text-xs">
                            <span className="text-primary font-medium">
                              Why it matters:
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {award.whyItMatters}
                            </span>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ===== SECTION 6: Genres Explained ===== */}
      <Section id="genres">
        <SectionHeader
          icon={Film}
          badge="Genre Explorer"
          title="Genres"
          titleHighlight="Explained"
          subtitle="Understanding the language of storytelling"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {GENRES_DATA.genres.map((genre) => (
            <motion.button
              key={genre.name}
              variants={fadeInUp}
              onClick={() => setSelectedGenre(genre)}
              className={`p-4 rounded-2xl bg-gradient-to-br ${genre.color} relative overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
              <div className="relative z-10 text-center">
                <span className="text-3xl block mb-2">{genre.icon}</span>
                <h3 className="font-semibold text-white text-sm">
                  {genre.name}
                </h3>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Mass vs Art Cinema */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-2xl">🍿</span>{" "}
              {GENRES_DATA.massVsArt.mass.name}
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {GENRES_DATA.massVsArt.mass.traits.map((trait) => (
                <span
                  key={trait}
                  className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs"
                >
                  {trait}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic">
              "{GENRES_DATA.massVsArt.mass.philosophy}"
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="text-2xl">🎨</span>{" "}
              {GENRES_DATA.massVsArt.art.name}
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {GENRES_DATA.massVsArt.art.traits.map((trait) => (
                <span
                  key={trait}
                  className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs"
                >
                  {trait}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic">
              "{GENRES_DATA.massVsArt.art.philosophy}"
            </p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8 text-lg text-foreground font-medium"
        >
          {GENRES_DATA.massVsArt.conclusion}
        </motion.p>

        {/* Genre Modal */}
        <AnimatePresence>
          {selectedGenre && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedGenre(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-8 shadow-2xl"
              >
                <button
                  onClick={() => setSelectedGenre(null)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <span className="text-5xl block mb-4">
                  {selectedGenre.icon}
                </span>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {selectedGenre.name}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {selectedGenre.description}
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      Common Tropes:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedGenre.tropes.map((trope) => (
                        <span
                          key={trope}
                          className="px-3 py-1 rounded-full bg-secondary text-sm"
                        >
                          {trope}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      Indian Examples:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedGenre.indianExamples.map((ex) => (
                        <span
                          key={ex}
                          className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      World Cinema:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedGenre.worldExamples.map((ex) => (
                        <span
                          key={ex}
                          className="px-3 py-1 rounded-full bg-secondary text-sm"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      {/* ===== SECTION 7: Why We Become The Character ===== */}
      <Section id="empathy" gradient>
        <SectionHeader
          icon={Heart}
          badge="Structured Empathy"
          title="Why We Become"
          titleHighlight="The Character"
          subtitle={EMPATHY_DATA.subtitle}
        />

        <div className="max-w-4xl mx-auto space-y-8">
          {EMPATHY_DATA.points.map((point, i) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 items-start p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <span className="text-4xl flex-shrink-0">{point.icon}</span>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {point.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {point.description}
                </p>
                <p className="text-primary font-medium italic text-sm">
                  "{point.quote}"
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== SECTION 8: Psychology of Fandom ===== */}
      <Section id="fandom">
        <SectionHeader
          icon={Users}
          badge="Psychology of Connection"
          title="The Psychology of"
          titleHighlight="Fandom"
          subtitle={FANDOM_DATA.subtitle}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FANDOM_DATA.insights.map((insight, i) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group"
            >
              <span className="text-4xl block mb-4 group-hover:scale-110 transition-transform">
                {insight.icon}
              </span>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {insight.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {insight.description}
              </p>
              <p className="text-xs text-primary font-medium">
                📚 {insight.psychological}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12 text-lg text-foreground font-medium"
        >
          {FANDOM_DATA.conclusion}
        </motion.p>
      </Section>

      {/* ===== SECTION 9: Cinematic Techniques ===== */}
      <Section id="techniques" gradient>
        <SectionHeader
          icon={Camera}
          badge="Learn to Watch Differently"
          title="Cinematic"
          titleHighlight="Techniques"
          subtitle={TECHNIQUES_DATA.subtitle}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {TECHNIQUES_DATA.techniques.map((tech, i) => (
            <motion.button
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedTechnique(tech)}
              className="p-5 rounded-2xl bg-card border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
            >
              <span className="text-3xl block mb-3">{tech.icon}</span>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {tech.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {tech.description}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Technique Modal */}
        <AnimatePresence>
          {selectedTechnique && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
              onClick={() => setSelectedTechnique(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-8 shadow-2xl"
              >
                <button
                  onClick={() => setSelectedTechnique(null)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <span className="text-5xl block mb-4">
                  {selectedTechnique.icon}
                </span>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {selectedTechnique.name}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {selectedTechnique.description}
                </p>
                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 font-medium">
                      How to spot it:
                    </p>
                    <p className="text-sm text-foreground">
                      {selectedTechnique.spotIt}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 font-medium">
                      Famous example:
                    </p>
                    <p className="text-sm text-primary font-medium">
                      {selectedTechnique.example}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      {/* ===== SECTION 10: Future of Cinema ===== */}
      <Section id="future">
        <SectionHeader
          icon={Rocket}
          badge="What's Next"
          title="The Future of"
          titleHighlight="Cinema"
          subtitle={FUTURE_CINEMA_DATA.subtitle}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FUTURE_CINEMA_DATA.futureTrends.map((trend, i) => (
            <motion.div
              key={trend.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{trend.icon}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trend.status === "Current"
                      ? "bg-green-500/20 text-green-400"
                      : trend.status === "Emerging"
                        ? "bg-blue-500/20 text-blue-400"
                        : trend.status === "Controversial"
                          ? "bg-red-500/20 text-red-400"
                          : trend.status === "Dominant"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {trend.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {trend.name}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {trend.description}
              </p>
              <div className="pt-3 border-t border-border text-xs">
                <p className="text-muted-foreground">
                  <span className="text-primary font-medium">Prediction:</span>{" "}
                  {trend.prediction}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20"
        >
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <p className="text-xl md:text-2xl font-medium text-foreground">
            {FUTURE_CINEMA_DATA.closingThought}
          </p>
        </motion.div>
      </Section>

      {/* ===== BONUS: Did You Know Facts ===== */}
      <Section id="facts" gradient>
        <SectionHeader
          icon={Lightbulb}
          badge="Interesting Facts"
          title="Did You"
          titleHighlight="Know?"
          subtitle="Fascinating insights about cinema"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MORE_FACTS_DATA.map((fact, i) => (
            <motion.div
              key={fact.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{fact.icon}</span>
                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {fact.category}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                {fact.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {fact.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== Quotes Section ===== */}
      <Section id="quotes">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Quote className="h-12 w-12 text-primary/30 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Words from the Masters
            </h2>
          </motion.div>

          <div className="space-y-6">
            {CINEMA_QUOTES.map((quote, i) => (
              <motion.div
                key={quote.author}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <p className="text-lg md:text-xl text-foreground italic mb-4">
                  "{quote.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Film className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {quote.author}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {quote.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ===== CTA Section ===== */}
      <Section className="pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
            Ready to <span className="text-primary">Explore</span> Cinema?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Discover movies, understand filmmaking, and join a community of
            cinephiles.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25"
            >
              <Play className="h-5 w-5" />
              Start Exploring
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-card border border-border text-foreground font-semibold hover:bg-secondary transition-colors"
            >
              Search Movies
            </Link>
          </div>
        </motion.div>
      </Section>

      <Footer />
    </div>
  );
};

export default Index;
