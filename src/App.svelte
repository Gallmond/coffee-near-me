<script lang="ts">
	import LeafletMap from "./Components/LeafletMap.svelte";
	import List from "./Components/List.svelte";
	import type { Shop } from "./Interfaces";
import { HomeLocation } from "./Stores/HomeLocation";
	import { ShopStore } from "./Stores/ShopStore";

	import { distanceBetween } from "./Helpers/GeoLocation";
import TransparentOverlay from "./Components/TransparentOverlay.svelte";

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

	<TransparentOverlay visible={true}>
		<div class="new-marker-prompt-container">
			<!-- TODO continue with this -->
			<h1>test</h1>
			<p>some text</p>
		</div>
	</TransparentOverlay>
	

	<div class="left">

		<div class="home-location">
			<div class="title">
				Home Location
			</div>
			<div class="latlng">{$HomeLocation.lat.toFixed(4)}, {$HomeLocation.lng.toFixed(4)}</div>
		</div>
		
		<div class="list-container">
			<List shops={shops} />
			<button on:click={addButtonClick}>Add</button>
		</div>

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
	
	.new-marker-prompt-container{
		background-color: white;
		border: 1px solid black;
		width: fit-content;
		margin: auto;
	}


</style>