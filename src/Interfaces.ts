interface Coord{
  lat: number;
  lng: number;
}

interface Shop{
  name: string;
  description?: string;
  priceInPence: number;
  location: Coord;
}

type ValidIfFunction = (value: string|number) => boolean;

export type{
  Coord,
  Shop,
  ValidIfFunction
}