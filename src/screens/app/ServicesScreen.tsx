import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../services/supabase";
import { Service } from "../../types";
import { HomeStackNavProp } from "../../navigation/types";
import { Skeleton } from "../../components/Skeleton";

function useServices() {
  return useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      if (__DEV__) await new Promise<void>((r) => setTimeout(r, 800));
      const response = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");
      // DEBUG
      console.log("[ServicesScreen] supabase services response:", {
        status: response.status,
        statusText: response.statusText,
        error: response.error,
        rows: response.data?.length,
      });
      if (response.error) throw response.error;
      return response.data ?? [];
    },
  });
}

// DEBUG: build a verbose error string from a Supabase / PostgrestError
function describeError(err: any): string {
  if (!err) return "Unknown";
  const code = err.code ? `[${err.code}] ` : "";
  const msg = err.message ?? String(err);
  const details = err.details ? `\nDetails: ${err.details}` : "";
  const hint = err.hint ? `\nHint: ${err.hint}` : "";
  return `${code}${msg}${details}${hint}`;
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

function formatPrice(price: number): string {
  return `${price.toLocaleString("sr-RS")} RSD`;
}

export default function ServicesScreen() {
  const navigation = useNavigation<HomeStackNavProp>();
  const { data: services, isLoading, error, refetch } = useServices();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  if (error) {
    if (__DEV__) console.log("[ServicesScreen] error rendered:", error);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Greška pri učitavanju</Text>
          <Text style={styles.errorDetail} selectable>
            {describeError(error)}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Pokušaj ponovo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ServicesSkeleton />
      </SafeAreaView>
    );
  }

  const sections = groupByCategory(services ?? []);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={sections}
        keyExtractor={([category]) => category}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2D7D6E"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🦷</Text>
            <Text style={styles.emptyTitle}>Nema dostupnih usluga</Text>
          </View>
        }
        renderItem={({ item: [category, items] }) => (
          <View style={styles.categorySection}>
            <Text style={styles.categoryLabel}>{category}</Text>
            {items.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() =>
                  navigation.navigate("DateSelection", {
                    serviceId: service.id,
                    serviceName: service.name,
                    durationMinutes: service.duration_minutes,
                    price: service.price,
                  })
                }
              >
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName} numberOfLines={2}>
                    {service.name}
                  </Text>
                  <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
                </View>
                {service.description ? (
                  <Text style={styles.serviceDesc} numberOfLines={2}>
                    {service.description}
                  </Text>
                ) : null}
                <View style={styles.serviceFooter}>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                      ⏱ {service.duration_minutes} min
                    </Text>
                  </View>
                  <Text style={styles.bookLink}>Zakaži →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function ServicesSkeleton() {
  return (
    <View style={styles.listContent}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.categorySection}>
          <Skeleton style={{ width: 120, height: 12, marginBottom: 14 }} />
          {[0, 1].map((j) => (
            <View key={j} style={[styles.serviceCard, { gap: 10 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Skeleton style={{ width: 160, height: 16 }} />
                <Skeleton style={{ width: 80, height: 16 }} />
              </View>
              <Skeleton style={{ width: "80%", height: 13 }} />
              <Skeleton style={{ width: 80, height: 24, borderRadius: 20 }} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorIcon: { fontSize: 32, marginBottom: 12 },
  errorTitle: { color: "#374151", fontWeight: "600", marginBottom: 8 },
  errorDetail: {
    color: "#B91C1C",
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  retryButton: {
    backgroundColor: "#2D7D6E",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryText: { color: "#FFFFFF", fontWeight: "600" },
  listContent: { padding: 20, paddingTop: 12, paddingBottom: 100 },
  categorySection: { marginBottom: 24 },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D7D6E",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  servicePrice: { fontSize: 15, fontWeight: "700", color: "#2D7D6E" },
  serviceDesc: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  serviceFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  durationBadge: {
    backgroundColor: "#F5F9F7",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C8E6DF",
  },
  durationText: { fontSize: 12, color: "#2D7D6E", fontWeight: "600" },
  bookLink: { marginLeft: "auto", color: "#2D7D6E", fontWeight: "700", fontSize: 13 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, color: "#6B7280", fontWeight: "500" },
});
