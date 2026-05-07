import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "./types";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/app/EditProfileScreen";
import ChangePasswordScreen from "../screens/app/ChangePasswordScreen";
import AboutScreen from "../screens/app/AboutScreen";
import PrivacyPolicyScreen from "../screens/app/PrivacyPolicyScreen";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: "#FFFFFF" },
  headerTintColor: "#2D7D6E",
  headerTitleStyle: { fontWeight: "700" as const, color: "#111827" },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: "#F9FAFB" },
};

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen
        name="ProfilMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: "Uredi profil" }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "Promena lozinke" }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: "O aplikaciji" }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: "Privatnost i uslovi" }}
      />
    </Stack.Navigator>
  );
}
