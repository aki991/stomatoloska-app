import React, { useMemo } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, parseISO } from "date-fns";
import { supabase } from "../../services/supabase";
import { WorkingHours, TimeOff } from "../../types";
import { AuthStackParamList } from "../../navigation/types";
import { BookingProgressBar } from "../../components/BookingProgressBar";
import { useGuestExitButton } from "./useGuestExitButton";

type Props = NativeStackScreenProps<AuthStackParamList, "GuestDate">;

const PRIMARY = "#2D7D6E";
const TODAY = format(new Date(), "yyyy-MM-dd");
const MAX_DATE = format(addDays(new Date(), 60), "yyyy-MM-dd");

type DisabledMark = { disabled: true; disableTouchEvent: true };

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function buildDisabledDates(
  workingHours: WorkingHours[],
  timeOffs: TimeOff[],
  durationMin: number
): Record<string, DisabledMark> {
  const disabled: Record<string, DisabledMark> = {};
  const mark: DisabledMark = { disabled: true, disableTouchEvent: true };

  const openDays = new Set<number>(
    workingHours.filter((wh) => !wh.is_closed).map((wh) => wh.day_of_week)
  );
  const useFallback = workingHours.length === 0;
  const fallbackClosed = new Set<number>([0]);

  const cursor = new Date();
  for (let i = 0; i <= 60; i++) {
    const d = addDays(cursor, i);
    const dow = d.getDay();
    const isClosed = useFallback ? fallbackClosed.has(dow) : !openDays.has(dow);
    if (isClosed) {
      disabled[format(d, "yyyy-MM-dd")] = mark;
    }
  }

  // Today: disable if no slot starting at now+60min or later can end by closes_at.
  const now = new Date();
  const todayKey = format(now, "yyyy-MM-dd");
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (!disabled[todayKey]) {
    const todayHours = workingHours.find((wh) => wh.day_of_week === now.getDay());
    if (todayHours && !todayHours.is_closed) {
      const closesMin = toMin(todayHours.closes_at);
      const latestSlotStart = closesMin - durationMin;
      const earliestSlotStart = nowMin + 60;
      if (latestSlotStart < earliestSlotStart) {
        disabled[todayKey] = mark;
      }
    }
  }

  for (const off of timeOffs) {
    const start = parseISO(off.start_date);
    const end = parseISO(off.end_date);
    const c = new Date(start);
    while (c <= end) {
      disabled[format(c, "yyyy-MM-dd")] = mark;
      c.setDate(c.getDate() + 1);
    }
  }

  return disabled;
}

export default function GuestDateStep({ route, navigation }: Props) {
  useGuestExitButton(navigation);
  const { firstName, lastName, phone, serviceId, serviceName, durationMinutes, price } =
    route.params;

  const whQ = useQuery<WorkingHours[]>({
    queryKey: ["guest", "working_hours"],
    queryFn: async () => {
      const { data, error } = await supabase.from("working_hours").select("*");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const toQ = useQuery<TimeOff[]>({
    queryKey: ["guest", "time_off_range"],
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

  const isLoading = whQ.isLoading || toQ.isLoading;

  const markedDates = useMemo(() => {
    if (!whQ.data || !toQ.data) return {};
    return buildDisabledDates(whQ.data, toQ.data, durationMinutes);
  }, [whQ.data, toQ.data, durationMinutes]);

  function onDayPress(day: DateData) {
    if (markedDates[day.dateString]?.disabled) return;
    navigation.navigate("GuestTime", {
      firstName,
      lastName,
      phone,
      serviceId,
      serviceName,
      durationMinutes,
      price,
      selectedDate: day.dateString,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <BookingProgressBar step={3} />

      <View style={styles.header}>
        <Text style={styles.title}>{serviceName}</Text>
        <Text style={styles.subtitle}>Izaberite datum termina</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <Calendar
          minDate={TODAY}
          maxDate={MAX_DATE}
          markedDates={markedDates}
          onDayPress={onDayPress}
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
      )}

      <View style={styles.legend}>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 2,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6B7280" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  legend: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    flexWrap: "wrap",
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendSampleDisabled: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D1D5DB",
    minWidth: 16,
    textAlign: "center",
  },
  legendText: { fontSize: 12, color: "#6B7280" },
});
