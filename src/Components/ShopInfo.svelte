<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Shop } from "../Interfaces";
import { ShopStore } from "../Stores/ShopStore";
  import Button from "./Button.svelte";
  import NumberInput from "./NumberInput.svelte";
  import TextInput from "./TextInput.svelte";
  export let shop: Shop|undefined;

  const dispatch = createEventDispatcher();

  let editing = false;

  let deletePendingConfirm = false;

  // if the shop becomes undefined, set editing false
  $: {
    if(shop === undefined){
      toggleEditing(false)
      toggleDeletePendingConfirm(false);
    }
  }

  const setInitialDeleteState = () => {
    // the shop has changed, set pending confirm false
    toggleDeletePendingConfirm(false);
  }

  $: {
    shop;
    setInitialDeleteState();
  }

  const toggleEditing = (newState?:boolean) => {
    editing = newState !== undefined ? newState : !editing;
  }

  const toggleDeletePendingConfirm = (newState?:boolean) => {
    deletePendingConfirm = newState !== undefined ? newState : !deletePendingConfirm;
  }

  const editButtonClicked = () => {
    toggleEditing();                // Turn on editing
  }

  const saveButtonClicked = () => {
    dispatch('shopUpdated', shop);  // Dispatch an event so parents know a shop was updated
    toggleEditing();                // Turn off editing
  }

  const deleteButtonClicked = () => {
    if(!deletePendingConfirm){
      toggleDeletePendingConfirm(true);
      return;
    }

    const allOtherShops = $ShopStore.filter( thisShop => !(thisShop === shop));
    ShopStore.set(allOtherShops);
    toggleDeletePendingConfirm(false);
    shop = undefined;
  }

  const navigateButtonClicked = () => {
    dispatch('navigateToShop', shop);
  }

</script>

{#if shop !== undefined}
<div class="container">

  {#if editing}
    <TextInput bind:value={shop.name} placeholder={shop.name ?? 'shop name'} />
    <div class="small-text">{shop.location.lat.toFixed(4)}, {shop.location.lng.toFixed(4)}</div>
    <TextInput bind:value={shop.description} placeholder={shop.description.length ? shop.description : 'description'} />
    <NumberInput bind:value={shop.price} placeholder={`£${shop.price ?? 0}`} />
  {:else}
    <div class="title-text">{shop.name}</div>
    <div class="small-text">{shop.location.lat.toFixed(4)}, {shop.location.lng.toFixed(4)}</div>
    {#if shop.description}
      <div class="desc-text">{shop.description}</div>
    {/if}
    <div class="price-text">£{shop.price.toFixed(2)}</div>
  {/if}

  <div class="buttons">

    {#if editing}
    <Button text=save on:click={saveButtonClicked} />  
    {:else}
    <Button text=edit on:click={editButtonClicked} />
    {/if}

    <Button 
      text="Nav"
      on:click={navigateButtonClicked}
    />

    <Button 
      highlight={deletePendingConfirm ? '#ce6688' : 'white'}
      text={deletePendingConfirm ? 'confirm' : 'delete'} 
      on:click={deleteButtonClicked}
    />
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