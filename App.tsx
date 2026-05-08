import "./global.css";
import React from "react";
import { LocaleConfig } from "react-native-calendars";

LocaleConfig.locales["sr"] = {
  monthNames: [
    "Januar", "Februar", "Mart", "April", "Maj", "Jun",
    "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
  ],
  monthNamesShort: [
    "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
    "Jul", "Avg", "Sep", "Okt", "Nov", "Dec",
  ],
  dayNames: [
    "Nedelja", "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota",
  ],
  dayNamesShort: ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"],
  today: "Danas",
};
LocaleConfig.defaultLocale = "sr";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { queryClient } from "./src/services/queryClient";
import RootNavigator from "./src/navigation/RootNavigator";
import { WebContainer } from "./src/components/WebContainer";
import { ConfirmModalHost } from "./src/components/ConfirmModal";

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <WebContainer>
          <RootNavigator />
        </WebContainer>
        <ConfirmModalHost />
        <Toast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
