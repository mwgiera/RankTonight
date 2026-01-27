import type { Platform } from "./ranking-model";

export interface ParsedReceipt {
  id: string;
  platform: Platform;
  timestamp: number;
  amount: number;
  duration: number | null;
  currency: string;
  rawText: string;
  parseConfidence: "high" | "medium" | "low";
  errors: string[];
}

interface ParsePattern {
  platform: Platform;
  datePatterns: RegExp[];
  amountPatterns: RegExp[];
  durationPatterns: RegExp[];
}

const UBER_PATTERNS: ParsePattern = {
  platform: "uber",
  datePatterns: [
    /(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})\s*[,\s]+(\d{1,2}:\d{2})/i,
    /(\d{4}-\d{2}-\d{2})\s*[T\s](\d{2}:\d{2})/i,
    /(\d{1,2}\s+\w+\s+\d{4})\s*[,\s]+(\d{1,2}:\d{2})/i,
    /Trip\s+on\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
  ],
  amountPatterns: [
    /(?:Total|Amount|Fare)[:\s]*(?:PLN|zł|€|EUR|$)?\s*(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s*(?:PLN|zł|€|EUR)/i,
    /(?:PLN|zł|€|EUR)\s*(\d+[.,]\d{2})/i,
    /Zapłacono[:\s]*(\d+[.,]\d{2})/i,
  ],
  durationPatterns: [
    /(?:Trip\s+time|Duration|Czas)[:\s]*(\d+)\s*(?:min|m)/i,
    /(\d+)\s*min(?:utes?)?/i,
    /(\d{1,2}):(\d{2})\s*(?:hrs?|hours?)/i,
  ],
};

const BOLT_PATTERNS: ParsePattern = {
  platform: "bolt",
  datePatterns: [
    /(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})\s*[,\s]+(\d{1,2}:\d{2})/i,
    /(\d{4}-\d{2}-\d{2})\s*[T\s](\d{2}:\d{2})/i,
    /Ride\s+on\s+(\d{1,2}\s+\w+\s+\d{4})/i,
  ],
  amountPatterns: [
    /(?:Total|Suma|Price|Cena)[:\s]*(?:PLN|zł|€|EUR)?\s*(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s*(?:PLN|zł)/i,
    /(?:PLN|zł)\s*(\d+[.,]\d{2})/i,
  ],
  durationPatterns: [
    /(?:Duration|Czas\s+przejazdu)[:\s]*(\d+)\s*(?:min|m)/i,
    /(\d+)\s*min/i,
  ],
};

const FREENOW_PATTERNS: ParsePattern = {
  platform: "freenow",
  datePatterns: [
    /(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})\s*[,\s]+(\d{1,2}:\d{2})/i,
    /(\d{4}-\d{2}-\d{2})\s*[T\s](\d{2}:\d{2})/i,
    /Trip\s+(\d{1,2}\s+\w+\s+\d{4})/i,
  ],
  amountPatterns: [
    /(?:Total|Suma|Fare)[:\s]*(?:PLN|zł|€|EUR)?\s*(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s*(?:PLN|zł|€)/i,
  ],
  durationPatterns: [
    /(?:Trip\s+duration|Czas)[:\s]*(\d+)\s*(?:min|m)/i,
    /(\d+)\s*min/i,
  ],
};

const PATTERN_MAP: Record<Platform, ParsePattern> = {
  uber: UBER_PATTERNS,
  bolt: BOLT_PATTERNS,
  freenow: FREENOW_PATTERNS,
};

function parseAmount(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(",", ".");
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }
  return null;
}

function parseDuration(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        return hours * 60 + minutes;
      } else {
        const minutes = parseInt(match[1], 10);
        if (!isNaN(minutes) && minutes > 0 && minutes < 300) {
          return minutes;
        }
      }
    }
  }
  return null;
}

function parseDate(text: string, patterns: RegExp[]): Date | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const dateStr = match[1] + (match[2] ? " " + match[2] : "");
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
        
        const parts = match[1].match(/(\d+)[\/.,-](\d+)[\/.,-](\d{2,4})/);
        if (parts) {
          const day = parseInt(parts[1], 10);
          const month = parseInt(parts[2], 10) - 1;
          let year = parseInt(parts[3], 10);
          if (year < 100) year += 2000;
          
          const timeMatch = match[2]?.match(/(\d{1,2}):(\d{2})/);
          const hours = timeMatch ? parseInt(timeMatch[1], 10) : 12;
          const minutes = timeMatch ? parseInt(timeMatch[2], 10) : 0;
          
          const parsedDate = new Date(year, month, day, hours, minutes);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

function detectCurrency(text: string): string {
  if (/PLN|zł|złoty/i.test(text)) return "PLN";
  if (/€|EUR/i.test(text)) return "EUR";
  if (/\$|USD/i.test(text)) return "USD";
  return "PLN";
}

export function parseReceipt(text: string, platform: Platform): ParsedReceipt {
  const patterns = PATTERN_MAP[platform];
  const errors: string[] = [];
  
  const amount = parseAmount(text, patterns.amountPatterns);
  const duration = parseDuration(text, patterns.durationPatterns);
  const date = parseDate(text, patterns.datePatterns);
  const currency = detectCurrency(text);
  
  if (!amount) errors.push("Could not parse amount");
  if (!date) errors.push("Could not parse date/time");
  
  let confidence: "high" | "medium" | "low" = "high";
  if (errors.length > 0) confidence = "medium";
  if (!amount) confidence = "low";
  
  return {
    id: `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    platform,
    timestamp: date?.getTime() || Date.now(),
    amount: amount || 0,
    duration,
    currency,
    rawText: text.substring(0, 500),
    parseConfidence: confidence,
    errors,
  };
}

export function formatReceiptForDisplay(receipt: ParsedReceipt): {
  date: string;
  time: string;
  amount: string;
  duration: string;
  revPerHour: string | null;
} {
  const d = new Date(receipt.timestamp);
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const amount = `${receipt.amount.toFixed(2)} ${receipt.currency}`;
  const duration = receipt.duration ? `${receipt.duration} min` : "Unknown";
  
  let revPerHour: string | null = null;
  if (receipt.duration && receipt.duration > 0) {
    const hourlyRate = (receipt.amount / receipt.duration) * 60;
    revPerHour = `${hourlyRate.toFixed(2)} ${receipt.currency}/hr`;
  }
  
  return { date, time, amount, duration, revPerHour };
}

export function autoDetectPlatform(text: string): Platform | null {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("uber") || lowerText.includes("uber.com")) return "uber";
  if (lowerText.includes("bolt") || lowerText.includes("bolt.eu")) return "bolt";
  if (lowerText.includes("freenow") || lowerText.includes("free now") || lowerText.includes("mytaxi")) return "freenow";
  return null;
}
