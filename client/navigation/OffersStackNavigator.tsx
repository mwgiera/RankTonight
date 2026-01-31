import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OffersScreen from "@/screens/OffersScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useLanguage } from "@/lib/language-context";

export type OffersStackParamList = {
  Offers: undefined;
};

const Stack = createNativeStackNavigator<OffersStackParamList>();

export default function OffersStackNavigator() {
  const screenOptions = useScreenOptions();
  const { t } = useLanguage();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Offers"
        component={OffersScreen}
        options={{ headerTitle: t.tabs.log }}
      />
    </Stack.Navigator>
  );
}
