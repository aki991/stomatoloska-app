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
import { AuthStackParamList } from "../../navigation/types";
import { BookingProgressBar } from "../../components/BookingProgressBar";
import { useGuestExitButton } from "./useGuestExitButton";

type Props = NativeStackScreenProps<AuthStackParamList, "GuestTime">;

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

function isSlotAvailable(
  slotTime: string,
  selectedDate: string,
  durationMin: number,
  appointments: Appointment[],
  timeOffs: TimeOff[]
): boolean {
  const slotStart = toMin(slotTime);
  const slotEnd = slotStart + durationMin;

  if (selectedDate === format(new Date(), "yyyy-MM-dd")) {
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes() + 60;
    if (slotStart < nowMin) return false;
  }

  for (const appt of appointments) {
    if (overlapsAppointment(slotStart, slotEnd, appt)) return false;
  }

  for (const off of timeOffs) {
    if (selectedDate >= off.start_date && selectedDate <= off.end_date) return false;
  }

  return true;
}

export default function GuestTimeStep({ route, navigation }: Props) {
  useGuestExitButton(navigation);
  const {
    firstName, lastName, phone,
    serviceId, serviceName, durationMinutes, price, selectedDate,
  } = route.params;

  const dow = parseISO(selectedDate).getDay();
  const dayStartISO = new Date(`${selectedDate}T00:00:00`).toISOString();
  const dayEndISO = new Date(`${selectedDate}T23:59:59`).toISOString();

  const whQ = useQuery<WorkingHours | null>({
    queryKey: ["guest", "working_hours_day", dow],
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

  const toQ = useQuery<TimeOff[]>({
    queryKey: ["guest", "time_off_day", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_off")
        .select("*")
        .lte("start_date", selectedDate)
        .gte("end_date", selectedDate);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const apptQ = useQuery<Appointment[]>({
    queryKey: ["guest", "appointments_day", selectedDate],
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

  const isLoading = whQ.isLoading || toQ.isLoading || apptQ.isLoading;
  const isFetching = apptQ.isFetching && !apptQ.isLoading;

  const slots = useMemo(() => {
    const wh = whQ.data;
    const timeOffs = toQ.data ?? [];
    const appointments = apptQ.data ?? [];

    if (!wh || wh.is_closed) return [];

    return generateSlots(wh.opens_at, wh.closes_at, durationMinutes).map((time) => ({
      time,
      available: isSlotAvailable(time, selectedDate, durationMinutes, appointments, timeOffs),
    }));
  }, [whQ.data, toQ.data, apptQ.data, selectedDate, durationMinutes]);

  const formattedDate = format(parseISO(selectedDate), "EEEE, d. MMMM yyyy", { locale: sr });
  const availableCount = slots.filter((s) => s.available).length;

  function onSlotPress(time: string) {
    navigation.navigate("GuestConfirm", {
      firstName,
      lastName,
      phone,
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
      <BookingProgressBar step={4} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.service}>{serviceName}</Text>
          {isFetching && (
            <ActivityIndicator size="small" color={PRIMARY} style={{ marginLeft: 8 }} />
          )}
        </View>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Učitavanje slobodnih termina...</Text>
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
          <Text style={styles.emptySubtitle}>Svi termini za ovaj dan su zauzeti</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Izaberi drugi datum</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          <Text style={styles.availableLabel}>{availableCount} slobodnih termina</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  service: { fontSize: 16, fontWeight: "700", color: "#111827" },
  date: { fontSize: 13, color: PRIMARY, fontWeight: "500", marginTop: 2 },

  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { color: "#6B7280", marginTop: 12 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151", textAlign: "center" },
  emptySubtitle: { fontSize: 13, color: "#6B7280", marginTop: 4, textAlign: "center" },
  backBtn: {
    marginTop: 20,
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  backBtnText: { color: "#FFFFFF", fontWeight: "600" },

  grid: { padding: 16, paddingBottom: 40 },
  availableLabel: { fontSize: 13, color: "#6B7280", marginBottom: 14, fontWeight: "500" },
  slotsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  slot: {
    width: "30%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1.5,
  },
  slotFree: { backgroundColor: "#FFFFFF", borderColor: PRIMARY },
  slotTaken: { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
  slotText: { fontSize: 15, fontWeight: "600" },
  slotTextFree: { color: PRIMARY },
  slotTextTaken: { color: "#D1D5DB" },
});
