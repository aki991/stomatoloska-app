import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sr } from "date-fns/locale";
import * as Animatable from "react-native-animatable";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";
import { AppointmentWithService, Profile } from "../../types";
import { HomeStackNavProp } from "../../navigation/types";
import { Skeleton } from "../../components/Skeleton";
import { StatusBadge } from "../../components/StatusBadge";

function useProfile() {
  const { user } = useAuthStore();
  return useQuery<Profile>({
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
}

function useNextAppointment() {
  const { user } = useAuthStore();
  return useQuery<AppointmentWithService | null>({
    queryKey: ["next-appointment", user?.id],
    queryFn: async () => {
      if (__DEV__) await new Promise<void>((r) => setTimeout(r, 800));
      const { data, error } = await supabase
        .from("appointments")
        .select("*, service:services(*)")
        .eq("patient_id", user!.id)
        .in("status", ["pending", "confirmed"])
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

function FadeInView({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      delay={delay}
      easing="ease-out"
      useNativeDriver
    >
      {children}
    </Animatable.View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeStackNavProp>();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: nextAppointment, isLoading: loadingAppt, refetch: refetchAppt } =
    useNextAppointment();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const fabScale = useRef(new Animated.Value(1)).current;

  const fullName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.first_name ?? null;

  const onFabPressIn = () => {
    Animated.timing(fabScale, {
      toValue: 0.92,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const onFabPressOut = () => {
    Animated.timing(fabScale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const onFabPress = () => navigation.navigate("Services");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchAppt(),
      queryClient.invalidateQueries({ queryKey: ["profile"] }),
    ]);
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={["#1F5A4F", "#2D7D6E", "#4A9B8E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Dobrodošli!</Text>
            {fullName ? <Text style={styles.welcomeName}>{fullName}</Text> : null}
            <Text style={styles.headerSub}>VenusApp stomatološka ordinacija</Text>
          </View>
          <View style={styles.headerLogoWrap}>
            <Image
              source={require("../../../assets/images/logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2D7D6E"
          />
        }
      >
        {/* Next appointment */}
        <FadeInView delay={100}>
          {loadingAppt ? (
            <>
              <Text style={styles.sectionTitle}>Naredni termin</Text>
              <AppointmentSkeleton />
            </>
          ) : nextAppointment ? (
            <>
              <Text style={styles.sectionTitle}>Naredni termin</Text>
              <TouchableOpacity
                style={styles.appointmentCard}
                onPress={() =>
                  navigation.navigate("AppointmentDetail", {
                    appointmentId: nextAppointment.id,
                  })
                }
                activeOpacity={0.85}
              >
                {/* Left accent bar */}
                <LinearGradient
                  colors={["#2D7D6E", "#4A9B8E"]}
                  style={styles.cardAccent}
                />
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardService} numberOfLines={1}>
                      {nextAppointment.service?.name ?? "Pregled"}
                    </Text>
                    <StatusBadge status={nextAppointment.status} />
                  </View>
                  <Text style={styles.cardDate}>
                    {format(new Date(nextAppointment.starts_at), "EEEE, d. MMMM yyyy", {
                      locale: sr,
                    })}
                  </Text>
                  <Text style={styles.cardTime}>
                    {format(new Date(nextAppointment.starts_at), "HH:mm")} –{" "}
                    {format(new Date(nextAppointment.ends_at), "HH:mm")}
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Image
                source={require("../../../assets/images/logo.png")}
                style={styles.emptyLogo}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>Nemate zakazanih termina</Text>
              <Text style={styles.emptySubtitle}>
                Pritisnite dugme ispod da zakažete novi termin
              </Text>
            </View>
          )}
        </FadeInView>

        {/* Quick actions */}
        <FadeInView delay={200}>
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Brze akcije</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("Services")}
              activeOpacity={0.85}
            >
              <View style={styles.quickIconRing}>
                <Image
                  source={require("../../../assets/images/logo.png")}
                  style={styles.quickLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.quickLabel}>Usluge</Text>
              <Text style={styles.quickSub}>Sve stomatološke{"\n"}usluge</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              activeOpacity={0.85}
            >
              <View style={[styles.quickIconRing, styles.quickIconRingGray]}>
                <Text style={styles.quickEmoji}>📋</Text>
              </View>
              <Text style={styles.quickLabel}>Istorija</Text>
              <Text style={styles.quickSub}>Prethodni{"\n"}pregledi</Text>
            </TouchableOpacity>
          </View>
        </FadeInView>
      </ScrollView>

      {/* Extended FAB */}
      <Animated.View
        style={[
          styles.fab,
          {
            bottom: 80 + insets.bottom,
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={onFabPress}
          onPressIn={onFabPressIn}
          onPressOut={onFabPressOut}
          activeOpacity={1}
          style={styles.fabTouchable}
        >
          <LinearGradient
            colors={["#2D7D6E", "#1F5A4F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text style={styles.fabLabel}>Zakaži termin</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

function AppointmentSkeleton() {
  return (
    <View style={[styles.appointmentCard, { overflow: "hidden" }]}>
      <View style={[styles.cardAccent, { backgroundColor: "#E5E7EB" }]} />
      <View style={[styles.cardBody, { gap: 10 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Skeleton style={{ width: 160, height: 18 }} />
          <Skeleton style={{ width: 80, height: 24, borderRadius: 20 }} />
        </View>
        <Skeleton style={{ width: 200, height: 15 }} />
        <Skeleton style={{ width: 100, height: 14 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9F7" },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    overflow: "hidden",
  },
  decorCircle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -40,
    right: -20,
  },
  decorCircle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -30,
    left: 60,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flex: 1 },
  welcomeText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  welcomeName: {
    fontSize: 16,
    fontWeight: "400",
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255,255,255,0.55)",
    marginTop: 4,
    letterSpacing: 0.3,
  },
  headerLogoWrap: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerLogo: { width: 80, height: 80, alignSelf: "center" },

  // Content
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: -0.3,
    marginBottom: 12,
  },

  // Appointment card
  appointmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    flexDirection: "row",
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
    overflow: "hidden",
  },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: 18 },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardService: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 10,
    letterSpacing: -0.2,
  },
  cardDate: {
    fontSize: 14,
    color: "#2D7D6E",
    fontWeight: "600",
    marginBottom: 3,
  },
  cardTime: { fontSize: 13, color: "#6B7280" },

  // Empty state
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  emptyLogo: { width: 60, height: 60, alignSelf: "center", marginBottom: 14 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },

  // Quick actions
  quickGrid: { flexDirection: "row", gap: 12 },
  quickCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  quickIconRing: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "#F5F9F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#C8E6DF",
  },
  quickIconRingGray: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  quickLogo: { width: 56, height: 56, alignSelf: "center" },
  quickEmoji: { fontSize: 28 },
  quickLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  quickSub: { fontSize: 12, color: "#9CA3AF", lineHeight: 17 },

  // Extended FAB
  fab: {
    position: "absolute",
    right: 20,
    borderRadius: 28,
    shadowColor: "#1F5A4F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  fabTouchable: {
    borderRadius: 28,
    overflow: "hidden",
  },
  fabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  fabLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
