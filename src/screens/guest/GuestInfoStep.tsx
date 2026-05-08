import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthStackParamList } from "../../navigation/types";
import { PremiumInput } from "../../components/PremiumInput";
import { GradientButton } from "../../components/GradientButton";
import { BookingProgressBar } from "../../components/BookingProgressBar";
import { useGuestExitButton } from "./useGuestExitButton";

type Props = NativeStackScreenProps<AuthStackParamList, "GuestInfo">;

// Serbian phone format: optional +381 prefix, allow spaces/dashes/parens, 9-15 digits.
const PHONE_REGEX = /^(\+?381\s?[-\s]?)?0?6[0-9]([-\s]?\d){6,8}$/;

const guestInfoSchema = z.object({
  first_name: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
  last_name: z.string().min(2, "Prezime mora imati najmanje 2 karaktera"),
  phone: z
    .string()
    .min(9, "Unesite ispravan broj telefona")
    .refine(
      (v) => PHONE_REGEX.test(v.replace(/\s+/g, "")),
      "Unesite ispravan srpski broj telefona (npr. 0641234567 ili +381641234567)"
    ),
});
type GuestInfoForm = z.infer<typeof guestInfoSchema>;

export default function GuestInfoStep({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  useGuestExitButton(navigation);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestInfoForm>({
    resolver: zodResolver(guestInfoSchema) as Resolver<GuestInfoForm>,
    defaultValues: { first_name: "", last_name: "", phone: "" },
  });

  function onSubmit(data: GuestInfoForm) {
    navigation.navigate("GuestService", {
      firstName: data.first_name.trim(),
      lastName: data.last_name.trim(),
      phone: data.phone.trim(),
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <BookingProgressBar step={1} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Vaši podaci</Text>
          <Text style={styles.subheading}>
            Potrebni su nam vaši podaci da ordinacija može da vas kontaktira u vezi termina
          </Text>

          <View style={styles.card}>
            <Controller
              control={control}
              name="first_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <PremiumInput
                  label="Ime *"
                  placeholder="npr. Marko"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.first_name?.message}
                  returnKeyType="next"
                  autoCapitalize="words"
                />
              )}
            />
            <Controller
              control={control}
              name="last_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <PremiumInput
                  label="Prezime *"
                  placeholder="npr. Petrović"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.last_name?.message}
                  returnKeyType="next"
                  autoCapitalize="words"
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <PremiumInput
                  label="Broj telefona *"
                  placeholder="npr. 0641234567"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />
              )}
            />
          </View>

          <GradientButton label="Dalje" onPress={handleSubmit(onSubmit)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  flex: { flex: 1 },
  scroll: { padding: 20 },
  heading: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 6 },
  subheading: { fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 19 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
});
