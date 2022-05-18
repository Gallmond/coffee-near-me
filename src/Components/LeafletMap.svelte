<script lang="ts">
  // interfaces
  import type { Coord } from "../Interfaces";
  import type { Map, Polyline } from "leaflet";
  
  // svelte methods
  import { onMount, createEventDispatcher } from "svelte";
  
  // svelte stores
  import { ShopStore } from "../Stores/ShopStore";
  import { HomeLocation } from "../Stores/HomeLocation";
  
  // our code
  import Application from "../Application";

  const dispatch = createEventDispatcher();

  let application: Application;

  let map: Map;
  let polyLines: Polyline[] = [];

  export const flyTo = (coord: Coord) => {
    if(application === undefined) return;
    application.flyTo(coord);
  }

  /**
   * A helper to get the leaflet root object without lots of ts-ignore directives
   */
  const LEAFLET = () => {
    //@ts-ignore
    return L === undefined ? undefined : L;
  }


  export const drawRoute = (latLonArray: Array<[number,number]>) => {
    if(application === undefined) return;
    application.clearLines();
    application.drawLine(latLonArray);
    application.fitCoords(latLonArray);
  }

  // required to access window objects
  onMount(() => {
    
    application = new Application({
      debug: true,
      startLocation: [51.46521575117327, -0.2595353314797258],
      mapBox: {
          accessToken: 'pk.eyJ1IjoiZnVuYW5kY29vbGd1eSIsImEiOiJjbDJyYWh2ZzYzMXNoM2lwOWhudGQ1NGpnIn0.PG_RcxkH973h1MEirqweDg'
      },
    });

    application.setLeaflet( LEAFLET() )
    map = application.createMap('map');

    ShopStore.subscribe(shops => {
      application.drawMarkers(shops);
      application.fitBoundsToAllMarkers();
    });

    HomeLocation.subscribe(coord => {
      application.drawHouse(coord)
    })

    application.onMarkerClick(e => {
      dispatch('markerClick', e)
    });

    application.onClick((e) => {
      dispatch('mapClick', e);
    })

    application.onLongClick((e) => {
      dispatch('mapLongPress', e);
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