import React, { useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginSchema, LoginFormData } from "../schemas/authSchemas";
import { supabase } from "../services/supabase";
import { AuthStackNavProp } from "../navigation/types";
import { PremiumInput } from "../components/PremiumInput";
import { GradientButton } from "../components/GradientButton";
import { ScreenWrapper } from "../components/ScreenWrapper";
import { translateError } from "../utils/errorMessages";

const REMEMBERED_EMAIL_KEY = "stomapp:remembered_email";

export default function LoginScreen() {
  const navigation = useNavigation<AuthStackNavProp>();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    AsyncStorage.getItem(REMEMBERED_EMAIL_KEY).then((saved) => {
      if (saved) setValue("email", saved);
    });
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setIsLoading(false);
    if (error) {
      Alert.alert("Greška pri prijavi", translateError(error.message));
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
              <Text style={styles.formTitle}>Prijava</Text>

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

              <TouchableOpacity
                style={styles.forgotRow}
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <Text style={styles.forgotText}>Zaboravili ste lozinku?</Text>
              </TouchableOpacity>

              <GradientButton
                label="Prijavi se"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Nemate nalog? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.footerLink}>Registrujte se</Text>
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

  brandSection: { alignItems: "center", marginBottom: 36 },
  logoWrap: {
    width: 108,
    height: 108,
    borderRadius: 28,
    backgroundColor: "#F5F9F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  logo: { width: 80, height: 80, alignSelf: "center" },
  welcomeSmall: {
    fontSize: 15,
    fontWeight: "300",
    color: "#9CA3AF",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  appName: {
    fontSize: 36,
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
    marginBottom: 20,
  },

  forgotRow: { alignItems: "flex-end", marginTop: -4, marginBottom: 20 },
  forgotText: { fontSize: 13, color: "#2D7D6E", fontWeight: "600" },

  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { fontSize: 14, color: "#9CA3AF", fontWeight: "400" },
  footerLink: { fontSize: 14, color: "#2D7D6E", fontWeight: "700" },
});
