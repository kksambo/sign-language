import type { RecognitionMode } from "@/lib/asl-classifier";

export type TextSize = "md" | "lg" | "xl";

export type AppPreferences = {
  clientId: string;
  preferredLanguage: string;
  recognitionMode: RecognitionMode;
  ttsEnabled: boolean;
  textSize: TextSize;
};

const STORAGE_KEY = "slt-preferences";

export const defaultPreferences: Omit<AppPreferences, "clientId"> = {
  preferredLanguage: "asl",
  recognitionMode: "fingerspell",
  ttsEnabled: true,
  textSize: "md",
};

export function getClientId() {
  if (typeof window === "undefined") {
    return "";
  }
  const existing = window.localStorage.getItem("slt-client-id");
  if (existing) {
    return existing;
  }
  const id = crypto.randomUUID();
  window.localStorage.setItem("slt-client-id", id);
  return id;
}

export function readLocalPreferences(): AppPreferences {
  const clientId = getClientId();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { clientId, ...defaultPreferences };
    }
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      clientId,
      preferredLanguage: parsed.preferredLanguage ?? defaultPreferences.preferredLanguage,
      recognitionMode: parsed.recognitionMode ?? defaultPreferences.recognitionMode,
      ttsEnabled: parsed.ttsEnabled ?? defaultPreferences.ttsEnabled,
      textSize: parsed.textSize ?? defaultPreferences.textSize,
    };
  } catch {
    return { clientId, ...defaultPreferences };
  }
}

export function writeLocalPreferences(prefs: AppPreferences) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  window.localStorage.setItem("slt-client-id", prefs.clientId);
}

export function textSizeClass(size: TextSize) {
  if (size === "xl") {
    return "text-3xl";
  }
  if (size === "lg") {
    return "text-2xl";
  }
  return "text-xl";
}
