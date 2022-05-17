import { Writable, writable } from "svelte/store";
import type { Coord } from "../Interfaces";

// richmond park 51.44335302653705, -0.27522446597719047

export const HomeLocation: Writable<Coord> = writable({
  lat: 51.44335302653705,
  lng: -0.27522446597719047
});