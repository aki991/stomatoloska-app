import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../../services/supabase";
import { AdminDashboardStackParamList } from "../../../navigation/types";
import { PremiumInput } from "../../../components/PremiumInput";
import { GradientButton } from "../../../components/GradientButton";
import { BookingProgressBar } from "../../../components/BookingProgressBar";
import { useBookingExitButton } from "./useBookingExitButton";

type Props = NativeStackScreenProps<AdminDashboardStackParamList, "AdminBookingPatient">;
type TabKey = "existing" | "walkin";

interface PatientRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

const walkInSchema = z.object({
  first_name: z.string().min(2, "Minimum 2 karaktera"),
  last_name: z.string().min(2, "Minimum 2 karaktera"),
  phone: z.string().min(6, "Unesite ispravan broj"),
});
type WalkInForm = z.infer<typeof walkInSchema>;

const PRIMARY = "#2D7D6E";

function patientDisplayName(p: PatientRow): string {
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || "Pacijent";
}

function patientInitials(p: PatientRow): string {
  return (
    (p.first_name?.[0] ?? "").toUpperCase() +
    (p.last_name?.[0] ?? "").toUpperCase()
  );
}

export default function AdminBookingPatientStep({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  useBookingExitButton(navigation);
  const [tab, setTab] = useState<TabKey>("existing");
  const [search, setSearch] = useState("");

  const { data: patients, isLoading } = useQuery<PatientRow[]>({
    queryKey: ["admin", "patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone")
        .eq("role", "patient")
        .order("last_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PatientRow[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const filtered = useMemo(() => {
    if (!patients) return [];
    const q = search.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter((p) => {
      const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
      const phone = (p.phone ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [patients, search]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WalkInForm>({
    resolver: zodResolver(walkInSchema) as Resolver<WalkInForm>,
    defaultValues: { first_name: "", last_name: "", phone: "" },
  });

  function selectPatient(p: PatientRow) {
    navigation.navigate("AdminBookingService", {
      patientId: p.id,
      patientName: patientDisplayName(p),
    });
  }

  function submitWalkIn(data: WalkInForm) {
    navigation.navigate("AdminBookingService", {
      patientId: null,
      patientName: `${data.first_name} ${data.last_name}`,
      walkInPhone: data.phone,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <BookingProgressBar step={1} />

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["existing", "walkin"] as TabKey[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "existing" ? "Postojeći pacijent" : "Bez naloga (telefonski)"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "existing" ? (
        <View style={styles.flex}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ime, prezime ili telefon..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={PRIMARY} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ paddingVertical: 8, paddingBottom: insets.bottom + 20 }}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Text style={styles.emptyText}>
                    {search ? "Nema rezultata" : "Nema registrovanih pacijenata"}
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.patientRow}
                  onPress={() => selectPatient(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>{patientInitials(item)}</Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patientDisplayName(item)}</Text>
                    <Text style={styles.patientPhone}>{item.phone ?? "Nema broja"}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.walkInScroll,
              { paddingBottom: insets.bottom + 100 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Controller
                control={control}
                name="first_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PremiumInput
                    label="Ime *"
                    placeholder="npr. Marko"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.first_name?.message}
                    returnKeyType="next"
                    autoCapitalize="words"
                  />
                )}
              />
              <Controller
                control={control}
                name="last_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PremiumInput
                    label="Prezime *"
                    placeholder="npr. Petrović"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.last_name?.message}
                    returnKeyType="next"
                    autoCapitalize="words"
                  />
                )}
              />
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PremiumInput
                    label="Telefon *"
                    placeholder="npr. 0641234567"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.phone?.message}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                  />
                )}
              />
            </View>

            <GradientButton label="Dalje" onPress={handleSubmit(submitWalkIn)} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  flex: { flex: 1 },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: PRIMARY },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  tabTextActive: { color: PRIMARY },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    gap: 8,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A1A1A",
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: { fontSize: 14, color: "#9CA3AF" },

  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    gap: 12,
  },
  patientAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF9F7",
    borderWidth: 1,
    borderColor: "#C8E6DF",
    alignItems: "center",
    justifyContent: "center",
  },
  patientAvatarText: { fontSize: 14, fontWeight: "700", color: PRIMARY },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  patientPhone: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  walkInScroll: { padding: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
});
