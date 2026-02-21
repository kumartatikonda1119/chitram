import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SAMPLE_MOVIES, GENRES } from "@/lib/types";
import { Sparkles, ArrowRight } from "lucide-react";
import MovieCard from "@/components/MovieCard";
const Recommend = () => {
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [mood, setMood] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const moods = [
        { label: "Feel Good", emoji: "😊" },
        { label: "Thrilling", emoji: "😱" },
        { label: "Romantic", emoji: "💕" },
        { label: "Mind-Bending", emoji: "🤯" },
        { label: "Emotional", emoji: "😢" },
        { label: "Action-Packed", emoji: "💥" },
    ];
    const toggleGenre = (id) => {
        setSelectedGenres((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
    };
    const recommendations = selectedGenres.length
        ? SAMPLE_MOVIES.filter((m) => m.genre_ids.some((g) => selectedGenres.includes(g)))
        : SAMPLE_MOVIES;
    return (<div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-secondary-foreground mb-4">
              <Sparkles className="h-3.5 w-3.5 text-primary"/>
              Powered by Chitram
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              What Should You <span className="text-primary">Watch</span>?
            </h1>
            <p className="text-muted-foreground">Tell us your mood and preferences, and we'll find the perfect movie for you.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-2xl mx-auto mb-10">
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">How are you feeling?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {moods.map((m) => (<button key={m.label} onClick={() => setMood(mood === m.label ? null : m.label)} className={`p-4 rounded-xl text-center transition-all ${mood === m.label ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-card border border-border text-foreground hover:border-primary/30"}`}>
                  <span className="text-2xl block mb-1">{m.emoji}</span>
                  <span className="text-sm font-medium">{m.label}</span>
                </button>))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-2xl mx-auto mb-10">
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">Pick your genres</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {GENRES.map((g) => (<button key={g.id} onClick={() => toggleGenre(g.id)} className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${selectedGenres.includes(g.id) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
                  {g.name}
                </button>))}
            </div>
          </motion.div>

          <div className="text-center mb-16">
            <button onClick={() => setShowResults(true)} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/25">
              Get Recommendations
              <ArrowRight className="h-4 w-4"/>
            </button>
          </div>

          {showResults && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">
                Your <span className="text-primary">Picks</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {recommendations.map((movie, i) => (<MovieCard key={movie.id} movie={movie} index={i}/>))}
              </div>
            </motion.div>)}
        </div>
      </div>
      <Footer />
    </div>);
};
export default Recommend;
