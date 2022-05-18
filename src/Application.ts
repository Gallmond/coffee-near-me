import type { LeafletMouseEvent, MapOptions, LeafletMouseEventHandlerFn, LeafletEventHandlerFn, Marker } from "leaflet";
import type { Coord, Latitude, Longitude, Shop } from "./Interfaces";
import { ShopStore } from "./Stores/ShopStore";
import MarkerHelpers from "./Helpers/MarkerHelpers";
import type HomeLocationListItem from "./Components/HomeLocationListItem.svelte";
const { getMarkerBoundingBox, latLonBoundingBox } = MarkerHelpers;

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
  homeLocationMarker: L.Marker;

  polyLines: L.Polyline[] = [];

  houseIconData:string = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNzUycHQiIGhlaWdodD0iNzUycHQiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDc1MiA3NTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiA8cGF0aCBkPSJtMzc1IDE0OC4zOWMtNC40NTcgMC04LjkxNDEgMS40OTYxLTEyLjU2NiA0LjQ5MjJsLTIxMC44NyAxNzNjLTYuNDgwNSA1LjMyMDMtOC45MTQxIDE0LjE0MS02LjA3MDMgMjIuMDI3IDIuODMyIDcuODYzMyAxMC4yODUgMTMuMDk4IDE4LjYzNyAxMy4wOThoMC4wODU5MzhsMzguNzA3LTAuMTcxODh2MC4wMDM5MDZsMC4xNDA2MiAyMTIuODljMC4wMDM5MDYgNS4yNTc4IDIuMDk3NyAxMC4zMDEgNS44MTY0IDE0LjAxMiAzLjcxNDggMy43MDcgOC43NDYxIDUuNzg1MiAxMy45OTIgNS43ODUyaDAuMDM1MTU2bDk4LjU4Ni0wLjE3MTg4aDAuMDI3MzQ0Yy0wLjExNzE5LTAuODAwNzgtMC4xNzU3OC0xLjYxMzMtMC4xNzU3OC0yLjQyOTd2LTE2MS4yMWMwLTQuNDQxNCAxLjc2NTYtOC43MDcgNC45MDYyLTExLjg0OCAzLjE0MDYtMy4xNDA2IDcuNDAyMy00LjkwNjIgMTEuODQ4LTQuOTA2Mmw3My40MTQgMC4wMDc4MTJjOS4yNTM5IDAgMTYuNzU0IDcuNSAxNi43NTQgMTYuNzU0djE2MS4yYzAgMC45Mjk2OS0wLjA3NDIxOSAxLjgzOTgtMC4yMjI2NiAyLjcyNjZoMC4wMjczNDRsNTYuODI4IDAuMzA0NjloMC4xMDkzOGMwLjg2NzE5IDAgMS43MjI3LTAuMDU0Njg4IDIuNTYyNS0wLjE2NDA2aDAuMDA3ODEyYzAuMDg5ODQ0IDAuMDAzOTA2IDAuMTc5NjkgMC4wMDM5MDYgMC4yNzM0NCAwLjAwMzkwNmwzOC42NTIgMC4wMTU2MjZoMC4wMDc4MTNjMTAuOTIyIDAgMTkuNzg1LTguODQzOCAxOS44MDktMTkuNzY2bDAuNDkyMTktMjEyLjk2IDM4Ljc1LTAuMTMyODFjOC4zNTE2LTAuMDMxMjUgMTUuNzg5LTUuMjk2OSAxOC41OTQtMTMuMTY0IDIuODAwOC03Ljg2NzIgMC4zNjcxOS0xNi42NDgtNi4wODU5LTIxLjk1M2wtMjEwLjUtMTcyLjkzYy0zLjY1NjItMy04LjExNzItNC41LTEyLjU3NC00LjV6IiBmaWxsPSIjMDA0NDllIi8+Cjwvc3ZnPgo=';

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

  /** zoom the map to contain these coords */
  fitCoords(latLonArray: [number,number][]): void{
    console.log('fitCoords', latLonArray);
    const bounds = latLonBoundingBox(latLonArray);
    this.map.flyToBounds(bounds, {
      maxZoom: 17,
    });
  }

  fitBoundsToAllMarkers(): void{
    const bounds = getMarkerBoundingBox(this.markerData);
    if(!bounds) return;

    this.map.flyToBounds(bounds);
  }

  flyTo(coord: Coord): void{
    this.map.flyTo([coord.lat, coord.lng], 17);
  }

  clearLines(): void{
    this.polyLines.forEach(line => {
      line.remove();
    })
  }

  drawLine(latLonArray: [number,number][]):void{
    //@ts-ignore
    const polyLine = this.leaflet.polyline(latLonArray, {
      color: 'red',
    }).addTo(this.map);
    this.polyLines.push(polyLine);
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

  drawHouse(HomeLocation: Coord): void{
    if(this.homeLocationMarker){
      this.homeLocationMarker.removeFrom(this.map);
    }

    //@ts-ignore
    const houseIcon = this.leaflet.icon({
      iconUrl: this.houseIconData,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      // popupAnchor: [-3, -76],
      // shadowUrl: 'my-icon-shadow.png',
      // shadowSize: [68, 95],
      // shadowAnchor: [22, 94]
    });
    //@ts-ignore
    
    const marker = this.leaflet.marker(HomeLocation, {icon: houseIcon}).addTo(this.map);
    this.homeLocationMarker = marker;
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
