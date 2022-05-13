<script lang="ts">
  import TextInput from './TextInput.svelte';
  import NumberInput from './NumberInput.svelte';
  import Button from './Button.svelte';

  import isValid from './../Helpers/ValidityChecks';
import { onMount } from 'svelte';
  
  export let newShopName = '';
  export let newShopDesc = '';
  export let newShopPrice: string|number = ''

  export let add: (e: Event) => void;
  export let cancel: (e: Event) => void;

  // can this form be submitted
  $:canSubmit = isValid.text(newShopName)
    && isValid.floatOverZero(parseFloat(newShopPrice !== null ? newShopPrice.toString() : '0')); 

  export const clearFields = () => {
    newShopName = '';
    newShopDesc = '';
    newShopPrice = '';
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if(e.key === 'Escape'){
      cancel(e);
    }

    if (e.key === 'Enter') {
      canSubmit && add(e);
    }
  }

  onMount(() => {
    document.addEventListener('keydown', onKeyDown);
  });

</script>

<div class="new-marker-prompt-container" >
  <NumberInput label="A flat white costs" placeholder="1.23"
    bind:value={newShopPrice}
    validIf={isValid.floatOverZero}
  />

  <TextInput label="At" placeholder="shop name"
    bind:value={newShopName}
    validIf={isValid.text}
  />

  <TextInput label="Notes?" placeholder="A nice coffee shop"
    bind:value={newShopDesc}
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