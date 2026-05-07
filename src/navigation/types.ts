import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

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

export type AuthStackNavProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppTabNavProp = BottomTabNavigationProp<AppTabParamList>;
export type HomeStackNavProp = NativeStackNavigationProp<HomeStackParamList>;
export type TerminiStackNavProp = NativeStackNavigationProp<TerminiStackParamList>;
