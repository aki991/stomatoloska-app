import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../stores/authStore";
import { Profile } from "../types";
import { format } from "date-fns";

function useProfile() {
  const { user } = useAuthStore();
  return useQuery<Profile>({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

function ProfileRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View className="flex-row justify-between py-3 border-b border-gray-100">
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text className="text-gray-900 text-sm font-medium">
        {value ?? "—"}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { signOut, user } = useAuthStore();
  const { data: profile, isLoading } = useProfile();

  const handleSignOut = () => {
    Alert.alert("Odjava", "Da li ste sigurni da se želite odjaviti?", [
      { text: "Otkaži", style: "cancel" },
      { text: "Odjavi se", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Profil</Text>

        <View className="bg-white rounded-2xl p-6 mb-4 items-center border border-gray-100 shadow-sm">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-3">
            <Text className="text-white text-3xl font-bold">
              {profile?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">
            {profile?.full_name ?? "Korisnik"}
          </Text>
          <Text className="text-gray-500 text-sm">{user?.email}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#2563EB" className="mt-8" />
        ) : (
          <View className="bg-white rounded-2xl px-4 mb-6 border border-gray-100 shadow-sm">
            <ProfileRow label="Ime i prezime" value={profile?.full_name ?? null} />
            <ProfileRow label="Email" value={profile?.email ?? user?.email ?? null} />
            <ProfileRow label="Telefon" value={profile?.phone ?? null} />
            <ProfileRow
              label="Datum rođenja"
              value={
                profile?.date_of_birth
                  ? format(new Date(profile.date_of_birth), "d. M. yyyy.")
                  : null
              }
            />
            <ProfileRow
              label="Član od"
              value={
                profile?.created_at
                  ? format(new Date(profile.created_at), "d. M. yyyy.")
                  : null
              }
            />
          </View>
        )}

        <TouchableOpacity
          className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center"
          onPress={handleSignOut}
        >
          <Text className="text-red-600 font-semibold">Odjavi se</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
