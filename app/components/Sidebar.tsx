"use client";

import { Country } from "../utils/countries";
import CountryFlag from "./CountryFlag";

interface SidebarProps {
  selectedCountry: { id: string; name: string; iso_a2: string | null } | null;
  usedCountries: Country[];
  isSpinning: boolean;
  onSpin: () => void;
  onReset: () => void;
  onUndo: () => void;
  allCountriesUsed: boolean;
}

export default function Sidebar({
  selectedCountry,
  usedCountries,
  isSpinning,
  onSpin,
  onReset,
  onUndo,
  allCountriesUsed,
}: SidebarProps) {
  return (
    <div className="bg-gray-900 text-white p-6 flex flex-col h-full overflow-hidden">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">
          🌍 Country Roulette
        </h1>
        <p className="text-gray-400 text-sm">
          Spin to explore the world, one country at a time!
        </p>
      </div>

      {/* Selected Country Section */}
      <div className="mb-6 bg-gray-800 rounded-lg p-4 border-2 border-yellow-400">
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
        disabled={isSpinning || allCountriesUsed}
        className={`
          w-full py-4 px-6 rounded-lg font-bold text-xl mb-4
          transition-all duration-200 transform
          ${
            isSpinning || allCountriesUsed
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-500 hover:to-yellow-600 hover:scale-105 active:scale-95 shadow-lg hover:shadow-yellow-400/50"
          }
        `}
      >
        {allCountriesUsed
          ? "🎉 ALL COMPLETE!"
          : isSpinning
            ? "🎰 SPINNING..."
            : "🎲 SPIN"}
      </button>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={onUndo}
          disabled={usedCountries.length === 0 || isSpinning}
          className="flex-1 py-2 px-4 rounded bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 transition-colors text-sm font-medium"
        >
          ↶ UNDO LAST
        </button>
        <button
          onClick={onReset}
          disabled={usedCountries.length === 0 || isSpinning}
          className="flex-1 py-2 px-4 rounded bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-600 transition-colors text-sm font-medium"
        >
          🔄 RESET ALL
        </button>
      </div>

      {/* Used Countries List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <h2 className="text-sm font-semibold text-gray-400 mb-2">
          USED COUNTRIES ({usedCountries.length})
        </h2>
        <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-3 space-y-1">
          {usedCountries.length === 0 ? (
            <p className="text-gray-600 text-sm italic text-center py-4">
              No countries used yet
            </p>
          ) : (
            [...usedCountries].reverse().map((country, index) => (
              <div
                key={`${country.id}-${index}`}
                className="bg-gray-700 px-3 py-2 rounded text-sm flex items-center gap-3"
              >
                {country.iso_a2 && (
                  <CountryFlag
                    code={country.iso_a2}
                    className="w-6 h-4 rounded flex-shrink-0"
                  />
                )}
                <span className="font-medium flex-1">{country.name}</span>
                <span className="text-gray-400 text-xs">{country.id}</span>
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
  );
}
