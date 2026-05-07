import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import { registerPushToken } from "../services/notificationService";

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    set({ isLoading: true });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    set({ session, user: session?.user ?? null, isLoading: false, isInitialized: true });

    supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user ?? null });
      // Register push token on first login and on session restore
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        registerPushToken(session.user.id).catch(() => {});
      }
    });
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ session: null, user: null, isLoading: false });
  },
}));
