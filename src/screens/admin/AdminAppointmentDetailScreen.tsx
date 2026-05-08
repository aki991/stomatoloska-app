import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInMinutes } from "date-fns";
import { sr } from "date-fns/locale";
import Toast from "react-native-toast-message";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";
import { Appointment, Service } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { GradientButton } from "../../components/GradientButton";
import { cancelAppointmentNotifications } from "../../services/notificationService";
import {
  AdminDashboardStackParamList,
  AdminCalendarStackParamList,
} from "../../navigation/types";

type Props =
  | NativeStackScreenProps<AdminDashboardStackParamList, "AdminAppointmentDetail">
  | NativeStackScreenProps<AdminCalendarStackParamList, "AdminAppointmentDetail">;

type AdminApptDetail = Appointment & {
  service: Pick<Service, "id" | "name" | "duration_minutes" | "price"> | null;
  patient: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
};

const PRIMARY = "#2D7D6E";

function describeError(err: any): string {
  if (!err) return "Greška";
  const code = err.code ? `[${err.code}] ` : "";
  const msg = err.message ?? String(err);
  return `${code}${msg}`;
}

function useAppointment(id: string) {
  return useQuery<AdminApptDetail>({
    queryKey: ["admin", "appointment", id],
    queryFn: async () => {
      const r = await supabase
        .from("appointments")
        .select(
          `*, service:services(id, name, duration_minutes, price),
           patient:profiles!patient_id(id, first_name, last_name, phone)`
        )
        .eq("id", id)
        .single();
      console.log("[AdminApptDetail] appointment response:", {
        status: r.status,
        error: r.error,
        patient: r.data?.patient,
      });
      if (r.error) throw r.error;
      return r.data as AdminApptDetail;
    },
  });
}

// Email lives on auth.users, not profiles. Pull it via the SECURITY DEFINER
// RPC `get_user_email` (see migrations/008_get_user_email.sql).
function usePatientEmail(patientId: string | null | undefined) {
  return useQuery<string | null>({
    queryKey: ["admin", "patient-email", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const r = await supabase.rpc("get_user_email", { user_id: patientId });
      if (r.error) {
        console.log("[AdminApptDetail] get_user_email error:", r.error);
        return null;
      }
      return (r.data as string | null) ?? null;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export default function AdminAppointmentDetailScreen({ route, navigation }: Props) {
  const { appointmentId } = route.params;
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: appt, isLoading, error, refetch } = useAppointment(appointmentId);
  const { data: patientEmail } = usePatientEmail(appt?.patient?.id);

  const [notesDraft, setNotesDraft] = useState("");
  useEffect(() => {
    setNotesDraft(appt?.admin_notes ?? "");
  }, [appt?.admin_notes]);

  const invalidateLists = () =>
    queryClient.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) && q.queryKey[0] === "admin",
    });

  const setStatusMutation = useMutation({
    mutationFn: async (next: {
      status: Appointment["status"];
      cancellation_reason?: string;
    }) => {
      const patch: Record<string, unknown> = { status: next.status };
      if (next.status === "cancelled") {
        patch.cancelled_at = new Date().toISOString();
        patch.cancelled_by = user?.id ?? null;
        patch.cancellation_reason =
          next.cancellation_reason ?? "Otkazano od strane administratora";
      }
      const r = await supabase
        .from("appointments")
        .update(patch)
        .eq("id", appointmentId);
      if (r.error) throw r.error;
      if (next.status === "cancelled") {
        cancelAppointmentNotifications(appointmentId).catch(() => {});
      }
    },
    onSuccess: async (_void, vars) => {
      await invalidateLists();
      await refetch();
      Toast.show({
        type: "success",
        text1:
          vars.status === "cancelled"
            ? "Termin otkazan"
            : vars.status === "completed"
            ? "Termin označen kao završen"
            : vars.status === "no_show"
            ? "Pacijent nije došao"
            : "Status ažuriran",
      });
    },
    onError: (err: any) => {
      Alert.alert("Greška", describeError(err));
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const r = await supabase
        .from("appointments")
        .update({ admin_notes: notes || null })
        .eq("id", appointmentId);
      if (r.error) throw r.error;
    },
    onSuccess: async () => {
      await invalidateLists();
      await refetch();
      Toast.show({ type: "success", text1: "Napomena sačuvana" });
    },
    onError: (err: any) => {
      Alert.alert("Greška", describeError(err));
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }
  if (error || !appt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Greška pri učitavanju</Text>
          <Text style={styles.errorDetail} selectable>
            {describeError(error)}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Pokušaj ponovo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const startsAt = new Date(appt.starts_at);
  const endsAt = new Date(appt.ends_at);
  const now = new Date();
  const isPast = now >= startsAt;
  const isUpcoming =
    (appt.status === "pending" || appt.status === "confirmed") && !isPast;
  const isPastUnresolved =
    (appt.status === "pending" || appt.status === "confirmed") && isPast;

  const isWalkIn = !appt.patient && !!appt.walk_in_name;

  const patientName = appt.patient
    ? [appt.patient.first_name, appt.patient.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || "Pacijent"
    : appt.walk_in_name ?? "Nepoznat pacijent";

  const patientPhone = appt.patient?.phone ?? appt.walk_in_phone ?? null;

  const durationMin = appt.service?.duration_minutes
    ?? differenceInMinutes(endsAt, startsAt);

  const dateLabelRaw = format(startsAt, "EEEE, d. MMMM yyyy", { locale: sr });
  const dateLabel =
    dateLabelRaw.charAt(0).toUpperCase() + dateLabelRaw.slice(1);
  const timeLabel = `${format(startsAt, "HH:mm")} – ${format(endsAt, "HH:mm")}`;

  const confirmCancel = () => {
    Alert.alert(
      "Otkaži termin",
      "Da li ste sigurni da želite da otkažete ovaj termin? Pacijent će biti obavešten.",
      [
        { text: "Ne", style: "cancel" },
        {
          text: "Otkaži",
          style: "destructive",
          onPress: () => setStatusMutation.mutate({ status: "cancelled" }),
        },
      ]
    );
  };

  const confirmComplete = () => {
    Alert.alert(
      "Označi kao završen",
      "Označiti termin kao uspešno završen?",
      [
        { text: "Ne", style: "cancel" },
        {
          text: "Da",
          onPress: () => setStatusMutation.mutate({ status: "completed" }),
        },
      ]
    );
  };

  const confirmNoShow = () => {
    Alert.alert(
      "Pacijent nije došao",
      "Označiti da se pacijent nije pojavio?",
      [
        { text: "Ne", style: "cancel" },
        {
          text: "Da",
          style: "destructive",
          onPress: () => setStatusMutation.mutate({ status: "no_show" }),
        },
      ]
    );
  };

  const onReschedule = () => {
    if (!appt.service) {
      Alert.alert("Greška", "Usluga nije dostupna za pomeranje termina.");
      return;
    }
    // AdminBookingDate lives in AdminDashboardStack (Dashboard tab).
    // Navigate to the Dashboard tab first, then push the booking screen within it.
    // This works whether we're currently in the Dashboard or Calendar stack.
    (navigation as any).navigate("Dashboard", {
      screen: "AdminBookingDate",
      params: {
        patientId: appt.patient?.id ?? null,
        patientName,
        walkInPhone: appt.walk_in_phone ?? undefined,
        serviceId: appt.service.id,
        serviceName: appt.service.name,
        durationMinutes: appt.service.duration_minutes,
        price: appt.service.price,
        existingAppointmentId: appointmentId,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>Detalji termina</Text>
            <View style={styles.heroRow}>
              <Text style={styles.heroService} numberOfLines={2}>
                {appt.service?.name ?? "Pregled"}
              </Text>
              <StatusBadge status={appt.status} />
            </View>
          </View>

          {/* Patient */}
          <SectionTitle text="Pacijent" />
          <View style={styles.card}>
            <DetailRow icon="person-outline" label="Ime i prezime" value={patientName} />
            {isWalkIn && (
              <View style={styles.walkInPill}>
                <Ionicons name="alert-circle-outline" size={12} color="#92400E" />
                <Text style={styles.walkInPillText}>Bez naloga</Text>
              </View>
            )}
            {patientPhone ? (
              <>
                <Sep />
                <ActionRow
                  icon="call-outline"
                  label="Telefon"
                  value={patientPhone}
                  onPress={() => {
                    const dial = patientPhone.replace(/[^+0-9]/g, "");
                    console.log("[AdminApptDetail] dial tel:", dial);
                    Linking.openURL(`tel:${dial}`).catch((err) =>
                      console.log("[AdminApptDetail] tel failed:", err)
                    );
                  }}
                />
              </>
            ) : null}
            {patientEmail ? (
              <>
                <Sep />
                <ActionRow
                  icon="mail-outline"
                  label="Email"
                  value={patientEmail}
                  onPress={() =>
                    Linking.openURL(`mailto:${patientEmail}`).catch((err) =>
                      console.log("[AdminApptDetail] mailto failed:", err)
                    )
                  }
                />
              </>
            ) : null}
          </View>

          {/* Termin */}
          <SectionTitle text="Termin" />
          <View style={styles.card}>
            <DetailRow icon="calendar-outline" label="Datum" value={dateLabel} />
            <Sep />
            <DetailRow icon="time-outline" label="Vreme" value={timeLabel} />
            <Sep />
            <DetailRow
              icon="hourglass-outline"
              label="Trajanje"
              value={`${durationMin} min`}
            />
            {appt.service?.price != null ? (
              <>
                <Sep />
                <DetailRow
                  icon="cash-outline"
                  label="Cena"
                  value={`${appt.service.price.toLocaleString("sr-RS")} RSD`}
                />
              </>
            ) : null}
          </View>

          {/* Notes */}
          <SectionTitle text="Napomene" />
          <View style={styles.card}>
            <TextInput
              style={styles.notesInput}
              placeholder="Dodaj napomenu (vidi samo administrator)…"
              placeholderTextColor="#9CA3AF"
              value={notesDraft}
              onChangeText={setNotesDraft}
              multiline
              textAlignVertical="top"
            />
          </View>
          <GradientButton
            label="Sačuvaj napomenu"
            onPress={() => saveNotesMutation.mutate(notesDraft.trim())}
            loading={saveNotesMutation.isPending}
            disabled={notesDraft.trim() === (appt.admin_notes?.trim() ?? "")}
            style={{ marginTop: 4, marginBottom: 22 }}
          />

          {/* Actions */}
          {isUpcoming && (
            <>
              <SectionTitle text="Akcije" />
              <GradientButton
                label="Pomeri termin"
                variant="secondary"
                onPress={onReschedule}
                style={{ marginBottom: 10 }}
              />
              <TouchableOpacity
                style={styles.dangerBtn}
                onPress={confirmCancel}
                disabled={setStatusMutation.isPending}
              >
                <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.dangerBtnText}>Otkaži termin</Text>
              </TouchableOpacity>
            </>
          )}

          {isPastUnresolved && (
            <>
              <SectionTitle text="Akcije" />
              <GradientButton
                label="Označi kao završen"
                onPress={confirmComplete}
                loading={
                  setStatusMutation.isPending &&
                  setStatusMutation.variables?.status === "completed"
                }
                style={{ marginBottom: 10 }}
              />
              <TouchableOpacity
                style={styles.dangerBtn}
                onPress={confirmNoShow}
                disabled={setStatusMutation.isPending}
              >
                <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.dangerBtnText}>Pacijent nije došao</Text>
              </TouchableOpacity>
            </>
          )}

          {appt.status === "cancelled" && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
              <Text style={styles.infoText}>
                Termin je otkazan
                {appt.cancelled_at
                  ? ` ${format(new Date(appt.cancelled_at), "d. M. yyyy. 'u' HH:mm")}`
                  : ""}
                {appt.cancellation_reason
                  ? `\nRazlog: ${appt.cancellation_reason}`
                  : ""}
              </Text>
            </View>
          )}

          {(appt.status === "completed" || appt.status === "no_show") && (
            <View style={styles.infoBox}>
              <Ionicons
                name={
                  appt.status === "completed"
                    ? "checkmark-circle-outline"
                    : "alert-circle-outline"
                }
                size={18}
                color={appt.status === "completed" ? PRIMARY : "#92400E"}
              />
              <Text style={styles.infoText}>
                {appt.status === "completed"
                  ? "Termin je uspešno završen."
                  : "Pacijent se nije pojavio."}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionTitle({ text }: { text: string }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={PRIMARY} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={PRIMARY} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, styles.rowValueLink]}>{value}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function Sep() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  scroll: { padding: 20 },

  errorTitle: { fontSize: 16, fontWeight: "700", color: "#374151", marginBottom: 8 },
  errorDetail: {
    color: "#B91C1C",
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  retryText: { color: "#FFFFFF", fontWeight: "700" },

  // Hero
  hero: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 3,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: PRIMARY,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroService: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.3,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#F5F9F7",
    borderWidth: 1,
    borderColor: "#C8E6DF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  rowValueLink: { color: PRIMARY, textDecorationLine: "underline" },
  chevron: { fontSize: 22, color: "#9CA3AF", marginLeft: 4 },
  sep: { height: 1, backgroundColor: "#F3F4F6" },

  walkInPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 60,
    marginBottom: 10,
    marginTop: -4,
  },
  walkInPillText: {
    color: "#92400E",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  notesInput: {
    fontSize: 15,
    color: "#111827",
    minHeight: 110,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },

  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  dangerBtnText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 15,
  },

  infoBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 13, color: "#4B5563", lineHeight: 19 },
});
