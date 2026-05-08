import React, { useLayoutEffect } from "react";
import { TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AdminDashboardStackParamList } from "../../../navigation/types";

type Nav = NativeStackNavigationProp<AdminDashboardStackParamList>;

export function useBookingExitButton(navigation: Nav, hide = false) {
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
            Alert.alert(
              "Prekini zakazivanje",
              "Da li ste sigurni da želite da prekinete zakazivanje?",
              [
                { text: "Otkaži", style: "cancel" },
                {
                  text: "Da, prekini",
                  style: "destructive",
                  onPress: () => navigation.navigate("DashboardMain"),
                },
              ]
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
