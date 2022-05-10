import { Writable, writable } from "svelte/store";
import type { Shop } from "../Interfaces";

export const ShopStore: Writable<Shop[]>  = writable([
  { name: "Shop 1", priceInPence: 100, location: { lat: 51.46465494328079, lng: -0.2663160635422830 } , description: "A cool shop" },
  { name: "Shop 2", priceInPence: 250, location: { lat: 51.46499276998004, lng: -0.26443413656157055 } , description: "A cool shop" },
  { name: "Shop 3", priceInPence: 310, location: { lat: 51.46480001289602, lng: -0.2642012898598832 }  },
  { name: "Shop 4", priceInPence: 4123, location: { lat: 51.465095753742666, lng: -0.2637593926874028 }  },
]);