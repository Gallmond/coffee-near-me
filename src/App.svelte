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


	let homeLocation = $HomeLocation;
	
	// show/hide the transparent overlay
	let overlayVisible = false;

	// shop input fields
	let lastClickedCoord: Coord = { lat: 0, lng: 0 };
	let newShopName = '';
	let newShopDesc = 'A new shop';
	let newShopPrice = 0;

	const addNewShop = (coord: Coord) => {

		let newShop: Shop = {
			name: newShopName,
			description: newShopDesc,
			priceInPence: newShopPrice,
			location: coord,
		}

		const existingShops = $ShopStore;
		existingShops.push(newShop);
		ShopStore.set(existingShops) 
	}

	const setHomeLocation = (leafletEvent) => {
		const { lat, lng } = leafletEvent.latlng;
		HomeLocation.set({ lat, lng });
	}

	let longPressPendingRelease = false;
	const mapLongPress = (e) => {
		const leafletEvent = e.detail;
		console.log('map long-clicked', e, leafletEvent)
		longPressPendingRelease = true;

		if(confirm('Set this location as home?')){
			setHomeLocation(leafletEvent);
			console.log(homeLocation);
		}

	}
	const mapClicked = (e) => {
		if(longPressPendingRelease){
			longPressPendingRelease = false;
			return;
		}
		const leafletEvent = e.detail;
		console.log('map clicked', e, leafletEvent)

		// set location 
		lastClickedCoord = { lat: leafletEvent.latlng.lat, lng: leafletEvent.latlng.lng };

		// prompt user for new marker info
		overlayVisible = true;
		console.log('overlayVisible', overlayVisible);
	}
	const markerClicked = (e) => {
		const leafletEvent = e.detail;
		console.log('marker clicked', e, leafletEvent)
	}

	const addClicked = (e) => {
		console.log('addClicked', e);
		addNewShop(lastClickedCoord);
	}
	const cancelClicked = (e) => {
		console.log('cancelClicked', e);
		overlayVisible = false;
	}



</script>

<main>

	<TransparentOverlay visible={overlayVisible}>
		<NewMarkerPopup
			newShopName={newShopName}
			newShopDesc={newShopDesc}
			newShopPrice={newShopPrice}
			add={addClicked}
			cancel={cancelClicked}
		/>
	</TransparentOverlay>
	

	<div class="left">

		<div class="home-location">
			<div class="title">
				Home Location
			</div>
			<div class="latlng">{$HomeLocation.lat.toFixed(4)}, {$HomeLocation.lng.toFixed(4)}</div>
		</div>
		
		<div class="list-container">
			<List shops={$ShopStore} />
		</div>

	</div>
	<div class="right">
		<LeafletMap
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

	.home-location{
		padding: 5px;
		display: flex;
		flex-direction: column;
	}
	.title{
		font-size: 1.2rem;
    font-weight: bold;
	}
	.latlng{
		font-size: 0.8rem;
    opacity: 0.7;
	}
</style>