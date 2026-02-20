"use client";

import { useEffect, useState } from "react";
import MapRoulette from "./components/MapRoulette";
import Sidebar from "./components/Sidebar";
import { getUsedCountries, saveUsedCountries } from "./utils/storage";
import { parseCountries, Country } from "./utils/countries";

export default function Home() {
  const [usedCountriesIds, setUsedCountriesIds] = useState<string[]>([]);
  const [usedCountriesList, setUsedCountriesList] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<{
    id: string;
    name: string;
    iso_a2: string | null;
  } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load used countries from server on mount
  useEffect(() => {
    setMounted(true);
    getUsedCountries().then((used) => setUsedCountriesIds(used));
  }, []);

  // Load all countries from GeoJSON
  useEffect(() => {
    fetch("/geo/world.geojson")
      .then((response) => response.json())
      .then((data) => {
        const countries = parseCountries(data.features);
        setAllCountries(countries);
      })
      .catch((error) => console.error("Error loading countries:", error));
  }, []);

  // Update used countries list when IDs change
  useEffect(() => {
    if (allCountries.length === 0) return;

    const list = usedCountriesIds
      .map((id) => allCountries.find((c) => c.id === id))
      .filter((c): c is Country => c !== undefined);

    setUsedCountriesList(list);
  }, [usedCountriesIds, allCountries]);

  const handleCountrySelected = (countryId: string, countryName: string) => {
    const country = allCountries.find((c) => c.id === countryId);
    setSelectedCountry({
      id: countryId,
      name: countryName,
      iso_a2: country?.iso_a2 || null,
    });
    const newUsed = [...usedCountriesIds, countryId];
    setUsedCountriesIds(newUsed);
    saveUsedCountries(newUsed);
  };

  const handleSpin = () => {
    // Trigger spin via custom event
    window.dispatchEvent(new Event("trigger-spin"));
  };

  const handleUndo = () => {
    const newUsed = usedCountriesIds.slice(0, -1);
    const removed = usedCountriesIds[usedCountriesIds.length - 1];
    if (!removed) return;
    setUsedCountriesIds(newUsed);
    saveUsedCountries(newUsed);
    if (selectedCountry?.id === removed) {
      setSelectedCountry(null);
    }
  };

  const handleReset = () => {
    saveUsedCountries([]);
    setUsedCountriesIds([]);
    setSelectedCountry(null);
  };

  const allCountriesUsed =
    allCountries.length > 0 && usedCountriesIds.length >= allCountries.length;

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <Sidebar
          selectedCountry={selectedCountry}
          usedCountries={usedCountriesList}
          isSpinning={isSpinning}
          onSpin={handleSpin}
          onReset={handleReset}
          onUndo={handleUndo}
          allCountriesUsed={allCountriesUsed}
        />
      </div>

      {/* Map */}
      <div className="flex-1 bg-gray-100">
        <MapRoulette
          usedCountries={usedCountriesIds}
          onCountrySelected={handleCountrySelected}
          isSpinning={isSpinning}
          setIsSpinning={setIsSpinning}
        />
      </div>
    </div>
  );
}
