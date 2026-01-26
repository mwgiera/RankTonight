import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NowScreen from "@/screens/NowScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type NowStackParamList = {
  Now: undefined;
};

const Stack = createNativeStackNavigator<NowStackParamList>();

export default function NowStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Now"
        component={NowScreen}
        options={{
          headerTitle: () => <HeaderTitle title="DriveRadar" />,
        }}
      />
    </Stack.Navigator>
  );
}
