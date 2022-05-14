import type { Marker } from "leaflet";

type Latitude = number;
type Longitude = number;

interface Coord{
  lat: Latitude;
  lng: Longitude;
}

/**
 * lon, lat (yes this is correct)
 */
type ORSCoord = [Longitude, Latitude];

interface Shop{
  name: string;
  description?: string;
  price: number; // in pounds
  location: Coord;
}

interface MarkerObjectsStore{
  [key: string]: Marker;
}

type ValidIfFunction = (value: string|number) => boolean;

export type{
  Latitude,
  Longitude,
  ORSCoord,
  Coord,
  Shop,
  ValidIfFunction,
  MarkerObjectsStore,
}