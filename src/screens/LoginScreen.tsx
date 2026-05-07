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
import { loginSchema, LoginFormData } from "../schemas/authSchemas";
import { supabase } from "../services/supabase";
import { AuthStackNavProp } from "../navigation/types";

export default function LoginScreen() {
  const navigation = useNavigation<AuthStackNavProp>();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setIsLoading(false);
    if (error) Alert.alert("Greška", error.message);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-gray-900 mb-2">Prijava</Text>
        <Text className="text-gray-500 mb-8">
          Dobrodošli u StomApp ordinaciju
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                placeholder="vas@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.email && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.email.message}
            </Text>
          )}
        </View>

        <View className="mb-2">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Lozinka
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                placeholder="••••••••"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.password && (
            <Text className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </Text>
          )}
        </View>

        <TouchableOpacity
          className="self-end mb-6"
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          <Text className="text-primary text-sm">Zaboravili ste lozinku?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center mb-4"
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-base">
            {isLoading ? "Prijavljivanje..." : "Prijavi se"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-gray-500">Nemate nalog? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text className="text-primary font-semibold">Registrujte se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
