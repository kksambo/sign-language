export const SIGN_LANGUAGES = [
  { id: "asl", label: "American Sign Language", short: "ASL" },
  { id: "sasl", label: "South African Sign Language", short: "SASL" },
  { id: "bsl", label: "British Sign Language", short: "BSL" },
] as const;

export type SignLanguageId = (typeof SIGN_LANGUAGES)[number]["id"];

export function languageLabel(id: string) {
  return SIGN_LANGUAGES.find((language) => language.id === id)?.label ?? id;
}

export function languageShort(id: string) {
  return SIGN_LANGUAGES.find((language) => language.id === id)?.short ?? id.toUpperCase();
}
