import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Toast from "react-native-toast-message";
import { supabase } from "../../services/supabase";
import { Service } from "../../types";
import { GradientButton } from "../../components/GradientButton";
import { PremiumInput } from "../../components/PremiumInput";
import { AdminServicesStackParamList } from "../../navigation/types";
import { confirmAlert } from "../../utils/alert";

type Props = NativeStackScreenProps<AdminServicesStackParamList, "EditService">;

const PRIMARY = "#2D7D6E";

const PRESET_CATEGORIES = [
  "Preventiva",
  "Restauracija",
  "Hirurgija",
  "Estetika",
  "Ortodoncija",
  "Dečja stom.",
  "Ostalo",
];

// ─── Zod schema ────────────────────────────────────────────────────────────────

const serviceSchema = z.object({
  name: z.string().min(2, "Naziv mora imati najmanje 2 karaktera"),
  description: z.string().optional(),
  category: z.string().min(1, "Odaberite ili unesite kategoriju"),
  duration_minutes: z.coerce
    .number()
    .int()
    .min(5, "Minimum je 5 minuta")
    .max(480, "Maksimum je 480 minuta (8 sati)"),
  price: z.coerce
    .number()
    .int("Cena mora biti ceo broj")
    .min(0, "Cena ne može biti negativna"),
  is_active: z.boolean(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

// ─── Data hooks ────────────────────────────────────────────────────────────────

function useService(serviceId: string | undefined) {
  return useQuery<Service | null>({
    queryKey: ["admin", "service", serviceId],
    enabled: !!serviceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId!)
        .single();
      if (error) throw error;
      return data as Service;
    },
  });
}

function useCategories() {
  return useQuery<string[]>({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("category");
      if (error) throw error;
      const fromDb = (data ?? []).map((d: any) => d.category as string).filter(Boolean);
      const merged = [...new Set([...PRESET_CATEGORIES, ...fromDb])];
      return merged.sort();
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function EditServiceScreen({ route, navigation }: Props) {
  const { serviceId } = route.params;
  const isEditing = !!serviceId;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: service, isLoading: serviceLoading } = useService(serviceId);
  const { data: categories = PRESET_CATEGORIES } = useCategories();

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema) as Resolver<ServiceFormData>,
    defaultValues: {
      name: "",
      description: "",
      category: "",
      duration_minutes: 30,
      price: 0,
      is_active: true,
    },
  });

  const watchedCategory = watch("category");

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? "Izmeni uslugu" : "Nova usluga",
    });
  }, [isEditing]); // eslint-disable-line

  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        description: service.description ?? "",
        category: service.category,
        duration_minutes: service.duration_minutes,
        price: service.price,
        is_active: service.is_active,
      });
      if (!categories.includes(service.category)) {
        setShowCustomInput(true);
      }
    }
  }, [service, reset]); // eslint-disable-line

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "service", serviceId] });
    queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      if (isEditing) {
        const { error } = await supabase
          .from("services")
          .update({
            name: data.name,
            description: data.description || null,
            category: data.category,
            duration_minutes: data.duration_minutes,
            price: data.price,
            is_active: data.is_active,
          })
          .eq("id", serviceId!);
        console.log("[EditService] UPDATE error:", error?.message ?? null);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert({
          name: data.name,
          description: data.description || null,
          category: data.category,
          duration_minutes: data.duration_minutes,
          price: data.price,
          is_active: data.is_active,
          // display_order uses DB default (9999) once migration 009 is applied
        });
        console.log("[EditService] INSERT error:", error?.message ?? null);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      Toast.show({
        type: "success",
        text1: isEditing ? "Usluga ažurirana" : "Usluga kreirana",
      });
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert("Greška", err.message ?? "Greška pri čuvanju usluge");
    },
  });

  const handleDelete = () => {
    confirmAlert(
      "Trajno obriši uslugu",
      `Da li ste sigurni da želite da trajno obrišete uslugu "${service?.name}"? Ova akcija se ne može poništiti.`,
      async () => {
        setIsDeleting(true);
        try {
          const { error } = await supabase.rpc("delete_service", {
            service_uuid: serviceId!,
          });

          if (error) {
            const msg = error.message ?? "";
            if (msg.includes("Cannot delete service with future")) {
              Toast.show({
                type: "error",
                text1: "Brisanje nije moguće",
                text2:
                  "Postoje predstojeći termini sa ovom uslugom. Otkažite ih ili samo deaktivirajte uslugu.",
                visibilityTime: 5000,
              });
            } else if (msg.includes("Only admins")) {
              Toast.show({
                type: "error",
                text1: "Samo administrator može da briše usluge",
                visibilityTime: 5000,
              });
            } else {
              Toast.show({
                type: "error",
                text1: "Greška pri brisanju usluge",
                text2: msg || "Pokušajte ponovo.",
                visibilityTime: 5000,
              });
            }
            return; // do not navigate away on error
          }

          // Invalidate every cache that lists services so the deleted row
          // disappears on whichever screen the user lands on next.
          queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "booking-services"] });
          queryClient.invalidateQueries({ queryKey: ["admin", "service", serviceId] });
          queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
          queryClient.invalidateQueries({ queryKey: ["services"] });
          queryClient.invalidateQueries({ queryKey: ["guest", "services"] });

          Toast.show({ type: "success", text1: "Usluga je trajno obrisana" });

          // popToTop is more robust than goBack() on web in case the back-stack
          // got desynced; the navigate fallback covers the empty-stack case.
          if (navigation.canGoBack()) {
            navigation.popToTop();
          } else {
            navigation.navigate("ServicesMain");
          }
        } catch (e: any) {
          Toast.show({
            type: "error",
            text1: "Neočekivana greška",
            text2: e?.message ?? undefined,
            visibilityTime: 5000,
          });
        } finally {
          setIsDeleting(false);
        }
      },
      "Obriši"
    );
  };

  const toggleActiveMutation = useMutation({
    mutationFn: async (activate: boolean) => {
      const { error } = await supabase
        .from("services")
        .update({ is_active: activate })
        .eq("id", serviceId!);
      if (error) throw error;
    },
    onSuccess: (_, activate) => {
      invalidate();
      setValue("is_active", activate, { shouldDirty: false });
      Toast.show({
        type: "success",
        text1: activate ? "Usluga aktivirana" : "Usluga deaktivirana",
      });
    },
    onError: (err: any) => {
      Alert.alert("Greška", err.message ?? "Greška pri promeni statusa");
    },
  });

  const confirmToggleActive = () => {
    const currentlyActive = service?.is_active ?? true;
    if (currentlyActive) {
      confirmAlert(
        "Deaktiviraj uslugu",
        "Usluga neće biti vidljiva pacijentima, ali postojeći termini ostaju netaknuti.",
        () => toggleActiveMutation.mutate(false),
        "Deaktiviraj"
      );
    } else {
      toggleActiveMutation.mutate(true);
    }
  };

  if (isEditing && serviceLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  const isActive = service?.is_active ?? true;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Naziv */}
          <SectionTitle text="Naziv usluge" />
          <View style={styles.card}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <PremiumInput
                  label="Naziv *"
                  placeholder="npr. Pregled i dijagnostika"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  returnKeyType="next"
                  autoCapitalize="sentences"
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <PremiumInput
                  label="Opis (opciono)"
                  placeholder="Kratak opis usluge za pacijente…"
                  value={value ?? ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.description?.message}
                  multiline
                  numberOfLines={3}
                  style={{ minHeight: 88, paddingTop: 14 }}
                  textAlignVertical="top"
                />
              )}
            />
          </View>

          {/* Kategorija */}
          <SectionTitle text="Kategorija" />
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <CategorySelector
                value={value}
                categories={categories}
                showCustomInput={showCustomInput}
                onSelect={(cat) => {
                  if (cat === "__custom__") {
                    setShowCustomInput(true);
                    onChange("");
                  } else {
                    setShowCustomInput(false);
                    onChange(cat);
                  }
                }}
                onCustomChange={onChange}
                error={errors.category?.message}
              />
            )}
          />

          {/* Trajanje i cena */}
          <SectionTitle text="Trajanje i cena" />
          <View style={styles.card}>
            <View style={styles.row2col}>
              <View style={styles.colHalf}>
                <Controller
                  control={control}
                  name="duration_minutes"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PremiumInput
                      label="Trajanje (min) *"
                      placeholder="30"
                      value={String(value ?? "")}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.duration_minutes?.message}
                      keyboardType="numeric"
                      returnKeyType="next"
                    />
                  )}
                />
              </View>
              <View style={styles.colHalf}>
                <Controller
                  control={control}
                  name="price"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PremiumInput
                      label="Cena (RSD) *"
                      placeholder="3000"
                      value={String(value ?? "")}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.price?.message}
                      keyboardType="numeric"
                      returnKeyType="done"
                    />
                  )}
                />
              </View>
            </View>
          </View>

          {/* Status switch */}
          <SectionTitle text="Status" />
          <View style={styles.card}>
            <Controller
              control={control}
              name="is_active"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchRow}>
                  <View style={styles.switchLabel}>
                    <Text style={styles.switchTitle}>Aktivna usluga</Text>
                    <Text style={styles.switchSubtitle}>
                      {value
                        ? "Vidljiva pacijentima za zakazivanje"
                        : "Skrivena — pacijenti ne mogu da zakazuju"}
                    </Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: "#E5E7EB", true: "#A7F3D0" }}
                    thumbColor={value ? PRIMARY : "#9CA3AF"}
                  />
                </View>
              )}
            />
          </View>

          {/* Save */}
          <GradientButton
            label="Sačuvaj uslugu"
            onPress={handleSubmit((data) => saveMutation.mutate(data))}
            loading={saveMutation.isPending}
            disabled={isDeleting}
            style={{ marginTop: 8, marginBottom: isEditing ? 12 : 0 }}
          />

          {/* Deactivate / Activate (edit only) */}
          {isEditing && (
            <>
              <TouchableOpacity
                style={[
                  styles.toggleActiveBtn,
                  !isActive && styles.toggleActiveBtnGreen,
                ]}
                onPress={confirmToggleActive}
                disabled={toggleActiveMutation.isPending || isDeleting}
              >
                {toggleActiveMutation.isPending ? (
                  <ActivityIndicator
                    size="small"
                    color={isActive ? "#DC2626" : PRIMARY}
                  />
                ) : (
                  <>
                    <Ionicons
                      name={isActive ? "eye-off-outline" : "eye-outline"}
                      size={17}
                      color={isActive ? "#DC2626" : PRIMARY}
                    />
                    <Text
                      style={[
                        styles.toggleActiveBtnText,
                        !isActive && styles.toggleActiveBtnTextGreen,
                      ]}
                    >
                      {isActive ? "Deaktiviraj uslugu" : "Aktiviraj uslugu"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={17} color="#DC2626" />
                    <Text style={styles.toggleActiveBtnText}>Trajno obriši uslugu</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── CategorySelector ──────────────────────────────────────────────────────────

function CategorySelector({
  value,
  categories,
  showCustomInput,
  onSelect,
  onCustomChange,
  error,
}: {
  value: string;
  categories: string[];
  showCustomInput: boolean;
  onSelect: (cat: string) => void;
  onCustomChange: (text: string) => void;
  error?: string;
}) {
  const chips = [...categories, "__custom__"];

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryChips}>
        {chips.map((cat) => {
          const isCustomChip = cat === "__custom__";
          const isSelected = isCustomChip ? showCustomInput : value === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
              ]}
              onPress={() => onSelect(cat)}
            >
              {isCustomChip && (
                <Ionicons
                  name="add"
                  size={13}
                  color={isSelected ? "#FFFFFF" : PRIMARY}
                  style={{ marginRight: 2 }}
                />
              )}
              <Text
                style={[
                  styles.categoryChipText,
                  isSelected && styles.categoryChipTextSelected,
                ]}
              >
                {isCustomChip ? "Nova kategorija" : cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showCustomInput && (
        <View style={styles.customCategoryWrap}>
          <TextInput
            style={[styles.customCategoryInput, error ? styles.customCategoryInputError : null]}
            placeholder="Unesite naziv kategorije…"
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onCustomChange}
            autoFocus
            returnKeyType="done"
            autoCapitalize="sentences"
          />
        </View>
      )}

      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : null}
    </View>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function SectionTitle({ text }: { text: string }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 20 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 8,
  },

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

  row2col: { flexDirection: "row", gap: 12 },
  colHalf: { flex: 1 },

  // Switch
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  switchLabel: { flex: 1 },
  switchTitle: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  switchSubtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  // Category selector
  categorySection: {
    marginBottom: 18,
  },
  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  categoryChipSelected: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  categoryChipTextSelected: {
    color: "#FFFFFF",
  },
  customCategoryWrap: {
    marginTop: 10,
  },
  customCategoryInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#2D7D6E",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: "#1A1A1A",
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 1,
  },
  customCategoryInputError: { borderColor: "#EF4444" },
  fieldError: { fontSize: 12, color: "#EF4444", marginTop: 6, fontWeight: "500" },

  // Toggle active button
  toggleActiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
  },
  toggleActiveBtnGreen: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  toggleActiveBtnText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 15,
  },
  toggleActiveBtnTextGreen: {
    color: PRIMARY,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 10,
  },
});
