<script lang="ts">
  import type { Shop } from "../Interfaces";

  export let shop: Shop;
</script>

<div class="shop-card">
  <div class="left">
    <div class="title">{shop.name}</div>
    <div class="distance">{shop.distanceInMetres}m</div>
  </div>
  <div class="right">£{(shop.priceInPence/100).toFixed(2)}</div>
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