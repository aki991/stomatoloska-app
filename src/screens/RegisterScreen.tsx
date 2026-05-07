import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerSchema, RegisterFormData } from "../schemas/authSchemas";
import { supabase } from "../services/supabase";
import { AuthStackNavProp } from "../navigation/types";
import { PremiumInput } from "../components/PremiumInput";
import { GradientButton } from "../components/GradientButton";
import { ScreenWrapper } from "../components/ScreenWrapper";
import { translateError } from "../utils/errorMessages";

export default function RegisterScreen() {
  const navigation = useNavigation<AuthStackNavProp>();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { first_name: data.first_name, last_name: data.last_name },
      },
    });
    setIsLoading(false);
    if (error) {
      Alert.alert("Greška", translateError(error.message));
    } else {
      Alert.alert(
        "Nalog kreiran",
        "Proverite email za potvrdu naloga.",
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
            showsVerticalScrollIndicator={false}
          >
            {/* Logo + Brand */}
            <View style={styles.brandSection}>
              <View style={styles.logoWrap}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.welcomeSmall}>Dobrodošli u</Text>
              <Text style={styles.appName}>VenusApp</Text>
              <Text style={styles.appSub}>stomatološka ordinacija</Text>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Registracija</Text>
              <Text style={styles.formSub}>Kreirajte novi nalog</Text>

              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Controller
                    control={control}
                    name="first_name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <PremiumInput
                        label="Ime"
                        placeholder="Marko"
                        autoCapitalize="words"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.first_name?.message}
                      />
                    )}
                  />
                </View>
                <View style={styles.nameField}>
                  <Controller
                    control={control}
                    name="last_name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <PremiumInput
                        label="Prezime"
                        placeholder="Marković"
                        autoCapitalize="words"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.last_name?.message}
                      />
                    )}
                  />
                </View>
              </View>

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PremiumInput
                    label="Email adresa"
                    placeholder="vas@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PremiumInput
                    label="Lozinka"
                    placeholder="••••••••"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirm_password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PremiumInput
                    label="Potvrdite lozinku"
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
                label="Registruj se"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                style={{ marginTop: 8 }}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Već imate nalog? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.footerLink}>Prijavite se</Text>
              </TouchableOpacity>
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
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40 },

  brandSection: { alignItems: "center", marginBottom: 32 },
  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: 26,
    backgroundColor: "#F5F9F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  logo: { width: 72, height: 72, alignSelf: "center" },
  welcomeSmall: {
    fontSize: 15,
    fontWeight: "300",
    color: "#9CA3AF",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  appName: {
    fontSize: 34,
    fontWeight: "800",
    color: "#2D7D6E",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  appSub: {
    fontSize: 14,
    fontWeight: "400",
    color: "#9CA3AF",
    letterSpacing: 0.2,
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
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  formSub: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "400",
    marginBottom: 20,
  },

  nameRow: { flexDirection: "row", gap: 12 },
  nameField: { flex: 1 },

  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { fontSize: 14, color: "#9CA3AF", fontWeight: "400" },
  footerLink: { fontSize: 14, color: "#2D7D6E", fontWeight: "700" },
});
