export interface NamedLocation {
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export const FREETOWN_LOCATIONS: NamedLocation[] = [
  { label: "Congo Cross", address: "Congo Cross, Freetown", lat: 8.4826, lng: -13.2571 },
  { label: "Aberdeen", address: "Aberdeen, Freetown", lat: 8.49, lng: -13.2836 },
  { label: "Lumley", address: "Lumley, Freetown", lat: 8.47, lng: -13.29 },
  { label: "City Centre", address: "City Centre, Freetown", lat: 8.4657, lng: -13.2317 },
];
