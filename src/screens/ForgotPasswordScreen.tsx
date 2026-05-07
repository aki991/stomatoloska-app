import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from "../schemas/authSchemas";
import { supabase } from "../services/supabase";
import { AuthStackNavProp } from "../navigation/types";
import { PremiumInput } from "../components/PremiumInput";
import { GradientButton } from "../components/GradientButton";
import { ScreenWrapper } from "../components/ScreenWrapper";
import { translateError } from "../utils/errorMessages";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<AuthStackNavProp>();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email);
    setIsLoading(false);
    if (error) {
      Alert.alert("Greška", translateError(error.message));
    } else {
      Alert.alert(
        "Email poslat",
        "Proverite email za link za resetovanje lozinke.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenWrapper>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Nazad</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Zaboravljena{"\n"}lozinka?</Text>
            <Text style={styles.subtitle}>
              Unesite email i poslaćemo vam link za resetovanje.
            </Text>

            <View style={styles.formCard}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PremiumInput
                    label="Email adresa"
                    placeholder="vas@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                  />
                )}
              />

              <GradientButton
                label="Pošalji link"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                style={{ marginTop: 4 }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: 28, paddingTop: 20 },
  backBtn: { marginBottom: 32, alignSelf: "flex-start" },
  backText: { fontSize: 15, color: "#2D7D6E", fontWeight: "600" },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
    marginBottom: 10,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "400",
    marginBottom: 32,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
});
