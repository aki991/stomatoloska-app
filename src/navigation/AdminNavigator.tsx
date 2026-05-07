import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { AdminTabParamList } from "./types";
import AdminDashboardStack from "./AdminDashboardStack";
import AdminCalendarStack from "./AdminCalendarStack";
import AdminServicesStack from "./AdminServicesStack";
import AdminProfileStack from "./AdminProfileStack";
import { CustomTabBar } from "../components/CustomTabBar";

const Tab = createMaterialTopTabNavigator<AdminTabParamList>();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: true,
      }}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardStack} />
      <Tab.Screen name="Kalendar" component={AdminCalendarStack} />
      <Tab.Screen name="Usluge" component={AdminServicesStack} />
      <Tab.Screen name="Profil" component={AdminProfileStack} />
    </Tab.Navigator>
  );
}
