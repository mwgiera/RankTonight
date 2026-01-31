export type TimeRegime = "morning-rush" | "midday" | "evening-rush" | "late-night" | "overnight";
export type DayType = "weekday" | "weekend";

export interface Bucket {
  timeRegime: TimeRegime;
  dayType: DayType;
  weekendMode: boolean;
}

export function nowMs(): number {
  return Date.now();
}

export function getBucket(tsMs: number): Bucket {
  const d = new Date(tsMs);
  const day = d.getDay();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const hm = hour + minute / 60;

  const timeRegime: TimeRegime =
    hm >= 5 && hm < 9 ? "morning-rush" :
    hm >= 9 && hm < 15 ? "midday" :
    hm >= 15 && hm < 19 ? "evening-rush" :
    (hm >= 19 && hm < 24) || (hm >= 0 && hm < 1) ? "late-night" :
    "overnight";

  const weekendMode = day === 0 || day === 6 || (day === 5 && hm >= 20);
  const dayType: DayType = weekendMode ? "weekend" : "weekday";

  return { timeRegime, dayType, weekendMode };
}

export function getTimeRegimeLabel(regime: TimeRegime): string {
  const labels: Record<TimeRegime, string> = {
    "morning-rush": "Morning Rush (05-09)",
    "midday": "Midday (09-15)",
    "evening-rush": "Evening Rush (15-19)",
    "late-night": "Late Night (19-01)",
    "overnight": "Overnight (01-05)",
  };
  return labels[regime];
}

export function getDayTypeLabel(dayType: DayType): string {
  return dayType === "weekend" ? "Weekend" : "Weekday";
}
