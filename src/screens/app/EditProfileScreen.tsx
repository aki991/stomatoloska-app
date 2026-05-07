import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";
import { editProfileSchema, EditProfileFormData } from "../../schemas/authSchemas";
import { ProfileStackParamList } from "../../navigation/types";
import { Profile } from "../../types";
import { PremiumInput } from "../../components/PremiumInput";
import { GradientButton } from "../../components/GradientButton";

type Props = NativeStackScreenProps<ProfileStackParamList, "EditProfile">;

const MAX_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d;
})();

export default function EditProfileScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      date_of_birth: "",
    },
  });

  const dobValue = watch("date_of_birth");

  useEffect(() => {
    if (!profile) return;
    reset({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      phone: profile.phone ?? "",
      date_of_birth: profile.date_of_birth ?? "",
    });
  }, [profile]);

  function onPickerChange(_: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS !== "ios") setPickerOpen(false);
    if (!picked) return;
    setValue("date_of_birth", format(picked, "yyyy-MM-dd"), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  async function onSubmit(data: EditProfileFormData) {
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        phone: data.phone || null,
        date_of_birth: data.date_of_birth || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user!.id);

    if (error) {
      Toast.show({ type: "error", text1: "Greška", text2: error.message });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    Toast.show({ type: "success", text1: "Profil uspešno ažuriran" });
    navigation.goBack();
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2D7D6E" />
        </View>
      </SafeAreaView>
    );
  }

  const dobDisplay = dobValue
    ? format(new Date(dobValue), "d. M. yyyy.")
    : "Izaberite datum rođenja";
  const dobInitial = dobValue ? new Date(dobValue) : MAX_DOB;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 100 + insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Read-only info */}
        <Text style={styles.sectionLabel}>Nepromenjivo</Text>
        <View style={styles.readOnlyCard}>
          <ReadOnlyRow label="Email" value={profile?.email ?? user?.email ?? "—"} />
        </View>

        {/* Editable fields */}
        <Text style={styles.sectionLabel}>Lični podaci</Text>
        <Controller
          control={control}
          name="first_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <PremiumInput
              label="Ime"
              placeholder="Vaše ime"
              autoCapitalize="words"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.first_name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="last_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <PremiumInput
              label="Prezime"
              placeholder="Vaše prezime"
              autoCapitalize="words"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.last_name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <PremiumInput
              label="Broj telefona"
              placeholder="+381 60 000 0000"
              keyboardType="phone-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.phone?.message}
            />
          )}
        />

        {/* Date of birth */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Datum rođenja</Text>
          <TouchableOpacity
            style={[
              styles.dateButton,
              errors.date_of_birth && styles.dateButtonError,
            ]}
            activeOpacity={0.7}
            onPress={() => setPickerOpen(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text
              style={[
                styles.dateButtonText,
                !dobValue && styles.dateButtonPlaceholder,
              ]}
            >
              {dobDisplay}
            </Text>
          </TouchableOpacity>
          {errors.date_of_birth ? (
            <Text style={styles.fieldError}>{errors.date_of_birth.message}</Text>
          ) : null}
        </View>

        {pickerOpen && (
          <DateTimePicker
            value={dobInitial}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={MAX_DOB}
            onChange={onPickerChange}
          />
        )}
        {pickerOpen && Platform.OS === "ios" && (
          <TouchableOpacity
            style={styles.iosDoneBtn}
            onPress={() => setPickerOpen(false)}
          >
            <Text style={styles.iosDoneText}>Gotovo</Text>
          </TouchableOpacity>
        )}

        <GradientButton
          label="Sačuvaj izmene"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          style={{ marginTop: 8, marginBottom: 12 }}
        />

        <GradientButton
          variant="secondary"
          label="Otkaži"
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readOnlyRow}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <Text style={styles.readOnlyValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 20 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },

  readOnlyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  readOnlyRow: { paddingVertical: 14, gap: 4 },
  readOnlyLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  readOnlyValue: { fontSize: 15, color: "#6B7280" },

  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateButtonError: { borderColor: "#EF4444" },
  dateButtonText: { fontSize: 15, color: "#111827", fontWeight: "500" },
  dateButtonPlaceholder: { color: "#9CA3AF", fontWeight: "400" },
  fieldError: { fontSize: 12, color: "#EF4444", marginTop: 4 },

  iosDoneBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  iosDoneText: { color: "#2D7D6E", fontWeight: "700", fontSize: 15 },
});
