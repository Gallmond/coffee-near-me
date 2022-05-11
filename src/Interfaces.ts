import type { Marker } from "leaflet";

interface Coord{
  lat: number;
  lng: number;
}

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
  Coord,
  Shop,
  ValidIfFunction,
  MarkerObjectsStore
}