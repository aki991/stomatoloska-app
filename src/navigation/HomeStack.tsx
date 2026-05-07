import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeStackParamList } from "./types";
import HomeScreen from "../screens/app/HomeScreen";
import ServicesScreen from "../screens/app/ServicesScreen";
import AppointmentDetailScreen from "../screens/app/AppointmentDetailScreen";
import DateSelectionScreen from "../screens/booking/DateSelectionScreen";
import TimeSelectionScreen from "../screens/booking/TimeSelectionScreen";
import ConfirmationScreen from "../screens/booking/ConfirmationScreen";
import SuccessScreen from "../screens/booking/SuccessScreen";

const Stack = createNativeStackNavigator<HomeStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: "#FFFFFF" },
  headerTintColor: "#2D7D6E",
  headerTitleStyle: { fontWeight: "700" as const, color: "#111827" },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: "#F9FAFB" },
};

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Services"
        component={ServicesScreen}
        options={{ title: "Usluge" }}
      />
      <Stack.Screen
        name="DateSelection"
        component={DateSelectionScreen}
        options={{ title: "Izaberi datum" }}
      />
      <Stack.Screen
        name="TimeSelection"
        component={TimeSelectionScreen}
        options={{ title: "Izaberi vreme" }}
      />
      <Stack.Screen
        name="Confirmation"
        component={ConfirmationScreen}
        options={{ title: "Potvrda" }}
      />
      <Stack.Screen
        name="Success"
        component={SuccessScreen}
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
