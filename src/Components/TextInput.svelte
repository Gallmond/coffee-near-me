<script lang="ts">
import type { ValidIfFunction } from "../Interfaces";


  export let placeholder = '';
  export let value = '';
  export let label = '';
  const id = 'id-' + Math.random().toString(36).substring(2, 5);

  let isValid = true;
  export let validIf: ValidIfFunction = (e) => true;

  const onKeyUp = (e) => {
    isValid = validIf(value);
  }

  $: inputClasses = isValid ? '' : 'invalid';

</script>

<div class="container">
  {#if label !== ''}
    <label for={id}>{label}</label>
  {/if}
  <input
    class="{inputClasses}"
    on:keyup={onKeyUp}
    id={id}
    type="text"
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
  .invalid{
    border: 1px solid rgba(255, 0, 0, 0.1)!important;
    background-color: rgba(255, 0, 0, 0.1);
  }
</style>