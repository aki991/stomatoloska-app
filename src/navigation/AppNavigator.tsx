import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { AppTabParamList } from "./types";
import HomeStack from "./HomeStack";
import TerminiStack from "./TerminiStack";
import ProfileStack from "./ProfileStack";
import { CustomTabBar } from "../components/CustomTabBar";

const Tab = createMaterialTopTabNavigator<AppTabParamList>();

export default function AppNavigator() {
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
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Termini" component={TerminiStack} />
      <Tab.Screen name="Profil" component={ProfileStack} />
    </Tab.Navigator>
  );
}
