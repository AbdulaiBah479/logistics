"use client";

import { useEffect, useRef, useState } from "react";
import { FREETOWN_LOCATIONS } from "@/lib/freetownLocations";

export interface LocationValue {
  address: string;
  lat: string;
  lng: string;
}

interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

export function LocationPicker({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}) {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleAddressChange(address: string) {
    onChange({ ...value, address });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (address.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.results);
      }
      setIsSearching(false);
    }, 400);
  }

  function selectSuggestion(suggestion: GeocodeResult) {
    onChange({ address: suggestion.label, lat: String(suggestion.lat), lng: String(suggestion.lng) });
    setSuggestions([]);
  }

  return (
    <fieldset className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <legend className="px-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </legend>

      <select
        onChange={(e) => {
          const loc = FREETOWN_LOCATIONS.find((l) => l.label === e.target.value);
          if (loc) {
            onChange({ address: loc.address, lat: String(loc.lat), lng: String(loc.lng) });
            setSuggestions([]);
          }
        }}
        defaultValue=""
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
      >
        <option value="" disabled>
          Quick-select a Freetown location…
        </option>
        {FREETOWN_LOCATIONS.map((loc) => (
          <option key={loc.label} value={loc.label}>
            {loc.label}
          </option>
        ))}
      </select>

      <div className="relative">
        <input
          type="text"
          required
          autoComplete="off"
          name={`${name}Address`}
          placeholder="Search an address…"
          value={value.address}
          onChange={(e) => handleAddressChange(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
        />
        {isSearching && (
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Searching…</p>
        )}
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {suggestions.map((suggestion, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {suggestion.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          step="any"
          required
          name={`${name}Lat`}
          placeholder="Latitude"
          value={value.lat}
          onChange={(e) => onChange({ ...value, lat: e.target.value })}
          className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
        />
        <input
          type="number"
          step="any"
          required
          name={`${name}Lng`}
          placeholder="Longitude"
          value={value.lng}
          onChange={(e) => onChange({ ...value, lng: e.target.value })}
          className="w-1/2 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
        />
      </div>
    </fieldset>
  );
}
