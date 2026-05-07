import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import { registerPushToken } from "../services/notificationService";
import { Profile, UserRole } from "../types";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  role: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    set({ isLoading: true });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user ?? null;
    const profile = user ? await fetchProfile(user.id) : null;

    set({
      session,
      user,
      profile,
      role: profile?.role ?? null,
      isLoading: false,
      isInitialized: true,
    });

    supabase.auth.onAuthStateChange((event, newSession) => {
      const newUser = newSession?.user ?? null;
      // Apply session/user synchronously; defer profile fetch to avoid the
      // documented deadlock when awaiting inside onAuthStateChange.
      set({ session: newSession, user: newUser });
      if (!newUser) {
        set({ profile: null, role: null });
        return;
      }
      setTimeout(async () => {
        const newProfile = await fetchProfile(newUser.id);
        set({ profile: newProfile, role: newProfile?.role ?? null });
      }, 0);
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        registerPushToken(newUser.id).catch(() => {});
      }
    });
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      profile: null,
      role: null,
      isLoading: false,
    });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const profile = await fetchProfile(user.id);
    set({ profile, role: profile?.role ?? null });
  },
}));
