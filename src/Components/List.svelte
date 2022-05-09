<script lang="ts">
  import ShopCard from "./ShopCard.svelte";

  export let shops: array;
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