import React from "react";
import { View, StyleSheet, Platform, useWindowDimensions } from "react-native";

const MAX_WIDTH = 480;
const BACKDROP = "#E5E7EB";

interface Props {
  children: React.ReactNode;
}

/**
 * On web (desktop browsers): renders children inside a 480px-wide centered card
 * with a gray backdrop, so the mobile UI looks like a phone in the middle of
 * the page. On narrow viewports (≤ 480px) and on native, it's a transparent
 * passthrough that takes the full screen.
 */
export function WebContainer({ children }: Props) {
  const { width } = useWindowDimensions();

  if (Platform.OS !== "web" || width <= MAX_WIDTH) {
    return <View style={styles.flex}>{children}</View>;
  }

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: BACKDROP,
    alignItems: "center",
    justifyContent: "center",
    // @ts-ignore — RN web supports overflow: 'auto'
    overflow: Platform.OS === "web" ? ("auto" as any) : "hidden",
  },
  card: {
    width: MAX_WIDTH,
    height: "100%",
    maxHeight: "100%",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    // Web-only "phone-on-desktop" shadow. RN ignores boxShadow but it's a no-op
    // on native because Platform.OS check above gates this branch.
    ...(Platform.select({
      web: {
        // @ts-ignore — `boxShadow` is web-only, accepted by RN web
        boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)",
      },
      default: {},
    }) as object),
  },
});
