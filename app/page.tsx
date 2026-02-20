"use client";

import { useEffect, useState, useRef } from "react";
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
  const [predeterminedCountryId, setPredeterminedCountryId] = useState<
    string | null
  >(null);
  const hasRestoredSelection = useRef(false);

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

  // Update used countries list when IDs change; restore last selection on mount
  useEffect(() => {
    if (allCountries.length === 0) return;

    const list = usedCountriesIds
      .map((id) => allCountries.find((c) => c.id === id))
      .filter((c): c is Country => c !== undefined);

    setUsedCountriesList(list);

    // Restore the last selected country if nothing is selected yet (e.g. after refresh)
    if (!hasRestoredSelection.current && list.length > 0) {
      hasRestoredSelection.current = true;
      const last = list[list.length - 1];
      setSelectedCountry({
        id: last.id,
        name: last.name,
        iso_a2: last.iso_a2 ?? null,
      });
    }
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

  const handleRemoveCountry = (countryId: string) => {
    const newUsed = usedCountriesIds.filter((id) => id !== countryId);
    setUsedCountriesIds(newUsed);
    saveUsedCountries(newUsed);
    if (selectedCountry?.id === countryId) {
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
    <div className="flex flex-col-reverse md:flex-row h-[100dvh] overflow-hidden">
      {/* Sidebar — bottom bar on mobile, left panel on desktop */}
      <div className="md:w-80 md:flex-shrink-0">
        <Sidebar
          selectedCountry={selectedCountry}
          usedCountries={usedCountriesList}
          allCountries={allCountries}
          isSpinning={isSpinning}
          onSpin={handleSpin}
          onReset={handleReset}
          onUndo={handleUndo}
          onRemoveCountry={handleRemoveCountry}
          allCountriesUsed={allCountriesUsed}
          predeterminedCountryId={predeterminedCountryId}
          onSetPredetermined={setPredeterminedCountryId}
        />
      </div>

      {/* Map */}
      <div className="flex-1 min-h-0 bg-gray-100">
        <MapRoulette
          usedCountries={usedCountriesIds}
          onCountrySelected={handleCountrySelected}
          isSpinning={isSpinning}
          setIsSpinning={setIsSpinning}
          predeterminedCountryId={predeterminedCountryId}
          onSpinComplete={() => setPredeterminedCountryId(null)}
        />
      </div>
    </div>
  );
}
