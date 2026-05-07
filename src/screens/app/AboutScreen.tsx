import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

const PHONE_DISPLAY = "+381 65 262 3054";
const PHONE_DIAL = "+381652623054";
const ADDRESS = "Miloša Velikog bb, Velika Plana";
const HOURS = "Ponedeljak – Petak: 09:00 – 15:00h";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* Logo card */}
        <View style={styles.logoCard}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>VenusApp</Text>
          <Text style={styles.tagline}>stomatološka ordinacija</Text>
        </View>

        {/* Info list */}
        <View style={styles.card}>
          <InfoRow
            icon="location-outline"
            label="Adresa"
            value={ADDRESS}
          />
          <Sep />
          <InfoRow
            icon="call-outline"
            label="Telefon"
            value={PHONE_DISPLAY}
            onPress={() => Linking.openURL(`tel:${PHONE_DIAL}`)}
          />
          <Sep />
          <InfoRow
            icon="time-outline"
            label="Radno vreme"
            value={HOURS}
          />
        </View>

        <Text style={styles.version}>Verzija aplikacije {APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const Wrapper: React.ComponentType<any> = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={styles.infoRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.iconBubble}>
        <Ionicons name={icon} size={20} color="#2D7D6E" />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, onPress && styles.infoValueLink]}>
          {value}
        </Text>
      </View>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </Wrapper>
  );
}

function Sep() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { padding: 20 },

  logoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  logo: { width: 100, height: 100, alignSelf: "center", marginBottom: 14 },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 14,
    color: "#6B7280",
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

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F5F9F7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C8E6DF",
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "500",
    lineHeight: 21,
  },
  infoValueLink: { color: "#2D7D6E" },
  chevron: { fontSize: 22, color: "#9CA3AF", marginLeft: 4 },
  sep: { height: 1, backgroundColor: "#F3F4F6" },

  version: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 8,
  },
});
