"use client";

import { useEffect, useState, useRef } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import {
  getCountryId,
  getCountryName,
  getRandomCountry,
} from "../utils/countries";

interface MapRouletteProps {
  usedCountries: string[];
  onCountrySelected: (countryId: string, countryName: string) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
}

export default function MapRoulette({
  usedCountries,
  onCountrySelected,
  isSpinning,
  setIsSpinning,
}: MapRouletteProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [currentHighlight, setCurrentHighlight] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [mapScale, setMapScale] = useState(147);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load GeoJSON on mount
  useEffect(() => {
    fetch("/geo/world.geojson")
      .then((response) => response.json())
      .then((data) => setGeoData(data))
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Spin algorithm:
   * - Starts with ~60ms delay
   * - Each tick increases delay by 10% (multiply by 1.1)
   * - Stops after ~50 ticks OR when delay exceeds 700ms
   * - Final highlighted country becomes the selection
   */
  const startSpin = () => {
    if (!geoData || isSpinning) return;

    // Get list of eligible countries (not used)
    const allCountryIds = geoData.features.map((f: any) =>
      getCountryId(f.properties),
    );
    const eligibleCountries = allCountryIds.filter(
      (id: string) => !usedCountries.includes(id),
    );

    if (eligibleCountries.length === 0) return;

    setIsSpinning(true);
    setSelectedCountry(null);

    let tickCount = 0;
    let delay = 60; // Start at 60ms
    const maxTicks = 50;
    const maxDelay = 400;
    // Threshold delay above which we drop to 1 highlight
    const singleHighlightDelay = 150;

    const tick = () => {
      // Pick 2 countries while fast, taper to 1 as it slows
      const count = delay < singleHighlightDelay ? 2 : 1;
      const picks: string[] = [];
      const pool = [...eligibleCountries];
      for (let i = 0; i < count; i++) {
        if (pool.length === 0) break;
        const pick = getRandomCountry(pool);
        picks.push(pick);
        // remove pick from pool so we don't pick the same country twice
        pool.splice(pool.indexOf(pick), 1);
      }
      setCurrentHighlight(picks);

      tickCount++;
      delay *= 1.1; // Increase delay by 10%

      // Stop condition: reached max ticks or delay is too long
      if (tickCount >= maxTicks || delay >= maxDelay) {
        // Final selection — always pick 1
        const randomCountry = getRandomCountry(eligibleCountries);
        setSelectedCountry(randomCountry);
        setCurrentHighlight([]);
        setIsSpinning(false);

        // Find country name
        const feature = geoData.features.find(
          (f: any) => getCountryId(f.properties) === randomCountry,
        );
        const countryName = feature
          ? getCountryName(feature.properties)
          : randomCountry;

        // Animate zoom to selected country
        if (feature && feature.geometry) {
          // Calculate centroid of the country
          const bounds = feature.geometry.coordinates;
          let centerLng = 0;
          let centerLat = 0;
          let pointCount = 0;

          // Simple centroid calculation
          const calculateCenter = (coords: any) => {
            if (typeof coords[0] === "number") {
              centerLng += coords[0];
              centerLat += coords[1];
              pointCount++;
            } else {
              coords.forEach((c: any) => calculateCenter(c));
            }
          };

          calculateCenter(bounds);
          if (pointCount > 0) {
            centerLng /= pointCount;
            centerLat /= pointCount;

            // Animate to zoom in
            setMapCenter([centerLng, centerLat]);
            setMapScale(400);

            // Reset after 5 seconds
            setTimeout(() => {
              setMapScale(147);
              setMapCenter([0, 20]);
            }, 5000);
          }
        }

        // Notify parent
        onCountrySelected(randomCountry, countryName);
      } else {
        // Schedule next tick
        timeoutRef.current = setTimeout(tick, delay);
      }
    };

    tick();
  };

  // Expose startSpin via a custom event (called from Sidebar)
  useEffect(() => {
    const handleSpin = () => startSpin();
    window.addEventListener("trigger-spin", handleSpin);
    return () => window.removeEventListener("trigger-spin", handleSpin);
  }, [geoData, isSpinning, usedCountries]);

  if (!geoData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: mapScale,
          center: mapCenter,
        }}
        className="w-full h-full transition-all duration-[5000ms] ease-in-out"
      >
        <Geographies geography={geoData}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryId = getCountryId(geo.properties);
              const countryName = getCountryName(geo.properties);
              const isUsed = usedCountries.includes(countryId);
              const isHighlighted = currentHighlight.includes(countryId);
              const isSelected = selectedCountry === countryId;
              const isHovered = hoveredCountry === countryId;

              let fill = "#E5E7EB"; // Default gray-200
              if (isUsed) {
                fill = "#D4B483"; // Tan for used
              }
              if (isHighlighted) {
                fill = "#FBBF24"; // Bright yellow for spinning highlight
              }
              if (isSelected) {
                fill = "#10B981"; // Green for final selection
              }

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: {
                      outline: "none",
                      fill: isUsed ? "#D4B483" : "#D1D5DB",
                      cursor: isUsed ? "default" : "pointer",
                    },
                    pressed: { outline: "none" },
                  }}
                  onMouseEnter={() => setHoveredCountry(countryId)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  data-tooltip-id="country-tooltip"
                  data-tooltip-content={countryName}
                  className={
                    isHighlighted
                      ? "animate-glow-pulse transition-all"
                      : "transition-all duration-200"
                  }
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      <Tooltip
        id="country-tooltip"
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "#F9FAFB",
          borderRadius: "6px",
          padding: "6px 12px",
          fontSize: "14px",
          zIndex: 1000,
        }}
      />
    </div>
  );
}
