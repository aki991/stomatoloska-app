import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AdminServicesStackParamList } from "./types";
import AdminServicesScreen from "../screens/admin/AdminServicesScreen";
import EditServiceScreen from "../screens/admin/EditServiceScreen";

const Stack = createNativeStackNavigator<AdminServicesStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: "#FFFFFF" },
  headerTintColor: "#2D7D6E",
  headerTitleStyle: { fontWeight: "700" as const, color: "#111827" },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: "#F9FAFB" },
};

export default function AdminServicesStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen
        name="ServicesMain"
        component={AdminServicesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditService"
        component={EditServiceScreen}
        options={{ title: "Usluga" }}
      />
    </Stack.Navigator>
  );
}
