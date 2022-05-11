<script lang="ts">
  // Cannot find module '../Stores/HomeLocation' or its corresponding type declarations.ts(2307)
  import { HomeLocation } from "../Stores/HomeLocation"; 
  import { ShopStore } from "../Stores/ShopStore";

  import { distanceBetweenKM } from "../Helpers/GeoLocation";
  import type { Shop } from "../Interfaces";

  export let shop: Shop;

  let temp = $ShopStore;

  $: thisShopDistance = distanceBetweenKM(
    [$HomeLocation.lat, $HomeLocation.lng],
    [shop.location.lat, shop.location.lng]
  );
  
</script>

<div class="shop-card" title="{shop.description}">
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