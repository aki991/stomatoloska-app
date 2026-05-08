import { Alert, Platform } from "react-native";
import { ConfirmModal } from "../components/ConfirmModal";

interface ConfirmAlertOptions {
  confirmText?: string;
  cancelText?: string;
  /** When true (default), the confirm button is styled as destructive (red). */
  destructive?: boolean;
}

/**
 * Cross-platform confirm dialog.
 *
 *   confirmAlert("Odjava", "Da li ste sigurni?", () => signOut());
 *   confirmAlert("Obriši", "Stvarno?", del, "Obriši", "Otkaži");
 *   confirmAlert("Završi", "Označiti kao završeno?", complete, { destructive: false });
 *
 * On web, renders a custom <ConfirmModalHost /> mounted at the app root.
 * On native, falls back to React Native's Alert.alert.
 */
export function confirmAlert(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmTextOrOptions: string | ConfirmAlertOptions = "Potvrdi",
  cancelText: string = "Otkaži"
): void {
  const opts: ConfirmAlertOptions =
    typeof confirmTextOrOptions === "string"
      ? { confirmText: confirmTextOrOptions, cancelText }
      : { cancelText, ...confirmTextOrOptions };

  const confirmLabel = opts.confirmText ?? "Potvrdi";
  const cancelLabel = opts.cancelText ?? "Otkaži";
  const destructive = opts.destructive ?? true;

  if (Platform.OS === "web") {
    ConfirmModal.show({
      title,
      message,
      confirmText: confirmLabel,
      cancelText: cancelLabel,
      destructive,
      onConfirm,
    });
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: "cancel" },
    {
      text: confirmLabel,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}
