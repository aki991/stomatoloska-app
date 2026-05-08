import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./types";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import GuestInfoStep from "../screens/guest/GuestInfoStep";
import GuestServiceStep from "../screens/guest/GuestServiceStep";
import GuestDateStep from "../screens/guest/GuestDateStep";
import GuestTimeStep from "../screens/guest/GuestTimeStep";
import GuestConfirmStep from "../screens/guest/GuestConfirmStep";
import GuestSuccessStep from "../screens/guest/GuestSuccessStep";

const Stack = createNativeStackNavigator<AuthStackParamList>();

const guestHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: "#FFFFFF" },
  headerTintColor: "#2D7D6E",
  headerTitleStyle: { fontWeight: "700" as const, color: "#111827" },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: "#F9FAFB" },
};

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

      {/* Guest booking flow */}
      <Stack.Screen
        name="GuestInfo"
        component={GuestInfoStep}
        options={{ ...guestHeader, title: "Zakaži kao gost" }}
      />
      <Stack.Screen
        name="GuestService"
        component={GuestServiceStep}
        options={{ ...guestHeader, title: "Izaberite uslugu" }}
      />
      <Stack.Screen
        name="GuestDate"
        component={GuestDateStep}
        options={{ ...guestHeader, title: "Izaberite datum" }}
      />
      <Stack.Screen
        name="GuestTime"
        component={GuestTimeStep}
        options={{ ...guestHeader, title: "Izaberite vreme" }}
      />
      <Stack.Screen
        name="GuestConfirm"
        component={GuestConfirmStep}
        options={{ ...guestHeader, title: "Potvrdi termin" }}
      />
      <Stack.Screen
        name="GuestSuccess"
        component={GuestSuccessStep}
        options={{ ...guestHeader, title: "Termin zakazan" }}
      />
    </Stack.Navigator>
  );
}
