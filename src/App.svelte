<script lang="ts">
	// interfaces
	import type { Shop, Coord } from "./Interfaces";
	
	// stores
	import { HomeLocation } from "./Stores/HomeLocation";
	import { ShopStore } from "./Stores/ShopStore";
	
	// components
	import LeafletMap from "./Components/LeafletMap.svelte";
	import List from "./Components/List.svelte";
	import TransparentOverlay from "./Components/TransparentOverlay.svelte";
	import NewMarkerPopup from "./Components/NewMarkerPopup.svelte";
	import HomeLocationListItem from "./Components/HomeLocationListItem.svelte";

	// bound component variables
	let leafletMap: LeafletMap;

	// show/hide the transparent overlay
	let overlayVisible = false;
	let newMarkerPopup: NewMarkerPopup;

	// shop input fields
	let lastClickedCoord: Coord = { lat: 0, lng: 0 };
	let newShopName: string;
	let newShopDesc: string;
	let newShopPrice: number;

	/**
	 * Adds a new shop to the ShopStore
	 * 
	 * @param coord the coordinate to set the home location to
	 */
	const addNewShop = () => {

		let newShop: Shop = {
			name: newShopName,
			description: newShopDesc,
			price: newShopPrice,
			location: lastClickedCoord,
		}

		const existingShops = $ShopStore;
		existingShops.push(newShop);
		ShopStore.set(existingShops) 
		console.log($ShopStore)
	}

	/**
	 * Sets the home location to the given leafletEvent.latlng
	 * @param leafletEvent
	 */
	const setHomeLocation = (leafletEvent) => {
		const { lat, lng } = leafletEvent.latlng;
		HomeLocation.set({ lat, lng });
	}

	/**
	 * flag to check if we're pending a release of a long press.
	 * prevents the map click handler firing on release of long press.
	 */
	let longPressPendingRelease = false;
	const mapLongPress = (e) => {
		console.log('mapLongPress', e);
		const leafletEvent = e.detail;
		longPressPendingRelease = true;

		if(confirm('Set this location as home?')){
			setHomeLocation(leafletEvent);
		}

	}
	const mapClicked = (e) => {
		console.log('mapClicked', e);

		/**
		 * If we're waiting for a long press release, don't do anything.
		 */
		if(longPressPendingRelease){
			longPressPendingRelease = false;
			return;
		}

		const leafletEvent = e.detail;

		// set location 
		lastClickedCoord = { lat: leafletEvent.latlng.lat, lng: leafletEvent.latlng.lng };

		// show the overlay
		overlayVisible = true;
	}
	const markerClicked = (e) => {
		console.log('marker clicked', e, e.detail)
		let leafletMouseEvent: L.LeafletMouseEvent = e.detail;
		leafletMap.flyTo({lat: leafletMouseEvent.latlng.lat, lng: leafletMouseEvent.latlng.lng});
	}

	/**
	 * Overlay add button clicked
	 */
	const addClicked = (e) => {
		console.log('addClicked', e);
		addNewShop();
		// after adding the shop clear the input fields and set the overlay to invisible
		newMarkerPopup.clearFields();
		overlayVisible = false;
	}
	/**
	 * Overlay cancel button clicked
	 */
	const cancelClicked = (e) => {
		console.log('cancelClicked', e);
		overlayVisible = false;
	}

	const itemClicked = (e) => {
		console.log('itemClicked', e);
		const thisShop: Shop = e.detail;
		leafletMap.flyTo(thisShop.location)
	}

</script>

<main>

	<TransparentOverlay visible={overlayVisible}>
		<NewMarkerPopup
			bind:this={newMarkerPopup}
			bind:newShopName={newShopName}
			bind:newShopDesc={newShopDesc}
			bind:newShopPrice={newShopPrice}
			add={addClicked}
			cancel={cancelClicked}
		/>
	</TransparentOverlay>

	<div class="left">
		<HomeLocationListItem />
		<div class="list-container">
			<List shops={$ShopStore} on:shopClick={itemClicked} />
		</div>
	</div>

	<div class="right">
		<LeafletMap
			bind:this={leafletMap}
		 	shops={$ShopStore}
			on:mapClick={mapClicked}
			on:mapLongPress={mapLongPress}
			on:markerClick={markerClicked}
		/>
	</div>

</main>

<style>
	main{
		display: flex;
		flex-direction: row;
		height: 100%;
	}
	
	.left{
		min-width: 300px;
		display: flex;
		flex-direction: column;
	}

	.right{
		flex-grow: 1;
		display: flex;
	}

	.list-container{
		display: flex;
		flex-direction: column;
		margin-top: 20px;
		overflow-y: scroll;
	}
</style>