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

export type AuthStackNavProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppTabNavProp = BottomTabNavigationProp<AppTabParamList>;
