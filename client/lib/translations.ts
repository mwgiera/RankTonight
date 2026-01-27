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
    receipts: string;
  };
  now: {
    title: string;
    topPick: string;
    recommendation: string;
    alternativeOptions: string;
    demand: string;
    friction: string;
    incentive: string;
    reliable: string;
    high: string;
    medium: string;
    low: string;
    confidence: string;
    strong: string;
    weak: string;
    basedOn: string;
    changeZone: string;
    scoreBreakdown: string;
    selectZone: string;
    opportunityScore: string;
    profitability: string;
    proxyModeLabel: string;
    personalModeLabel: string;
    noDataYet: string;
    needMoreRecords: string;
  };
  zones: {
    title: string;
    selectZone: string;
    currentZone: string;
    behaviorBias: string;
    all: string;
    airport: string;
    center: string;
    residential: string;
    noZonesFound: string;
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
    noLogsDesc: string;
    logFirstRide: string;
    delete: string;
    totalEarnings: string;
    hoursLogged: string;
    avgRate: string;
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
    scoringMode: string;
    pilotMode: string;
    personalMode: string;
    pilotModeDesc: string;
    personalModeDesc: string;
  };
  receipts: {
    title: string;
    pasteReceipt: string;
    selectPlatform: string;
    parseReceipt: string;
    parsedPreview: string;
    date: string;
    time: string;
    amount: string;
    duration: string;
    unknown: string;
    revPerHour: string;
    saveToLog: string;
    editFields: string;
    parseError: string;
    noReceiptText: string;
    exportCsv: string;
    parsedReceipts: string;
    importToLog: string;
    perTrip: string;
    durationMissing: string;
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
      receipts: "Receipts",
    },
    now: {
      title: "DriveRadar",
      topPick: "TOP PICK",
      recommendation: "Recommended platform for maximum earnings",
      alternativeOptions: "Alternative Options",
      demand: "Demand",
      friction: "Friction",
      incentive: "Incentive",
      reliable: "Reliable",
      high: "High",
      medium: "Medium",
      low: "Low",
      confidence: "Confidence",
      strong: "Strong",
      weak: "Weak",
      basedOn: "Based on",
      changeZone: "Change Zone",
      scoreBreakdown: "Score Breakdown",
      selectZone: "Select Zone",
      opportunityScore: "Opportunity Score",
      profitability: "Profitability",
      proxyModeLabel: "Proxy model (demand/friction priors). Not based on earnings history.",
      personalModeLabel: "Based on your logged earnings",
      noDataYet: "No data yet",
      needMoreRecords: "Need more records for personal mode",
    },
    zones: {
      title: "Zones",
      selectZone: "Select Zone",
      currentZone: "Current Zone",
      behaviorBias: "Behavior",
      all: "All",
      airport: "Airport",
      center: "City Center",
      residential: "Residential",
      noZonesFound: "No zones found",
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
      noLogs: "No Earnings Logged",
      noLogsDesc: "Start logging your rides to track performance and improve recommendations.",
      logFirstRide: "Log Your First Ride",
      delete: "Delete",
      totalEarnings: "Total Earnings",
      hoursLogged: "Hours Logged",
      avgRate: "Avg Rate",
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
      scoringMode: "Scoring Mode",
      pilotMode: "Pilot Mode",
      personalMode: "Personal Mode",
      pilotModeDesc: "Uses market benchmarks until you log 5+ trips",
      personalModeDesc: "Uses your logged earnings data",
    },
    receipts: {
      title: "Receipts",
      pasteReceipt: "Paste Receipt Text",
      selectPlatform: "Select Platform",
      parseReceipt: "Parse Receipt",
      parsedPreview: "Parsed Preview",
      date: "Date",
      time: "Time",
      amount: "Amount",
      duration: "Duration",
      unknown: "Unknown",
      revPerHour: "Rev/Hour",
      saveToLog: "Save to Log",
      editFields: "Edit Fields",
      parseError: "Could not parse receipt",
      noReceiptText: "Paste receipt text to parse",
      exportCsv: "Export CSV",
      parsedReceipts: "Parsed Receipts",
      importToLog: "Import to Log",
      perTrip: "per trip",
      durationMissing: "duration missing",
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
      receipts: "Quittungen",
    },
    now: {
      title: "DriveRadar",
      topPick: "TOP-WAHL",
      recommendation: "Empfohlene Plattform für maximale Einnahmen",
      alternativeOptions: "Weitere Optionen",
      demand: "Nachfrage",
      friction: "Reibung",
      incentive: "Anreiz",
      reliable: "Zuverlässig",
      high: "Hoch",
      medium: "Mittel",
      low: "Niedrig",
      confidence: "Vertrauen",
      strong: "Stark",
      weak: "Schwach",
      basedOn: "Basierend auf",
      changeZone: "Zone wechseln",
      scoreBreakdown: "Punkteaufschlüsselung",
      selectZone: "Zone auswählen",
      opportunityScore: "Chancen-Score",
      profitability: "Rentabilität",
      proxyModeLabel: "Proxy-Modell (Nachfrage/Reibungs-Priors). Nicht auf Einnahmenhistorie basiert.",
      personalModeLabel: "Basierend auf Ihren protokollierten Einnahmen",
      noDataYet: "Noch keine Daten",
      needMoreRecords: "Mehr Einträge für persönlichen Modus erforderlich",
    },
    zones: {
      title: "Zonen",
      selectZone: "Zone auswählen",
      currentZone: "Aktuelle Zone",
      behaviorBias: "Verhalten",
      all: "Alle",
      airport: "Flughafen",
      center: "Stadtzentrum",
      residential: "Wohngebiet",
      noZonesFound: "Keine Zonen gefunden",
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
      noLogs: "Keine Einnahmen protokolliert",
      noLogsDesc: "Protokollieren Sie Ihre Fahrten, um die Leistung zu verfolgen und Empfehlungen zu verbessern.",
      logFirstRide: "Erste Fahrt protokollieren",
      delete: "Löschen",
      totalEarnings: "Gesamteinnahmen",
      hoursLogged: "Stunden protokolliert",
      avgRate: "Durchschn. Rate",
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
      scoringMode: "Bewertungsmodus",
      pilotMode: "Pilot-Modus",
      personalMode: "Persönlicher Modus",
      pilotModeDesc: "Verwendet Markt-Benchmarks bis 5+ Fahrten protokolliert",
      personalModeDesc: "Verwendet Ihre protokollierten Einnahmen",
    },
    receipts: {
      title: "Quittungen",
      pasteReceipt: "Quittungstext einfügen",
      selectPlatform: "Plattform auswählen",
      parseReceipt: "Quittung analysieren",
      parsedPreview: "Analysierte Vorschau",
      date: "Datum",
      time: "Zeit",
      amount: "Betrag",
      duration: "Dauer",
      unknown: "Unbekannt",
      revPerHour: "Einnahmen/Stunde",
      saveToLog: "Im Protokoll speichern",
      editFields: "Felder bearbeiten",
      parseError: "Quittung konnte nicht analysiert werden",
      noReceiptText: "Quittungstext zum Analysieren einfügen",
      exportCsv: "CSV exportieren",
      parsedReceipts: "Analysierte Quittungen",
      importToLog: "Ins Protokoll importieren",
      perTrip: "pro Fahrt",
      durationMissing: "Dauer fehlt",
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
      receipts: "Paragony",
    },
    now: {
      title: "DriveRadar",
      topPick: "NAJLEPSZY WYBÓR",
      recommendation: "Zalecana platforma dla maksymalnych zarobków",
      alternativeOptions: "Alternatywne opcje",
      demand: "Popyt",
      friction: "Opór",
      incentive: "Zachęta",
      reliable: "Niezawodny",
      high: "Wysoki",
      medium: "Średni",
      low: "Niski",
      confidence: "Pewność",
      strong: "Silna",
      weak: "Słaba",
      basedOn: "Na podstawie",
      changeZone: "Zmień strefę",
      scoreBreakdown: "Rozkład punktów",
      selectZone: "Wybierz strefę",
      opportunityScore: "Wynik szansy",
      profitability: "Rentowność",
      proxyModeLabel: "Model proxy (priorytety popytu/oporu). Nie oparte na historii zarobków.",
      personalModeLabel: "Na podstawie Twoich zalogowanych zarobków",
      noDataYet: "Brak danych",
      needMoreRecords: "Potrzeba więcej wpisów dla trybu osobistego",
    },
    zones: {
      title: "Strefy",
      selectZone: "Wybierz strefę",
      currentZone: "Aktualna strefa",
      behaviorBias: "Zachowanie",
      all: "Wszystkie",
      airport: "Lotnisko",
      center: "Centrum miasta",
      residential: "Dzielnica mieszkaniowa",
      noZonesFound: "Nie znaleziono stref",
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
      noLogsDesc: "Zacznij rejestrować swoje przejazdy, aby śledzić wydajność i ulepszać rekomendacje.",
      logFirstRide: "Zarejestruj pierwszą jazdę",
      delete: "Usuń",
      totalEarnings: "Łączne zarobki",
      hoursLogged: "Godzin zarejestrowanych",
      avgRate: "Średnia stawka",
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
      scoringMode: "Tryb oceny",
      pilotMode: "Tryb pilotażowy",
      personalMode: "Tryb osobisty",
      pilotModeDesc: "Używa benchmarków rynkowych do 5+ przejazdów",
      personalModeDesc: "Używa Twoich zalogowanych zarobków",
    },
    receipts: {
      title: "Paragony",
      pasteReceipt: "Wklej tekst paragonu",
      selectPlatform: "Wybierz platformę",
      parseReceipt: "Analizuj paragon",
      parsedPreview: "Analizowany podgląd",
      date: "Data",
      time: "Czas",
      amount: "Kwota",
      duration: "Czas trwania",
      unknown: "Nieznany",
      revPerHour: "Przychód/godz.",
      saveToLog: "Zapisz do dziennika",
      editFields: "Edytuj pola",
      parseError: "Nie można przeanalizować paragonu",
      noReceiptText: "Wklej tekst paragonu do analizy",
      exportCsv: "Eksportuj CSV",
      parsedReceipts: "Przeanalizowane paragony",
      importToLog: "Importuj do dziennika",
      perTrip: "na przejazd",
      durationMissing: "brak czasu trwania",
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
