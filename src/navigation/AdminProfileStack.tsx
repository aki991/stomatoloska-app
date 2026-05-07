import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AdminProfileStackParamList } from "./types";
import AdminProfileScreen from "../screens/admin/AdminProfileScreen";

const Stack = createNativeStackNavigator<AdminProfileStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: "#FFFFFF" },
  headerTintColor: "#2D7D6E",
  headerTitleStyle: { fontWeight: "700" as const, color: "#111827" },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: "#F9FAFB" },
};

export default function AdminProfileStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen
        name="ProfilMain"
        component={AdminProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
