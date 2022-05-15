<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import type { MarkerObjectsStore, Shop, Coord } from "../Interfaces";
  import { Map, polyline, Polyline } from "leaflet";
  import MarkerHelpers from '../Helpers/MarkerHelpers'
  import OSRHelper from "../Helpers/OSRHelper";
  import Application from "../Application";
  // import Openrouteservice from "../../public/js/ors-js-client";
  const { getMarkerBoundingBox } = MarkerHelpers;
  
  const MAP_LONGPRESS_MS = 666;

  export let shops: Shop[];
  let map: Map;

  const dispatch = createEventDispatcher();

  
  let existingMarkers: MarkerObjectsStore = {};
  let polyLines: Polyline[] = [];


  export const flyTo = (coord: Coord) => {
    if(map === undefined) return;
    map.flyTo([coord.lat, coord.lng], 17);
  }

  /** Remove a specific polyLine */
  const clearPolyLine = (_polyLine: Polyline) => {
    const polyLine = polyLines.find(e => e === _polyLine);
    polyLine && polyLine.remove();
  }
  /** Remove all current polyLines */
  const clearPolyLines = () => {
    polyLines.forEach( polyline => {
      polyline.remove();
    })
  }

  /** Just a wrapper for ts-ignore mess*/
  const LEAFLET = () => {
    //@ts-ignore
    return L === undefined ? undefined : L;
  }

  export const drawRoute = (latLonArray: Array<[number,number]>) => {
    if(LEAFLET() === undefined) return;

    // clear any existing polylines
    clearPolyLines();

    const newPolyLine = LEAFLET().polyline(latLonArray, {color: 'red'}).addTo(map);
    polyLines.push(newPolyLine);
  }

  export const deleteShopMarker = (shop: Shop) => {
    if(LEAFLET() === undefined) return;

    let pretendId = `${shop.location.lat}-${shop.location.lng}`;

    const existingMarkerIds = Object.keys( existingMarkers );
    for(var i = 0, l = existingMarkerIds.length; i < l; i++){
      if(existingMarkerIds[i] === pretendId){
        existingMarkers[ existingMarkerIds[i] ].removeFrom(map);  // remove marker from the map
        delete existingMarkers[ existingMarkerIds[i] ];           // remove marker from the object store
        break;                                                    // end the loop, should only be one
      }
    }

    existingMarkers = existingMarkers;                            // reassign to update rendered markers
  }

  const addShopToMarkersList = (shop:Shop): Marker|undefined => {
    if(LEAFLET() === undefined) return;

    let pretendId = `${shop.location.lat}-${shop.location.lng}`;

    if (existingMarkers[pretendId]) {     // If we already have a marker for this shop, do nothing
      return existingMarkers[pretendId];
    }

    existingMarkers[pretendId] = LEAFLET().marker([shop.location.lat, shop.location.lng]);  // create a new marker
    existingMarkers[pretendId].on('click', (e: L.LeafletMouseEvent) => {            // assign the markerClick event
      dispatch('markerClick', e)
    });
    existingMarkers[pretendId].addTo(map);                                          // put it on the map
    
    existingMarkers = existingMarkers;  // reassign to update

    return existingMarkers[pretendId];
  }

  $: {
    if(map !== undefined){
      shops.forEach(addShopToMarkersList) // watch for changes to shops to add markers to the Leaflet map.
    }
  }

  const fitBounds = () => {

    const bounds = getMarkerBoundingBox( existingMarkers );
    if(!bounds) return;

    map.flyToBounds(bounds);
  }

  // when existingMarkers is reassigned, fitBounds will run
  $:{
    existingMarkers;
    fitBounds();
  }

  // required to access window objects
  onMount(() => {
    
    const application = new Application({
      debug: true,
      startLocation: [51.465, -0.259],
      mapBox: {
          accessToken: 'pk.eyJ1IjoiZnVuYW5kY29vbGd1eSIsImEiOiJjbDJyYWh2ZzYzMXNoM2lwOWhudGQ1NGpnIn0.PG_RcxkH973h1MEirqweDg'
      },
    });

    application.setLeaflet( LEAFLET() )
    map = application.createMap('map');

    application.onClick((e) => {
      dispatch('mapClick', e);
    })

    // map.on('click', (e) => {
    //   dispatch('mapClick', e);
    // })

    // add a timeout debounce so we can use long press without firing click event after release
    let mouseDownTimeout: NodeJS.Timeout;
    map.on('mousedown', (e) => {
      mouseDownTimeout = setTimeout(() => {
        dispatch('mapLongPress', e);
      }, MAP_LONGPRESS_MS);
    })
    map.on('mouseup', (e) => {
      clearTimeout(mouseDownTimeout);
    })
    map.on('mousemove', (e) => {
      clearTimeout(mouseDownTimeout);
    })

    // OPENROUTESERVICE EXPERIMENT START
    const start = [ 51.46505050391631, -0.2485207421687411];
    const end = [ 51.46526069993964, -0.24381059989316992];

    const startCoord = {
      lat: start[0],
      lng: start[1]
    };
    const endCoord = {
      lat: end[0],
      lng: end[1]
    };

  })
</script>

<div id="map"></div>

<style>
  #map {
    display: flex;
    flex: 1;
  }
</style>