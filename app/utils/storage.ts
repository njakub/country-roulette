// Utility functions — persists to server via API, keyed by a per-device UUID

const USER_ID_KEY = "country-roulette-user-id";

function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export async function getUsedCountries(): Promise<string[]> {
  if (typeof window === "undefined") return [];
  try {
    const id = getUserId();
    const res = await fetch(`/api/countries?id=${id}`);
    const data = await res.json();
    return data.countries ?? [];
  } catch (error) {
    console.error("Error fetching used countries:", error);
    return [];
  }
}

export async function saveUsedCountries(countries: string[]): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const id = getUserId();
    await fetch("/api/countries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, countries }),
    });
  } catch (error) {
    console.error("Error saving used countries:", error);
  }
}
