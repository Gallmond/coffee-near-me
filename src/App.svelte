<script lang="ts">
	import LeafletMap from "./Components/LeafletMap.svelte";
	import List from "./Components/List.svelte";
	import type { Shop } from "./Interfaces";
	import { ShopStore } from "./Stores/ShopStore";

	let shops = $ShopStore;

	const addButtonClick = (e) => {

		let newShops = [];
		for(var i = 0, l = 5; i < l; i++){
			newShops.push({ name: `shop ${(shops.length + 1)}`, distanceInMetres: 999, priceInPence: 888 })
		}

		let newShopList = [...$ShopStore, ...newShops]

		ShopStore.set(newShopList)
		shops = newShopList;
	}

</script>

<main>
	<div class="left">
		<List shops={shops} />
		<button on:click={addButtonClick}>Add</button>
	</div>
	<div class="right">
		<LeafletMap shops={shops}/>
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
	}

	.right{
		flex-grow: 1;
		display: flex;
	}

</style>