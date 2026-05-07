import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialTopTabNavigationProp } from "@react-navigation/material-top-tabs";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Termini: undefined;
  Profil: undefined;
};

export type ProfileStackParamList = {
  ProfilMain: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  About: undefined;
  PrivacyPolicy: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  Services: undefined;
  DateSelection: {
    serviceId: string;
    serviceName: string;
    durationMinutes: number;
    price: number;
  };
  TimeSelection: {
    serviceId: string;
    serviceName: string;
    durationMinutes: number;
    price: number;
    selectedDate: string;
  };
  Confirmation: {
    serviceId: string;
    serviceName: string;
    durationMinutes: number;
    price: number;
    selectedDate: string;
    selectedTime: string;
  };
  Success: {
    serviceName: string;
    selectedDate: string;
    selectedTime: string;
    appointmentId: string;
  };
  AppointmentDetail: { appointmentId: string };
};

export type TerminiStackParamList = {
  AppointmentsList: { flash?: string } | undefined;
  AppointmentDetail: { appointmentId: string };
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export type AdminTabParamList = {
  Dashboard: undefined;
  Kalendar: undefined;
  Usluge: undefined;
  Profil: undefined;
};

export type AdminDashboardStackParamList = {
  DashboardMain: undefined;
  AdminAppointmentDetail: { appointmentId: string };
  AdminBooking: undefined;
};

export type AdminCalendarStackParamList = {
  CalendarMain: undefined;
  AdminAppointmentDetail: { appointmentId: string };
};

export type AdminServicesStackParamList = {
  ServicesMain: undefined;
  EditService: { serviceId?: string };
};

export type AdminProfileStackParamList = {
  ProfilMain: undefined;
};

export type AuthStackNavProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppTabNavProp = MaterialTopTabNavigationProp<AppTabParamList>;
export type HomeStackNavProp = NativeStackNavigationProp<HomeStackParamList>;
export type TerminiStackNavProp = NativeStackNavigationProp<TerminiStackParamList>;
export type AdminDashboardStackNavProp = NativeStackNavigationProp<AdminDashboardStackParamList>;
