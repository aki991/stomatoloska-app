import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Toast from "react-native-toast-message";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";
import { changePasswordSchema, ChangePasswordFormData } from "../../schemas/authSchemas";
import { ProfileStackParamList } from "../../navigation/types";
import { PremiumInput } from "../../components/PremiumInput";
import { GradientButton } from "../../components/GradientButton";

type Props = NativeStackScreenProps<ProfileStackParamList, "ChangePassword">;

export default function ChangePasswordScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(data: ChangePasswordFormData) {
    // Verify current password by re-authenticating
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: data.current_password,
    });

    if (authError) {
      setError("current_password", { message: "Trenutna lozinka nije tačna" });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: data.new_password });

    if (error) {
      Toast.show({ type: "error", text1: "Greška", text2: error.message });
      return;
    }

    Toast.show({ type: "success", text1: "Lozinka uspešno promenjena" });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Nova lozinka mora imati najmanje 8 karaktera, jedno veliko slovo i jedan broj.
          </Text>
        </View>

        <Controller
          control={control}
          name="current_password"
          render={({ field: { onChange, onBlur, value } }) => (
            <PremiumInput
              label="Trenutna lozinka"
              placeholder="••••••••"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.current_password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="new_password"
          render={({ field: { onChange, onBlur, value } }) => (
            <PremiumInput
              label="Nova lozinka"
              placeholder="••••••••"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.new_password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirm_password"
          render={({ field: { onChange, onBlur, value } }) => (
            <PremiumInput
              label="Potvrda nove lozinke"
              placeholder="••••••••"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.confirm_password?.message}
            />
          )}
        />

        <GradientButton
          label="Promeni lozinku"
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
  scroll: { padding: 20 },

  hint: {
    backgroundColor: "#F5F9F7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  hintText: { fontSize: 13, color: "#1F5A4F", lineHeight: 20 },

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
