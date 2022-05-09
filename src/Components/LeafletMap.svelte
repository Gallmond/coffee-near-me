<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import type { Shop } from "../Interfaces";
  
  export let shops: Shop[];
  
  const MAP_LONGPRESS_MS = 666;

  const dispatch = createEventDispatcher();

  // required for Leaflet init
  const config = {
      mapbox: {
          accessToken: 'pk.eyJ1IjoiZnVuYW5kY29vbGd1eSIsImEiOiJjbDJyYWh2ZzYzMXNoM2lwOWhudGQ1NGpnIn0.PG_RcxkH973h1MEirqweDg'
      },
      coords: {
          start: [51.465, -0.259]
      }
  };

  // required to access window objects
  onMount(() => {

    const addMarker = (shop: Shop) => {
      const { lat, lng } = shop.location;
      //@ts-ignore
      const marker = L.marker([lat, lng]).addTo(map);
      marker.on('click', (e) => {
        dispatch('markerClick', e);
      });
      return marker;
    }

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

    shops.forEach((shop: Shop) => {
      addMarker(shop);
    });

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

  // create map
  

</script>

<div id="map"></div>

<style>
  #map {
    display: flex;
    flex: 1;
  }
</style>