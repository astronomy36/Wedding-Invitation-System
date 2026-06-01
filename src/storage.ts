import { defaultSettings, seedGuests } from "./data";
import type { AppSettings, Guest } from "./types";

const STORAGE_KEY = "wedding-guests-v1";
const SETTINGS_KEY = "wedding-settings-v1";

export function loadGuests(): Guest[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveGuests(seedGuests);
    return seedGuests;
  }

  try {
    const parsed = JSON.parse(raw) as Guest[];
    return Array.isArray(parsed) ? parsed : seedGuests;
  } catch {
    return seedGuests;
  }
}

export function saveGuests(guests: Guest[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
}

export function loadSettings(): AppSettings {
  const raw = window.localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    saveSettings(defaultSettings);
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      weddingInfo: { ...defaultSettings.weddingInfo, ...parsed.weddingInfo },
      sideOptions: parsed.sideOptions?.length ? parsed.sideOptions : defaultSettings.sideOptions,
      categoryOptions: parsed.categoryOptions?.length ? parsed.categoryOptions : defaultSettings.categoryOptions,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function makeGuestId() {
  return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function makeOptionId(label: string) {
  const cleaned = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w\u4e00-\u9fa5]/g, "");
  return cleaned || `option_${Date.now()}`;
}
