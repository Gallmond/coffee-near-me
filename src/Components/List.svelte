<script lang="ts">
  import type { Shop } from "../Interfaces";
  import ShopCard from "./ShopCard.svelte";

  export let shops: Shop[];

  /**
   * the on:shopClick with no value just forwards it up to the next component
   */
</script>

<div class="container">
  {#each shops as shop}
    <ShopCard on:shopClick shop={shop} />
  {/each}
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
  }
</style>