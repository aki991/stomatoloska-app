import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AdminServicesStackParamList } from "./types";
import {
  AdminServicesPlaceholder,
  AdminPlaceholder,
} from "../screens/admin/AdminPlaceholderScreen";

const Stack = createNativeStackNavigator<AdminServicesStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: "#FFFFFF" },
  headerTintColor: "#2D7D6E",
  headerTitleStyle: { fontWeight: "700" as const, color: "#111827" },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: "#F9FAFB" },
};

function EditServicePlaceholder() {
  return <AdminPlaceholder title="Uređivanje usluge" phase="Fazi 3" />;
}

export default function AdminServicesStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen
        name="ServicesMain"
        component={AdminServicesPlaceholder}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditService"
        component={EditServicePlaceholder}
        options={{ title: "Usluga" }}
      />
    </Stack.Navigator>
  );
}
