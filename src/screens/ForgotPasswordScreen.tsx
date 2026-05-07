import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from "../schemas/authSchemas";
import { supabase } from "../services/supabase";
import { AuthStackNavProp } from "../navigation/types";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<AuthStackNavProp>();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email);
    setIsLoading(false);
    if (error) {
      Alert.alert("Greška", error.message);
    } else {
      Alert.alert(
        "Email poslat",
        "Proverite email za link za resetovanje lozinke.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white px-6"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center">
        <TouchableOpacity className="mb-8" onPress={() => navigation.goBack()}>
          <Text className="text-primary text-base">← Nazad</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Zaboravljena lozinka
        </Text>
        <Text className="text-gray-500 mb-8">
          Unesite email i poslaćemo vam link za resetovanje.
        </Text>

        <View className="mb-6">
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

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center"
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-base">
            {isLoading ? "Slanje..." : "Pošalji link"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
