import type { LeafletMouseEvent, MapOptions, LeafletMouseEventHandlerFn, LeafletEventHandlerFn, Marker } from "leaflet";
import type { Coord, Latitude, Longitude, Shop } from "./Interfaces";
import { ShopStore } from "./Stores/ShopStore";
import MarkerHelpers from "./Helpers/MarkerHelpers";
const { getMarkerBoundingBox } = MarkerHelpers;

interface MapBoxOptions {
  accessToken: string;
}

interface ApplicationOptions {
  debug?: boolean;
  mapBox: MapBoxOptions;
  startLocation: [Latitude, Longitude]; 
}

interface MarkerDataStore {
  [key: string]: Marker;
}

class Application {
  options: ApplicationOptions | null;
  leaflet: object;
  map: L.Map;
  markerData: MarkerDataStore = {};
  leafletMarkers: Marker[] = [];

  mouseDownTimeout: NodeJS.Timeout;
  longPressTimeMs: number = 500;

  markerClickHandler: LeafletMouseEventHandlerFn;

  constructor(options: ApplicationOptions | null = null) {
    this.options = options ?? null;

    if (this.option('debug')) {
      console.log("created Application");
      console.log('With options', this.options);
    }
  }

  option(key:string): any{
    if(Object.keys(this.options).includes(key)){
      return this.options[key];
    }
    return null;
  }

  setLeaflet(leaflet: object): this {
    this.leaflet = leaflet;
    return this;
  }

  createMap(element: string | HTMLElement, options?: MapOptions): L.Map{
    //@ts-ignore
    this.map = this.leaflet.map(element, options);

    if(this.option('startLocation')){
      this.map.setView(this.option('startLocation'), 18);
    }

    //@ts-ignore
    this.leaflet.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: this.option('mapBox').accessToken
        //@ts-ignore
    }).addTo(this.map);

    return this.map;
  }

  fitBounds(): void{
    const bounds = getMarkerBoundingBox(this.markerData);
    if(!bounds) return;

    this.map.flyToBounds(bounds);
  }

  drawMarkers( shops: Shop[]): void{
    const existingMarkersKeys = Object.keys( this.markerData );
    
    shops.forEach((shop:Shop) => {

      // check if it already exists
      const pretendId = `${shop.location.lat}-${shop.location.lng}`;

      if(existingMarkersKeys.includes(pretendId)){
        // already exists, do nothing

        const existingMarkerIndex = existingMarkersKeys.findIndex(key => key === pretendId);
        if(existingMarkerIndex > -1){
          existingMarkersKeys.splice(existingMarkerIndex, 1);
        }
        return;
      }

      //@ts-ignore
      this.markerData[ pretendId ] = this.leaflet.marker(shop.location);
      this.markerData[ pretendId ].addTo(this.map)
      this.markerData[ pretendId ].on('click', this.markerClickHandler);
    })

    // any markers still in the list should not be set
    existingMarkersKeys.forEach(key => {
      this.markerData[key].removeFrom(this.map);
      delete this.markerData[key];
    })

  }

  onMarkerClick(fn: LeafletMouseEventHandlerFn){
    this.markerClickHandler = fn
  }

  onClick(fn: LeafletMouseEventHandlerFn): void {
    this.map.on('click', fn)
  }

  onLongClick(fn: LeafletEventHandlerFn): void {
    this.map.on('mousedown', (e) => {
      this.mouseDownTimeout = setTimeout(() => {
        fn(e);
      }, this.longPressTimeMs);
    })
    this.map.on('mouseup', (e) => {
      clearTimeout(this.mouseDownTimeout);
    })
    this.map.on('mousemove', (e) => {
      clearTimeout(this.mouseDownTimeout);
    })
  }

  addStore(
    price: number,
    name: string,
    coord: Coord,
    description: string | null = null
  ): this {

    // add to the ShopStore
    ShopStore.update(shops => {
      const newShop = {
        price,
        name,
        location: coord,
      }

      if(description) newShop['description'] = description;
      
      return [...shops, newShop];
    })

    // add marker to map


    return this;
  }

  initMap(): void {}
}

export default Application;
