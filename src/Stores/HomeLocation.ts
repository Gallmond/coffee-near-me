import { Writable, writable } from "svelte/store";
import type { Coord } from "../Interfaces";

export const HomeLocation: Writable<Coord> = writable({ lat: 51.465, lng:-0.259 });