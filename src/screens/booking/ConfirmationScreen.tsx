import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { GradientButton } from "../../components/GradientButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { format, parseISO, addMinutes } from "date-fns";
import { sr } from "date-fns/locale";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";
import { scheduleAppointmentNotifications } from "../../services/notificationService";
import { HomeStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "Confirmation">;

function formatPrice(price: number): string {
  return `${price.toLocaleString("sr-RS")} RSD`;
}

export default function ConfirmationScreen({ route, navigation }: Props) {
  const { serviceId, serviceName, durationMinutes, price, selectedDate, selectedTime } =
    route.params;
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const startsAt = parseISO(`${selectedDate}T${selectedTime}:00`);
  const endsAt = addMinutes(startsAt, durationMinutes);

  const displayDate = format(startsAt, "EEEE, d. MMMM yyyy", { locale: sr });
  const displayStart = format(startsAt, "HH:mm");
  const displayEnd = format(endsAt, "HH:mm");

  async function confirm() {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          patient_id: user.id,
          service_id: serviceId,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "confirmed",
        })
        .select("id")
        .single();

      if (error) {
        // EXCLUDE constraint: slot taken between our check and insert
        if (
          error.code === "23P01" ||
          error.message?.toLowerCase().includes("overlap") ||
          error.message?.toLowerCase().includes("conflict")
        ) {
          Alert.alert(
            "Termin zauzet",
            "Neko je upravo zakazao ovaj termin. Molimo izaberite drugi.",
            [
              {
                text: "Izaberi drugi termin",
                onPress: () =>
                  navigation.navigate("TimeSelection", {
                    serviceId,
                    serviceName,
                    durationMinutes,
                    price,
                    selectedDate,
                  }),
              },
            ]
          );
        } else {
          Alert.alert("Greška", error.message ?? "Pokušajte ponovo.");
        }
        return;
      }

      // Fire-and-forget: write notification rows to DB (cron sends them later)
      scheduleAppointmentNotifications(
        data.id,
        user.id,
        serviceName,
        startsAt
      ).catch(() => {});

      navigation.replace("Success", {
        serviceName,
        selectedDate,
        selectedTime,
        appointmentId: data.id,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.heading}>Potvrda termina</Text>
        <Text style={styles.subheading}>Proverite detalje pre potvrde</Text>

        <View style={styles.card}>
          <Row icon="🦷" label="Usluga" value={serviceName} />
          <Divider />
          <Row icon="📅" label="Datum" value={displayDate} />
          <Divider />
          <Row icon="🕐" label="Vreme" value={`${displayStart} – ${displayEnd}`} />
          <Divider />
          <Row icon="⏱" label="Trajanje" value={`${durationMinutes} min`} />
          <Divider />
          <Row icon="💰" label="Cena" value={formatPrice(price)} highlight />
        </View>

        <GradientButton
          label="Potvrdi termin"
          onPress={confirm}
          loading={loading}
          style={{ marginBottom: 12 }}
        />

        <GradientButton
          variant="secondary"
          label="Izmeni vreme"
          onPress={() => navigation.goBack()}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { flex: 1, padding: 20 },
  heading: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  subheading: { fontSize: 14, color: "#6B7280", marginBottom: 24 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 28,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowIcon: { fontSize: 20, width: 28, textAlign: "center" },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 12, color: "#9CA3AF", fontWeight: "500", marginBottom: 2 },
  rowValue: { fontSize: 15, color: "#111827", fontWeight: "600" },
  rowValueHighlight: { color: "#2D7D6E", fontSize: 17 },
  divider: { height: 1, backgroundColor: "#F9FAFB", marginHorizontal: 16 },
});
