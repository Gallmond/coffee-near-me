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
import TextDirections from "./Components/TextDirections.svelte";
import GJ from "./Helpers/GeoJsonHelper";
import SplashInfo from "./Components/SplashInfo.svelte";
	const { getWalkingDirections } = ORSHelper;

	// bound component variables
	let leafletMap: LeafletMap;

	// show/hide the transparent overlay
	let splashOverlayVisible = true;
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
		newMarkerOverlayVisible = true;
	}


	/**
	 * Overlay add button clicked
	 */
	const addClicked = (e) => {
		console.log('addClicked', e);
		addNewShop();
		// after adding the shop clear the input fields and set the overlay to invisible
		newMarkerPopup.clearFields();
		newMarkerOverlayVisible = false;
	}
	/**
	 * Overlay cancel button clicked
	 */
	const cancelClicked = (e) => {
		console.log('cancelClicked', e);
		newMarkerOverlayVisible = false;
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

	let directions = undefined;
	let directionsOpen = false;

	const onNavigate = (e) => {
		const shop: Shop = e.detail;
		const from = $HomeLocation; 
		const to = shop.location;

		let directionsPromise = getWalkingDirections(from, to)

		console.log('onNavigate', from, to);
		

		directionsPromise.then( (parsedDirections) => {

			GeoJSONToMapDirections(parsedDirections);

			console.log('setting directions to', parsedDirections);
			directions = parsedDirections;
			directionsOpen = true;

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
	// newMarkerOverlayVisible = true;
	// let directions = JSON.parse("{\"type\":\"FeatureCollection\",\"features\":[{\"bbox\":[-0.266355,51.464658,-0.263254,51.46664],\"type\":\"Feature\",\"properties\":{\"segments\":[{\"distance\":398.5,\"duration\":286.9,\"steps\":[{\"distance\":52.8,\"duration\":38,\"type\":11,\"instruction\":\"Head north on Portman Avenue\",\"name\":\"Portman Avenue\",\"way_points\":[0,3]},{\"distance\":56.1,\"duration\":40.4,\"type\":0,\"instruction\":\"Turn left onto Vernon Road\",\"name\":\"Vernon Road\",\"way_points\":[3,7]},{\"distance\":212.9,\"duration\":153.3,\"type\":0,\"instruction\":\"Turn left onto Church Avenue\",\"name\":\"Church Avenue\",\"way_points\":[7,16]},{\"distance\":6.1,\"duration\":4.4,\"type\":4,\"instruction\":\"Turn slight left\",\"name\":\"-\",\"way_points\":[16,18]},{\"distance\":49.3,\"duration\":35.5,\"type\":1,\"instruction\":\"Turn right onto Upper Richmond Road West, A205\",\"name\":\"Upper Richmond Road West, A205\",\"way_points\":[18,19]},{\"distance\":17.4,\"duration\":12.6,\"type\":12,\"instruction\":\"Keep left onto Sheen Lane, B351\",\"name\":\"Sheen Lane, B351\",\"way_points\":[19,21]},{\"distance\":3.9,\"duration\":2.8,\"type\":2,\"instruction\":\"Turn sharp left onto Milestone Green\",\"name\":\"Milestone Green\",\"way_points\":[21,23]},{\"distance\":0,\"duration\":0,\"type\":10,\"instruction\":\"Arrive at Milestone Green, straight ahead\",\"name\":\"-\",\"way_points\":[23,23]}]}],\"summary\":{\"distance\":398.5,\"duration\":286.9},\"way_points\":[0,23]},\"geometry\":{\"coordinates\":[[-0.263254,51.466109],[-0.263298,51.466286],[-0.263443,51.466516],[-0.263471,51.466561],[-0.263868,51.466566],[-0.264035,51.466579],[-0.264144,51.46661],[-0.264259,51.46664],[-0.264342,51.466503],[-0.264485,51.466316],[-0.26455,51.466216],[-0.264934,51.46573],[-0.264912,51.465655],[-0.265058,51.465452],[-0.265192,51.465287],[-0.265265,51.4652],[-0.265494,51.464904],[-0.265492,51.464872],[-0.26549,51.464849],[-0.266197,51.464796],[-0.2663,51.464719],[-0.266355,51.464674],[-0.266315,51.464664],[-0.266322,51.464658]],\"type\":\"LineString\"}}],\"bbox\":[-0.266355,51.464658,-0.263254,51.46664],\"metadata\":{\"attribution\":\"openrouteservice.org | OpenStreetMap contributors\",\"service\":\"routing\",\"timestamp\":1652612048148,\"query\":{\"coordinates\":[[-0.2632856369018555,51.4661062340029],[-0.266316063542283,51.46465494328079]],\"profile\":\"foot-walking\",\"format\":\"json\"},\"engine\":{\"version\":\"6.7.0\",\"build_date\":\"2022-02-18T19:37:41Z\",\"graph_date\":\"2022-05-03T06:30:15Z\"}}}");

</script>

<main>

	<TransparentOverlay visible={newMarkerOverlayVisible}>
		<NewMarkerPopup
			bind:this={newMarkerPopup}
			bind:newShopName={newShopName}
			bind:newShopDesc={newShopDesc}
			bind:newShopPrice={newShopPrice}
			add={addClicked}
			cancel={cancelClicked}
		/>
	</TransparentOverlay>

	<TransparentOverlay visible={splashOverlayVisible}>
		<SplashInfo on:close={()=>{ splashOverlayVisible = false; }}/>
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

		{#if directionsOpen && directions }
			<TextDirections
				directions={directions}
				on:close={()=>{ directionsOpen = false; }}	
			/>
		{/if}

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