import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GradientButton } from "../../components/GradientButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { format, parseISO } from "date-fns";
import { sr } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { HomeStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<HomeStackParamList, "Success">;

export default function SuccessScreen({ route, navigation }: Props) {
  const { serviceName, selectedDate, selectedTime, appointmentId } = route.params;
  const queryClient = useQueryClient();

  const displayDate = format(parseISO(selectedDate), "EEEE, d. MMMM yyyy", {
    locale: sr,
  });

  function goHome() {
    // Invalidate queries so HomeScreen and AppointmentsScreen refresh
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["next-appointment"] });
    navigation.navigate("HomeMain");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>✓</Text>
        </View>

        <Text style={styles.title}>Termin uspešno zakazan!</Text>
        <Text style={styles.subtitle}>
          Vidimo se u ordinaciji. Podsetićemo vas dan ranije.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardService}>{serviceName}</Text>
          <Text style={styles.cardDate}>{displayDate}</Text>
          <Text style={styles.cardTime}>u {selectedTime}h</Text>
        </View>

        <GradientButton
          label="Nazad na početnu"
          onPress={goHome}
          style={{ width: "100%", marginBottom: 12 }}
        />

        <GradientButton
          variant="secondary"
          label="Pogledaj sve termine"
          onPress={() => {
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            queryClient.invalidateQueries({ queryKey: ["next-appointment"] });
            navigation.navigate("HomeMain");
          }}
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
    paddingBottom: 100,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  icon: { fontSize: 44, color: "#059669" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    marginBottom: 32,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardService: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  cardDate: { fontSize: 14, color: "#374151", fontWeight: "500", marginBottom: 4 },
  cardTime: { fontSize: 22, fontWeight: "800", color: "#059669" },
});
