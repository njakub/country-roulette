const COUNTRIES_KEY = "country-roulette-used-countries";

export async function getUsedCountries(): Promise<string[]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COUNTRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveUsedCountries(countries: string[]): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.setItem(COUNTRIES_KEY, JSON.stringify(countries));
}
