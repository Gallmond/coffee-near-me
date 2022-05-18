import { Writable, writable } from "svelte/store";

interface MemoisedDirections {
  [key: string]: {
    added: number;
    json: any;
  }
}


// store like
/**
 * {
 *  "lat,lng": {
 *    "stored": 12343425412,
 *    "json": {oprseresponse}
 *  }
 * }
 */


export const MemoisedDirections: Writable<MemoisedDirections>  = writable({});