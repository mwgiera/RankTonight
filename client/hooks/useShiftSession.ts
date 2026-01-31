import { useState, useEffect, useRef, useCallback } from "react";
import { AppState, Platform as RNPlatform } from "react-native";
import * as Location from "expo-location";
import { nowMs } from "@/lib/time-buckets";
import {
  detectZoneWithHysteresis,
  INITIAL_ZONE_STATE,
  type ZoneState,
  getZoneName,
} from "@/lib/zones";
import {
  getActiveSession,
  startSession,
  stopSession,
  openDwell,
  closeDwell,
  getOpenDwell,
  type Session,
  type ZoneDwell,
} from "@/lib/database";

export interface ShiftState {
  isActive: boolean;
  session: Session | null;
  currentZoneId: string | null;
  currentZoneName: string | null;
  dwellMinutes: number;
  isLoading: boolean;
  locationError: string | null;
  isWebPlatform: boolean;
}

interface LocationSubscription {
  remove: () => void;
}

const GPS_TIME_INTERVAL_MS = 10_000;
const GPS_DISTANCE_INTERVAL_M = 50;

export function useShiftSession() {
  const [state, setState] = useState<ShiftState>({
    isActive: false,
    session: null,
    currentZoneId: null,
    currentZoneName: null,
    dwellMinutes: 0,
    isLoading: true,
    locationError: null,
    isWebPlatform: RNPlatform.OS === "web",
  });

  const zoneStateRef = useRef<ZoneState>(INITIAL_ZONE_STATE);
  const currentDwellRef = useRef<ZoneDwell | null>(null);
  const locationSubRef = useRef<LocationSubscription | null>(null);
  const dwellStartMsRef = useRef<number | null>(null);
  const distanceAccumulatorRef = useRef<number>(0);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const updateDwellMinutes = useCallback(() => {
    if (dwellStartMsRef.current) {
      const dwellMs = nowMs() - dwellStartMsRef.current;
      const dwellMinutes = dwellMs / 60000;
      setState((prev) => ({ ...prev, dwellMinutes }));
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state.isActive && dwellStartMsRef.current) {
      interval = setInterval(updateDwellMinutes, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isActive, updateDwellMinutes]);

  const handleLocationUpdate = useCallback(
    async (location: Location.LocationObject) => {
      if (!state.session) return;

      const { latitude: lat, longitude: lng, accuracy } = location.coords;
      const accuracyM = accuracy ?? 100;
      const ts = nowMs();

      if (lastLocationRef.current) {
        const R = 6371000;
        const dLat = ((lat - lastLocationRef.current.lat) * Math.PI) / 180;
        const dLng = ((lng - lastLocationRef.current.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lastLocationRef.current.lat * Math.PI) / 180) *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distM = R * c;
        distanceAccumulatorRef.current += distM / 1000;
      }
      lastLocationRef.current = { lat, lng };

      const prevZoneId = zoneStateRef.current.currentZoneId;
      const newZoneState = detectZoneWithHysteresis(
        lat,
        lng,
        accuracyM,
        ts,
        zoneStateRef.current
      );
      zoneStateRef.current = newZoneState;

      if (newZoneState.currentZoneId !== prevZoneId) {
        if (currentDwellRef.current) {
          await closeDwell(
            currentDwellRef.current.id,
            distanceAccumulatorRef.current
          );
          distanceAccumulatorRef.current = 0;
        }

        if (newZoneState.currentZoneId) {
          const newDwell = await openDwell(
            state.session.id,
            newZoneState.currentZoneId
          );
          currentDwellRef.current = newDwell;
          dwellStartMsRef.current = newDwell.startMs;

          setState((prev) => ({
            ...prev,
            currentZoneId: newZoneState.currentZoneId,
            currentZoneName: getZoneName(newZoneState.currentZoneId!),
            dwellMinutes: 0,
          }));
        } else {
          currentDwellRef.current = null;
          dwellStartMsRef.current = null;
          setState((prev) => ({
            ...prev,
            currentZoneId: null,
            currentZoneName: null,
            dwellMinutes: 0,
          }));
        }
      }
    },
    [state.session]
  );

  const startLocationWatch = useCallback(async () => {
    if (RNPlatform.OS === "web") {
      setState((prev) => ({
        ...prev,
        locationError: "GPS tracking requires Expo Go on a physical device",
      }));
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setState((prev) => ({
        ...prev,
        locationError: "Location permission denied",
      }));
      return;
    }

    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: GPS_TIME_INTERVAL_MS,
          distanceInterval: GPS_DISTANCE_INTERVAL_M,
        },
        handleLocationUpdate
      );
      locationSubRef.current = sub;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        locationError: "Failed to start location tracking",
      }));
    }
  }, [handleLocationUpdate]);

  const stopLocationWatch = useCallback(() => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (state.isActive) {
        if (nextState === "background" || nextState === "inactive") {
          stopLocationWatch();
        } else if (nextState === "active") {
          startLocationWatch();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [state.isActive, startLocationWatch, stopLocationWatch]);

  useEffect(() => {
    async function init() {
      try {
        const activeSession = await getActiveSession();
        if (activeSession) {
          const openDwellRecord = await getOpenDwell(activeSession.id);
          if (openDwellRecord) {
            currentDwellRef.current = openDwellRecord;
            dwellStartMsRef.current = openDwellRecord.startMs;
            zoneStateRef.current = {
              currentZoneId: openDwellRecord.zoneId,
              pendingZoneId: null,
              pendingSinceMs: null,
            };
          }

          setState((prev) => ({
            ...prev,
            isActive: true,
            session: activeSession,
            currentZoneId: openDwellRecord?.zoneId ?? null,
            currentZoneName: openDwellRecord
              ? getZoneName(openDwellRecord.zoneId)
              : null,
            dwellMinutes: openDwellRecord
              ? (nowMs() - openDwellRecord.startMs) / 60000
              : 0,
            isLoading: false,
          }));

          if (RNPlatform.OS !== "web") {
            startLocationWatch();
          }
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    }

    init();

    return () => {
      stopLocationWatch();
    };
  }, [startLocationWatch, stopLocationWatch]);

  const startShift = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const session = await startSession();
      
      zoneStateRef.current = INITIAL_ZONE_STATE;
      currentDwellRef.current = null;
      dwellStartMsRef.current = null;
      distanceAccumulatorRef.current = 0;
      lastLocationRef.current = null;

      setState((prev) => ({
        ...prev,
        isActive: true,
        session,
        currentZoneId: null,
        currentZoneName: null,
        dwellMinutes: 0,
        isLoading: false,
        locationError: null,
      }));

      if (RNPlatform.OS !== "web") {
        await startLocationWatch();
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [startLocationWatch]);

  const endShift = useCallback(async () => {
    if (!state.session) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      stopLocationWatch();
      await stopSession(state.session.id);

      zoneStateRef.current = INITIAL_ZONE_STATE;
      currentDwellRef.current = null;
      dwellStartMsRef.current = null;
      distanceAccumulatorRef.current = 0;
      lastLocationRef.current = null;

      setState({
        isActive: false,
        session: null,
        currentZoneId: null,
        currentZoneName: null,
        dwellMinutes: 0,
        isLoading: false,
        locationError: null,
        isWebPlatform: RNPlatform.OS === "web",
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.session, stopLocationWatch]);

  return {
    ...state,
    startShift,
    endShift,
  };
}
