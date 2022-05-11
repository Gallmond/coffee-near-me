import { Writable, writable } from "svelte/store";
import type { Shop } from "../Interfaces";

export const ShopStore: Writable<Shop[]>  = writable([
  { name: "Shop 1", price: 1.00, location: { lat: 51.46465494328079, lng: -0.2663160635422830 } , description: "A cool shop" },
  { name: "Shop 2", price: 2.50, location: { lat: 51.46499276998004, lng: -0.26443413656157055 } , description: "A cool shop" },
  { name: "Shop 3", price: 3.10, location: { lat: 51.46480001289602, lng: -0.2642012898598832 }  },
  { name: "Shop 4", price: 4.56, location: { lat: 51.465095753742666, lng: -0.2637593926874028 }  },
]);