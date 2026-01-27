import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReceiptsScreen from "@/screens/ReceiptsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ReceiptsStackParamList = {
  Receipts: undefined;
};

const Stack = createNativeStackNavigator<ReceiptsStackParamList>();

export default function ReceiptsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Receipts"
        component={ReceiptsScreen}
        options={{ headerTitle: "Receipts" }}
      />
    </Stack.Navigator>
  );
}
