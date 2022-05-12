<script lang="ts">
  import type { Shop } from "../Interfaces";
  import Button from "./Button.svelte";
  export let shop: Shop|undefined;
</script>

{#if shop !== undefined}
  <div class="container wireframe">
    <div class="title-text">{shop.name}</div>
    <div class="small-text">{shop.location.lat.toFixed(4)}, {shop.location.lng.toFixed(4)}</div>
    
    {#if shop.description}
      <div class="desc-text">{shop.description}</div>
    {/if}

    <div class="price-text">£{shop.price.toFixed(2)}</div>

    <div class="buttons">
      <Button text=edit />
      <Button text=delete />
    </div>

  </div>
{/if}

<style>
  .container{
    border-top: 5px solid black;
    display: flex;
    min-height: 25%;
    flex-direction: column;
    padding: 5px;
    margin-top: auto;
  }

  .buttons{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-top: auto;
  }
</style>