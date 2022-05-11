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

type ValidIfFunction = (value: string|number) => boolean;

export type{
  Coord,
  Shop,
  ValidIfFunction
}