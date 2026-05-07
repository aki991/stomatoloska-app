import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";
import { editProfileSchema, EditProfileFormData } from "../../schemas/authSchemas";
import { ProfileStackParamList } from "../../navigation/types";
import { Profile } from "../../types";
import { PremiumInput } from "../../components/PremiumInput";
import { GradientButton } from "../../components/GradientButton";

type Props = NativeStackScreenProps<ProfileStackParamList, "EditProfile">;

export default function EditProfileScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

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
    formState: { errors, isSubmitting },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { first_name: "", last_name: "", phone: "" },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      phone: profile.phone ?? "",
    });
  }, [profile]);

  async function onSubmit(data: EditProfileFormData) {
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        phone: data.phone || null,
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

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Read-only info */}
        <Text style={styles.sectionLabel}>Nepromenjivo</Text>
        <View style={styles.readOnlyCard}>
          <ReadOnlyRow label="Email" value={profile?.email ?? user?.email ?? "—"} />
          <View style={styles.rowDivider} />
          <ReadOnlyRow
            label="Datum rođenja"
            value={
              profile?.date_of_birth
                ? new Date(profile.date_of_birth).toLocaleDateString("sr-RS")
                : "Nije uneto"
            }
          />
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 20, paddingBottom: 40 },

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
  rowDivider: { height: 1, backgroundColor: "#F9FAFB" },

  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#111827",
  },
  inputError: { borderColor: "#EF4444" },
  fieldError: { fontSize: 12, color: "#EF4444", marginTop: 4 },

  saveBtn: {
    backgroundColor: "#2D7D6E",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  cancelBtnText: { color: "#6B7280", fontWeight: "600", fontSize: 15 },
});
