import React from "react";
import { View, Text, StyleSheet } from "react-native";

const PRIMARY = "#2D7D6E";
const TOTAL = 5;

export function BookingProgressBar({ step }: { step: number }) {
  return (
    <View style={styles.container}>
      <View style={styles.bars}>
        {Array.from({ length: TOTAL }, (_, i) => (
          <View key={i} style={[styles.bar, i < step ? styles.barActive : styles.barInactive]} />
        ))}
      </View>
      <Text style={styles.label}>{step} / {TOTAL}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  bars: { flex: 1, flexDirection: "row", gap: 4 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  barActive: { backgroundColor: PRIMARY },
  barInactive: { backgroundColor: "#E5E7EB" },
  label: { fontSize: 12, fontWeight: "600", color: "#6B7280", minWidth: 32, textAlign: "right" },
});
