import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { sr } from "date-fns/locale";
import { supabase } from "../../../services/supabase";
import { WorkingHours, Appointment } from "../../../types";
import { AdminDashboardStackParamList } from "../../../navigation/types";
import { BookingProgressBar } from "../../../components/BookingProgressBar";
import { useBookingExitButton } from "./useBookingExitButton";

type Props = NativeStackScreenProps<AdminDashboardStackParamList, "AdminBookingTime">;

const PRIMARY = "#2D7D6E";

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function generateSlots(opensAt: string, closesAt: string, durationMin: number): string[] {
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

function overlapsAppointment(slotStart: number, slotEnd: number, appt: Appointment): boolean {
  const a = new Date(appt.starts_at);
  const b = new Date(appt.ends_at);
  const aStart = a.getHours() * 60 + a.getMinutes();
  const aEnd = b.getHours() * 60 + b.getMinutes();
  return slotStart < aEnd && slotEnd > aStart;
}

export default function AdminBookingTimeStep({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  useBookingExitButton(navigation);
  const {
    patientId, patientName, walkInPhone,
    serviceId, serviceName, durationMinutes, price, selectedDate, existingAppointmentId,
  } = route.params;

  const dow = parseISO(selectedDate).getDay();
  const dayStartISO = new Date(`${selectedDate}T00:00:00`).toISOString();
  const dayEndISO = new Date(`${selectedDate}T23:59:59`).toISOString();

  const whQ = useQuery<WorkingHours | null>({
    queryKey: ["working_hours_day", dow],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("working_hours")
        .select("*")
        .eq("day_of_week", dow)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60,
  });

  const apptQ = useQuery<Appointment[]>({
    queryKey: ["appointments_day", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, starts_at, ends_at, status")
        .in("status", ["confirmed", "pending"])
        .gte("starts_at", dayStartISO)
        .lte("starts_at", dayEndISO);
      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  useFocusEffect(
    useCallback(() => {
      apptQ.refetch();
    }, [selectedDate]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  const isLoading = whQ.isLoading || apptQ.isLoading;

  const { slots, isNonWorkingDay } = useMemo(() => {
    const appointments = apptQ.data ?? [];
    const wh = whQ.data;

    // Admin uses 08:00–20:00 when no working hours row or is_closed
    const opensAt = (!wh || wh.is_closed) ? "08:00" : wh.opens_at;
    const closesAt = (!wh || wh.is_closed) ? "20:00" : wh.closes_at;
    const nonWorking = !wh || wh.is_closed;

    const now = new Date();
    const isToday = selectedDate === format(now, "yyyy-MM-dd");
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const slotList = generateSlots(opensAt, closesAt, durationMinutes)
      .filter((time) => !isToday || toMin(time) >= nowMin)
      .map((time) => {
        const slotStart = toMin(time);
        const slotEnd = slotStart + durationMinutes;
        const taken = appointments.some((a) => overlapsAppointment(slotStart, slotEnd, a));
        return { time, taken };
      });

    return { slots: slotList, isNonWorkingDay: nonWorking };
  }, [whQ.data, apptQ.data, durationMinutes, selectedDate]);

  const formattedDate = format(parseISO(selectedDate), "EEEE, d. MMMM yyyy", { locale: sr });
  const freeCount = slots.filter((s) => !s.taken).length;

  function onSlotPress(time: string) {
    navigation.navigate("AdminBookingConfirm", {
      patientId,
      patientName,
      walkInPhone,
      serviceId,
      serviceName,
      durationMinutes,
      price,
      selectedDate,
      selectedTime: time,
      existingAppointmentId,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <BookingProgressBar step={4} />

      <View style={styles.header}>
        <Text style={styles.service}>{serviceName}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
        <Text style={styles.patient}>Pacijent: {patientName}</Text>
      </View>

      {isNonWorkingDay && (
        <View style={styles.nonWorkingBanner}>
          <Text style={styles.nonWorkingText}>
            Neradni dan — prikazano 08:00–20:00 za retroaktivni unos
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.availableLabel}>
            {freeCount} slobodnih · {slots.length - freeCount} zauzetih
          </Text>
          <View style={styles.slotsContainer}>
            {slots.map(({ time, taken }) => (
              <TouchableOpacity
                key={time}
                style={[styles.slot, taken ? styles.slotTaken : styles.slotFree]}
                onPress={() => !taken && onSlotPress(time)}
                disabled={taken}
                activeOpacity={0.7}
              >
                <Text style={[styles.slotTime, taken ? styles.slotTimeTaken : styles.slotTimeFree]}>
                  {time}
                </Text>
                {taken && <Text style={styles.slotLabel}>Zauzeto</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
  service: { fontSize: 16, fontWeight: "700", color: "#111827" },
  date: { fontSize: 13, color: PRIMARY, fontWeight: "500" },
  patient: { fontSize: 12, color: "#6B7280" },

  nonWorkingBanner: {
    backgroundColor: "#FEF9C3",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  nonWorkingText: { fontSize: 12, color: "#92400E" },

  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  grid: { padding: 16 },
  availableLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 14,
  },
  slotsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  slot: {
    width: "30%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    gap: 2,
  },
  slotFree: { backgroundColor: "#FFFFFF", borderColor: PRIMARY },
  slotTaken: { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
  slotTime: { fontSize: 14, fontWeight: "700" },
  slotTimeFree: { color: PRIMARY },
  slotTimeTaken: { color: "#D1D5DB" },
  slotLabel: { fontSize: 9, color: "#D1D5DB", fontWeight: "600", textTransform: "uppercase" },
});
