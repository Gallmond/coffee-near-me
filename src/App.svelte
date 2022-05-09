<script lang="ts">
	import LeafletMap from "./Components/LeafletMap.svelte";
	import List from "./Components/List.svelte";
	import type { Shop } from "./Interfaces";
import { HomeLocation } from "./Stores/HomeLocation";
	import { ShopStore } from "./Stores/ShopStore";

	let shops = $ShopStore;
	let homeLocation = $HomeLocation;

	const setHomeLocation = (leafletEvent) => {
		const { lat, lng } = leafletEvent.latlng;
		HomeLocation.set({ lat, lng });
	}

	const addButtonClick = (e) => {

		let newShops = [];
		for(var i = 0, l = 5; i < l; i++){
			newShops.push({ name: `shop ${(shops.length + 1)}`, distanceInMetres: 999, priceInPence: 888 })
		}

		let newShopList = [...$ShopStore, ...newShops]

		ShopStore.set(newShopList)
		shops = newShopList;
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
	}
	const markerClicked = (e) => {
		const leafletEvent = e.detail;
		console.log('marker clicked', e, leafletEvent)
	}

</script>

<main>
	<div class="left wireframe">

		<div class="home-location">
			<h2>Home Location</h2>
			<div class="lat">{$HomeLocation.lat.toFixed(4)}</div>
			<div class="lng">{$HomeLocation.lng.toFixed(4)}</div>
		</div>
		
		<List shops={shops} />
		<button on:click={addButtonClick}>Add</button>

		

	</div>
	<div class="right">
		<LeafletMap
		 	shops={shops}
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
		overflow-y: scroll;
		display: flex;
		flex-direction: column;
		justify-content: space-between;

	}

	.right{
		flex-grow: 1;
		display: flex;
	}

	.home-location{
		display: flex;
	}

</style>