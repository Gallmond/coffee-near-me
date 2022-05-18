import type { Coord } from "../Interfaces";

const ors_url = 'https://api.openrouteservice.org';
const api_key = '5b3ce3597851110001cf6248511c38bca6e2470b828a93edf1d33fe6';

/**
 * Just a convenience function to make the request to ORS
 * 
 * @param path The api path to use
 * @param getParams the get params to use
 * @returns Promise<Response>
 */
const ORSRequest = async (path: string, getParams: Record<string, string>): Promise<Response> => {
  const params = { api_key: api_key, ...getParams, }
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${ors_url}${path}?${queryString}`);
  return res;
}

const getWalkingDirections = async (from: Coord, to: Coord): Promise<null> => {
  // nb: ors expect lng then lat
  const start = [from.lng, from.lat].join(',');
  const end = [to.lng, to.lat].join(',');

  const res = await ORSRequest('/v2/directions/foot-walking', {
    start: start,
    end: end,
  });

  const json = await res.json();
  return json;
}

export default {
  getWalkingDirections,
}