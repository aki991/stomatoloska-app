import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { format, parseISO, addMinutes } from "date-fns";
import { sr } from "date-fns/locale";
import { supabase } from "../../services/supabase";
import { AuthStackParamList } from "../../navigation/types";
import { GradientButton } from "../../components/GradientButton";
import { BookingProgressBar } from "../../components/BookingProgressBar";
import { useGuestExitButton } from "./useGuestExitButton";

type Props = NativeStackScreenProps<AuthStackParamList, "GuestConfirm">;

const PRIMARY = "#2D7D6E";

function formatPrice(p: number) {
  return `${p.toLocaleString("sr-RS")} RSD`;
}

export default function GuestConfirmStep({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const {
    firstName, lastName, phone,
    serviceId, serviceName, durationMinutes, price,
    selectedDate, selectedTime,
  } = route.params;

  const [loading, setLoading] = useState(false);
  useGuestExitButton(navigation, loading);

  const startsAt = parseISO(`${selectedDate}T${selectedTime}:00`);
  const endsAt = addMinutes(startsAt, durationMinutes);
  const displayDate = format(startsAt, "EEEE, d. MMMM yyyy", { locale: sr });
  const displayTime = `${format(startsAt, "HH:mm")} – ${format(endsAt, "HH:mm")}`;
  const fullName = `${firstName} ${lastName}`;

  async function confirm() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("create_guest_appointment", {
        p_walk_in_name: fullName,
        p_walk_in_phone: phone,
        p_service_id: serviceId,
        p_starts_at: startsAt.toISOString(),
        p_ends_at: endsAt.toISOString(),
      });

      console.log("[GuestConfirm] RPC response:", { data, error });

      if (error) {
        if (
          error.code === "23P01" ||
          error.message?.toLowerCase().includes("overlap") ||
          error.message?.toLowerCase().includes("conflict")
        ) {
          Alert.alert(
            "Termin zauzet",
            "Neko je upravo zakazao ovaj termin. Molimo izaberite drugi.",
            [{ text: "Izaberi drugi termin", onPress: () => navigation.goBack() }]
          );
        } else {
          const detail =
            (error.code ? `[${error.code}] ` : "") +
            (error.message ?? "Pokušajte ponovo.") +
            (error.details ? `\nDetails: ${error.details}` : "") +
            (error.hint ? `\nHint: ${error.hint}` : "");
          Alert.alert("Greška pri zakazivanju", detail);
        }
        return;
      }

      navigation.replace("GuestSuccess", {
        firstName,
        serviceName,
        selectedDate,
        selectedTime,
      });
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
        <Text style={styles.heading}>Potvrda termina</Text>
        <Text style={styles.subheading}>Proverite detalje pre potvrde</Text>

        <View style={styles.card}>
          <SummaryRow icon="person-outline" label="Pacijent" value={fullName} />
          <Divider />
          <SummaryRow icon="call-outline" label="Telefon" value={phone} />
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

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={22} color="#92400E" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Pošto zakazujete kao gost, nećete moći da otkažete termin kroz aplikaciju. Za otkazivanje pozovite ordinaciju na +381 65 262 3054.
          </Text>
        </View>

        <GradientButton
          label="Potvrdi zakazivanje"
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
    marginBottom: 20,
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

  infoBox: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 14,
    marginBottom: 20,
    gap: 10,
    alignItems: "flex-start",
  },
  infoIcon: { marginTop: 1 },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
    fontWeight: "500",
  },
});
