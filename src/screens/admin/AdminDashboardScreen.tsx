import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { format, addMinutes } from "date-fns";
import { sr } from "date-fns/locale";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";
import { Appointment, Service } from "../../types";
import { AdminDashboardStackNavProp } from "../../navigation/types";
import { Skeleton } from "../../components/Skeleton";
import { StatusBadge } from "../../components/StatusBadge";

type AdminAppointmentRow = Appointment & {
  service: Pick<Service, "id" | "name" | "duration_minutes"> | null;
  patient: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Dobro jutro";
  if (h < 18) return "Dobar dan";
  return "Dobro veče";
}

function dayBoundsISO(date: Date): { startISO: string; endISO: string } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

function patientDisplay(a: AdminAppointmentRow): string {
  if (a.patient) {
    const name = [a.patient.first_name, a.patient.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    return name || "Pacijent";
  }
  if (a.walk_in_name) return `${a.walk_in_name} (bez naloga)`;
  return "Nepoznat pacijent";
}

function useTodaysAppointments() {
  const { startISO, endISO } = dayBoundsISO(new Date());
  return useQuery<AdminAppointmentRow[]>({
    queryKey: ["admin", "today-appointments", startISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `*, service:services(id, name, duration_minutes),
           patient:profiles!patient_id(id, first_name, last_name, phone)`
        )
        .gte("starts_at", startISO)
        .lte("starts_at", endISO)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AdminAppointmentRow[];
    },
    staleTime: 1000 * 30,
  });
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation<AdminDashboardStackNavProp>();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { data: todays, isLoading, refetch } = useTodaysAppointments();
  const [refreshing, setRefreshing] = useState(false);
  const fabScale = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const greeting = `${getGreeting()}, Dr ${profile?.first_name ?? ""}`.trim();
  const dateLabel = format(new Date(), "EEEE, d. MMMM yyyy", { locale: sr });

  // Stats
  const list = todays ?? [];
  const activeList = list.filter((a) => a.status !== "cancelled");
  const cancelledCount = list.filter((a) => a.status === "cancelled").length;
  const now = new Date();
  const oneHourLater = addMinutes(now, 60);
  const nextWithinHour = activeList.find((a) => {
    const t = new Date(a.starts_at);
    return t >= now && t <= oneHourLater;
  });

  const onFabPressIn = () =>
    Animated.timing(fabScale, {
      toValue: 0.92,
      duration: 100,
      useNativeDriver: true,
    }).start();
  const onFabPressOut = () =>
    Animated.timing(fabScale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  const onFabPress = () => navigation.navigate("AdminBookingPatient");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={["#1F5A4F", "#2D7D6E", "#4A9B8E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.headerTopRow}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2D7D6E"
          />
        }
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="calendar"
            value={String(activeList.length)}
            label="termina danas"
          />
          <StatCard
            icon="close-circle"
            value={String(cancelledCount)}
            label="otkazano"
            tint="#EF4444"
          />
        </View>

        {/* Next within hour */}
        <NextWithinHourCard
          appt={nextWithinHour ?? null}
          onPress={
            nextWithinHour
              ? () =>
                  navigation.navigate("AdminAppointmentDetail", {
                    appointmentId: nextWithinHour.id,
                  })
              : undefined
          }
        />

        {/* Today's list */}
        <Text style={styles.sectionTitle}>Današnji raspored</Text>
        {isLoading ? (
          <View style={{ gap: 10 }}>
            <ApptSkeleton />
            <ApptSkeleton />
            <ApptSkeleton />
          </View>
        ) : activeList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-clear-outline"
              size={28}
              color="#9CA3AF"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.emptyTitle}>Nema termina za danas</Text>
            <Text style={styles.emptySubtitle}>
              Iskoristi vreme za pripremu ili zakazivanje sledećih termina.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {list.map((a) => (
              <AppointmentRow
                key={a.id}
                appt={a}
                onPress={() =>
                  navigation.navigate("AdminAppointmentDetail", {
                    appointmentId: a.id,
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Extended FAB */}
      <Animated.View
        style={[
          styles.fab,
          {
            bottom: 80 + insets.bottom,
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={onFabPress}
          onPressIn={onFabPressIn}
          onPressOut={onFabPressOut}
          activeOpacity={1}
          style={styles.fabTouchable}
        >
          <LinearGradient
            colors={["#2D7D6E", "#1F5A4F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text style={styles.fabLabel}>Zakaži termin</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  value,
  label,
  tint,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: string;
  label: string;
  tint?: string;
}) {
  const color = tint ?? "#2D7D6E";
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NextWithinHourCard({
  appt,
  onPress,
}: {
  appt: AdminAppointmentRow | null;
  onPress?: () => void;
}) {
  if (!appt) {
    return (
      <View style={styles.nextEmpty}>
        <Ionicons name="time-outline" size={18} color="#6B7280" />
        <Text style={styles.nextEmptyText}>Nema termina u sledećih sat vremena</Text>
      </View>
    );
  }
  return (
    <TouchableOpacity
      style={styles.nextCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <LinearGradient
        colors={["#2D7D6E", "#1F5A4F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.nextAccent}
      />
      <View style={styles.nextBody}>
        <Text style={styles.nextLabel}>U narednom satu</Text>
        <Text style={styles.nextTime}>
          {format(new Date(appt.starts_at), "HH:mm")}  •  {patientDisplay(appt)}
        </Text>
        <Text style={styles.nextService} numberOfLines={1}>
          {appt.service?.name ?? "Pregled"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

function AppointmentRow({
  appt,
  onPress,
}: {
  appt: AdminAppointmentRow;
  onPress: () => void;
}) {
  const time = format(new Date(appt.starts_at), "HH:mm");
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.rowTime}>
        <Text style={styles.rowTimeText}>{time}</Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTopRow}>
          <Text style={styles.rowPatient} numberOfLines={1}>
            {patientDisplay(appt)}
          </Text>
          <StatusBadge status={appt.status} />
        </View>
        <Text style={styles.rowService} numberOfLines={1}>
          {appt.service?.name ?? "Pregled"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ApptSkeleton() {
  return (
    <View style={styles.row}>
      <View style={styles.rowTime}>
        <Skeleton style={{ width: 40, height: 16, borderRadius: 6 }} />
      </View>
      <View style={[styles.rowBody, { gap: 8 }]}>
        <Skeleton style={{ width: 160, height: 15 }} />
        <Skeleton style={{ width: 200, height: 13 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9F7" },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    overflow: "hidden",
  },
  decorCircle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -40,
    right: -20,
  },
  decorCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -30,
    left: 60,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.35)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  dateLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    textTransform: "capitalize",
  },

  // Content
  scrollContent: { padding: 20, paddingTop: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
    marginTop: 22,
    marginBottom: 10,
  },

  // Stats
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },

  // Next within hour
  nextCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 3,
  },
  nextAccent: { width: 5, alignSelf: "stretch" },
  nextBody: { flex: 1, padding: 14 },
  nextLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2D7D6E",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  nextTime: { fontSize: 16, fontWeight: "700", color: "#111827" },
  nextService: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  nextEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  nextEmptyText: { fontSize: 13, color: "#6B7280" },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  rowTime: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: "#F3F4F6",
  },
  rowTimeText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2D7D6E",
    letterSpacing: -0.3,
  },
  rowBody: { flex: 1, paddingLeft: 12, gap: 4 },
  rowTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  rowPatient: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
  rowService: { fontSize: 13, color: "#6B7280" },

  // Empty
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    borderRadius: 28,
    shadowColor: "#1F5A4F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  fabTouchable: { borderRadius: 28, overflow: "hidden" },
  fabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  fabLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
