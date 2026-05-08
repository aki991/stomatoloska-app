import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../services/supabase";
import { Service } from "../../../types";
import { AdminDashboardStackParamList } from "../../../navigation/types";
import { Skeleton } from "../../../components/Skeleton";
import { BookingProgressBar } from "../../../components/BookingProgressBar";
import { useBookingExitButton } from "./useBookingExitButton";

type Props = NativeStackScreenProps<AdminDashboardStackParamList, "AdminBookingService">;

const PRIMARY = "#2D7D6E";

function formatPrice(p: number) {
  return `${p.toLocaleString("sr-RS")} RSD`;
}

function groupByCategory(services: Service[]): [string, Service[]][] {
  const map = new Map<string, Service[]>();
  for (const s of services) {
    const key = s.category ?? "Ostale usluge";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries());
}

export default function AdminBookingServiceStep({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  useBookingExitButton(navigation);
  const { patientId, patientName, walkInPhone } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const { data: services, isLoading, refetch } = useQuery<Service[]>({
    queryKey: ["admin", "booking-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) {
        // Fallback if display_order column not yet migrated
        const fb = await supabase.from("services").select("*").order("name", { ascending: true });
        if (fb.error) throw fb.error;
        return (fb.data ?? []) as Service[];
      }
      return (data ?? []) as Service[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const sections = groupByCategory(services ?? []);

  function selectService(s: Service) {
    navigation.navigate("AdminBookingDate", {
      patientId,
      patientName,
      walkInPhone,
      serviceId: s.id,
      serviceName: s.name,
      durationMinutes: s.duration_minutes,
      price: s.price,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <BookingProgressBar step={2} />

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} style={styles.skeletonItem} />
          ))}
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={([cat]) => cat}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await refetch();
                setRefreshing(false);
              }}
              tintColor={PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>Nema usluga</Text>
            </View>
          }
          renderItem={({ item: [category, items] }) => (
            <View style={styles.section}>
              <Text style={styles.categoryLabel}>{category}</Text>
              {items.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.card, !s.is_active && styles.cardInactive]}
                  onPress={() => selectService(s)}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.nameWrap}>
                      <Text style={styles.serviceName} numberOfLines={2}>
                        {s.name}
                      </Text>
                      {!s.is_active && (
                        <View style={styles.inactivePill}>
                          <Text style={styles.inactivePillText}>Neaktivna</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.servicePrice}>{formatPrice(s.price)}</Text>
                  </View>
                  {s.description ? (
                    <Text style={styles.serviceDesc} numberOfLines={2}>
                      {s.description}
                    </Text>
                  ) : null}
                  <View style={styles.cardFooter}>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>⏱ {s.duration_minutes} min</Text>
                    </View>
                    <Text style={styles.selectLabel}>Izaberi →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },

  skeletonWrap: { padding: 16, gap: 12 },
  skeletonItem: { height: 100, borderRadius: 18 },

  section: { marginBottom: 24 },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: PRIMARY,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInactive: { opacity: 0.6 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  nameWrap: { flex: 1, gap: 4 },
  serviceName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  servicePrice: { fontSize: 14, fontWeight: "700", color: PRIMARY, flexShrink: 0 },
  serviceDesc: { fontSize: 12, color: "#6B7280", lineHeight: 17, marginBottom: 10 },
  inactivePill: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  inactivePillText: { fontSize: 10, fontWeight: "700", color: "#92400E" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  durationBadge: {
    backgroundColor: "#F5F9F7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C8E6DF",
  },
  durationText: { fontSize: 11, color: PRIMARY, fontWeight: "600" },
  selectLabel: { marginLeft: "auto", color: PRIMARY, fontWeight: "700", fontSize: 13 },
});
