import type { ZoneCategory } from "./ranking-model";

export interface ZoneDef {
  id: string;
  name: string;
  category: ZoneCategory;
  center: [number, number];
  radiusKm: number;
  primaryBias: "daytime" | "late-night" | "commuter" | "mixed";
  defaultStayUntilMin: number;
  defaultLeaveIfMin: number;
  suggestedNextZones: [string, string];
}

export const KRAKOW_ZONES: ZoneDef[] = [
  { id: "stare-miasto", name: "Stare Miasto", category: "center", center: [50.0614, 19.9372], radiusKm: 1.2, primaryBias: "mixed", defaultStayUntilMin: 8, defaultLeaveIfMin: 15, suggestedNextZones: ["kazimierz", "grzegorzki"] },
  { id: "kazimierz", name: "Kazimierz", category: "center", center: [50.0508, 19.9447], radiusKm: 0.8, primaryBias: "late-night", defaultStayUntilMin: 10, defaultLeaveIfMin: 18, suggestedNextZones: ["stare-miasto", "podgorze"] },
  { id: "grzegorzki", name: "Grzegórzki", category: "center", center: [50.0656, 19.9686], radiusKm: 1.0, primaryBias: "daytime", defaultStayUntilMin: 6, defaultLeaveIfMin: 12, suggestedNextZones: ["stare-miasto", "czyzyny"] },
  { id: "podgorze", name: "Podgórze", category: "residential", center: [50.0408, 19.9544], radiusKm: 1.5, primaryBias: "commuter", defaultStayUntilMin: 5, defaultLeaveIfMin: 10, suggestedNextZones: ["kazimierz", "lagiewniki-borek"] },
  { id: "podgorze-duchackie", name: "Podgórze Duchackie", category: "residential", center: [50.0186, 19.9638], radiusKm: 1.8, primaryBias: "commuter", defaultStayUntilMin: 4, defaultLeaveIfMin: 8, suggestedNextZones: ["podgorze", "lagiewniki-borek"] },
  { id: "krowodrza", name: "Krowodrza", category: "residential", center: [50.0789, 19.9156], radiusKm: 1.5, primaryBias: "daytime", defaultStayUntilMin: 5, defaultLeaveIfMin: 10, suggestedNextZones: ["stare-miasto", "bronowice"] },
  { id: "pradnik-bialy", name: "Prądnik Biały", category: "residential", center: [50.1042, 19.9269], radiusKm: 2.0, primaryBias: "commuter", defaultStayUntilMin: 4, defaultLeaveIfMin: 8, suggestedNextZones: ["krowodrza", "pradnik-czerwony"] },
  { id: "pradnik-czerwony", name: "Prądnik Czerwony", category: "residential", center: [50.0972, 19.9683], radiusKm: 1.8, primaryBias: "commuter", defaultStayUntilMin: 4, defaultLeaveIfMin: 8, suggestedNextZones: ["pradnik-bialy", "mistrzejowice"] },
  { id: "czyzyny", name: "Czyżyny", category: "residential", center: [50.0711, 20.0086], radiusKm: 1.5, primaryBias: "mixed", defaultStayUntilMin: 5, defaultLeaveIfMin: 10, suggestedNextZones: ["grzegorzki", "nowa-huta"] },
  { id: "mistrzejowice", name: "Mistrzejowice", category: "residential", center: [50.1056, 20.0128], radiusKm: 1.5, primaryBias: "commuter", defaultStayUntilMin: 4, defaultLeaveIfMin: 8, suggestedNextZones: ["pradnik-czerwony", "bienczyce"] },
  { id: "bienczyce", name: "Bieńczyce", category: "residential", center: [50.0917, 20.0344], radiusKm: 1.5, primaryBias: "commuter", defaultStayUntilMin: 4, defaultLeaveIfMin: 8, suggestedNextZones: ["mistrzejowice", "nowa-huta"] },
  { id: "nowa-huta", name: "Nowa Huta", category: "residential", center: [50.0711, 20.0419], radiusKm: 2.5, primaryBias: "mixed", defaultStayUntilMin: 5, defaultLeaveIfMin: 12, suggestedNextZones: ["czyzyny", "bienczyce"] },
  { id: "bronowice", name: "Bronowice", category: "residential", center: [50.0833, 19.8875], radiusKm: 1.5, primaryBias: "daytime", defaultStayUntilMin: 4, defaultLeaveIfMin: 8, suggestedNextZones: ["krowodrza", "zwierzyniec"] },
  { id: "zwierzyniec", name: "Zwierzyniec", category: "residential", center: [50.0583, 19.8667], radiusKm: 2.0, primaryBias: "daytime", defaultStayUntilMin: 5, defaultLeaveIfMin: 10, suggestedNextZones: ["bronowice", "debniki"] },
  { id: "debniki", name: "Dębniki", category: "residential", center: [50.0414, 19.9128], radiusKm: 1.8, primaryBias: "mixed", defaultStayUntilMin: 5, defaultLeaveIfMin: 10, suggestedNextZones: ["zwierzyniec", "lagiewniki-borek"] },
  { id: "lagiewniki-borek", name: "Łagiewniki–Borek Fałęcki", category: "residential", center: [50.0156, 19.9233], radiusKm: 2.0, primaryBias: "commuter", defaultStayUntilMin: 4, defaultLeaveIfMin: 8, suggestedNextZones: ["debniki", "podgorze-duchackie"] },
  { id: "ruczaj", name: "Ruczaj", category: "residential", center: [50.0258, 19.8883], radiusKm: 1.5, primaryBias: "commuter", defaultStayUntilMin: 4, defaultLeaveIfMin: 8, suggestedNextZones: ["debniki", "lagiewniki-borek"] },
  { id: "airport", name: "Airport / Balice", category: "airport", center: [50.0778, 19.7847], radiusKm: 2.5, primaryBias: "mixed", defaultStayUntilMin: 10, defaultLeaveIfMin: 20, suggestedNextZones: ["bronowice", "krowodrza"] },
];

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function detectZoneOnce(lat: number, lng: number, zones: ZoneDef[] = KRAKOW_ZONES): string | null {
  const candidates: Array<{ id: string; containment: number; idx: number }> = [];

  zones.forEach((z, idx) => {
    const d = haversineDistance(lat, lng, z.center[0], z.center[1]);
    if (d <= z.radiusKm) {
      candidates.push({ id: z.id, containment: z.radiusKm - d, idx });
    }
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => (b.containment - a.containment) || (a.idx - b.idx));
  return candidates[0].id;
}

export interface ZoneState {
  currentZoneId: string | null;
  pendingZoneId: string | null;
  pendingSinceMs: number | null;
}

const STABLE_MS = 25_000;
const ACCURACY_MAX_M = 80;

export function detectZoneWithHysteresis(
  lat: number,
  lng: number,
  accuracyM: number,
  nowTs: number,
  state: ZoneState,
  zones: ZoneDef[] = KRAKOW_ZONES
): ZoneState {
  if (accuracyM > ACCURACY_MAX_M) return state;

  const candidate = detectZoneOnce(lat, lng, zones);

  if (!candidate) return { ...state, pendingZoneId: null, pendingSinceMs: null };

  if (candidate === state.currentZoneId) {
    return { ...state, pendingZoneId: null, pendingSinceMs: null };
  }

  if (state.pendingZoneId !== candidate) {
    return { ...state, pendingZoneId: candidate, pendingSinceMs: nowTs };
  }

  if (state.pendingSinceMs && (nowTs - state.pendingSinceMs) >= STABLE_MS) {
    return { currentZoneId: candidate, pendingZoneId: null, pendingSinceMs: null };
  }

  return state;
}

export function getZoneById(zoneId: string): ZoneDef | undefined {
  return KRAKOW_ZONES.find(z => z.id === zoneId);
}

export function getZoneName(zoneId: string): string {
  const zone = getZoneById(zoneId);
  return zone?.name ?? zoneId;
}

export function getZoneCategory(zoneId: string): ZoneCategory | null {
  const zone = getZoneById(zoneId);
  return zone?.category ?? null;
}

export function getAllZoneIds(): string[] {
  return KRAKOW_ZONES.map(z => z.id);
}

export function getAllZoneNames(): Array<{ id: string; name: string }> {
  return KRAKOW_ZONES.map(z => ({ id: z.id, name: z.name }));
}

export const INITIAL_ZONE_STATE: ZoneState = {
  currentZoneId: null,
  pendingZoneId: null,
  pendingSinceMs: null,
};
