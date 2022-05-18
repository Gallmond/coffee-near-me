<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import type { MarkerObjectsStore, Shop, Coord } from "../Interfaces";
  import { Map, polyline, Polyline } from "leaflet";
  import MarkerHelpers from '../Helpers/MarkerHelpers'
  import OSRHelper from "../Helpers/OSRHelper";
  import Application from "../Application";
import { ShopStore } from "../Stores/ShopStore";
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

  // required to access window objects
  onMount(() => {
    
    const application = new Application({
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
      application.fitBounds();
    });

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