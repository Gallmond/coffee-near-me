<script lang="ts">
  import TextInput from './TextInput.svelte';
  import NumberInput from './NumberInput.svelte';
  import Button from './Button.svelte';

  import isValid from './../Helpers/ValidityChecks';
  
  export let newShopName = '';
  export let newShopDesc = '';
  export let newShopPrice: string|number = ''

  export let add: (e: Event) => void;
  export let cancel: (e: Event) => void;

  let textValid = false, priceValid = false;

  // can this form be submitted
  $:canSubmit = isValid.text(newShopName)
    && isValid.text(newShopDesc)
    && isValid.floatOverZero(parseFloat(newShopPrice !== null ? newShopPrice.toString() : '0')); 

  export const clearFields = () => {
    newShopName = '';
    newShopDesc = '';
    newShopPrice = '';
  }

</script>

<div class="new-marker-prompt-container">
  <div class="title">Add Store</div>
  <p class="description">Add a name and the price of a flat white below</p>
  <TextInput label="Shop name" placeholder="shop name"
    bind:value={newShopName}
    validIf={isValid.text}
  />
  <TextInput label="Shop description" placeholder="A nice coffee shop"
    bind:value={newShopDesc}
    validIf={isValid.text}
  />
  <NumberInput label="A flat white costs" placeholder="1.23"
    bind:value={newShopPrice}
    validIf={isValid.floatOverZero}
  />

  <div class="buttons">
    <!-- TODO hook up this disabled bool to the inputs above -->
    <Button text="add" on:click={add} disabled={!canSubmit} />
    <Button text="cancel" on:click={cancel} />
  </div>
</div>

<style>
  .buttons{
	display: flex;
	flex-direction: row;
	justify-content: space-between;
}

.new-marker-prompt-container{
		background-color: white;
		border: 5px solid black;
		padding: 5px;
		width: fit-content;
		margin: auto;
	}
</style>