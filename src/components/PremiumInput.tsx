import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Animated,
} from "react-native";

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function PremiumInput({ label, error, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, focused && styles.labelFocused, !!error && styles.labelError]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          style,
        ]}
        placeholderTextColor="#A0ADA7"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  labelFocused: { color: "#2D7D6E" },
  labelError: { color: "#EF4444" },
  input: {
    backgroundColor: "#F5F9F7",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1A1A1A",
  },
  inputFocused: {
    borderColor: "#2D7D6E",
    backgroundColor: "#FFFFFF",
    shadowColor: "#2D7D6E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  inputError: { borderColor: "#EF4444", backgroundColor: "#FFF5F5" },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: 5, fontWeight: "500" },
});
