import { useAuth } from "@/contexts/AuthContext";
import { interactionAPI } from "@/lib/api";

/**
 * Hook for tracking user interactions.
 * Returns a `track` function that fires asynchronously and never
 * blocks the UI. Silently skips tracking for unauthenticated users.
 */
export const useTracker = () => {
  const { user } = useAuth();

  const track = (action, targetType, targetId, metadata = {}) => {
    if (!user) return;
    interactionAPI
      .track({ action, targetType, targetId: String(targetId), metadata })
      .catch(() => {});
  };

  return { track };
};
