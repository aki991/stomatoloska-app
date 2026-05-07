import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🦷</Text>
          </View>
          <Text style={styles.appName}>StomApp</Text>
          <Text style={styles.version}>Verzija {APP_VERSION}</Text>
        </View>

        {/* Clinic info */}
        <Text style={styles.sectionLabel}>Ordinacija</Text>
        <View style={styles.card}>
          <InfoRow label="Naziv" value="Stomatološka ordinacija Dr. Milić" />
          <Sep />
          <InfoRow label="Adresa" value="Bulevar oslobođenja 123, Beograd" />
          <Sep />
          <InfoRow label="Telefon" value="+381 11 000 0000" />
          <Sep />
          <InfoRow
            label="Radno vreme"
            value={"Pon – Pet:  08:00 – 20:00\nSubota:  09:00 – 14:00"}
          />
        </View>

        {/* Contact link */}
        <Text style={styles.sectionLabel}>Kontakt</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL("mailto:kontakt@stomaordinacija.rs")}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>✉️  Pošaljite nam email</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <Sep />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL("tel:+381110000000")}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>📞  Pozovite nas</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          © {new Date().getFullYear()} StomApp. Sva prava zadržana.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Sep() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { padding: 20, paddingBottom: 40 },

  logoSection: { alignItems: "center", marginBottom: 28, marginTop: 4 },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "#F5F9F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#C8E6DF",
  },
  logoEmoji: { fontSize: 38 },
  appName: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 4 },
  version: { fontSize: 13, color: "#9CA3AF" },

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
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: { paddingVertical: 14, gap: 4 },
  infoLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: { fontSize: 14, color: "#374151", lineHeight: 22 },
  sep: { height: 1, backgroundColor: "#F9FAFB" },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  linkText: { fontSize: 15, color: "#2D7D6E", fontWeight: "600" },
  chevron: { fontSize: 20, color: "#9CA3AF" },

  footer: { textAlign: "center", color: "#9CA3AF", fontSize: 12, marginTop: 8 },
});
