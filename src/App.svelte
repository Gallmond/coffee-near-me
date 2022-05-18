<script lang="ts">
  // interfaces
  import type { Shop, Coord } from "./Interfaces";

  // helpers
  import ORSHelper from "./Helpers/OSRHelper";
  const { getWalkingDirections } = ORSHelper;
  import LocalStorageHelper from "./Helpers/LocalStorageHelper";
  const { save, load } = LocalStorageHelper;

  // stores
  import { HomeLocation } from "./Stores/HomeLocation";
  import { ShopStore } from "./Stores/ShopStore";
  import { SplashOverlayVisible } from "./Stores/SplayOverlayVisble";

  // components
  import LeafletMap from "./Components/LeafletMap.svelte";
  import List from "./Components/List.svelte";
  import TransparentOverlay from "./Components/TransparentOverlay.svelte";
  import NewMarkerPopup from "./Components/NewMarkerPopup.svelte";
  import HomeLocationListItem from "./Components/HomeLocationListItem.svelte";
  import ShopInfo from "./Components/ShopInfo.svelte";
  import TextDirections from "./Components/TextDirections.svelte";
  import SplashInfo from "./Components/SplashInfo.svelte";
  import { onMount } from "svelte";
  import { MemoisedDirections } from "./Stores/MemoisedDirections";

  // bound component variables
  let leafletMap: LeafletMap;

  // show/hide the transparent overlay
  let splashOverlayVisible;
  let newMarkerOverlayVisible = false;
  let newMarkerPopup: NewMarkerPopup;

  // shop input fields
  let lastClickedCoord: Coord = { lat: 0, lng: 0 };
  let newShopName: string;
  let newShopDesc: string;
  let newShopPrice: number;

  /**
   * Adds a new shop to the ShopStore
   */
  const addNewShop = () => {
    const existingShops = $ShopStore;
    existingShops.push({
      name: newShopName,
      description: newShopDesc,
      price: newShopPrice,
      location: lastClickedCoord,
    });
    ShopStore.set(existingShops);
    console.log($ShopStore);
  };

  /**
   * Sets the home location to the given leafletEvent.latlng
   * @param leafletEvent
   */
  const setHomeLocation = (leafletEvent) => {
    const { lat, lng } = leafletEvent.latlng;
    HomeLocation.set({ lat, lng });
  };

  /**
   * flag to check if we're pending a release of a long press.
   * prevents the map click handler firing on release of long press.
   */
  let longPressPendingRelease = false;
  const mapLongPress = (e) => {
    console.log("mapLongPress", e);
    const leafletEvent = e.detail;
    longPressPendingRelease = true;

    if (confirm("Set this location as home?")) {
      setHomeLocation(leafletEvent);
    }
  };
  const mapClicked = (e) => {
    console.log("mapClicked", e);

    /**
     * If we're waiting for a long press release, don't do anything.
     */
    if (longPressPendingRelease) {
      longPressPendingRelease = false;
      return;
    }

    const leafletEvent: L.LeafletMouseEvent = e.detail;

    // set location
    lastClickedCoord = {
      lat: leafletEvent.latlng.lat,
      lng: leafletEvent.latlng.lng,
    };

    // show the overlay
    newMarkerOverlayVisible = true;
  };

  /**
   * Overlay add button clicked
   */
  const addClicked = (e) => {
    console.log("addClicked", e);
    addNewShop();
    // after adding the shop clear the input fields and set the overlay to invisible
    newMarkerPopup.clearFields();
    newMarkerOverlayVisible = false;
  };
  /**
   * Overlay cancel button clicked
   */
  const cancelClicked = (e) => {
    console.log("cancelClicked", e);
    newMarkerOverlayVisible = false;
  };

  const markerClicked = (e) => {
    console.log("marker clicked", e, e.detail);
    let leafletMouseEvent: L.LeafletMouseEvent = e.detail;
    let { latlng } = leafletMouseEvent;

    // fly to this marker
    leafletMap.flyTo({ lat: latlng.lat, lng: latlng.lng });

    // get the lat-lng "id" and get the corrosponding shop
    let markerPretendId = `${latlng.lat}-${latlng.lng}`;
    let thisShop: Shop;
    $ShopStore.forEach((shop) => {
      let pretendId = `${shop.location.lat}-${shop.location.lng}`;
      if (pretendId === markerPretendId) {
        thisShop = shop;
      }
    });

    // open the shop info in the side bar
    selectedShop = thisShop === selectedShop ? undefined : thisShop;
  };

  let selectedShop: Shop | undefined;
  const itemClicked = (e) => {
    console.log("itemClicked", e);
    const thisShop: Shop = e.detail;
    leafletMap.flyTo(thisShop.location);
    selectedShop = thisShop === selectedShop ? undefined : thisShop;
  };

  const onShopUpdated = (e) => {
    const updatedShop: Shop = e.detail;
    ShopStore.set($ShopStore);
  };

  let directions = undefined;
  let directionsOpen = false;

  /**
   * Attempt to read any stored existing directions from the Store
   * @param {string} pretendId Id composed of the to:from latlons
   */
  const getExistingDirections = ( pretendId:string ): object|null =>{
    // how long until directions are considered old
    const expiresMs = (1000 * 60 * 60 * 24 * 5); // 5 days

    if( !Object.keys($MemoisedDirections).includes(pretendId) ){
      return;
    }

    const existing = $MemoisedDirections[pretendId];
    const now = new Date().valueOf();

    if (now - existing.added < expiresMs) {
      // use the existing info if it is not too old
      console.log("existing directions found", pretendId, existing);
      return existing.json;
    }
    // remove it if it's too old
    console.log("old existing directions found", pretendId, existing);
    MemoisedDirections.update((existing) => {
      delete existing[pretendId];
      return existing;
    });

    return;
  }

  const onNavigate = async (e) => {
    const shop: Shop = e.detail;
    const from = $HomeLocation;
    const to = shop.location;

    let parsedDirections;

    // first check stored locations
    const pretendId = `${from.lat},${from.lng}:${to.lat},${to.lng}`;
    parsedDirections = getExistingDirections(pretendId);

    // if we've not been set above, now make an actual API call
    if (!parsedDirections) {
      console.log("requesting new directions");
      parsedDirections = await getWalkingDirections(from, to);

      // saving directions
      MemoisedDirections.update((existing) => {
        existing[pretendId] = {
          added: new Date().valueOf(),
          json: parsedDirections,
        };
        return existing;
      });
    }

    console.log("onNavigate", from, to);

    GeoJSONToMapDirections(parsedDirections);

    directions = parsedDirections;
    directionsOpen = true;

  };

  const GeoJSONToMapDirections = (GeoJSON) => {
    // get the lines
    const features = GeoJSON.features;
    const latLonArray = [];
    features.forEach((feature) => {
      const { geometry } = feature;
      const { coordinates } = geometry;
      coordinates.forEach(([lon, lat]) => {
        latLonArray.push([lat, lon]);
      });
    });

    leafletMap.drawRoute(latLonArray);
  };

  let saveDebounceId: NodeJS.Timeout;
  const saveDebounce = (key: string, value: any) => {
    if (saveDebounceId) {
      clearTimeout(saveDebounceId);
    }
    saveDebounceId = setTimeout(() => {
      save(key, value);
    }, 5000);
  };

  const storeUpdaters = (): void => {
    // update the stores on changes
    ShopStore.subscribe((shops) => {
      saveDebounce("$ShopStore", shops);
    });
    HomeLocation.subscribe((homeLocation) => {
      saveDebounce("$HomeLocation", homeLocation);
    });
    MemoisedDirections.subscribe((directions) => {
      saveDebounce("$MemoisedDirections", directions);
    });
    SplashOverlayVisible.subscribe((isVisible) => {
      saveDebounce("$SplashOverlayVisible", isVisible);
      splashOverlayVisible = isVisible;
    });
  };
  storeUpdaters();

  onMount(() => {
    // load the stores
    loadSavedData();
  });

  /** Load data from localstorage into the Stores */
  const loadSavedData = () => {
    console.log("loadSavedData");
    if (!window.localStorage) {
      throw new Error(
        "loadSavedData called before window.localStorage is available"
      );
    }

    const existingShopStore = load("$ShopStore");
    const existingHomeLocation = load("$HomeLocation");
    const existingSplashOverlayVisible = load("$SplashOverlayVisible");
    const existingMemoisedDirections = load("$MemoisedDirections");

    if (existingShopStore !== null && typeof existingShopStore === "object") {
      ShopStore.set(existingShopStore);
    }
    if (
      existingHomeLocation !== null &&
      typeof existingHomeLocation === "object"
    ) {
      HomeLocation.set(existingHomeLocation);
    }
    if (
      existingSplashOverlayVisible !== null &&
      typeof existingSplashOverlayVisible === "boolean"
    ) {
      SplashOverlayVisible.set(existingSplashOverlayVisible);
    }
    if (
      existingMemoisedDirections !== null &&
      typeof existingMemoisedDirections === "object"
    ) {
      SplashOverlayVisible.set(existingMemoisedDirections);
    }
  };

  //TEMP for testing
  // selectedShop = $ShopStore[0];
  // newMarkerOverlayVisible = true;
</script>

<main>
  <TransparentOverlay visible={newMarkerOverlayVisible}>
    <NewMarkerPopup
      bind:this={newMarkerPopup}
      bind:newShopName
      bind:newShopDesc
      bind:newShopPrice
      add={addClicked}
      cancel={cancelClicked}
    />
  </TransparentOverlay>

  <TransparentOverlay visible={splashOverlayVisible}>
    <SplashInfo
      on:close={() => {
        SplashOverlayVisible.set(false);
      }}
    />
  </TransparentOverlay>

  <div class="left">
    <HomeLocationListItem />
    <div class="list-container">
      <List shops={$ShopStore} on:shopClick={itemClicked} />
    </div>

    <ShopInfo
      shop={selectedShop}
      on:shopUpdated={onShopUpdated}
      on:navigateToShop={onNavigate}
    />
  </div>

  <div class="right">
    <LeafletMap
      bind:this={leafletMap}
      shops={$ShopStore}
      on:mapClick={mapClicked}
      on:mapLongPress={mapLongPress}
      on:markerClick={markerClicked}
    />

    {#if directionsOpen && directions}
      <TextDirections
        {directions}
        on:close={() => {
          directionsOpen = false;
        }}
      />
    {/if}
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: row;
    height: 100%;
  }

  .left {
    min-width: 300px;
    display: flex;
    flex-direction: column;
    border-right: 5px solid black;
  }

  .right {
    flex-grow: 1;
    display: flex;
  }

  .list-container {
    display: flex;
    flex-direction: column;
    margin-top: 20px;
    overflow-y: scroll;
  }
</style>
