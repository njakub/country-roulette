"use client";

import { useEffect, useState, useRef } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import confetti from "canvas-confetti";
import { geoMercator } from "d3-geo";
import {
  getCountryId,
  getCountryName,
  getRandomCountry,
  getISO_A2FromA3,
} from "../utils/countries";
import CountryFlag from "./CountryFlag";

// react-simple-maps renders SVG with these intrinsic dimensions
const SVG_W = 800;
const SVG_H = 450;
// Base projection (matches ComposableMap projectionConfig below)
const BASE_PROJECTION = geoMercator()
  .scale(147)
  .center([0, 20] as [number, number])
  .translate([SVG_W / 2, SVG_H / 2]);

interface MapRouletteProps {
  usedCountries: string[];
  onCountrySelected: (countryId: string, countryName: string) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  predeterminedCountryId: string | null;
  onSpinComplete: () => void;
}

export default function MapRoulette({
  usedCountries,
  onCountrySelected,
  isSpinning,
  setIsSpinning,
  predeterminedCountryId,
  onSpinComplete,
}: MapRouletteProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [currentHighlight, setCurrentHighlight] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectionBanner, setSelectionBanner] = useState<{
    name: string;
    iso_a2: string | null;
  } | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  // CSS transform applied to the map wrapper for zoom
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimersRef = useRef<NodeJS.Timeout[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const clearResetTimers = () => {
    resetTimersRef.current.forEach(clearTimeout);
    resetTimersRef.current = [];
  };

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  };

  // Short beep on each tick — pitch rises as the spin slows (building excitement)
  const playTickSound = (currentDelay: number) => {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = Math.min((currentDelay - 60) / (400 - 60), 1); // 0 → 1 as it slows
      osc.type = "sine";
      osc.frequency.setValueAtTime(400 + t * 500, ctx.currentTime); // 400 Hz → 900 Hz
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // audio unavailable — ignore
    }
  };

  // Ceremonial fanfare with trumpets and cymbal crash
  const playWinSound = () => {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;

      // Fanfare melody: C-C-G-C-E-C (triumphant rising pattern)
      const melody = [
        { freq: 523.25, start: 0, dur: 0.15 }, // C5
        { freq: 523.25, start: 0.16, dur: 0.15 }, // C5
        { freq: 783.99, start: 0.32, dur: 0.22 }, // G5
        { freq: 1046.5, start: 0.55, dur: 0.35 }, // C6 (climax)
        { freq: 659.25, start: 0.92, dur: 0.18 }, // E5
        { freq: 1046.5, start: 1.12, dur: 0.5 }, // C6 (resolution)
      ];

      // Brass-like trumpet voice (sawtooth + square blend)
      melody.forEach(({ freq, start, dur }) => {
        [0.7, 0.3].forEach((mix, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = idx === 0 ? "sawtooth" : "square";
          osc.frequency.setValueAtTime(freq, now);
          const t = now + start;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.08 * mix, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
          osc.start(t);
          osc.stop(t + dur + 0.01);
        });
      });

      // Cymbal crash at the climax (synthesized with filtered white noise)
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.setValueAtTime(3000, now);

      const noiseGain = ctx.createGain();
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      const cymbalStart = now + 0.55; // Crash at climax
      noiseGain.gain.setValueAtTime(0.3, cymbalStart);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, cymbalStart + 1.2);
      noise.start(cymbalStart);
      noise.stop(cymbalStart + 1.21);

      // Bass foundation (root note held throughout)
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.connect(bassGain);
      bassGain.connect(ctx.destination);
      bass.type = "triangle";
      bass.frequency.setValueAtTime(130.81, now); // C3
      bassGain.gain.setValueAtTime(0, now);
      bassGain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      bassGain.gain.setValueAtTime(0.15, now + 1.2);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
      bass.start(now);
      bass.stop(now + 1.71);
    } catch {
      // audio unavailable — ignore
    }
  };

  // Load GeoJSON on mount
  useEffect(() => {
    fetch("/geo/world.geojson")
      .then((r) => r.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearResetTimers();
      audioCtxRef.current?.close();
    };
  }, []);

  const startSpin = () => {
    if (!geoData || isSpinning) return;

    // Cancel any in-progress zoom
    clearResetTimers();
    setZoomStyle({});
    setBannerVisible(false);
    setSelectionBanner(null);

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
    let delay = 60;
    const maxTicks = 50;
    const maxDelay = 400;
    const singleHighlightDelay = 150;

    const tick = () => {
      const count = delay < singleHighlightDelay ? 2 : 1;
      const picks: string[] = [];
      const pool = [...eligibleCountries];
      for (let i = 0; i < count; i++) {
        if (pool.length === 0) break;
        const pick = getRandomCountry(pool);
        picks.push(pick);
        pool.splice(pool.indexOf(pick), 1);
      }
      setCurrentHighlight(picks);
      playTickSound(delay);
      tickCount++;
      delay *= 1.1;

      if (tickCount >= maxTicks || delay >= maxDelay) {
        const finalCountry =
          predeterminedCountryId &&
          eligibleCountries.includes(predeterminedCountryId)
            ? predeterminedCountryId
            : getRandomCountry(eligibleCountries);

        setSelectedCountry(finalCountry);
        setCurrentHighlight([]);
        setIsSpinning(false);
        onSpinComplete();

        // Resolve name + iso_a2
        const feature = geoData.features.find(
          (f: any) => getCountryId(f.properties) === finalCountry,
        );
        const countryName = feature
          ? getCountryName(feature.properties)
          : finalCountry;

        let iso_a2: string | null = null;
        if (feature) {
          const rawA2 = feature.properties.ISO_A2 || feature.properties.iso_a2;
          const rawA3 = feature.properties.ISO_A3 || feature.properties.iso_a3;
          if (rawA2 && rawA2 !== "-99") iso_a2 = rawA2;
          else if (rawA3 && rawA3 !== "-99") iso_a2 = getISO_A2FromA3(rawA3);
        }

        // Show banner
        setSelectionBanner({ name: countryName, iso_a2 });
        setTimeout(() => setBannerVisible(true), 50);

        // Win sound + confetti bursts
        playWinSound();
        const burst = (origin: { x: number; y: number }) =>
          confetti({
            particleCount: 80,
            spread: 70,
            origin,
            colors: ["#C9A843", "#ffffff", "#10B981", "#3B82F6", "#F87171"],
            zIndex: 9999,
          });
        burst({ x: 0.3, y: 0.5 });
        setTimeout(() => burst({ x: 0.7, y: 0.4 }), 150);
        setTimeout(() => burst({ x: 0.5, y: 0.6 }), 300);

        // CSS zoom — compute country centroid in SVG coordinate space
        if (feature && feature.geometry) {
          const bounds = feature.geometry.coordinates;
          let sumLng = 0,
            sumLat = 0,
            n = 0;
          const accumulate = (coords: any) => {
            if (typeof coords[0] === "number") {
              sumLng += coords[0];
              sumLat += coords[1];
              n++;
            } else {
              coords.forEach(accumulate);
            }
          };
          accumulate(bounds);

          if (n > 0) {
            const [px, py] = BASE_PROJECTION([sumLng / n, sumLat / n]) ?? [
              SVG_W / 2,
              SVG_H / 2,
            ];
            const z = 5; // zoom level
            // CSS % translate so [px,py] lands at the center of the wrapper (transform-origin: 50% 50%)
            const txPct = (50 - (px / SVG_W) * 100) * z;
            const tyPct = (50 - (py / SVG_H) * 100) * z;

            const ZOOM_IN_MS = 20000;
            const HOLD_MS = 8000;
            const ZOOM_OUT_MS = 5000;
            const BANNER_HIDE_MS = ZOOM_IN_MS + HOLD_MS - 2000;

            // Apply zoom-in with CSS transition
            setZoomStyle({
              transform: `translate(${txPct}%, ${tyPct}%) scale(${z})`,
              transition: `transform ${ZOOM_IN_MS}ms cubic-bezier(0.05, 0.7, 0.1, 1.0)`,
              transformOrigin: "50% 50%",
            });

            // Hide banner before zoom out
            resetTimersRef.current.push(
              setTimeout(() => setBannerVisible(false), BANNER_HIDE_MS),
              setTimeout(() => setSelectionBanner(null), BANNER_HIDE_MS + 600),
              // Zoom out
              setTimeout(() => {
                setZoomStyle({
                  transform: "translate(0%, 0%) scale(1)",
                  transition: `transform ${ZOOM_OUT_MS}ms ease-in-out`,
                  transformOrigin: "50% 50%",
                });
              }, ZOOM_IN_MS + HOLD_MS),
              // Clear style after zoom-out completes
              setTimeout(
                () => setZoomStyle({}),
                ZOOM_IN_MS + HOLD_MS + ZOOM_OUT_MS + 200,
              ),
            );
          }
        }

        onCountrySelected(finalCountry, countryName);
      } else {
        timeoutRef.current = setTimeout(tick, delay);
      }
    };

    tick();
  };

  // Expose spin via custom event
  useEffect(() => {
    const handleSpin = () => startSpin();
    window.addEventListener("trigger-spin", handleSpin);
    return () => window.removeEventListener("trigger-spin", handleSpin);
  }, [geoData, isSpinning, usedCountries, predeterminedCountryId]);

  if (!geoData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Zoom wrapper — CSS transform only, SVG never changes projection */}
      <div className="w-full h-full" style={zoomStyle}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 147, center: [0, 20] }}
          width={SVG_W}
          height={SVG_H}
          className="w-full h-full"
        >
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryId = getCountryId(geo.properties);
                const countryName = getCountryName(geo.properties);
                const isUsed = usedCountries.includes(countryId);
                const isHighlighted = currentHighlight.includes(countryId);
                const isSelected = selectedCountry === countryId;

                let fill = "#E5E7EB";
                if (isUsed) fill = "#D4B483";
                if (isHighlighted) fill = "#FBBF24";
                if (isSelected) fill = "#10B981";

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
      </div>

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

      {/* Selection banner */}
      {selectionBanner && (
        <div
          className={`absolute inset-x-0 top-6 flex justify-center pointer-events-none transition-all duration-500 ${
            bannerVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4"
          }`}
        >
          <div className="bg-black/75 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl border border-white/10">
            {selectionBanner.iso_a2 && (
              <CountryFlag
                code={selectionBanner.iso_a2}
                className="w-16 h-11 rounded-md shadow-lg flex-shrink-0"
              />
            )}
            <span className="font-bebas text-4xl tracking-widest text-white leading-none">
              {selectionBanner.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
