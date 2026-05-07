import React from "react";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../stores/authStore";
import { Appointment } from "../types";
import { format } from "date-fns";
import { sr } from "date-fns/locale";

function useAppointments() {
  const { user } = useAuthStore();
  return useQuery<Appointment[]>({
    queryKey: ["appointments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", user!.id)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

const statusLabel: Record<Appointment["status"], string> = {
  pending: "Na čekanju",
  confirmed: "Potvrđen",
  cancelled: "Otkazan",
  completed: "Završen",
};

const statusColor: Record<Appointment["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-600",
};

export default function AppointmentsScreen() {
  const { data: appointments, isLoading } = useAppointments();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Termini</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Učitavanje...</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-6 pb-6"
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-5xl mb-4">📭</Text>
              <Text className="text-gray-500 text-center">
                Nemate zakazanih termina
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="font-semibold text-gray-900">
                  {format(new Date(item.scheduled_at), "EEEE, d. MMMM yyyy", {
                    locale: sr,
                  })}
                </Text>
                <View className={`px-2 py-1 rounded-full ${statusColor[item.status].split(" ")[0]}`}>
                  <Text className={`text-xs font-medium ${statusColor[item.status].split(" ")[1]}`}>
                    {statusLabel[item.status]}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-500 text-sm">
                {format(new Date(item.scheduled_at), "HH:mm")} •{" "}
                {item.duration_minutes} min
              </Text>
              {item.notes && (
                <Text className="text-gray-400 text-xs mt-2">{item.notes}</Text>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
