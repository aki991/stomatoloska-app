/**
 * Push notification wrapper.
 *
 * expo-notifications and expo-device are loaded via dynamic import ONLY when
 * not running in Expo Go (SDK 53+ dropped push support there). Static imports
 * of those packages crash Expo Go on launch, hence the conditional require.
 *
 * scheduleAppointmentNotifications and cancelAppointmentNotifications write
 * rows to the DB regardless of environment — cron jobs pick them up later.
 */

import Constants from "expo-constants";
import { Platform } from "react-native";
import { format, subHours } from "date-fns";
import { sr } from "date-fns/locale";
import { supabase } from "./supabase";

const isExpoGo = Constants.appOwnership === "expo";

// ─── Token registration ───────────────────────────────────────────────────────

export async function registerPushToken(userId: string): Promise<void> {
  if (isExpoGo) {
    console.log("[notifications] Expo Go — push token registration skipped");
    return;
  }

  // Dynamic imports: never evaluated in Expo Go
  const [{ default: Device }, Notifications] = await Promise.all([
    import("expo-device"),
    import("expo-notifications"),
  ]);

  if (!Device.isDevice) {
    console.log("[notifications] Simulator — push token registration skipped");
    return;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  const { status: final } =
    existing === "granted"
      ? { status: existing }
      : await Notifications.requestPermissionsAsync();

  if (final !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Termini",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } catch (e) {
    console.log("[notifications] getExpoPushTokenAsync failed:", (e as Error).message);
    return;
  }

  await supabase.from("push_tokens").upsert(
    { user_id: userId, token, platform: Platform.OS },
    { onConflict: "user_id,token" }
  );
}

// ─── Schedule notifications for a booked appointment ─────────────────────────

export async function scheduleAppointmentNotifications(
  appointmentId: string,
  userId: string,
  serviceName: string,
  startsAt: Date
): Promise<void> {
  const reminderAt = subHours(startsAt, 24);
  const timeStr = format(startsAt, "HH:mm", { locale: sr });

  const { error } = await supabase.from("notifications").insert([
    {
      user_id: userId,
      appointment_id: appointmentId,
      type: "booking_confirmed",
      title: "Termin zakazan ✓",
      body: `Vaš termin za ${serviceName} je uspešno zakazan.`,
      data: { appointmentId },
      scheduled_for: new Date().toISOString(),
      sent_at: null,
    },
    {
      user_id: userId,
      appointment_id: appointmentId,
      type: "appointment_reminder",
      title: "Podsetnik za sutra",
      body: `Sutra u ${timeStr}h imate termin za ${serviceName}.`,
      data: { appointmentId },
      scheduled_for: reminderAt.toISOString(),
      sent_at: null,
    },
  ]);

  if (error) {
    console.warn("[notifications] scheduleAppointmentNotifications:", error.message);
  }
}

// ─── Delete pending notifications when an appointment is cancelled ────────────

export async function cancelAppointmentNotifications(
  appointmentId: string
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("appointment_id", appointmentId)
    .is("sent_at", null);

  if (error) {
    console.warn("[notifications] cancelAppointmentNotifications:", error.message);
  }
}
