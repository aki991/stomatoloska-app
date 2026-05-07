import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AdminDashboardStackParamList } from "./types";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminAppointmentDetailScreen from "../screens/admin/AdminAppointmentDetailScreen";
import { AdminBookingPlaceholder } from "../screens/admin/AdminPlaceholderScreen";

const Stack = createNativeStackNavigator<AdminDashboardStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: "#FFFFFF" },
  headerTintColor: "#2D7D6E",
  headerTitleStyle: { fontWeight: "700" as const, color: "#111827" },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: "#F9FAFB" },
};

export default function AdminDashboardStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen
        name="DashboardMain"
        component={AdminDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminAppointmentDetail"
        component={AdminAppointmentDetailScreen}
        options={{ title: "Detalji termina" }}
      />
      <Stack.Screen
        name="AdminBooking"
        component={AdminBookingPlaceholder}
        options={{ title: "Zakaži termin" }}
      />
    </Stack.Navigator>
  );
}
