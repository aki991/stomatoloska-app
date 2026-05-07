import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AppTabParamList } from "./types";
import HomeScreen from "../screens/HomeScreen";
import AppointmentsScreen from "../screens/AppointmentsScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          paddingBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: "Početna" }}
      />
      <Tab.Screen
        name="Termini"
        component={AppointmentsScreen}
        options={{ tabBarLabel: "Termini" }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profil" }}
      />
    </Tab.Navigator>
  );
}
