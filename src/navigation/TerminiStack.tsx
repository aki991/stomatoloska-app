import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TerminiStackParamList } from "./types";
import AppointmentsScreen from "../screens/app/AppointmentsScreen";
import AppointmentDetailScreen from "../screens/app/AppointmentDetailScreen";

const Stack = createNativeStackNavigator<TerminiStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: "#FFFFFF" },
  headerTintColor: "#2D7D6E",
  headerTitleStyle: { fontWeight: "700" as const, color: "#111827" },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: "#F9FAFB" },
};

export default function TerminiStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen
        name="AppointmentsList"
        component={AppointmentsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{ title: "Detalji termina" }}
      />
    </Stack.Navigator>
  );
}
