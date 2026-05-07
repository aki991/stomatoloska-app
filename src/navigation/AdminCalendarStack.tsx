import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AdminCalendarStackParamList } from "./types";
import AdminCalendarScreen from "../screens/admin/AdminCalendarScreen";
import AdminAppointmentDetailScreen from "../screens/admin/AdminAppointmentDetailScreen";

const Stack = createNativeStackNavigator<AdminCalendarStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: "#FFFFFF" },
  headerTintColor: "#2D7D6E",
  headerTitleStyle: { fontWeight: "700" as const, color: "#111827" },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: "#F9FAFB" },
};

export default function AdminCalendarStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen
        name="CalendarMain"
        component={AdminCalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminAppointmentDetail"
        component={AdminAppointmentDetailScreen}
        options={{ title: "Detalji termina" }}
      />
    </Stack.Navigator>
  );
}
