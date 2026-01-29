import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "./query-client";
import { findNearestZone } from "./ranking-model";

const VISITOR_ID_KEY = "@driveradar:visitor_id";
const TRACKING_INTERVAL_MS = 60000;

let trackingIntervalId: ReturnType<typeof setInterval> | null = null;

async function getOrCreateVisitorId(): Promise<string> {
  try {
    let visitorId = await AsyncStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

async function sendLocationToServer(
  visitorId: string,
  latitude: number,
  longitude: number,
  zone: string | null
): Promise<void> {
  try {
    const apiUrl = getApiUrl();
    const url = new URL("/api/location", apiUrl);
    await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, latitude, longitude, zone }),
    });
  } catch (error) {
    console.warn("Failed to send location:", error);
  }
}

export async function startLocationTracking(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Location permission denied");
      return false;
    }

    const visitorId = await getOrCreateVisitorId();

    const trackLocation = async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = location.coords;
        const detectedZone = findNearestZone(latitude, longitude);
        const zoneName = detectedZone ? detectedZone.id : null;
        await sendLocationToServer(visitorId, latitude, longitude, zoneName);
      } catch (error) {
        console.warn("Failed to get location:", error);
      }
    };

    await trackLocation();

    if (trackingIntervalId) {
      clearInterval(trackingIntervalId);
    }
    trackingIntervalId = setInterval(trackLocation, TRACKING_INTERVAL_MS);

    return true;
  } catch (error) {
    console.error("Failed to start location tracking:", error);
    return false;
  }
}

export function stopLocationTracking(): void {
  if (trackingIntervalId) {
    clearInterval(trackingIntervalId);
    trackingIntervalId = null;
  }
}
