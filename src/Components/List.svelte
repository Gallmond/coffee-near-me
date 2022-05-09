<script lang="ts">
  import type { Shop } from "../Interfaces";
  import ShopCard from "./ShopCard.svelte";
  
  export let shops: Shop[];
</script>

<div class="container">
  {#each shops as shop}
    <ShopCard shop={shop} />
  {/each}
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
  }

</style>