import React, { useMemo } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, isWithinInterval, parseISO } from "date-fns";
import { supabase } from "../../services/supabase";
import { WorkingHours, TimeOff } from "../../types";
import { HomeStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "DateSelection">;

const TODAY = format(new Date(), "yyyy-MM-dd");
const MAX_DATE = format(addDays(new Date(), 60), "yyyy-MM-dd");

function useWorkingHours() {
  return useQuery<WorkingHours[]>({
    queryKey: ["working_hours"],
    queryFn: async () => {
      const response = await supabase.from("working_hours").select("*");
      console.log("[DateSelection] working_hours response:", {
        status: response.status,
        error: response.error,
        rows: response.data?.length,
      });
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });
}

function useTimeOffs() {
  return useQuery<TimeOff[]>({
    queryKey: ["time_off", TODAY],
    queryFn: async () => {
      const response = await supabase
        .from("time_off")
        .select("*")
        .gte("end_date", TODAY)
        .lte("start_date", MAX_DATE);
      console.log("[DateSelection] time_off response:", {
        status: response.status,
        error: response.error,
        rows: response.data?.length,
      });
      if (response.error) throw response.error;
      return response.data ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });
}

/** "HH:MM" or "HH:MM:SS" → minutes since midnight */
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

function buildDisabledDates(
  workingHours: WorkingHours[],
  timeOffs: TimeOff[],
  durationMin: number
): Record<string, { disabled: true; disableTouchEvent: true }> {
  const disabled: Record<string, { disabled: true; disableTouchEvent: true }> = {};

  // A day is OPEN only if it has a row AND is_closed === false.
  // Anything else (is_closed=true OR missing row) is treated as closed.
  const openDays = new Set<number>(
    workingHours.filter((wh) => !wh.is_closed).map((wh) => wh.day_of_week)
  );

  // Conservative fallback: if working_hours has no rows at all (data not seeded),
  // disable only Sunday so the screen remains usable.
  const useFallback = workingHours.length === 0;
  const fallbackClosed = new Set<number>([0]);

  const mark = { disabled: true as const, disableTouchEvent: true as const };

  const cursor = new Date();
  for (let i = 0; i <= 60; i++) {
    const d = addDays(cursor, i);
    const dow = d.getDay();
    const isClosed = useFallback ? fallbackClosed.has(dow) : !openDays.has(dow);
    if (isClosed) {
      disabled[format(d, "yyyy-MM-dd")] = mark;
    }
  }

  // Today: even if the clinic is open, disable if no slot fits before close.
  // Mirrors the 2h booking buffer used in TimeSelectionScreen.
  const now = new Date();
  const todayKey = format(now, "yyyy-MM-dd");
  const todayHours = workingHours.find((wh) => wh.day_of_week === now.getDay());
  if (!disabled[todayKey] && todayHours && !todayHours.is_closed) {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const earliestStart = Math.max(toMin(todayHours.opens_at), nowMin + 120);
    const latestStart = toMin(todayHours.closes_at) - durationMin;
    if (latestStart < earliestStart) {
      disabled[todayKey] = mark;
    }
  }

  // Mark time_off ranges
  timeOffs.forEach((off) => {
    const start = parseISO(off.start_date);
    const end = parseISO(off.end_date);
    const c = new Date(start);
    while (c <= end) {
      disabled[format(c, "yyyy-MM-dd")] = mark;
      c.setDate(c.getDate() + 1);
    }
  });

  return disabled;
}

export default function DateSelectionScreen({ route, navigation }: Props) {
  const { serviceId, serviceName, durationMinutes, price } = route.params;
  const whQ = useWorkingHours();
  const toQ = useTimeOffs();
  const workingHours = whQ.data;
  const timeOffs = toQ.data;

  const markedDates = useMemo(() => {
    if (!workingHours || !timeOffs) return {};
    return buildDisabledDates(workingHours, timeOffs, durationMinutes);
  }, [workingHours, timeOffs, durationMinutes]);

  const isLoading = whQ.isLoading || toQ.isLoading;
  const queryError = whQ.error ?? toQ.error;

  function onDayPress(day: DateData) {
    if (markedDates[day.dateString]?.disabled) return;
    navigation.navigate("TimeSelection", {
      serviceId,
      serviceName,
      durationMinutes,
      price,
      selectedDate: day.dateString,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.service}>{serviceName}</Text>
        <Text style={styles.subtitle}>Izaberite datum termina</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2D7D6E" />
        </View>
      ) : queryError ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Greška pri učitavanju</Text>
          <Text style={styles.errorDetail} selectable>
            {describeError(queryError)}
          </Text>
        </View>
      ) : (
        <Calendar
          minDate={TODAY}
          maxDate={MAX_DATE}
          markedDates={markedDates}
          onDayPress={onDayPress}
          enableSwipeMonths
          theme={{
            backgroundColor: "#F9FAFB",
            calendarBackground: "#F9FAFB",
            selectedDayBackgroundColor: "#2D7D6E",
            selectedDayTextColor: "#FFFFFF",
            todayTextColor: "#2D7D6E",
            dayTextColor: "#111827",
            textDisabledColor: "#D1D5DB",
            arrowColor: "#2D7D6E",
            monthTextColor: "#111827",
            textDayFontWeight: "500",
            textMonthFontWeight: "700",
            textDayHeaderFontWeight: "600",
            textDayFontSize: 15,
            textMonthFontSize: 16,
          }}
        />
      )}

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={styles.legendCircle} />
          <Text style={styles.legendText}>Izabrani datum</Text>
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendSampleDisabled}>15</Text>
          <Text style={styles.legendText}>Neradni dan / prošlost</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  service: { fontSize: 18, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  errorTitle: { fontSize: 16, fontWeight: "700", color: "#374151", marginBottom: 8 },
  errorDetail: {
    color: "#B91C1C",
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    flexWrap: "wrap",
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2D7D6E",
  },
  legendSampleDisabled: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D1D5DB",
    minWidth: 16,
    textAlign: "center",
  },
  legendText: { fontSize: 12, color: "#6B7280" },
});
