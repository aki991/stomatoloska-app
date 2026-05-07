import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../stores/authStore";
import { ProfileStackParamList } from "../navigation/types";
import { Profile } from "../types";

const REMEMBERED_EMAIL_KEY = "stomapp:remembered_email";

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList, "ProfilMain">;

function useProfile() {
  const { user } = useAuthStore();
  return useQuery<Profile>({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const { signOut, user } = useAuthStore();
  const { data: profile, isLoading } = useProfile();

  const handleSignOut = () => {
    Alert.alert("Odjava", "Da li ste sigurni da se želite odjaviti?", [
      { text: "Otkaži", style: "cancel" },
      {
        text: "Odjavi se",
        style: "destructive",
        onPress: async () => {
          if (user?.email) {
            await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, user.email);
          }
          signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Profil</Text>

        {/* Avatar + basic info */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {profile?.first_name?.[0]?.toUpperCase() ??
                user?.email?.[0]?.toUpperCase() ??
                "?"}
            </Text>
          </View>
          <Text style={styles.displayName}>
            {profile?.first_name && profile?.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile?.first_name ?? "Korisnik"}
          </Text>
          <Text style={styles.displayEmail}>{user?.email}</Text>
        </View>

        {/* Profile details */}
        {isLoading ? (
          <ActivityIndicator color="#2D7D6E" style={{ marginBottom: 16 }} />
        ) : (
          <View style={styles.card}>
            <ProfileRow label="Ime" value={profile?.first_name ?? null} />
            <Sep />
            <ProfileRow label="Prezime" value={profile?.last_name ?? null} />
            <Sep />
            <ProfileRow label="Email" value={profile?.email ?? user?.email ?? null} />
            <Sep />
            <ProfileRow label="Telefon" value={profile?.phone ?? null} />
            <Sep />
            <ProfileRow
              label="Datum rođenja"
              value={
                profile?.date_of_birth
                  ? format(new Date(profile.date_of_birth), "d. M. yyyy.")
                  : null
              }
            />
            <Sep />
            <ProfileRow
              label="Član od"
              value={
                profile?.created_at
                  ? format(new Date(profile.created_at), "d. M. yyyy.")
                  : null
              }
            />
          </View>
        )}

        {/* Account actions */}
        <Text style={styles.sectionLabel}>Nalog</Text>
        <View style={styles.card}>
          <MenuRow
            label="Uredi profil"
            icon="✏️"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <Sep />
          <MenuRow
            label="Promeni lozinku"
            icon="🔒"
            onPress={() => navigation.navigate("ChangePassword")}
          />
        </View>

        {/* App info */}
        <Text style={styles.sectionLabel}>Aplikacija</Text>
        <View style={styles.card}>
          <MenuRow
            label="O aplikaciji"
            icon="ℹ️"
            onPress={() => navigation.navigate("About")}
          />
          <Sep />
          <MenuRow
            label="Privatnost i uslovi"
            icon="📄"
            onPress={() => navigation.navigate("PrivacyPolicy")}
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Odjavi se</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileRowLabel}>{label}</Text>
      <Text style={styles.profileRowValue}>{value ?? "—"}</Text>
    </View>
  );
}

function MenuRow({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

function Sep() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  pageTitle: { fontSize: 26, fontWeight: "800", color: "#111827", marginBottom: 20 },

  avatarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 4,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: "#2D7D6E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#1F5A4F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarLetter: { color: "#FFFFFF", fontSize: 32, fontWeight: "700" },
  displayName: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 4 },
  displayEmail: { fontSize: 13, color: "#6B7280" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
  },
  profileRowLabel: { fontSize: 14, color: "#6B7280" },
  profileRowValue: { fontSize: 14, color: "#111827", fontWeight: "500", maxWidth: "60%" },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    gap: 12,
  },
  menuIcon: { fontSize: 18, width: 26, textAlign: "center" },
  menuLabel: { flex: 1, fontSize: 15, color: "#111827", fontWeight: "500" },
  menuChevron: { fontSize: 20, color: "#9CA3AF" },

  sep: { height: 1, backgroundColor: "#F9FAFB" },

  signOutBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  signOutText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
});
