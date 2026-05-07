import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export function AdminPlaceholder({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.center}>
        <View style={styles.iconBubble}>
          <Ionicons name="construct-outline" size={32} color="#2D7D6E" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Stiže u {phase}</Text>
      </View>
    </SafeAreaView>
  );
}

export function AdminServicesPlaceholder() {
  return <AdminPlaceholder title="Usluge" phase="Fazi 3" />;
}
export function AdminBookingPlaceholder() {
  return <AdminPlaceholder title="Zakazivanje za pacijenta" phase="Fazi 4" />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#F5F9F7",
    borderWidth: 1,
    borderColor: "#C8E6DF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: { fontSize: 14, color: "#6B7280", textAlign: "center" },
});
