<script lang="ts">
  import { onMount } from "svelte";
  import type { ValidIfFunction } from "../Interfaces";
  
  export let placeholder = '';
  export let value: number;
  export let label = '';
  const id = 'id-' + Math.random().toString(36).substring(2, 5);

  // validity check
  let isValid = true;
  export let validIf: ValidIfFunction = (e) => true;
  const onKeyUp = (e) => {
    isValid = validIf(value ?? 0);
  }
  $: inputClasses = isValid ? '' : 'invalid';

  // grab the element and disable the wheel changing the value
  let inputElement:HTMLInputElement;
  onMount(() => {
    inputElement.addEventListener('wheel', (e) => {
      e.preventDefault();
    });
  })
</script>

<div class="container">
  {#if label !== ''}
    <label for={id}>{label}</label>
  {/if}
  <input
    class={inputClasses}
    on:keyup={onKeyUp}
    bind:this={inputElement}
    id={id}
    type="number"
    placeholder={placeholder}
    bind:value={value}
  />
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
  }
  .container > label {
    margin-bottom: 5px;
    font-size: 1.2rem;
  }
  .container > input {
    flex-grow: 1;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 5px;
  }

  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }

  .invalid{
    border: 1px solid rgba(255, 0, 0, 0.1)!important;
    background-color: rgba(255, 0, 0, 0.1);
  }
</style>