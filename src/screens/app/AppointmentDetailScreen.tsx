import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  format,
  differenceInMinutes,
  differenceInHours,
} from "date-fns";
import { sr } from "date-fns/locale";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";
import { cancelAppointmentNotifications } from "../../services/notificationService";
import { AppointmentWithService } from "../../types";
import { TerminiStackParamList, HomeStackParamList } from "../../navigation/types";
import { StatusBadge } from "../../components/StatusBadge";
import { LinearGradient } from "expo-linear-gradient";

type Props =
  | NativeStackScreenProps<TerminiStackParamList, "AppointmentDetail">
  | NativeStackScreenProps<HomeStackParamList, "AppointmentDetail">;


// ─── Data ─────────────────────────────────────────────────────────────────────

function useAppointment(id: string) {
  return useQuery<AppointmentWithService>({
    queryKey: ["appointment", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, service:services(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as AppointmentWithService;
    },
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppointmentDetailScreen({ route, navigation }: Props) {
  const { appointmentId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const { data: appt, isLoading, error } = useAppointment(appointmentId);
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2D7D6E" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !appt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Termin nije pronađen</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>Nazad</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const startsAt = new Date(appt.starts_at);
  const endsAt = new Date(appt.ends_at);
  const durationMin = differenceInMinutes(endsAt, startsAt);
  const hoursUntil = differenceInHours(startsAt, new Date());

  const isCancellable =
    (appt.status === "confirmed" || appt.status === "pending") &&
    hoursUntil > 24;

  const isInFuture =
    (appt.status === "confirmed" || appt.status === "pending") &&
    startsAt > new Date();

  async function handleCancel(reason: string) {
    if (!user) return;
    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason.trim() || null,
      })
      .eq("id", appointmentId)
      .eq("patient_id", user.id);

    if (error) {
      Alert.alert("Greška", error.message ?? "Pokušajte ponovo.");
      return;
    }

    // Delete unsent notification rows for this appointment
    cancelAppointmentNotifications(appointmentId).catch(() => {});

    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["next-appointment"] });
    queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId] });

    setShowCancelModal(false);

    // Navigate to AppointmentsList with flash if in TerminiStack, else just go back
    const routeNames: string[] = (navigation.getState()?.routeNames as string[]) ?? [];
    if (routeNames.includes("AppointmentsList")) {
      (navigation as any).navigate("AppointmentsList", {
        flash: "Termin je uspešno otkazan",
      });
    } else {
      navigation.goBack();
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* Service + Status */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={["#2D7D6E", "#1F5A4F"]}
            style={styles.heroAccent}
          />
          <View style={styles.heroBody}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroService} numberOfLines={2}>
                {appt.service?.name ?? "Pregled"}
              </Text>
              <StatusBadge status={appt.status} />
            </View>
          </View>
        </View>

        {/* Details card */}
        <View style={styles.detailCard}>
          <DetailRow
            icon="📅"
            label="Datum"
            value={format(startsAt, "EEEE, d. MMMM yyyy", { locale: sr })}
          />
          <Divider />
          <DetailRow
            icon="🕐"
            label="Vreme"
            value={`${format(startsAt, "HH:mm")} – ${format(endsAt, "HH:mm")}`}
          />
          <Divider />
          <DetailRow icon="⏱" label="Trajanje" value={`${durationMin} min`} />
          {appt.service?.price != null && (
            <>
              <Divider />
              <DetailRow
                icon="💰"
                label="Cena"
                value={`${appt.service.price.toLocaleString("sr-RS")} RSD`}
                highlight
              />
            </>
          )}
          {appt.service?.description && (
            <>
              <Divider />
              <DetailRow
                icon="📋"
                label="Opis usluge"
                value={appt.service.description}
              />
            </>
          )}
          {appt.notes && (
            <>
              <Divider />
              <DetailRow icon="🗒" label="Napomene" value={appt.notes} />
            </>
          )}
          {appt.cancellation_reason && (
            <>
              <Divider />
              <DetailRow
                icon="❌"
                label="Razlog otkazivanja"
                value={appt.cancellation_reason}
              />
            </>
          )}
        </View>

        {/* Cancel section */}
        {isInFuture && (
          <View style={styles.cancelSection}>
            {isCancellable ? (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCancelModal(true)}
              >
                <Text style={styles.cancelBtnText}>Otkaži termin</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.noCancel}>
                <Text style={styles.noCancelText}>
                  ⚠️  Termin se ne može otkazati — manje od 24h do termina
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Cancel modal */}
      <CancelModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
      />
    </SafeAreaView>
  );
}

// ─── Cancel modal ─────────────────────────────────────────────────────────────

function CancelModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await onConfirm(reason);
      setReason("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Otkaži termin</Text>
          <Text style={styles.modalSubtitle}>
            Da li ste sigurni da želite da otkažete ovaj termin?
          </Text>

          <Text style={styles.inputLabel}>Razlog (opciono)</Text>
          <TextInput
            style={styles.input}
            placeholder="Unesite razlog otkazivanja..."
            placeholderTextColor="#9CA3AF"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.modalCancelText}>Odustani</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, loading && { opacity: 0.7 }]}
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalConfirmText}>Da, otkaži</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({
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
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  scroll: { padding: 20 },

  errorText: { fontSize: 16, color: "#374151", marginBottom: 16 },
  backBtn: {
    backgroundColor: "#2D7D6E",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  backBtnText: { color: "#FFFFFF", fontWeight: "600" },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
    overflow: "hidden",
  },
  heroAccent: { width: 5 },
  heroBody: { flex: 1, padding: 20 },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  heroService: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
    flex: 1,
    letterSpacing: -0.3,
  },

  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  detailIcon: { fontSize: 18, width: 26, textAlign: "center", paddingTop: 1 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.4 },
  detailValue: { fontSize: 15, color: "#111827", fontWeight: "500" },
  detailValueHighlight: { color: "#2D7D6E", fontWeight: "700", fontSize: 17 },
  divider: { height: 1, backgroundColor: "#F9FAFB", marginHorizontal: 16 },

  cancelSection: { marginTop: 4 },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: "#EF4444",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  cancelBtnText: { color: "#EF4444", fontWeight: "700", fontSize: 15 },
  noCancel: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 14,
  },
  noCancelText: { fontSize: 13, color: "#92400E", lineHeight: 18 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 80,
    backgroundColor: "#F9FAFB",
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: { color: "#6B7280", fontWeight: "600", fontSize: 15 },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalConfirmText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
