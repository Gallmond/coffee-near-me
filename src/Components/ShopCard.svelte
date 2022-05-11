<script lang="ts">
  import { HomeLocation } from "../Stores/HomeLocation"; 
  import { createEventDispatcher } from "svelte";
  import { distanceBetweenKM } from "../Helpers/GeoLocation";
  import type { Shop } from "../Interfaces";

  const dispatch = createEventDispatcher();

  export let shop: Shop;

  const onClick = (e) => {
    dispatch("shopClick", shop);
  }

  // recalculate distance if HomeLocation changes.
  $: thisShopDistance = distanceBetweenKM(
    [$HomeLocation.lat, $HomeLocation.lng],
    [shop.location.lat, shop.location.lng]
  );
  
</script>

<div class="shop-card" title="{shop.description}" on:click={onClick}>
  <div class="left">
    <div class="title">{shop.name}</div>
    <div class="distance">{thisShopDistance.toFixed(2)}km</div>
  </div>
  <div class="right">£{shop.price.toFixed(2)}</div>
</div>

<style>
  .shop-card {
    display: flex;
    flex-direction: row;
    padding: 5px;
  }

  .shop-card:hover{
    background-color: #fafafa;
  }

  .title{
    font-size: 1.2rem;
    font-weight: bold;
  }
  .distance{
    font-size: 0.8rem;
    opacity: 0.7;
  }

  .left{
    flex: 6;
  }
  .right{
    flex: 4;
    display: flex;
    justify-items: center;
    justify-content: center;
    align-items: center;
    font-weight: bold;
  }
</style>