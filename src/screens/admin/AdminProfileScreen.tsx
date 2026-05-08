import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useAuthStore } from "../../stores/authStore";
import { confirmAlert } from "../../utils/alert";

const REMEMBERED_EMAIL_KEY = "stomapp:remembered_email";

export default function AdminProfileScreen() {
  const { signOut, user, profile } = useAuthStore();
  const insets = useSafeAreaInsets();

  const handleSignOut = () => {
    confirmAlert(
      "Odjava",
      "Da li ste sigurni da se želite odjaviti?",
      async () => {
        if (user?.email) {
          await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, user.email);
        }
        signOut();
      },
      "Odjavi se"
    );
  };

  const fullName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.first_name ?? "Administrator";

  const initial =
    (profile?.first_name?.[0] ?? user?.email?.[0] ?? "A").toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Profil</Text>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>

        {/* Avatar + basic info */}
        <View style={styles.avatarCard}>
          <LinearGradient
            colors={["#2D7D6E", "#4A9B8E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarLetter}>{initial}</Text>
          </LinearGradient>
          <Text style={styles.displayName}>Dr {fullName}</Text>
          <Text style={styles.roleText}>Administrator ordinacije</Text>
          <Text
            style={styles.displayEmail}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user?.email}
          </Text>
        </View>

        {/* Profile details (read-only) */}
        <View style={styles.card}>
          <ProfileRow label="Ime" value={profile?.first_name ?? null} />
          <Sep />
          <ProfileRow label="Prezime" value={profile?.last_name ?? null} />
          <Sep />
          <ProfileRow label="Telefon" value={profile?.phone ?? null} />
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

        <Text style={styles.note}>
          Administratorski podaci se ne menjaju kroz aplikaciju. Za izmene
          kontaktirajte tehničku podršku.
        </Text>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
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
      <Text
        style={styles.profileRowValue}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {value ?? "—"}
      </Text>
    </View>
  );
}

function Sep() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pageTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2D7D6E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

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
  displayName: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 2 },
  roleText: {
    fontSize: 13,
    color: "#2D7D6E",
    fontWeight: "600",
    marginBottom: 6,
  },
  displayEmail: {
    fontSize: 13,
    color: "#6B7280",
    maxWidth: "100%",
    paddingHorizontal: 8,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
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
  profileRowValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    maxWidth: "65%",
    textAlign: "right",
    flexShrink: 1,
  },
  sep: { height: 1, backgroundColor: "#F9FAFB" },

  note: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 30,
  },
  signOutText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
});
