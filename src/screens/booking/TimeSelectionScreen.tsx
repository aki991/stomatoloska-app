import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { sr } from "date-fns/locale";
import { supabase } from "../../services/supabase";
import { WorkingHours, TimeOff, Appointment } from "../../types";
import { HomeStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "TimeSelection">;

// ─── Pure helpers ────────────────────────────────────────────────────────────

/** Convert "HH:MM" or "HH:MM:SS" → minutes since midnight */
function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
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

/**
 * Generate candidate slot times every 15 min.
 * Last slot must end by closesAt, so: slot_start + duration ≤ closesAt.
 */
function generateSlots(
  opensAt: string,
  closesAt: string,
  durationMin: number
): string[] {
  const slots: string[] = [];
  let cur = toMin(opensAt);
  const last = toMin(closesAt) - durationMin;
  while (cur <= last) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    cur += 15;
  }
  return slots;
}

/**
 * Two half-open intervals [a,b) and [c,d) overlap when: a < d && b > c
 * slotStart / slotEnd  →  minutes since midnight (local)
 * apptStart / apptEnd  →  extracted from ISO timestamp in LOCAL timezone via getHours/getMinutes
 */
function overlapsAppointment(
  slotStart: number,
  slotEnd: number,
  appt: Appointment
): boolean {
  // Use local time – JS Date.getHours() always returns local hours
  const apptStart = new Date(appt.starts_at);
  const apptEnd = new Date(appt.ends_at);
  const aStart = apptStart.getHours() * 60 + apptStart.getMinutes();
  const aEnd = apptEnd.getHours() * 60 + apptEnd.getMinutes();
  return slotStart < aEnd && slotEnd > aStart;
}

function isSlotAvailable(
  slotTime: string,
  selectedDate: string,
  durationMin: number,
  appointments: Appointment[],
  timeOffs: TimeOff[]
): boolean {
  const slotStart = toMin(slotTime);
  const slotEnd = slotStart + durationMin;

  // Block slots in the past + 1h buffer when selected date is today
  if (selectedDate === format(new Date(), "yyyy-MM-dd")) {
    const nowMin =
      new Date().getHours() * 60 + new Date().getMinutes() + 60;
    if (slotStart < nowMin) return false;
  }

  // Block slots that overlap any confirmed/pending appointment
  for (const appt of appointments) {
    if (overlapsAppointment(slotStart, slotEnd, appt)) return false;
  }

  // Block whole day if any time_off record covers the selected date
  for (const off of timeOffs) {
    if (selectedDate >= off.start_date && selectedDate <= off.end_date)
      return false;
  }

  return true;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

function useSlotData(selectedDate: string) {
  const dow = parseISO(selectedDate).getDay();

  // Convert selectedDate to a local-time day boundary in UTC for the Supabase query.
  // new Date("YYYY-MM-DDT00:00:00") is parsed as LOCAL midnight → .toISOString() = UTC.
  const dayStartISO = new Date(`${selectedDate}T00:00:00`).toISOString();
  const dayEndISO = new Date(`${selectedDate}T23:59:59`).toISOString();

  const whQuery = useQuery<WorkingHours | null>({
    queryKey: ["working_hours_day", dow],
    queryFn: async () => {
      const r = await supabase
        .from("working_hours")
        .select("*")
        .eq("day_of_week", dow)
        .maybeSingle();
      console.log("[TimeSelection] working_hours_day response:", {
        dow,
        status: r.status,
        error: r.error,
        row: r.data,
      });
      if (r.error) throw r.error;
      return r.data;
    },
    staleTime: 1000 * 60 * 60, // working hours change rarely
  });

  const toQuery = useQuery<TimeOff[]>({
    queryKey: ["time_off_day", selectedDate],
    queryFn: async () => {
      const r = await supabase
        .from("time_off")
        .select("*")
        .lte("start_date", selectedDate)
        .gte("end_date", selectedDate);
      console.log("[TimeSelection] time_off_day response:", {
        selectedDate,
        status: r.status,
        error: r.error,
        rows: r.data?.length,
      });
      if (r.error) throw r.error;
      return r.data ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const apptQuery = useQuery<Appointment[]>({
    queryKey: ["appointments_day", selectedDate],
    queryFn: async () => {
      const r = await supabase
        .from("appointments")
        .select("id, starts_at, ends_at, status")
        .in("status", ["confirmed", "pending"])
        // Use UTC-converted boundaries so the range is correct regardless of server timezone
        .gte("starts_at", dayStartISO)
        .lte("starts_at", dayEndISO);
      console.log("[TimeSelection] appointments_day response:", {
        selectedDate,
        status: r.status,
        error: r.error,
        rows: r.data?.length,
      });
      if (r.error) throw r.error;
      return (r.data ?? []) as Appointment[];
    },
    staleTime: 0,          // always consider stale – slots change frequently
    refetchOnMount: true,
  });

  return { whQuery, toQuery, apptQuery };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimeSelectionScreen({ route, navigation }: Props) {
  const { serviceId, serviceName, durationMinutes, price, selectedDate } =
    route.params;

  const { whQuery, toQuery, apptQuery } = useSlotData(selectedDate);

  // Refetch appointments every time this screen comes into focus so we always
  // show up-to-date availability (e.g. user returns after a failed confirmation)
  useFocusEffect(
    useCallback(() => {
      apptQuery.refetch();
    }, [selectedDate]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  const isLoading =
    whQuery.isLoading || toQuery.isLoading || apptQuery.isLoading;

  const queryError = whQuery.error ?? toQuery.error ?? apptQuery.error;

  const isFetching = apptQuery.isFetching && !apptQuery.isLoading;

  const slots = useMemo(() => {
    const wh = whQuery.data;
    const timeOffs = toQuery.data ?? [];
    const appointments = apptQuery.data ?? [];

    if (!wh || wh.is_closed) return [];

    return generateSlots(wh.opens_at, wh.closes_at, durationMinutes).map(
      (time) => ({
        time,
        available: isSlotAvailable(
          time,
          selectedDate,
          durationMinutes,
          appointments,
          timeOffs
        ),
      })
    );
  }, [whQuery.data, toQuery.data, apptQuery.data, selectedDate, durationMinutes]);

  const formattedDate = format(parseISO(selectedDate), "EEEE, d. MMMM yyyy", {
    locale: sr,
  });
  const availableCount = slots.filter((s) => s.available).length;

  function onSlotPress(time: string) {
    navigation.navigate("Confirmation", {
      serviceId,
      serviceName,
      durationMinutes,
      price,
      selectedDate,
      selectedTime: time,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.service}>{serviceName}</Text>
          {isFetching && (
            <ActivityIndicator size="small" color="#2D7D6E" style={{ marginLeft: 8 }} />
          )}
        </View>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2D7D6E" />
          <Text style={styles.loadingText}>Učitavanje slobodnih termina...</Text>
        </View>
      ) : queryError ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Greška pri učitavanju</Text>
          <Text style={styles.errorDetail} selectable>
            {describeError(queryError)}
          </Text>
        </View>
      ) : slots.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🔒</Text>
          <Text style={styles.emptyTitle}>Ordinacija ne radi ovaj dan</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Izaberi drugi datum</Text>
          </TouchableOpacity>
        </View>
      ) : availableCount === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>😔</Text>
          <Text style={styles.emptyTitle}>Nema slobodnih termina</Text>
          <Text style={styles.emptySubtitle}>
            Svi termini za ovaj dan su zauzeti
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Izaberi drugi datum</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          <Text style={styles.availableLabel}>
            {availableCount} slobodnih termina
          </Text>
          <View style={styles.slotsContainer}>
            {slots.map(({ time, available }) => (
              <TouchableOpacity
                key={time}
                style={[styles.slot, available ? styles.slotFree : styles.slotTaken]}
                onPress={() => onSlotPress(time)}
                disabled={!available}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.slotText,
                    available ? styles.slotTextFree : styles.slotTextTaken,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  service: { fontSize: 17, fontWeight: "700", color: "#111827" },
  date: { fontSize: 13, color: "#2D7D6E", fontWeight: "500", marginTop: 2 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { color: "#6B7280", marginTop: 12 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151", textAlign: "center" },
  errorDetail: {
    color: "#B91C1C",
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
    marginTop: 8,
  },
  emptySubtitle: { fontSize: 13, color: "#6B7280", marginTop: 4, textAlign: "center" },
  backBtn: {
    marginTop: 20,
    backgroundColor: "#2D7D6E",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  backBtnText: { color: "#FFFFFF", fontWeight: "600" },
  grid: { padding: 20, paddingBottom: 100 },
  availableLabel: { fontSize: 13, color: "#6B7280", marginBottom: 14, fontWeight: "500" },
  slotsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slot: {
    width: "30%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1.5,
  },
  slotFree: { backgroundColor: "#FFFFFF", borderColor: "#2D7D6E" },
  slotTaken: { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
  slotText: { fontSize: 15, fontWeight: "600" },
  slotTextFree: { color: "#2D7D6E" },
  slotTextTaken: { color: "#D1D5DB" },
});
