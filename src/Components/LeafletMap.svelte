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

  const addShopToMarkersList = (shop:Shop): Marker|undefined => {
    //@ts-ignore
    if(L === undefined) return;

    let pretendId = `${shop.location.lat}-${shop.location.lng}`;

    // If we already have a marker for this shop, do nothing
    if (existingMarkers[pretendId]) {
      return existingMarkers[pretendId];
    }

    // create one

    //@ts-ignore
    existingMarkers[pretendId] = L.marker([shop.location.lat, shop.location.lng]);
    existingMarkers[pretendId].on('click', (e: L.LeafletMouseEvent) => {
      dispatch('markerClick', e)
    });
    existingMarkers[pretendId].addTo(map);
    
    // reassign to update
    existingMarkers = existingMarkers;

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

  // watch for changes to shops to add markers to the Leaflet map.
  $: {
    if(map !== undefined){
      shops.forEach(addShopToMarkersList)
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