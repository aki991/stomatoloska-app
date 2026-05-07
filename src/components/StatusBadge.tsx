import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Status = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

const CONFIG: Record<Status, { label: string; icon: string; bg: string; text: string }> = {
  confirmed: { label: "Potvrđen", icon: "✓", bg: "#D1FAE5", text: "#065F46" },
  pending:   { label: "Na čekanju", icon: "◷", bg: "#FEF3C7", text: "#92400E" },
  cancelled: { label: "Otkazan", icon: "✕", bg: "#FEE2E2", text: "#991B1B" },
  completed: { label: "Završen", icon: "●", bg: "#E5E7EB", text: "#374151" },
  no_show:   { label: "Nije došao", icon: "!", bg: "#FEF3C7", text: "#92400E" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = CONFIG[status as Status] ?? { label: status, icon: "●", bg: "#E5E7EB", text: "#374151" };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.icon, { color: cfg.text }]}>{cfg.icon}</Text>
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  icon: { fontSize: 11, fontWeight: "700" },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
});
