import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AdminDashboardStackParamList } from "./types";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminAppointmentDetailScreen from "../screens/admin/AdminAppointmentDetailScreen";
import AdminBookingPatientStep from "../screens/admin/booking/AdminBookingPatientStep";
import AdminBookingServiceStep from "../screens/admin/booking/AdminBookingServiceStep";
import AdminBookingDateStep from "../screens/admin/booking/AdminBookingDateStep";
import AdminBookingTimeStep from "../screens/admin/booking/AdminBookingTimeStep";
import AdminBookingConfirmStep from "../screens/admin/booking/AdminBookingConfirmStep";

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
        name="AdminBookingPatient"
        component={AdminBookingPatientStep}
        options={{ title: "Zakaži — Pacijent" }}
      />
      <Stack.Screen
        name="AdminBookingService"
        component={AdminBookingServiceStep}
        options={{ title: "Zakaži — Usluga" }}
      />
      <Stack.Screen
        name="AdminBookingDate"
        component={AdminBookingDateStep}
        options={{ title: "Zakaži — Datum" }}
      />
      <Stack.Screen
        name="AdminBookingTime"
        component={AdminBookingTimeStep}
        options={{ title: "Zakaži — Vreme" }}
      />
      <Stack.Screen
        name="AdminBookingConfirm"
        component={AdminBookingConfirmStep}
        options={{ title: "Potvrdi termin" }}
      />
    </Stack.Navigator>
  );
}
