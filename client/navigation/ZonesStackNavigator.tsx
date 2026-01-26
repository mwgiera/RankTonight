import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ZonesScreen from "@/screens/ZonesScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ZonesStackParamList = {
  Zones: undefined;
};

const Stack = createNativeStackNavigator<ZonesStackParamList>();

export default function ZonesStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Zones"
        component={ZonesScreen}
        options={{
          headerTitle: "Zones",
        }}
      />
    </Stack.Navigator>
  );
}
