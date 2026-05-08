import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
} from "date-fns";
import { sr } from "date-fns/locale";
import { supabase } from "../../services/supabase";
import {
  Appointment,
  Service,
} from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AdminCalendarStackParamList } from "../../navigation/types";

type AdminAppointmentRow = Appointment & {
  service: Pick<Service, "id" | "name"> | null;
  patient: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

type StatusFilter = "all" | "confirmed" | "cancelled" | "completed";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Svi" },
  { key: "confirmed", label: "Potvrđeni" },
  { key: "cancelled", label: "Otkazani" },
  { key: "completed", label: "Završeni" },
];

const PRIMARY = "#2D7D6E";
const RED = "#EF4444";
const GRAY = "#D1D5DB";

function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function patientDisplay(a: AdminAppointmentRow): string {
  if (a.patient) {
    const name = [a.patient.first_name, a.patient.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    return name || "Pacijent";
  }
  if (a.walk_in_name) return `${a.walk_in_name} (walk-in)`;
  return "Nepoznat pacijent";
}

function statusFamily(s: Appointment["status"]): StatusFilter {
  if (s === "cancelled") return "cancelled";
  if (s === "completed" || s === "no_show") return "completed";
  return "confirmed"; // pending + confirmed
}

function useMonthAppointments(monthKey: string) {
  return useQuery<AdminAppointmentRow[]>({
    queryKey: ["admin", "month-appointments", monthKey],
    queryFn: async () => {
      const cursor = parseISO(`${monthKey}-01`);
      // Fetch the visible month +/- 1 so swiping doesn't show empty state for an instant
      const start = startOfMonth(addMonths(cursor, -1)).toISOString();
      const end = endOfMonth(addMonths(cursor, 1)).toISOString();
      const r = await supabase
        .from("appointments")
        .select(
          `*, service:services(id, name),
           patient:profiles!patient_id(id, first_name, last_name)`
        )
        .gte("starts_at", start)
        .lte("starts_at", end)
        .order("starts_at", { ascending: true });
      if (r.error) throw r.error;
      return (r.data ?? []) as AdminAppointmentRow[];
    },
    staleTime: 1000 * 30,
  });
}

export default function AdminCalendarScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AdminCalendarStackParamList>>();
  const insets = useSafeAreaInsets();

  const today = useMemo(() => dateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [visibleMonth, setVisibleMonth] = useState<string>(today.slice(0, 7));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const apptQ = useMonthAppointments(visibleMonth);

  useFocusEffect(
    useCallback(() => {
      apptQ.refetch();
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Group appointments by date key
  const byDate = useMemo(() => {
    const map = new Map<string, AdminAppointmentRow[]>();
    for (const a of apptQ.data ?? []) {
      const k = dateKey(new Date(a.starts_at));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    }
    return map;
  }, [apptQ.data]);

  // Build markedDates: dots for status families + selected highlight.
  // No days are disabled — admin can view appointments on any date.
  const markedDates = useMemo(() => {
    const out: Record<string, any> = {};

    for (const [k, list] of byDate.entries()) {
      const families = new Set<StatusFilter>(list.map((a) => statusFamily(a.status)));
      const dots: { key: string; color: string }[] = [];
      if (families.has("confirmed")) dots.push({ key: "c", color: PRIMARY });
      if (families.has("cancelled")) dots.push({ key: "x", color: RED });
      if (families.has("completed")) dots.push({ key: "d", color: GRAY });
      out[k] = { dots, marked: true };
    }

    out[selectedDate] = {
      ...(out[selectedDate] ?? {}),
      selected: true,
      selectedColor: PRIMARY,
    };

    return out;
  }, [byDate, selectedDate]);

  // Day list (filtered)
  const dayList = useMemo(() => {
    const list = byDate.get(selectedDate) ?? [];
    if (statusFilter === "all") return list;
    return list.filter((a) => statusFamily(a.status) === statusFilter);
  }, [byDate, selectedDate, statusFilter]);

  const onDayPress = (d: DateData) => setSelectedDate(d.dateString);
  const onMonthChange = (d: DateData) => setVisibleMonth(d.dateString.slice(0, 7));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await apptQ.refetch();
    setRefreshing(false);
  }, [apptQ]);

  const selectedDateLabelRaw = format(parseISO(selectedDate), "EEEE, d. MMMM yyyy", {
    locale: sr,
  });
  const selectedDateLabel =
    selectedDateLabelRaw.charAt(0).toUpperCase() + selectedDateLabelRaw.slice(1);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Kalendar termina</Text>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </View>

      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={onDayPress}
        onMonthChange={onMonthChange}
        enableSwipeMonths
        firstDay={1}
        theme={{
          backgroundColor: "#F9FAFB",
          calendarBackground: "#F9FAFB",
          selectedDayBackgroundColor: PRIMARY,
          selectedDayTextColor: "#FFFFFF",
          todayTextColor: PRIMARY,
          dayTextColor: "#111827",
          textDisabledColor: "#D1D5DB",
          arrowColor: PRIMARY,
          monthTextColor: "#111827",
          textDayFontWeight: "500",
          textMonthFontWeight: "700",
          textDayHeaderFontWeight: "600",
          textDayFontSize: 15,
          textMonthFontSize: 16,
        }}
      />

      <View style={styles.legend}>
        <LegendItem color={PRIMARY} label="Potvrđeni" />
        <LegendItem color={RED} label="Otkazani" />
        <LegendItem color={GRAY} label="Završeni" />
      </View>

      <View style={styles.dayHeader}>
        <Text style={styles.dayHeaderTitle} numberOfLines={1}>
          {selectedDateLabel}
        </Text>
        <Text style={styles.dayHeaderCount}>
          {dayList.length} {dayList.length === 1 ? "termin" : "termina"}
        </Text>
      </View>

      <View style={styles.chipsRow}>
        {FILTERS.map((f) => {
          const active = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setStatusFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={dayList}
        keyExtractor={(a) => a.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-clear-outline"
              size={28}
              color="#9CA3AF"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.emptyTitle}>Nema termina za ovaj dan</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("AdminAppointmentDetail", {
                appointmentId: item.id,
              })
            }
          >
            <View style={styles.rowTime}>
              <Text style={styles.rowTimeText}>
                {format(new Date(item.starts_at), "HH:mm")}
              </Text>
              <Text style={styles.rowTimeEnd}>
                {format(new Date(item.ends_at), "HH:mm")}
              </Text>
            </View>
            <View style={styles.rowBody}>
              <View style={styles.rowTopRow}>
                <Text style={styles.rowPatient} numberOfLines={1}>
                  {patientDisplay(item)}
                </Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.rowService} numberOfLines={1}>
                {item.service?.name ?? "Pregled"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#111827", letterSpacing: -0.3 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: PRIMARY,
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

  legend: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: "#6B7280" },

  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  dayHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 12,
  },
  dayHeaderCount: { fontSize: 12, color: "#6B7280" },

  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipText: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  chipTextActive: { color: "#FFFFFF" },

  list: { paddingHorizontal: 20, paddingTop: 4, gap: 10 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  rowTime: {
    width: 64,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: "#F3F4F6",
    alignItems: "center",
  },
  rowTimeText: {
    fontSize: 15,
    fontWeight: "800",
    color: PRIMARY,
    letterSpacing: -0.3,
  },
  rowTimeEnd: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
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

  emptyCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
});
