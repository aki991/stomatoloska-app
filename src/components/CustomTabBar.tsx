import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  // Patient tabs
  Home:      { active: "home",     inactive: "home-outline" },
  Termini:   { active: "calendar", inactive: "calendar-outline" },
  Profil:    { active: "person",   inactive: "person-outline" },
  // Admin tabs
  Dashboard: { active: "home",     inactive: "home-outline" },
  Kalendar:  { active: "calendar", inactive: "calendar-outline" },
  Usluge:    { active: "medkit",   inactive: "medkit-outline" },
};

const TAB_LABELS: Record<string, string> = {
  Home:      "Početna",
  Termini:   "Termini",
  Profil:    "Profil",
  Dashboard: "Početna",
  Kalendar:  "Kalendar",
  Usluge:    "Usluge",
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
  const icons = TAB_ICONS[name] ?? { active: "ellipse", inactive: "ellipse-outline" };
  const iconName = isFocused ? icons.active : icons.inactive;
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
        <Ionicons
          name={iconName}
          size={26}
          color={isFocused ? "#2D7D6E" : "#9CA3AF"}
        />
      </Animated.View>
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function CustomTabBar({ state, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <View style={[styles.inner, { paddingBottom: insets.bottom }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          function onPress() {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.jumpTo(route.name as never);
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 12,
  },
  inner: {
    flexDirection: "row",
    paddingTop: 8,
    backgroundColor: "#FFFFFF",
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
  tabLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "500" },
  tabLabelActive: { color: "#2D7D6E", fontWeight: "700" },
});
