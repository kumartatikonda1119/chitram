import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";
import ScrollToTopButton from "./components/ScrollToTopButton";
import axios from "axios";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Explore from "./pages/Explore";
import SearchPage from "./pages/Search";
import MovieDetail from "./pages/MovieDetail";
import ActorDetail from "./pages/ActorDetail";
import Recommend from "./pages/Recommend";
import Profile from "./pages/Profile";
import ListDetail from "./pages/ListDetail";
import SeriesDetail from "./pages/SeriesDetail";
import SeasonDetail from "./pages/SeasonDetail";
import EpisodeDetail from "./pages/EpisodeDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ScrollRestorer = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.hash]);
  return null;
};

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <ScrollRestorer />
      <ScrollToTopButton />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/person/:id" element={<ActorDetail />} />
        <Route path="/recommend" element={<Recommend />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/list/:id" element={<ListDetail />} />
        <Route path="/series/:id" element={<SeriesDetail />} />
        <Route
          path="/series/:seriesId/season/:seasonNo"
          element={<SeasonDetail />}
        />
        <Route
          path="/series/:seriesId/season/:seasonNo/episode/:episodeNo"
          element={<EpisodeDetail />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
};

const App = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const hasGoogleClientId = Boolean(googleClientId);
  useEffect(() => {
    if (!hasGoogleClientId) {
      console.warn(
        "Google OAuth is disabled: VITE_GOOGLE_CLIENT_ID is missing in current Vite mode.",
      );
    }

    const wakeBackend = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        if (apiBaseUrl && !apiBaseUrl.includes("localhost")) {
          const baseUrl = apiBaseUrl.replace("/api", "");
          await axios.get(`${baseUrl}/health`, { timeout: 10000 });
          console.log("Backend wakened successfully");
        }
      } catch (error) {
        console.log("Backend wake attempt:", error.message);
      }
    };
    wakeBackend();
  }, []);

  const appContent = (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );

  if (!hasGoogleClientId) {
    return appContent;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {appContent}
    </GoogleOAuthProvider>
  );
};

export default App;
