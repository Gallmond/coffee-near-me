import { Writable, writable } from "svelte/store";
import type { Coord } from "../Interfaces";

export const SplashOverlayVisible: Writable<boolean> = writable(true);