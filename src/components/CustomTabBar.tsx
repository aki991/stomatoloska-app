import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";

const TAB_ICONS: Record<string, string> = {
  Home:    "⌂",
  Termini: "📅",
  Profil:  "◉",
};

const TAB_LABELS: Record<string, string> = {
  Home:    "Početna",
  Termini: "Termini",
  Profil:  "Profil",
};

function TabItem({
  name,
  isFocused,
  onPress,
}: {
  name: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const icon = TAB_ICONS[name] ?? "●";
  const label = TAB_LABELS[name] ?? name;

  useEffect(() => {
    if (isFocused) {
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.18,
          useNativeDriver: true,
          speed: 50,
          bounciness: 8,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 6,
        }),
      ]).start();
    }
  }, [isFocused]);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {isFocused && <View style={styles.indicator} />}
      <Animated.View
        style={[
          styles.iconWrap,
          isFocused && styles.iconWrapActive,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.icon, isFocused && styles.iconActive]}>{icon}</Text>
      </Animated.View>
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      <BlurView intensity={75} tint="light" style={styles.blur}>
        <View style={styles.inner}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            function onPress() {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }

            return (
              <TabItem
                key={route.key}
                name={route.name}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  blur: {
    borderTopWidth: 1,
    borderTopColor: "rgba(45,125,110,0.08)",
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    paddingTop: 8,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: 0,
    width: 24,
    height: 3,
    backgroundColor: "#2D7D6E",
    borderRadius: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  iconWrapActive: {
    backgroundColor: "#F5F9F7",
  },
  icon: { fontSize: 20, color: "#9CA3AF" },
  iconActive: { color: "#2D7D6E" },
  tabLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  tabLabelActive: { color: "#2D7D6E", fontWeight: "700" },
});
