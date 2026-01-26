export type Language = "en" | "de" | "pl";

export const LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
];

type TranslationKeys = {
  tabs: {
    now: string;
    zones: string;
    log: string;
    profile: string;
  };
  now: {
    title: string;
    topPick: string;
    recommendation: string;
    alternativeOptions: string;
    demand: string;
    friction: string;
    high: string;
    medium: string;
    low: string;
    confidence: string;
    strong: string;
    weak: string;
    basedOn: string;
  };
  zones: {
    title: string;
    selectZone: string;
    currentZone: string;
    behaviorBias: string;
    airport: string;
    center: string;
    residential: string;
  };
  log: {
    title: string;
    addEarnings: string;
    platform: string;
    amount: string;
    duration: string;
    minutes: string;
    zone: string;
    save: string;
    cancel: string;
    recentLogs: string;
    noLogs: string;
    delete: string;
  };
  profile: {
    title: string;
    settings: string;
    language: string;
    selectLanguage: string;
    sensitivity: string;
    sensitivityDesc: string;
    conservative: string;
    aggressive: string;
    about: string;
    version: string;
    dataManagement: string;
    clearAllData: string;
    clearDataConfirm: string;
    clearDataSuccess: string;
    designedBy: string;
    developedBy: string;
    license: string;
  };
  context: {
    weekendMode: string;
    weekdayMode: string;
    earlyMorning: string;
    morningRush: string;
    midday: string;
    afternoon: string;
    eveningRush: string;
    lateNight: string;
    overnight: string;
  };
  common: {
    confirm: string;
    cancel: string;
    ok: string;
    error: string;
    success: string;
  };
};

const translations: Record<Language, TranslationKeys> = {
  en: {
    tabs: {
      now: "Now",
      zones: "Zones",
      log: "Log",
      profile: "Profile",
    },
    now: {
      title: "DriveRadar",
      topPick: "TOP PICK",
      recommendation: "Recommended platform for maximum earnings",
      alternativeOptions: "Alternative Options",
      demand: "Demand",
      friction: "Friction",
      high: "High",
      medium: "Medium",
      low: "Low",
      confidence: "Confidence",
      strong: "Strong",
      weak: "Weak",
      basedOn: "Based on",
    },
    zones: {
      title: "Zones",
      selectZone: "Select Zone",
      currentZone: "Current Zone",
      behaviorBias: "Behavior",
      airport: "Airport",
      center: "City Center",
      residential: "Residential",
    },
    log: {
      title: "Earnings Log",
      addEarnings: "Add Earnings",
      platform: "Platform",
      amount: "Amount",
      duration: "Duration",
      minutes: "min",
      zone: "Zone",
      save: "Save",
      cancel: "Cancel",
      recentLogs: "Recent Logs",
      noLogs: "No earnings logged yet",
      delete: "Delete",
    },
    profile: {
      title: "Profile",
      settings: "Settings",
      language: "Language",
      selectLanguage: "Select Language",
      sensitivity: "Model Sensitivity",
      sensitivityDesc: "Adjust how aggressively the model differentiates platforms",
      conservative: "Conservative",
      aggressive: "Aggressive",
      about: "About",
      version: "Version",
      dataManagement: "Data Management",
      clearAllData: "Clear All Data",
      clearDataConfirm: "Are you sure you want to clear all data? This cannot be undone.",
      clearDataSuccess: "All data cleared",
      designedBy: "Designed by",
      developedBy: "Developed by",
      license: "All rights reserved | MIT License",
    },
    context: {
      weekendMode: "Weekend Mode",
      weekdayMode: "Weekday Mode",
      earlyMorning: "Early Morning (05-07)",
      morningRush: "Morning Rush (07-10)",
      midday: "Midday (10-14)",
      afternoon: "Afternoon (14-17)",
      eveningRush: "Evening Rush (17-20)",
      lateNight: "Late Night (20-02)",
      overnight: "Overnight (02-05)",
    },
    common: {
      confirm: "Confirm",
      cancel: "Cancel",
      ok: "OK",
      error: "Error",
      success: "Success",
    },
  },
  de: {
    tabs: {
      now: "Jetzt",
      zones: "Zonen",
      log: "Protokoll",
      profile: "Profil",
    },
    now: {
      title: "DriveRadar",
      topPick: "TOP-WAHL",
      recommendation: "Empfohlene Plattform für maximale Einnahmen",
      alternativeOptions: "Weitere Optionen",
      demand: "Nachfrage",
      friction: "Reibung",
      high: "Hoch",
      medium: "Mittel",
      low: "Niedrig",
      confidence: "Vertrauen",
      strong: "Stark",
      weak: "Schwach",
      basedOn: "Basierend auf",
    },
    zones: {
      title: "Zonen",
      selectZone: "Zone auswählen",
      currentZone: "Aktuelle Zone",
      behaviorBias: "Verhalten",
      airport: "Flughafen",
      center: "Stadtzentrum",
      residential: "Wohngebiet",
    },
    log: {
      title: "Einnahmen-Protokoll",
      addEarnings: "Einnahmen hinzufügen",
      platform: "Plattform",
      amount: "Betrag",
      duration: "Dauer",
      minutes: "Min",
      zone: "Zone",
      save: "Speichern",
      cancel: "Abbrechen",
      recentLogs: "Letzte Einträge",
      noLogs: "Noch keine Einnahmen protokolliert",
      delete: "Löschen",
    },
    profile: {
      title: "Profil",
      settings: "Einstellungen",
      language: "Sprache",
      selectLanguage: "Sprache auswählen",
      sensitivity: "Modellempfindlichkeit",
      sensitivityDesc: "Passen Sie an, wie aggressiv das Modell Plattformen unterscheidet",
      conservative: "Konservativ",
      aggressive: "Aggressiv",
      about: "Über",
      version: "Version",
      dataManagement: "Datenverwaltung",
      clearAllData: "Alle Daten löschen",
      clearDataConfirm: "Möchten Sie wirklich alle Daten löschen? Dies kann nicht rückgängig gemacht werden.",
      clearDataSuccess: "Alle Daten gelöscht",
      designedBy: "Design von",
      developedBy: "Entwickelt von",
      license: "Alle Rechte vorbehalten | MIT-Lizenz",
    },
    context: {
      weekendMode: "Wochenend-Modus",
      weekdayMode: "Wochentag-Modus",
      earlyMorning: "Früher Morgen (05-07)",
      morningRush: "Morgen-Stoßzeit (07-10)",
      midday: "Mittag (10-14)",
      afternoon: "Nachmittag (14-17)",
      eveningRush: "Abend-Stoßzeit (17-20)",
      lateNight: "Spätabend (20-02)",
      overnight: "Nacht (02-05)",
    },
    common: {
      confirm: "Bestätigen",
      cancel: "Abbrechen",
      ok: "OK",
      error: "Fehler",
      success: "Erfolg",
    },
  },
  pl: {
    tabs: {
      now: "Teraz",
      zones: "Strefy",
      log: "Dziennik",
      profile: "Profil",
    },
    now: {
      title: "DriveRadar",
      topPick: "NAJLEPSZY WYBÓR",
      recommendation: "Zalecana platforma dla maksymalnych zarobków",
      alternativeOptions: "Alternatywne opcje",
      demand: "Popyt",
      friction: "Opór",
      high: "Wysoki",
      medium: "Średni",
      low: "Niski",
      confidence: "Pewność",
      strong: "Silna",
      weak: "Słaba",
      basedOn: "Na podstawie",
    },
    zones: {
      title: "Strefy",
      selectZone: "Wybierz strefę",
      currentZone: "Aktualna strefa",
      behaviorBias: "Zachowanie",
      airport: "Lotnisko",
      center: "Centrum miasta",
      residential: "Dzielnica mieszkaniowa",
    },
    log: {
      title: "Dziennik zarobków",
      addEarnings: "Dodaj zarobki",
      platform: "Platforma",
      amount: "Kwota",
      duration: "Czas trwania",
      minutes: "min",
      zone: "Strefa",
      save: "Zapisz",
      cancel: "Anuluj",
      recentLogs: "Ostatnie wpisy",
      noLogs: "Brak zarejestrowanych zarobków",
      delete: "Usuń",
    },
    profile: {
      title: "Profil",
      settings: "Ustawienia",
      language: "Język",
      selectLanguage: "Wybierz język",
      sensitivity: "Czułość modelu",
      sensitivityDesc: "Dostosuj, jak agresywnie model rozróżnia platformy",
      conservative: "Konserwatywny",
      aggressive: "Agresywny",
      about: "O aplikacji",
      version: "Wersja",
      dataManagement: "Zarządzanie danymi",
      clearAllData: "Wyczyść wszystkie dane",
      clearDataConfirm: "Czy na pewno chcesz usunąć wszystkie dane? Tej operacji nie można cofnąć.",
      clearDataSuccess: "Wszystkie dane usunięte",
      designedBy: "Projekt",
      developedBy: "Rozwój",
      license: "Wszelkie prawa zastrzeżone | Licencja MIT",
    },
    context: {
      weekendMode: "Tryb weekendowy",
      weekdayMode: "Tryb dzienny",
      earlyMorning: "Wczesny ranek (05-07)",
      morningRush: "Poranny szczyt (07-10)",
      midday: "Południe (10-14)",
      afternoon: "Popołudnie (14-17)",
      eveningRush: "Wieczorny szczyt (17-20)",
      lateNight: "Późna noc (20-02)",
      overnight: "Noc (02-05)",
    },
    common: {
      confirm: "Potwierdź",
      cancel: "Anuluj",
      ok: "OK",
      error: "Błąd",
      success: "Sukces",
    },
  },
};

export function getTranslation(language: Language): TranslationKeys {
  return translations[language];
}

export function getTimeRegimeLabelTranslated(regime: string, language: Language): string {
  const t = translations[language].context;
  const map: Record<string, string> = {
    "early-morning": t.earlyMorning,
    "morning-rush": t.morningRush,
    "midday": t.midday,
    "afternoon": t.afternoon,
    "evening-rush": t.eveningRush,
    "late-night": t.lateNight,
    "overnight": t.overnight,
  };
  return map[regime] || regime;
}

export function getDayModeLabelTranslated(dayMode: string, language: Language): string {
  const t = translations[language].context;
  return dayMode === "WEEKEND" ? t.weekendMode : t.weekdayMode;
}
