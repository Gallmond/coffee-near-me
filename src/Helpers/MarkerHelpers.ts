import type { LatLngBoundsExpression } from "leaflet"; 
import type { MarkerObjectsStore } from "../Interfaces";

const latLonBoundingBox = (coordinates: number[][]): LatLngBoundsExpression => {
  let minLat = coordinates[0][0];
  let minLon = coordinates[0][1];
  let maxLat = coordinates[0][0];
  let maxLon = coordinates[0][1];

  coordinates.forEach(coord => {
    if(coord[0] < minLat) minLat = coord[0];
    if(coord[1] < minLon) minLon = coord[1];
    if(coord[0] > maxLat) maxLat = coord[0];
    if(coord[1] > maxLon) maxLon = coord[1];
  })

  return [
    [minLat, minLon],
    [maxLat, maxLon]
  ];
} 

const getMarkerBoundingBox = (markers: MarkerObjectsStore): LatLngBoundsExpression|null => {
  const allMarkerCoordinates = [];
  Object.entries(markers).forEach(([key, marker]) => {
    allMarkerCoordinates.push([marker.getLatLng().lat, marker.getLatLng().lng]);
  });

  if(allMarkerCoordinates.length === 0) return null;

  return latLonBoundingBox(allMarkerCoordinates);
}

export default {
  getMarkerBoundingBox,
  latLonBoundingBox
}