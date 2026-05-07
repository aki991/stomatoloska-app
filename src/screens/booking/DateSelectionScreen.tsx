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
      const { data, error } = await supabase
        .from("working_hours")
        .select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });
}

function useTimeOffs() {
  return useQuery<TimeOff[]>({
    queryKey: ["time_off", TODAY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_off")
        .select("*")
        .gte("end_date", TODAY)
        .lte("start_date", MAX_DATE);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });
}

function buildDisabledDates(
  workingHours: WorkingHours[],
  timeOffs: TimeOff[]
): Record<string, { disabled: true; disableTouchEvent: true }> {
  const disabled: Record<string, { disabled: true; disableTouchEvent: true }> = {};
  const closedDays = new Set<number>();

  if (workingHours.length > 0) {
    workingHours.forEach((wh) => {
      if (wh.is_closed) closedDays.add(wh.day_of_week);
    });
  } else {
    // default: closed on Sundays (0)
    closedDays.add(0);
  }

  const mark = { disabled: true as const, disableTouchEvent: true as const };

  // Mark closed weekdays across the 60-day range
  const cursor = new Date();
  for (let i = 0; i <= 60; i++) {
    const d = addDays(cursor, i);
    const dow = d.getDay();
    if (closedDays.has(dow)) {
      disabled[format(d, "yyyy-MM-dd")] = mark;
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
  const { data: workingHours, isLoading: loadingWH } = useWorkingHours();
  const { data: timeOffs, isLoading: loadingTO } = useTimeOffs();

  const markedDates = useMemo(() => {
    if (!workingHours || !timeOffs) return {};
    return buildDisabledDates(workingHours, timeOffs);
  }, [workingHours, timeOffs]);

  const isLoading = loadingWH || loadingTO;

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
          <View style={[styles.legendDot, { backgroundColor: "#D1D5DB" }]} />
          <Text style={styles.legendText}>Ordinacija ne radi</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: "#2D7D6E" }]} />
          <Text style={styles.legendText}>Izabrani datum</Text>
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
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  legend: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#6B7280" },
});
