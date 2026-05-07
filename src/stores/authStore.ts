import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";

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

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ session: null, user: null, isLoading: false });
  },
}));
