import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import ZoneDetailScreen from "@/screens/ZoneDetailScreen";
import LogEarningsScreen from "@/screens/LogEarningsScreen";
import AdminLoginScreen from "@/screens/AdminLoginScreen";
import AdminDashboardScreen from "@/screens/AdminDashboardScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  ZoneDetail: { zoneId: string };
  LogEarnings: undefined;
  AdminLogin: undefined;
  AdminDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ZoneDetail"
        component={ZoneDetailScreen}
        options={{
          headerTitle: "Zone Details",
        }}
      />
      <Stack.Screen
        name="LogEarnings"
        component={LogEarningsScreen}
        options={{
          presentation: "modal",
          headerTitle: "Log Earnings",
        }}
      />
      <Stack.Screen
        name="AdminLogin"
        component={AdminLoginScreen}
        options={{
          headerTitle: "Admin",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          headerTitle: "Admin Dashboard",
        }}
      />
    </Stack.Navigator>
  );
}
