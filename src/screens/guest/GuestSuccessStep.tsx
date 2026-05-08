import React, { useLayoutEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { format, parseISO } from "date-fns";
import { sr } from "date-fns/locale";
import { GradientButton } from "../../components/GradientButton";
import { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "GuestSuccess">;

export default function GuestSuccessStep({ route, navigation }: Props) {
  const { firstName, serviceName, selectedDate, selectedTime } = route.params;

  // Hide back arrow + close button — only path forward is "Nazad na početnu"
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      headerRight: () => null,
      headerBackVisible: false,
      gestureEnabled: false,
      title: "Termin zakazan",
    });
  }, [navigation]);

  const displayDate = format(parseISO(selectedDate), "EEEE, d. MMMM yyyy", { locale: sr });

  function goBackToLogin() {
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>✓</Text>
        </View>

        <Text style={styles.title}>Termin uspešno zakazan!</Text>
        <Text style={styles.subtitle}>
          {firstName ? `Hvala, ${firstName}! ` : ""}
          Stomatološka ordinacija će vas kontaktirati telefonom dan ranije za potvrdu.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardService}>{serviceName}</Text>
          <Text style={styles.cardDate}>{displayDate}</Text>
          <Text style={styles.cardTime}>u {selectedTime}h</Text>
        </View>

        <GradientButton
          label="Nazad na početnu"
          onPress={goBackToLogin}
          style={{ width: "100%" }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    paddingBottom: 40,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  icon: { fontSize: 52, color: "#059669", fontWeight: "700" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    marginBottom: 28,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardService: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8, textAlign: "center" },
  cardDate: { fontSize: 14, color: "#374151", fontWeight: "500", marginBottom: 4, textAlign: "center" },
  cardTime: { fontSize: 22, fontWeight: "800", color: "#059669" },
});
