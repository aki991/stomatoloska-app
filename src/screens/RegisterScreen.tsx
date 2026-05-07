import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import { registerSchema, RegisterFormData } from "../schemas/authSchemas";
import { supabase } from "../services/supabase";
import { AuthStackNavProp } from "../navigation/types";

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
        data: { full_name: data.full_name },
      },
    });
    setIsLoading(false);
    if (error) {
      Alert.alert("Greška", error.message);
    } else {
      Alert.alert(
        "Uspešno",
        "Nalog je kreiran. Proverite email za potvrdu.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    }
  };

  const fields: Array<{
    name: keyof RegisterFormData;
    label: string;
    placeholder: string;
    secure?: boolean;
    keyboard?: "email-address" | "default";
  }> = [
    { name: "full_name", label: "Ime i prezime", placeholder: "Marko Marković" },
    {
      name: "email",
      label: "Email",
      placeholder: "vas@email.com",
      keyboard: "email-address",
    },
    {
      name: "password",
      label: "Lozinka",
      placeholder: "••••••••",
      secure: true,
    },
    {
      name: "confirm_password",
      label: "Potvrdite lozinku",
      placeholder: "••••••••",
      secure: true,
    },
  ];

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Registracija
        </Text>
        <Text className="text-gray-500 mb-8">Kreirajte novi nalog</Text>

        {fields.map((f) => (
          <View key={f.name} className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              {f.label}
            </Text>
            <Controller
              control={control}
              name={f.name}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                  placeholder={f.placeholder}
                  secureTextEntry={f.secure}
                  keyboardType={f.keyboard ?? "default"}
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors[f.name] && (
              <Text className="text-red-500 text-xs mt-1">
                {errors[f.name]?.message}
              </Text>
            )}
          </View>
        ))}

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mt-2 mb-4"
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-base">
            {isLoading ? "Kreiranje naloga..." : "Registruj se"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-500">Već imate nalog? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text className="text-primary font-semibold">Prijavite se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
