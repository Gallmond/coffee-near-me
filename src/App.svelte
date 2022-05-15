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
	import ShopInfo from "./Components/ShopInfo.svelte";

	import ORSHelper from './Helpers/OSRHelper';
	const { getWalkingDirections } = ORSHelper;

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
	 */
	const addNewShop = () => {
		const existingShops = $ShopStore;
		existingShops.push({
			name: newShopName,
			description: newShopDesc,
			price: newShopPrice,
			location: lastClickedCoord,
		});
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

		const leafletEvent: L.LeafletMouseEvent = e.detail;

		// set location 
		lastClickedCoord = { lat: leafletEvent.latlng.lat, lng: leafletEvent.latlng.lng };

		// show the overlay
		overlayVisible = true;
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

	const markerClicked = (e) => {
		console.log('marker clicked', e, e.detail)
		let leafletMouseEvent: L.LeafletMouseEvent = e.detail;
		let {latlng} = leafletMouseEvent;

		// fly to this marker
		leafletMap.flyTo({lat: latlng.lat, lng: latlng.lng});

		// get the lat-lng "id" and get the corrosponding shop
		let markerPretendId = `${latlng.lat}-${latlng.lng}`;
		let thisShop: Shop;
		$ShopStore.forEach( shop => {
			let pretendId = `${shop.location.lat}-${shop.location.lng}`;
			if(pretendId === markerPretendId){
				thisShop = shop
			}
		})

		// open the shop info in the side bar
		selectedShop = thisShop === selectedShop ? undefined : thisShop;
	}

	let selectedShop: Shop|undefined;
	const itemClicked = (e) => {
		console.log('itemClicked', e);
		const thisShop: Shop = e.detail;
		leafletMap.flyTo(thisShop.location)
		selectedShop = thisShop === selectedShop ? undefined : thisShop;
	}

	const onShopUpdated = (e) => {
		const updatedShop: Shop = e.detail;
		ShopStore.set( $ShopStore );
	}

	const onShopDeleted = (e) => {
		const deletedShop: Shop = e.detail;
		leafletMap.deleteShopMarker(deletedShop);
	}

	const onNavigate = (e) => {
		const shop: Shop = e.detail;
		const from = $HomeLocation; 
		const to = shop.location;

		const directions = getWalkingDirections(from, to)

		console.log('onNavigate', from, to);
		

		directions.then( (directions) => {

			GeoJSONToMapDirections(directions);

			console.log('directions', directions);
		})


	}

	const GeoJSONToMapDirections = (GeoJSON) => {

		// get the lines
		const features = GeoJSON.features;
		const latLonArray = [];
		features.forEach( feature => {
			const { geometry } = feature;
			const { coordinates } = geometry;
			coordinates.forEach( ([lon, lat]) => {
				latLonArray.push([lat, lon]);
			})
		})

		leafletMap.drawRoute(latLonArray);

	}


	//TEMP for testing
	selectedShop = $ShopStore[0]
	// overlayVisible = true;

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

		<ShopInfo
			shop={selectedShop}
			on:shopUpdated={onShopUpdated}
			on:shopDeleted={onShopDeleted} 
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
		border-right: 5px solid black;
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