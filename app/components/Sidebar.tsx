"use client";

import { useState, useEffect, useRef } from "react";
import { Country } from "../utils/countries";
import CountryFlag from "./CountryFlag";

interface SidebarProps {
  selectedCountry: { id: string; name: string; iso_a2: string | null } | null;
  usedCountries: Country[];
  allCountries: Country[];
  isSpinning: boolean;
  onSpin: () => void;
  onReset: () => void;
  onUndo: () => void;
  onRemoveCountry: (countryId: string) => void;
  allCountriesUsed: boolean;
  predeterminedCountryId: string | null;
  onSetPredetermined: (id: string | null) => void;
}

export default function Sidebar({
  selectedCountry,
  usedCountries,
  allCountries,
  isSpinning,
  onSpin,
  onReset,
  onUndo,
  onRemoveCountry,
  allCountriesUsed,
  predeterminedCountryId,
  onSetPredetermined,
}: SidebarProps) {
  const [showResultCard, setShowResultCard] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Show the result card whenever a new country is selected (not during spin)
  useEffect(() => {
    if (selectedCountry && !isSpinning) {
      setShowResultCard(true);
    }
  }, [selectedCountry?.id, isSpinning]);

  // Focus search input when picker opens
  useEffect(() => {
    if (showPicker) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [showPicker]);

  const spinLabel = allCountriesUsed
    ? "🎉 ALL COMPLETE!"
    : isSpinning
      ? "🎰 SPINNING..."
      : "🎲 SPIN";

  const spinDisabled = isSpinning || allCountriesUsed;

  const spinClass = spinDisabled
    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-gold hover:bg-[#e0bc55] text-black font-extrabold hover:scale-105 active:scale-95 shadow-lg hover:shadow-gold/40";
  const predeterminedCountry = predeterminedCountryId
    ? allCountries.find((c) => c.id === predeterminedCountryId)
    : null;

  const filteredCountries = allCountries
    .filter((c) => !usedCountries.some((u) => u.id === c.id))
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const CountryPicker = () => (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
      <div className="p-2 border-b border-gray-700 flex gap-2 items-center">
        <input
          ref={searchRef}
          type="text"
          placeholder="Search countries…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-700 text-white text-sm px-3 py-1.5 rounded outline-none placeholder-gray-500"
        />
        {predeterminedCountryId && (
          <button
            onClick={() => {
              onSetPredetermined(null);
              setShowPicker(false);
            }}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>
      <div className="max-h-52 overflow-y-auto">
        {filteredCountries.length === 0 ? (
          <p className="text-gray-500 text-xs italic text-center py-4">
            No matches
          </p>
        ) : (
          filteredCountries.map((country) => (
            <button
              key={country.id}
              onClick={() => {
                onSetPredetermined(country.id);
                setShowPicker(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700 transition-colors text-left ${
                predeterminedCountryId === country.id
                  ? "bg-gray-700 text-yellow-400"
                  : "text-white"
              }`}
            >
              {country.iso_a2 && (
                <CountryFlag
                  code={country.iso_a2}
                  className="w-5 h-3.5 rounded flex-shrink-0"
                />
              )}
              {country.name}
            </button>
          ))
        )}
      </div>
    </div>
  );

  const handleResetClick = () => {
    if (usedCountries.length === 0 || isSpinning) return;
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    onReset();
    setShowResetConfirm(false);
  };

  return (
    <>
      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">Reset all countries?</h2>
            <p className="text-gray-400 text-sm mb-6">
              This will clear all {usedCountries.length} visited {usedCountries.length === 1 ? "country" : "countries"} and start fresh.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── MOBILE ── */}
      <div className="md:hidden flex flex-col">
        {/* Country picker — shown when globe is tapped */}
        {showPicker && (
          <div className="bg-gray-900 border-t border-gray-700 px-4 pt-3 pb-2">
            <CountryPicker />
          </div>
        )}

        {/* Result card — slides up after selection */}
        {showResultCard && selectedCountry && (
          <div
            className="bg-[#111111] border-t-2 border-gold px-5 py-5 flex flex-col items-center gap-3 animate-slide-up"
            onClick={() => setShowResultCard(false)}
          >
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              Selected
            </p>
            {selectedCountry.iso_a2 && (
              <CountryFlag
                code={selectedCountry.iso_a2}
                className="w-32 h-20 rounded-lg shadow-xl"
              />
            )}
            <p className="text-3xl font-extrabold text-green-400 text-center">
              {selectedCountry.name}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowResultCard(false);
              }}
              className="w-full py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Bottom action bar */}
        <div className="flex items-center gap-2 bg-[#111111] text-white px-4 py-3 border-t border-[#2a2a2a]">
          {/* Globe icon — hidden tap target to open picker */}
          <button
            onClick={() => setShowPicker((v) => !v)}
            className={`text-xl flex-shrink-0 transition-opacity ${predeterminedCountryId ? "opacity-100" : "opacity-20"}`}
            title="Set predetermined country"
          >
            🌍
          </button>

          {/* Spin button */}
          <button
            onClick={onSpin}
            disabled={spinDisabled}
            className={`flex-1 py-3 rounded-lg font-bold text-base transition-all duration-200 transform ${spinClass}`}
          >
            {spinLabel}
          </button>

          {/* Icon buttons */}
          <button
            onClick={onUndo}
            disabled={usedCountries.length === 0 || isSpinning}
            title="Undo last"
            className="w-11 h-11 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-30 transition-colors text-lg flex items-center justify-center"
          >
            ↶
          </button>
          <button
            onClick={handleResetClick}
            disabled={usedCountries.length === 0 || isSpinning}
            title="Reset all"
            className="w-11 h-11 rounded bg-red-700 hover:bg-red-600 disabled:opacity-30 transition-colors text-base flex items-center justify-center"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ── DESKTOP: full sidebar ── */}
      <div className="hidden md:flex bg-[#111111] text-white p-6 flex-col h-full overflow-hidden">
        {/* Title — click to toggle country picker */}
        <div className="mb-4">
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="text-left w-full group"
            title="Click to predetermine the next country"
          >
            <div className="leading-none mb-2">
              <span className="block font-bebas text-5xl tracking-widest text-white group-hover:text-gray-200 transition-colors">
                COUNTRY
              </span>
              <span className="block font-bebas text-5xl tracking-widest text-gold group-hover:text-[#e0bc55] transition-colors">
                ROULETTE
              </span>
            </div>
          </button>
          <p className="text-gray-500 text-xs tracking-widest uppercase">
            Spin to explore the world
          </p>
        </div>

        {/* Country picker — shown when title is clicked */}
        {showPicker && (
          <div className="mb-4">
            {predeterminedCountry && (
              <p className="text-xs text-gold mb-1.5">
                🎯 Next spin lands on:{" "}
                <strong>{predeterminedCountry.name}</strong>
              </p>
            )}
            <CountryPicker />
          </div>
        )}

        {/* Selected Country Section */}
        <div className="mb-6 bg-[#1a1a1a] rounded-lg p-4 border-2 border-gold">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">
            CURRENT SELECTION
          </h2>
          {selectedCountry ? (
            <div className="text-center">
              {selectedCountry.iso_a2 && (
                <div className="flex justify-center mb-3">
                  <CountryFlag
                    code={selectedCountry.iso_a2}
                    className="w-24 h-16 rounded shadow-lg"
                  />
                </div>
              )}
              <p className="text-2xl font-bold text-green-400 mb-1">
                {selectedCountry.name}
              </p>
              <p className="text-sm text-gray-400">{selectedCountry.id}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-center italic">
              {isSpinning ? "Spinning..." : "Press SPIN to start!"}
            </p>
          )}
        </div>

        {/* Spin Button */}
        <button
          onClick={onSpin}
          disabled={spinDisabled}
          className={`w-full py-4 px-6 rounded-lg font-bold text-xl mb-4 transition-all duration-200 transform ${spinClass}`}
        >
          {spinLabel}
        </button>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={onUndo}
            disabled={usedCountries.length === 0 || isSpinning}
            className="flex-1 py-2 px-3 rounded bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 transition-colors text-sm font-medium"
          >
            ↶ UNDO
          </button>
          <button
            onClick={handleResetClick}
            disabled={usedCountries.length === 0 || isSpinning}
            className="flex-1 py-2 px-3 rounded bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-600 transition-colors text-sm font-medium"
          >
            🔄 RESET
          </button>
        </div>

        {/* Used Countries List */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">
            USED COUNTRIES ({usedCountries.length})
          </h2>
          <div className="flex-1 overflow-y-auto bg-[#1a1a1a] rounded-lg p-3 space-y-1">
            {usedCountries.length === 0 ? (
              <p className="text-gray-600 text-sm italic text-center py-4">
                No countries used yet
              </p>
            ) : (
              [...usedCountries].reverse().map((country, index) => (
                <div
                  key={`${country.id}-${index}`}
                  className="group bg-gray-700 px-3 py-2 rounded text-sm flex items-center gap-3"
                >
                  {country.iso_a2 && (
                    <CountryFlag
                      code={country.iso_a2}
                      className="w-6 h-4 rounded flex-shrink-0"
                    />
                  )}
                  <span className="font-medium flex-1">{country.name}</span>
                  <span className="text-gray-400 text-xs group-hover:hidden">
                    {country.id}
                  </span>
                  <button
                    onClick={() => onRemoveCountry(country.id)}
                    disabled={isSpinning}
                    className="hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:text-white hover:bg-red-500 transition-colors disabled:pointer-events-none flex-shrink-0"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Stats */}
        {allCountriesUsed && (
          <div className="mt-4 bg-green-600 text-white text-center py-3 rounded-lg font-bold">
            🎊 You've visited all countries! 🎊
          </div>
        )}
      </div>
    </>
  );
}
