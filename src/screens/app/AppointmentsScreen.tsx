import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StyleSheet,
} from "react-native";
import { Skeleton } from "../../components/Skeleton";
import { StatusBadge } from "../../components/StatusBadge";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, differenceInMinutes } from "date-fns";
import { sr } from "date-fns/locale";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";
import { AppointmentWithService } from "../../types";
import { TerminiStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<TerminiStackParamList, "AppointmentsList">;


// ─── Data ─────────────────────────────────────────────────────────────────────

function useAppointments() {
  const { user } = useAuthStore();
  return useQuery<AppointmentWithService[]>({
    queryKey: ["appointments", user?.id],
    queryFn: async () => {
      if (__DEV__) await new Promise<void>((r) => setTimeout(r, 800));
      const { data, error } = await supabase
        .from("appointments")
        .select("*, service:services(*)")
        .eq("patient_id", user!.id)
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AppointmentWithService[];
    },
    enabled: !!user,
    staleTime: 0,
  });
}

function splitAppointments(all: AppointmentWithService[]) {
  const now = new Date();
  const upcoming: AppointmentWithService[] = [];
  const past: AppointmentWithService[] = [];

  for (const a of all) {
    const isFutureConfirmed =
      (a.status === "confirmed" || a.status === "pending") &&
      new Date(a.starts_at) > now;
    if (isFutureConfirmed) {
      upcoming.push(a);
    } else {
      past.push(a);
    }
  }

  // Upcoming: ascending (soonest first); Past: descending (most recent first)
  upcoming.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
  past.sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
  );

  return { upcoming, past };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppointmentsScreen({ navigation, route }: Props) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [refreshing, setRefreshing] = useState(false);
  const { data: all, isLoading, refetch } = useAppointments();
  const queryClient = useQueryClient();

  // Toast / flash banner
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const flashMessage = route?.params?.flash;

  useEffect(() => {
    if (!flashMessage) return;
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(flashOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [flashMessage]);

  // Refresh on focus (e.g. after cancellation)
  useFocusEffect(
    useCallback(() => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["next-appointment"] });
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const { upcoming, past } = splitAppointments(all ?? []);
  const data = activeTab === "upcoming" ? upcoming : past;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Termini</Text>
      </View>

      {/* Flash banner */}
      {flashMessage ? (
        <Animated.View style={[styles.flashBanner, { opacity: flashOpacity }]}>
          <Text style={styles.flashText}>✓  {flashMessage}</Text>
        </Animated.View>
      ) : null}

      {/* Tab switcher */}
      <View style={styles.tabs}>
        <TabButton
          label={`Predstojeći (${upcoming.length})`}
          active={activeTab === "upcoming"}
          onPress={() => setActiveTab("upcoming")}
        />
        <TabButton
          label={`Prošli (${past.length})`}
          active={activeTab === "past"}
          onPress={() => setActiveTab("past")}
        />
      </View>

      {/* List */}
      {isLoading ? (
        <AppointmentsSkeleton />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2D7D6E"
            />
          }
          ListEmptyComponent={
            <EmptyState
              isUpcoming={activeTab === "upcoming"}
              onBook={() => navigation.getParent()?.navigate("Home")}
            />
          }
          renderItem={({ item }) => (
            <AppointmentCard
              item={item}
              onPress={() =>
                navigation.navigate("AppointmentDetail", {
                  appointmentId: item.id,
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AppointmentsSkeleton() {
  return (
    <View style={{ padding: 16 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.card, { gap: 10, marginBottom: 10 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Skeleton style={{ width: 160, height: 17 }} />
            <Skeleton style={{ width: 72, height: 22, borderRadius: 20 }} />
          </View>
          <Skeleton style={{ width: "70%", height: 13 }} />
          <Skeleton style={{ width: 100, height: 13 }} />
        </View>
      ))}
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tabBtn} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
      {active && <View style={styles.tabIndicator} />}
    </TouchableOpacity>
  );
}

function AppointmentCard({
  item,
  onPress,
}: {
  item: AppointmentWithService;
  onPress: () => void;
}) {
  const durationMin = differenceInMinutes(
    new Date(item.ends_at),
    new Date(item.starts_at)
  );
  const dateStr = format(
    new Date(item.starts_at),
    "EEEE, d. MMMM yyyy, HH:mm",
    { locale: sr }
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardService} numberOfLines={1}>
          {item.service?.name ?? "Pregled"}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      <Text style={styles.cardDate}>{dateStr}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>⏱ {durationMin} min</Text>
        {item.service?.price != null && (
          <Text style={styles.cardMeta}>
            {item.service.price.toLocaleString("sr-RS")} RSD
          </Text>
        )}
        <Text style={styles.cardChevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({
  isUpcoming,
  onBook,
}: {
  isUpcoming: boolean;
  onBook: () => void;
}) {
  if (isUpcoming) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>📭</Text>
        <Text style={styles.emptyTitle}>Nemate zakazanih termina</Text>
        <Text style={styles.emptySubtitle}>
          Zakažite prvi termin u samo nekoliko koraka
        </Text>
        <TouchableOpacity style={styles.bookBtn} onPress={onBook}>
          <Text style={styles.bookBtnText}>Zakaži termin</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🗓</Text>
      <Text style={styles.emptyTitle}>Nemate prošlih termina</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#111827" },

  flashBanner: {
    backgroundColor: "#059669",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  flashText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  tabLabel: { fontSize: 14, fontWeight: "500", color: "#6B7280" },
  tabLabelActive: { color: "#2D7D6E", fontWeight: "700" },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: "#2D7D6E",
    borderRadius: 2,
  },

  listContent: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  cardService: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  cardDate: { fontSize: 13, color: "#374151", marginBottom: 10, lineHeight: 18 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardMeta: { fontSize: 13, color: "#6B7280" },
  cardChevron: { marginLeft: "auto", fontSize: 22, color: "#9CA3AF", lineHeight: 22 },

  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151", textAlign: "center" },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  bookBtn: {
    backgroundColor: "#2D7D6E",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  bookBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
