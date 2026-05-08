import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";

const PRIMARY = "#2D7D6E";
const DANGER = "#DC2626";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

// Module-scoped setter populated by the singleton instance.
let setStateRef: ((opts: ConfirmOptions | null) => void) | null = null;

/**
 * Cross-platform confirm dialog. Mount <ConfirmModalHost /> once at the app
 * root, then call ConfirmModal.show({...}) from anywhere.
 */
export const ConfirmModal = {
  show(options: ConfirmOptions) {
    if (!setStateRef) {
      // Fallback: invoke onConfirm if the host isn't mounted yet (shouldn't happen).
      console.warn("[ConfirmModal] host not mounted — running onConfirm directly");
      options.onConfirm();
      return;
    }
    setStateRef(options);
  },
  hide() {
    setStateRef?.(null);
  },
};

export function ConfirmModalHost() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);

  useEffect(() => {
    setStateRef = setOpts;
    return () => {
      setStateRef = null;
    };
  }, []);

  const visible = opts !== null;

  function handleCancel() {
    opts?.onCancel?.();
    setOpts(null);
  }

  function handleConfirm() {
    const cb = opts?.onConfirm;
    setOpts(null);
    cb?.();
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {opts?.title ? <Text style={styles.title}>{opts.title}</Text> : null}
          {opts?.message ? <Text style={styles.message}>{opts.message}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.btnCancelText}>{opts?.cancelText ?? "Otkaži"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                opts?.destructive ? styles.btnDestructive : styles.btnPrimary,
              ]}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.btnConfirmText}>{opts?.confirmText ?? "Potvrdi"}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 16,
    ...Platform.select({
      web: {
        // @ts-ignore — RN web supports boxShadow
        boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.12)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 28,
        elevation: 12,
      },
    }),
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  btnPrimary: {
    backgroundColor: PRIMARY,
  },
  btnDestructive: {
    backgroundColor: DANGER,
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
