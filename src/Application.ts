import type { MapOptions, LeafletMouseEventHandlerFn } from "leaflet";
import type { Coord, Latitude, Longitude, Shop } from "./Interfaces";

interface MapBoxOptions {
  accessToken: string;
}

interface ApplicationOptions {
  debug?: boolean;
  mapBox: MapBoxOptions;
  startLocation: [Latitude, Longitude]; 
}

class Application {
  options: ApplicationOptions | null;
  leaflet: object;
  map: L.Map;

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

  // //TODO write these
  onClick(fn: LeafletMouseEventHandlerFn): void {
    console.log('onclickeset', fn);
    this.map.on('click', fn)
  }
  onLongClick(): void {}

  addStore(
    price: number,
    name: string,
    coord: Coord,
    description: string | null = null
  ): this {

    // add to the shopstore

    //


    return this;
  }

  initMap(): void {}
}

export default Application;
