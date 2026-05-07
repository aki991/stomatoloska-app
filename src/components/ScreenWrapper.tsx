import React from "react";
import { StyleSheet } from "react-native";
import * as Animatable from "react-native-animatable";

interface Props {
  children: React.ReactNode;
}

export function ScreenWrapper({ children }: Props) {
  return (
    <Animatable.View
      animation="fadeIn"
      duration={500}
      easing="ease-out"
      style={styles.container}
    >
      {children}
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
