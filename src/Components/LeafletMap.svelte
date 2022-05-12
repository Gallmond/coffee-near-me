<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import type { MarkerObjectsStore, Shop, Coord } from "../Interfaces";
  import type { Map, Marker } from "leaflet";

  const MAP_LONGPRESS_MS = 666;

  export let shops: Shop[];
  let map: Map;

  const dispatch = createEventDispatcher();

  
  let existingMarkers: MarkerObjectsStore = {};
  
  export const flyTo = (coord: Coord) => {
    if(map === undefined) return;
    map.flyTo([coord.lat, coord.lng], 17);
  }

  export const deleteShopMarker = (shop: Shop) => {
    //@ts-ignore
    if(L === undefined) return;

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
    //@ts-ignore
    if(L === undefined) return;

    let pretendId = `${shop.location.lat}-${shop.location.lng}`;

    if (existingMarkers[pretendId]) {     // If we already have a marker for this shop, do nothing
      return existingMarkers[pretendId];
    }

    //@ts-ignore
    existingMarkers[pretendId] = L.marker([shop.location.lat, shop.location.lng]);  // create a new marker
    existingMarkers[pretendId].on('click', (e: L.LeafletMouseEvent) => {            // assign the markerClick event
      dispatch('markerClick', e)
    });
    existingMarkers[pretendId].addTo(map);                                          // put it on the map
    
    existingMarkers = existingMarkers;  // reassign to update

    return existingMarkers[pretendId];
  }

  // required for Leaflet init
  const config = {
      mapbox: {
          accessToken: 'pk.eyJ1IjoiZnVuYW5kY29vbGd1eSIsImEiOiJjbDJyYWh2ZzYzMXNoM2lwOWhudGQ1NGpnIn0.PG_RcxkH973h1MEirqweDg'
      },
      coords: {
          start: [51.465, -0.259]
      }
  };

  $: {
    if(map !== undefined){
      shops.forEach(addShopToMarkersList) // watch for changes to shops to add markers to the Leaflet map.
    }
  }

  // required to access window objects
  onMount(() => {
    //@ts-ignore  
    map = L.map('map').setView([51.465, -0.259], 18);
    // set tile layer
    //@ts-ignore
    L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: config.mapbox.accessToken
        //@ts-ignore
    }).addTo(map)

    //@ts-ignore
    map.on('click', (e) => {
      dispatch('mapClick', e);
    })

    // add a timeout debounce so we can use long press without firing click event after release
    let mouseDownTimeout: NodeJS.Timeout;
    //@ts-ignore
    map.on('mousedown', (e) => {
      mouseDownTimeout = setTimeout(() => {
        dispatch('mapLongPress', e);
      }, MAP_LONGPRESS_MS);
    })
    //@ts-ignore
    map.on('mouseup', (e) => {
      clearTimeout(mouseDownTimeout);
    })
    //@ts-ignore
    map.on('mousemove', (e) => {
      clearTimeout(mouseDownTimeout);
    })

  })
</script>

<div id="map"></div>

<style>
  #map {
    display: flex;
    flex: 1;
  }
</style>