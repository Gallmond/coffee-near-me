import { Writable, writable } from "svelte/store";
import type { Shop } from "../Interfaces";

export const ShopStore: Writable<Shop[]>  = writable([]);