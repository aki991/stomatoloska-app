import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { supabase } from "../../services/supabase";
import { Service } from "../../types";
import { AdminServicesStackParamList } from "../../navigation/types";
import { Skeleton } from "../../components/Skeleton";

type NavProp = NativeStackNavigationProp<AdminServicesStackParamList>;
type FilterKey = "all" | "active" | "inactive";

const PRIMARY = "#2D7D6E";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Sve" },
  { key: "active", label: "Aktivne" },
  { key: "inactive", label: "Neaktivne" },
];

function useServices() {
  return useQuery<Service[]>({
    queryKey: ["admin", "services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      console.log("[useServices] data:", data?.length ?? null, "error:", error?.message ?? null);

      if (error) {
        // display_order column may not exist yet — fall back to name ordering
        console.warn("[useServices] falling back to name ordering, reason:", error.message);
        const fallback = await supabase
          .from("services")
          .select("*")
          .order("name", { ascending: true });
        console.log("[useServices] fallback data:", fallback.data?.length ?? null, "error:", fallback.error?.message ?? null);
        if (fallback.error) throw fallback.error;
        return (fallback.data ?? []) as Service[];
      }

      return (data ?? []) as Service[];
    },
    staleTime: 1000 * 60,
  });
}

export default function AdminServicesScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: services, isLoading, error: servicesError, refetch } = useServices();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [isReordering, setIsReordering] = useState(false);
  const [reorderList, setReorderList] = useState<Service[]>([]);

  const fabScale = useRef(new Animated.Value(1)).current;

  useFocusEffect(useCallback(() => { refetch(); }, [])); // eslint-disable-line

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const saveReorderMutation = useMutation({
    mutationFn: async (list: Service[]) => {
      const payload = list.map((s, i) => ({ id: s.id, display_order: i }));
      console.log("[saveReorder] payload:", JSON.stringify(payload));
      const { error } = await supabase.rpc("reorder_services", { items: payload });
      console.log("[saveReorder] error:", error?.message ?? null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      Toast.show({ type: "success", text1: "Redosled sačuvan" });
      setIsReordering(false);
    },
    onError: (err: any) => {
      Alert.alert("Greška", err.message ?? "Greška pri čuvanju redosleda");
    },
  });

  const enterReorder = () => {
    setReorderList([...(services ?? [])]);
    setIsReordering(true);
  };

  const cancelReorder = () => {
    setIsReordering(false);
    setReorderList([]);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const list = [...reorderList];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    [list[index], list[targetIndex]] = [list[targetIndex], list[index]];
    setReorderList(list);
  };

  const displayList = isReordering
    ? reorderList
    : (services ?? []).filter((s) => {
        if (filter === "active") return s.is_active;
        if (filter === "inactive") return !s.is_active;
        return true;
      });

  const activeCount = (services ?? []).filter((s) => s.is_active).length;
  const totalCount = (services ?? []).length;

  const onFabPressIn = () =>
    Animated.timing(fabScale, { toValue: 0.92, duration: 100, useNativeDriver: true }).start();
  const onFabPressOut = () =>
    Animated.timing(fabScale, { toValue: 1, duration: 100, useNativeDriver: true }).start();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={["#1F5A4F", "#2D7D6E", "#4A9B8E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.headerTopRow}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
          {!isReordering ? (
            <TouchableOpacity onPress={enterReorder} style={styles.reorderBtn}>
              <Ionicons name="reorder-three-outline" size={16} color="#FFFFFF" />
              <Text style={styles.reorderBtnText}>Preuredi</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.reorderActions}>
              <TouchableOpacity onPress={cancelReorder} style={styles.reorderCancelBtn}>
                <Text style={styles.reorderCancelText}>Otkaži</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => saveReorderMutation.mutate(reorderList)}
                style={styles.reorderSaveBtn}
                disabled={saveReorderMutation.isPending}
              >
                <Text style={styles.reorderSaveText}>
                  {saveReorderMutation.isPending ? "..." : "Sačuvaj"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={styles.headerTitle}>Usluge</Text>
        <Text style={styles.headerSubtitle}>
          {isLoading
            ? "Učitavanje..."
            : `${activeCount} aktivnih · ${totalCount} ukupno`}
        </Text>
      </LinearGradient>

      {/* Filter chips */}
      {!isReordering && (
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === f.key && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Reorder hint */}
      {isReordering && (
        <View style={styles.reorderHint}>
          <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
          <Text style={styles.reorderHintText}>
            Pomerite usluge strelicama, pa pritisnite "Sačuvaj"
          </Text>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <ServiceSkeleton />
          <ServiceSkeleton />
          <ServiceSkeleton />
          <ServiceSkeleton />
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 160 },
          ]}
          refreshControl={
            !isReordering ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={PRIMARY}
              />
            ) : undefined
          }
          ListEmptyComponent={
            servicesError ? (
              <View style={styles.emptyCard}>
                <Ionicons name="warning-outline" size={32} color="#EF4444" style={{ marginBottom: 10 }} />
                <Text style={[styles.emptyTitle, { color: "#EF4444" }]}>Greška pri učitavanju</Text>
                <Text style={styles.emptySubtitle}>{(servicesError as any)?.message ?? "Nepoznata greška"}</Text>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="medical-outline"
                  size={32}
                  color="#9CA3AF"
                  style={{ marginBottom: 10 }}
                />
                <Text style={styles.emptyTitle}>Nema usluga</Text>
                <Text style={styles.emptySubtitle}>
                  Dodajte prvu uslugu pritiskom na dugme "+"
                </Text>
              </View>
            )
          }
          renderItem={({ item, index }) => (
            <ServiceCard
              service={item}
              isReordering={isReordering}
              isFirst={index === 0}
              isLast={index === displayList.length - 1}
              onMoveUp={() => moveItem(index, "up")}
              onMoveDown={() => moveItem(index, "down")}
              onPress={() =>
                navigation.navigate("EditService", { serviceId: item.id })
              }
            />
          )}
        />
      )}

      {/* FAB */}
      {!isReordering && (
        <Animated.View
          style={[
            styles.fab,
            { bottom: 80 + insets.bottom, transform: [{ scale: fabScale }] },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("EditService", {})}
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
              <Text style={styles.fabLabel}>Nova usluga</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  isReordering,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onPress,
}: {
  service: Service;
  isReordering: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, !service.is_active && styles.cardInactive]}
      onPress={isReordering ? undefined : onPress}
      activeOpacity={isReordering ? 1 : 0.8}
    >
      {isReordering && (
        <View style={styles.reorderControls}>
          <TouchableOpacity
            style={[styles.arrowBtn, isFirst && styles.arrowBtnDisabled]}
            onPress={onMoveUp}
            disabled={isFirst}
            hitSlop={{ top: 8, bottom: 4, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-up"
              size={18}
              color={isFirst ? "#D1D5DB" : PRIMARY}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.arrowBtn, isLast && styles.arrowBtnDisabled]}
            onPress={onMoveDown}
            disabled={isLast}
            hitSlop={{ top: 4, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-down"
              size={18}
              color={isLast ? "#D1D5DB" : PRIMARY}
            />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {service.name}
          </Text>
          <StatusPill active={service.is_active} />
        </View>
        <View style={styles.cardMeta}>
          <CategoryBadge category={service.category} />
          <View style={styles.metaRight}>
            <MetaItem icon="time-outline" text={`${service.duration_minutes} min`} />
            <MetaItem
              icon="cash-outline"
              text={`${service.price.toLocaleString("sr-RS")} RSD`}
            />
          </View>
        </View>
      </View>

      {!isReordering && (
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      )}
    </TouchableOpacity>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <View style={[styles.statusPill, active ? styles.statusPillOn : styles.statusPillOff]}>
      <Text style={[styles.statusPillText, active ? styles.statusPillTextOn : styles.statusPillTextOff]}>
        {active ? "Aktivna" : "Neaktivna"}
      </Text>
    </View>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <View style={styles.categoryBadge}>
      <Text style={styles.categoryBadgeText} numberOfLines={1}>
        {category}
      </Text>
    </View>
  );
}

function MetaItem({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>["name"]; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={12} color="#9CA3AF" />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function ServiceSkeleton() {
  return (
    <View style={[styles.card, { gap: 10, paddingVertical: 16 }]}>
      <View style={styles.cardBody}>
        <View style={[styles.cardTopRow, { marginBottom: 10 }]}>
          <Skeleton style={{ flex: 1, height: 16, borderRadius: 8, marginRight: 60 }} />
          <Skeleton style={{ width: 60, height: 20, borderRadius: 10 }} />
        </View>
        <View style={styles.cardMeta}>
          <Skeleton style={{ width: 70, height: 20, borderRadius: 10 }} />
          <View style={styles.metaRight}>
            <Skeleton style={{ width: 50, height: 14, borderRadius: 7 }} />
            <Skeleton style={{ width: 80, height: 14, borderRadius: 7 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9F7" },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
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
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.35)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.35)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  reorderBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  reorderActions: { flexDirection: "row", gap: 8 },
  reorderCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  reorderCancelText: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  reorderSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  reorderSaveText: { color: PRIMARY, fontSize: 12, fontWeight: "700" },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    borderColor: PRIMARY,
    backgroundColor: "#F0F9F7",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterChipTextActive: { color: PRIMARY },

  // Reorder hint
  reorderHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FEF3C7",
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  reorderHintText: { fontSize: 12, color: "#92400E", flex: 1 },

  // List
  skeletonContainer: { padding: 20, gap: 10 },
  listContent: { padding: 16, gap: 10 },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    gap: 10,
  },
  cardInactive: { opacity: 0.5 },
  cardBody: { flex: 1 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  cardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  metaRight: { flexDirection: "row", gap: 12, alignItems: "center" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },

  // Status pill
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillOn: { backgroundColor: "#D1FAE5", borderColor: "#A7F3D0" },
  statusPillOff: { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
  statusPillText: { fontSize: 11, fontWeight: "700" },
  statusPillTextOn: { color: "#065F46" },
  statusPillTextOff: { color: "#6B7280" },

  // Category badge
  categoryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#C7D7FD",
    maxWidth: 120,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: "600", color: "#3B5BDB" },

  // Reorder controls
  reorderControls: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    width: 32,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F9F7",
    borderWidth: 1,
    borderColor: "#C8E6DF",
  },
  arrowBtnDisabled: { backgroundColor: "#F9FAFB", borderColor: "#E5E7EB" },

  // Empty
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 32,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: "#9CA3AF", textAlign: "center" },

  // FAB
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
  fabTouchable: { borderRadius: 28, overflow: "hidden" },
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
