import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../stores/authStore";

export default function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-2xl font-bold text-gray-900 mb-1">
          Dobro jutro 👋
        </Text>
        <Text className="text-gray-500 mb-8">
          {user?.email ?? "Pacijent"}
        </Text>

        <View className="bg-primary rounded-2xl p-6 mb-6">
          <Text className="text-white text-lg font-semibold mb-1">
            Naredni termin
          </Text>
          <Text className="text-blue-100 text-sm">
            Nemate zakazanih termina
          </Text>
        </View>

        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Brze akcije
        </Text>
        <View className="flex-row gap-4">
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-2xl mb-2">📅</Text>
            <Text className="font-semibold text-gray-900">Zakaži termin</Text>
            <Text className="text-xs text-gray-500 mt-1">
              Novi pregled ili kontrola
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-2xl mb-2">📋</Text>
            <Text className="font-semibold text-gray-900">Istorija</Text>
            <Text className="text-xs text-gray-500 mt-1">
              Prethodni pregledi
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
