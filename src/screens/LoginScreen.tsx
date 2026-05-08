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
import { Ionicons } from "@expo/vector-icons";
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
            {/* Logo + Brand — kompaktan, centriran */}
            <View style={styles.brandSection}>
              <View style={styles.logoWrap}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
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
                    wrapperStyle={styles.inputWrap}
                    style={styles.inputCompact}
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
                    wrapperStyle={styles.inputWrap}
                    style={styles.inputCompact}
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

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ili</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Guest CTA */}
            <TouchableOpacity
              style={styles.guestBtn}
              onPress={() => navigation.navigate("GuestInfo")}
              activeOpacity={0.8}
            >
              <Ionicons name="person-outline" size={18} color="#2D7D6E" />
              <Text style={styles.guestBtnText}>Zakaži kao gost</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20 },

  brandSection: { alignItems: "center", marginBottom: 14 },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#F5F9F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: { width: 50, height: 50, alignSelf: "center" },
  appName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2D7D6E",
    letterSpacing: -0.3,
    marginBottom: 1,
  },
  appSub: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9CA3AF",
    letterSpacing: 0.2,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  inputWrap: { marginBottom: 8 },
  inputCompact: { paddingVertical: 12, fontSize: 15 },

  forgotRow: { alignItems: "flex-end", marginTop: -2, marginBottom: 12 },
  forgotText: { fontSize: 13, color: "#2D7D6E", fontWeight: "600" },

  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { fontSize: 13, color: "#9CA3AF", fontWeight: "400" },
  footerLink: { fontSize: 13, color: "#2D7D6E", fontWeight: "700" },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    marginHorizontal: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2D7D6E",
    backgroundColor: "#FFFFFF",
  },
  guestBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D7D6E",
    letterSpacing: 0.2,
  },
});
