import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO, addMinutes } from "date-fns";
import { sr } from "date-fns/locale";
import Toast from "react-native-toast-message";
import { supabase } from "../../../services/supabase";
import { AdminDashboardStackParamList } from "../../../navigation/types";
import { GradientButton } from "../../../components/GradientButton";
import { BookingProgressBar } from "../../../components/BookingProgressBar";
import { useBookingExitButton } from "./useBookingExitButton";

type Props = NativeStackScreenProps<AdminDashboardStackParamList, "AdminBookingConfirm">;

const PRIMARY = "#2D7D6E";

function formatPrice(p: number) {
  return `${p.toLocaleString("sr-RS")} RSD`;
}

export default function AdminBookingConfirmStep({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const {
    patientId, patientName, walkInPhone,
    serviceId, serviceName, durationMinutes, price,
    selectedDate, selectedTime, existingAppointmentId,
  } = route.params;
  const isReschedule = !!existingAppointmentId;

  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(false);
  useBookingExitButton(navigation, loading);

  const startsAt = parseISO(`${selectedDate}T${selectedTime}:00`);
  const endsAt = addMinutes(startsAt, durationMinutes);
  const displayDate = format(startsAt, "EEEE, d. MMMM yyyy", { locale: sr });
  const displayTime = `${format(startsAt, "HH:mm")} – ${format(endsAt, "HH:mm")}`;

  async function confirm() {
    setLoading(true);
    try {
      let error: any = null;

      if (isReschedule) {
        const result = await supabase
          .from("appointments")
          .update({
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            admin_notes: adminNotes.trim() || null,
          })
          .eq("id", existingAppointmentId!);
        error = result.error;
        console.log("[AdminBookingConfirm] UPDATE response:", { error: error?.message ?? null });
      } else {
        type InsertPayload = {
          service_id: string;
          starts_at: string;
          ends_at: string;
          status: string;
          admin_notes: string | null;
          patient_id?: string;
          walk_in_name?: string;
          walk_in_phone?: string;
        };

        const payload: InsertPayload = {
          service_id: serviceId,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "confirmed",
          admin_notes: adminNotes.trim() || null,
        };

        if (patientId) {
          payload.patient_id = patientId;
        } else {
          payload.walk_in_name = patientName;
          payload.walk_in_phone = walkInPhone ?? "";
        }

        console.log("[AdminBookingConfirm] inserting:", payload);
        const result = await supabase
          .from("appointments")
          .insert(payload)
          .select("id")
          .single();
        error = result.error;
        console.log("[AdminBookingConfirm] INSERT response:", { error: error?.message ?? null });
      }

      if (error) {
        if (
          error.code === "23P01" ||
          error.message?.toLowerCase().includes("overlap") ||
          error.message?.toLowerCase().includes("conflict")
        ) {
          Alert.alert(
            "Termin zauzet",
            "Ovaj termin se preklapa sa postojećim. Izaberite drugo vreme.",
            [{ text: "Nazad", onPress: () => navigation.goBack() }]
          );
        } else {
          const detail =
            (error.code ? `[${error.code}] ` : "") +
            (error.message ?? "Pokušajte ponovo.") +
            (error.details ? `\nDetails: ${error.details}` : "");
          Alert.alert(isReschedule ? "Greška pri pomeranju" : "Greška pri zakazivanju", detail);
        }
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["admin", "today-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments_day", selectedDate] });
      if (isReschedule) {
        queryClient.invalidateQueries({ queryKey: ["admin", "appointment", existingAppointmentId] });
      }

      Toast.show({
        type: "success",
        text1: isReschedule ? "Termin pomeren" : "Termin zakazan",
        text2: `${patientName} · ${selectedTime}`,
      });

      navigation.navigate("DashboardMain");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <BookingProgressBar step={5} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>{isReschedule ? "Pomeri termin" : "Potvrda termina"}</Text>
        <Text style={styles.subheading}>{isReschedule ? "Novo vreme termina" : "Proverite detalje pre potvrde"}</Text>

        {/* Summary card */}
        <View style={styles.card}>
          <SummaryRow icon="person-outline" label="Pacijent" value={patientName} />
          {!patientId && walkInPhone && (
            <>
              <Divider />
              <SummaryRow icon="call-outline" label="Telefon" value={walkInPhone} />
            </>
          )}
          <Divider />
          <SummaryRow icon="medical-outline" label="Usluga" value={serviceName} />
          <Divider />
          <SummaryRow icon="calendar-outline" label="Datum" value={displayDate} />
          <Divider />
          <SummaryRow icon="time-outline" label="Vreme" value={displayTime} />
          <Divider />
          <SummaryRow icon="hourglass-outline" label="Trajanje" value={`${durationMinutes} min`} />
          <Divider />
          <SummaryRow icon="cash-outline" label="Cena" value={formatPrice(price)} highlight />
        </View>

        {/* Admin notes */}
        <Text style={styles.sectionTitle}>Napomena (opciono)</Text>
        <View style={styles.notesCard}>
          <TextInput
            style={styles.notesInput}
            placeholder="Interna napomena za ovaj termin..."
            placeholderTextColor="#9CA3AF"
            value={adminNotes}
            onChangeText={setAdminNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <GradientButton
          label={isReschedule ? "Potvrdi pomeranje" : "Potvrdi termin"}
          onPress={confirm}
          loading={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color="#9CA3AF" style={styles.rowIcon} />
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { padding: 20 },

  heading: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  subheading: { fontSize: 13, color: "#6B7280", marginBottom: 20 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowIcon: { flexShrink: 0, width: 20 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  rowValue: { fontSize: 15, color: "#111827", fontWeight: "600" },
  rowValueHighlight: { color: PRIMARY, fontSize: 16 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginHorizontal: 16 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  notesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 20,
  },
  notesInput: {
    fontSize: 15,
    color: "#1A1A1A",
    minHeight: 80,
  },
});
