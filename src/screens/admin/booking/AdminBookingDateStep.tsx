import React, { useMemo } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, parseISO } from "date-fns";
import { supabase } from "../../../services/supabase";
import { TimeOff } from "../../../types";
import { AdminDashboardStackParamList } from "../../../navigation/types";
import { BookingProgressBar } from "../../../components/BookingProgressBar";
import { useBookingExitButton } from "./useBookingExitButton";

type Props = NativeStackScreenProps<AdminDashboardStackParamList, "AdminBookingDate">;

const PRIMARY = "#2D7D6E";
const TODAY = format(new Date(), "yyyy-MM-dd");
const MAX_DATE = format(addDays(new Date(), 60), "yyyy-MM-dd");

type DisabledMark = { disabled: true; disableTouchEvent: true };

function buildDisabledDates(
  timeOffs: TimeOff[]
): Record<string, DisabledMark> {
  const mark: DisabledMark = { disabled: true, disableTouchEvent: true };
  const disabled: Record<string, DisabledMark> = {};

  // Disable Sundays (day 0) in the booking range
  const start = parseISO(TODAY);
  const end = parseISO(MAX_DATE);
  const c = new Date(start);
  while (c <= end) {
    if (c.getDay() === 0) {
      disabled[format(c, "yyyy-MM-dd")] = mark;
    }
    c.setDate(c.getDate() + 1);
  }

  // Disable time-off periods
  for (const off of timeOffs) {
    const offStart = parseISO(off.start_date);
    const offEnd = parseISO(off.end_date);
    const d = new Date(offStart);
    while (d <= offEnd) {
      disabled[format(d, "yyyy-MM-dd")] = mark;
      d.setDate(d.getDate() + 1);
    }
  }

  return disabled;
}

export default function AdminBookingDateStep({ route, navigation }: Props) {
  useBookingExitButton(navigation);
  const { patientId, patientName, walkInPhone, serviceId, serviceName, durationMinutes, price, existingAppointmentId } =
    route.params;

  const toQ = useQuery<TimeOff[]>({
    queryKey: ["admin", "time_off_range"],
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

  const markedDates = useMemo(() => {
    if (!toQ.data) return {};
    return buildDisabledDates(toQ.data);
  }, [toQ.data]);

  function onDayPress(day: DateData) {
    if (markedDates[day.dateString]?.disabled) return;
    navigation.navigate("AdminBookingTime", {
      patientId,
      patientName,
      walkInPhone,
      serviceId,
      serviceName,
      durationMinutes,
      price,
      selectedDate: day.dateString,
      existingAppointmentId,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <BookingProgressBar step={3} />

      <View style={styles.header}>
        <Text style={styles.title}>{serviceName}</Text>
        <Text style={styles.subtitle}>Pacijent: {patientName}</Text>
        <Text style={styles.hint}>Subota je dostupna · Nedelja onemogućena</Text>
      </View>

      {toQ.isLoading ? (
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
  hint: { fontSize: 11, color: "#9CA3AF", marginTop: 2, fontStyle: "italic" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
});
