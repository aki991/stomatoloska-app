import { useLayoutEffect } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { confirmAlert } from "../../utils/alert";

// Loose nav type so it works with any AuthStack screen (params shape varies per screen).
type Nav = {
  setOptions: (options: Record<string, unknown>) => void;
  navigate: (...args: any[]) => void;
};

export function useGuestExitButton(navigation: Nav, hide = false) {
  useLayoutEffect(() => {
    if (hide) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }

    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.btn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() =>
            confirmAlert(
              "Prekini zakazivanje",
              "Da li ste sigurni da želite da prekinete zakazivanje?",
              () => navigation.navigate("Login"),
              "Da, prekini"
            )
          }
        >
          <Ionicons name="close" size={28} color="#9CA3AF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, hide]);
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 4 },
});
