interface Coord{
  lat: number;
  lng: number;
}

interface Shop{
  name: string;
  description?: string;
  priceInPence: number;
  distanceInMetres: number;
  location: Coord;
}

export type{
  Shop
}